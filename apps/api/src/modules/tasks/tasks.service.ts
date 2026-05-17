import type { CreateTaskRequest, CurrentSession, TaskDecisionRequest, TaskDto } from "@ctw/contracts";
import { createProviderBundle, type EmailProvider } from "@ctw/integrations";
import { getRuntimeAuditService } from "../audit/audit.service.js";
import { sessionHasCapabilityForDeal } from "../authz.js";
import { getWorkflowProvider } from "../workflow-provider.js";

const defaultOrganizationId = "org_northgate";
let emailProviderOverride: EmailProvider | undefined;

export function setEmailProviderForTests(provider: EmailProvider | undefined) {
  emailProviderOverride = provider;
}

function emailProvider(): EmailProvider {
  return emailProviderOverride ?? createProviderBundle().email;
}

export async function listTasks(dealId: string, session?: CurrentSession): Promise<TaskDto[]> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    return workflow.prisma.listTasksForDeal(session?.activeOrganization.id ?? defaultOrganizationId, dealId) as Promise<TaskDto[]>;
  }
  return workflow.memory.tasks.filter((task) => task.dealId === dealId);
}

export async function createTask(dealId: string, input: CreateTaskRequest, session?: CurrentSession): Promise<TaskDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    const organizationId = session?.activeOrganization.id ?? defaultOrganizationId;
    const task = (await workflow.prisma.createTask({
      organizationId,
      dealId,
      title: input.title,
      ...(input.description !== undefined ? { description: input.description } : {}),
      route: input.route ?? "self",
      assignedToMembershipId: session?.membership.id ?? null,
      payload: {}
    })) as TaskDto;
    await getRuntimeAuditService().recordAuditEvent({
      organizationId,
      dealId,
      actorType: "user",
      eventType: "task.created",
      entityType: "task",
      entityId: task.id,
      after: task,
      metadata: { route: task.route }
    });
    return task;
  }

  const task: TaskDto = { id: workflow.memory.nextId("task", workflow.memory.tasks.length), dealId, title: input.title, description: input.description ?? null, status: "proposed", route: input.route ?? "self", isCurrentNextAction: false, payload: {}, dueAt: null };
  workflow.memory.tasks.push(task);
  return task;
}

type TaskDecision = "approve" | "reject" | "defer" | "route" | "complete";

export async function decideTask(taskId: string, session: CurrentSession, decision: TaskDecision, input: TaskDecisionRequest = {}): Promise<TaskDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    return decideTaskWithPrisma(workflow.prisma, taskId, session, decision, input);
  }
  return decideTaskInMemory(taskId, session, decision, input);
}

async function decideTaskWithPrisma(
  repository: NonNullable<ReturnType<typeof getWorkflowProvider>["prisma"]>,
  taskId: string,
  session: CurrentSession,
  decision: TaskDecision,
  input: TaskDecisionRequest
): Promise<TaskDto> {
  const organizationId = session.activeOrganization.id;
  const auditService = getRuntimeAuditService();
  const task = (await repository.getTask(organizationId, taskId)) as TaskDto;
  if (decision === "approve" && task.route === "system" && !(await sessionHasCapabilityForDeal(session, "approveOutboundSend", task.dealId))) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });

  const before = { ...task };
  let updated = task;
  const title = input.editedTitle ?? task.title;

  if (decision === "approve") {
    if (task.route === "system") {
      const bodyText = typeof task.payload["draft"] === "string" ? task.payload["draft"] : "Approved draft sent.";
      const payloadRecipients = task.payload["recipients"];
      const recipients = Array.isArray(payloadRecipients) && payloadRecipients.every((value) => typeof value === "string") ? payloadRecipients : ["broker@halcyon.com"];
      let providerMessageId: string | null = null;
      let rawProviderResponse: unknown = null;
      let messageStatus: "sent" | "failed" = "sent";
      try {
        const sendResult = await emailProvider().sendOutbound({ to: recipients, subject: title, text: bodyText });
        providerMessageId = sendResult.providerMessageId;
        rawProviderResponse = sendResult.rawProviderResponse;
      } catch {
        messageStatus = "failed";
      }
      updated = (await repository.updateTask({ organizationId, taskId, title, status: messageStatus === "sent" ? "completed" : "waiting_approval", completedAt: messageStatus === "sent" ? new Date() : null })) as TaskDto;
      const message = (await repository.appendOutboundMessage({ organizationId, dealId: task.dealId, taskId: task.id, providerMessageId, messageStatus, subject: title, bodyText, rawProviderResponse })) as { id: string };
      await auditService.recordApprovalEvent({ organizationId, dealId: task.dealId, taskId: task.id, messageId: message.id, approvalType: "outbound_send", decision: "approved", decisionByMembershipId: session.membership.id, ...(input.reason ? { decisionReason: input.reason } : {}) });
      if (messageStatus === "sent") await auditService.recordTaskOutcome({ organizationId, dealId: task.dealId, taskId: task.id, outcome: "completed", createdByMembershipId: session.membership.id });
      await auditService.recordAuditEvent({ organizationId, dealId: task.dealId, actorType: "system", eventType: `outbound_send.${messageStatus}`, entityType: "message", entityId: message.id, metadata: { recipients, rawProviderResponse } });
    } else {
      updated = (await repository.updateTask({ organizationId, taskId, title, status: "approved" })) as TaskDto;
      await repository.setCurrentNextAction({ organizationId, dealId: task.dealId, taskId: task.id });
      updated = (await repository.getTask(organizationId, taskId)) as TaskDto;
      await auditService.recordApprovalEvent({ organizationId, dealId: task.dealId, taskId: task.id, approvalType: "next_action", decision: "approved", decisionByMembershipId: session.membership.id, ...(input.reason ? { decisionReason: input.reason } : {}) });
      await auditService.recordTaskOutcome({ organizationId, dealId: task.dealId, taskId: task.id, outcome: "accepted", createdByMembershipId: session.membership.id });
    }
  }
  if (decision === "reject") {
    updated = (await repository.updateTask({ organizationId, taskId, ...(input.editedTitle !== undefined ? { title } : {}), status: "rejected" })) as TaskDto;
    await auditService.recordApprovalEvent({ organizationId, dealId: task.dealId, taskId: task.id, approvalType: "next_action", decision: "rejected", decisionByMembershipId: session.membership.id, ...(input.reason ? { decisionReason: input.reason } : {}) });
    await auditService.recordTaskOutcome({ organizationId, dealId: task.dealId, taskId: task.id, outcome: "rejected", createdByMembershipId: session.membership.id });
  }
  if (decision === "defer") {
    updated = (await repository.updateTask({ organizationId, taskId, ...(input.editedTitle !== undefined ? { title } : {}), status: "deferred" })) as TaskDto;
    await auditService.recordTaskOutcome({ organizationId, dealId: task.dealId, taskId: task.id, outcome: "deferred", createdByMembershipId: session.membership.id });
  }
  if (decision === "route" && input.route) {
    updated = (await repository.updateTask({ organizationId, taskId, ...(input.editedTitle !== undefined ? { title } : {}), route: input.route })) as TaskDto;
    await auditService.recordTaskOutcome({ organizationId, dealId: task.dealId, taskId: task.id, outcome: "rerouted", createdByMembershipId: session.membership.id });
  }
  if (decision === "complete") {
    updated = (await repository.updateTask({ organizationId, taskId, ...(input.editedTitle !== undefined ? { title } : {}), status: "completed", completedAt: new Date() })) as TaskDto;
    await auditService.recordTaskOutcome({ organizationId, dealId: task.dealId, taskId: task.id, outcome: "completed", createdByMembershipId: session.membership.id });
  }

  await auditService.recordAuditEvent({ organizationId, dealId: task.dealId, actorType: "user", eventType: `task.${decision}`, entityType: "task", entityId: task.id, before, after: updated, metadata: { reason: input.reason ?? null } });
  return updated;
}

async function decideTaskInMemory(taskId: string, session: CurrentSession, decision: TaskDecision, input: TaskDecisionRequest): Promise<TaskDto> {
  const workflow = getWorkflowProvider().memory;
  const auditService = getRuntimeAuditService();
  const task = workflow.tasks.find((item) => item.id === taskId);
  if (!task) throw Object.assign(new Error("Task not found"), { statusCode: 404 });
  if (decision === "approve" && task.route === "system" && !(await sessionHasCapabilityForDeal(session, "approveOutboundSend", task.dealId))) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  const before = { ...task };
  if (input.editedTitle) task.title = input.editedTitle;
  if (decision === "approve") {
    task.status = task.route === "system" ? "completed" : "approved";
    if (task.route === "system") {
      const bodyText = String(task.payload["draft"] ?? "Approved draft sent.");
      const payloadRecipients = task.payload["recipients"];
      const recipients = Array.isArray(payloadRecipients) && payloadRecipients.every((value) => typeof value === "string") ? payloadRecipients : ["broker@halcyon.com"];
      let providerMessageId: string | null = null;
      let messageStatus: "sent" | "failed" = "sent";
      try {
        const sendResult = await emailProvider().sendOutbound({ to: recipients, subject: task.title, text: bodyText });
        providerMessageId = sendResult.providerMessageId;
      } catch {
        messageStatus = "failed";
        task.status = "waiting_approval";
      }
      const message = { id: workflow.nextId("msg", workflow.messages.length), dealId: task.dealId, channelType: "email" as const, direction: "outbound" as const, messageStatus, providerMessageId, subject: task.title, preview: messageStatus === "sent" ? "Sent approved System draft." : "Failed to send approved System draft.", bodyText, occurredAt: new Date().toISOString(), visibility: "shared" as const, routingConfidence: null, routingStatus: "routed" as const };
      workflow.messages.push(message);
      workflow.activityEvents.unshift({ id: workflow.nextId("act", workflow.activityEvents.length), dealId: task.dealId, actor: "System", action: messageStatus, summary: `${messageStatus === "sent" ? "Sent" : "Failed to send"} approved draft for ${task.title}`, type: "Approval", createdAt: message.occurredAt });
      await auditService.recordApprovalEvent({ organizationId: workflow.orgId, dealId: task.dealId, taskId: task.id, messageId: message.id, approvalType: "outbound_send", decision: "approved", decisionByMembershipId: session.membership.id, ...(input.reason ? { decisionReason: input.reason } : {}) });
      if (messageStatus === "sent") await auditService.recordTaskOutcome({ organizationId: workflow.orgId, dealId: task.dealId, taskId: task.id, outcome: "completed", createdByMembershipId: session.membership.id });
      await auditService.recordAuditEvent({ organizationId: workflow.orgId, dealId: task.dealId, actorType: "system", eventType: `outbound_send.${messageStatus}`, entityType: "message", entityId: message.id, before: null, after: message, metadata: { recipients } });
    } else {
      workflow.tasks.forEach((candidate) => {
        if (candidate.dealId === task.dealId) candidate.isCurrentNextAction = candidate.id === task.id;
      });
      await auditService.recordApprovalEvent({ organizationId: workflow.orgId, dealId: task.dealId, taskId: task.id, approvalType: "next_action", decision: "approved", decisionByMembershipId: session.membership.id, ...(input.reason ? { decisionReason: input.reason } : {}) });
      await auditService.recordTaskOutcome({ organizationId: workflow.orgId, dealId: task.dealId, taskId: task.id, outcome: "accepted", createdByMembershipId: session.membership.id });
    }
  }
  if (decision === "reject") {
    task.status = "rejected";
    await auditService.recordApprovalEvent({ organizationId: workflow.orgId, dealId: task.dealId, taskId: task.id, approvalType: "next_action", decision: "rejected", decisionByMembershipId: session.membership.id, ...(input.reason ? { decisionReason: input.reason } : {}) });
    await auditService.recordTaskOutcome({ organizationId: workflow.orgId, dealId: task.dealId, taskId: task.id, outcome: "rejected", createdByMembershipId: session.membership.id });
  }
  if (decision === "defer") {
    task.status = "deferred";
    await auditService.recordTaskOutcome({ organizationId: workflow.orgId, dealId: task.dealId, taskId: task.id, outcome: "deferred", createdByMembershipId: session.membership.id });
  }
  if (decision === "route" && input.route) {
    task.route = input.route;
    await auditService.recordTaskOutcome({ organizationId: workflow.orgId, dealId: task.dealId, taskId: task.id, outcome: "rerouted", createdByMembershipId: session.membership.id });
  }
  if (decision === "complete") {
    task.status = "completed";
    await auditService.recordTaskOutcome({ organizationId: workflow.orgId, dealId: task.dealId, taskId: task.id, outcome: "completed", createdByMembershipId: session.membership.id });
  }
  await auditService.recordAuditEvent({ organizationId: workflow.orgId, dealId: task.dealId, actorType: "user", eventType: `task.${decision}`, entityType: "task", entityId: task.id, before, after: task, metadata: { reason: input.reason } });
  return task;
}
