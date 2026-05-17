import type { CreateTaskRequest, TaskDecisionRequest, TaskDto } from "@ctw/contracts";
import { sendOutboundEmail } from "@ctw/integrations";
import { activityEvents, messages, nextId, orgId, tasks } from "../demo-store.js";
import { createAuditService, createMemoryAuditRepositories } from "../audit/audit.service.js";

const auditService = createAuditService(createMemoryAuditRepositories());

export function listTasks(dealId: string): TaskDto[] {
  return tasks.filter((task) => task.dealId === dealId);
}

export function createTask(dealId: string, input: CreateTaskRequest): TaskDto {
  const task: TaskDto = { id: nextId("task", tasks.length), dealId, title: input.title, description: input.description ?? null, status: "proposed", route: input.route ?? "self", isCurrentNextAction: false, payload: {}, dueAt: null };
  tasks.push(task);
  return task;
}

export async function decideTask(taskId: string, decision: "approve" | "reject" | "defer" | "route", input: TaskDecisionRequest = {}): Promise<TaskDto> {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) throw Object.assign(new Error("Task not found"), { statusCode: 404 });
  const before = { ...task };
  if (input.editedTitle) task.title = input.editedTitle;
  if (decision === "approve") {
    task.status = task.route === "system" ? "completed" : "approved";
    if (task.route === "system") {
      const bodyText = String(task.payload["draft"] ?? "Approved draft sent.");
      const sendResult = await sendOutboundEmail({ to: [], subject: task.title, text: bodyText });
      const message = { id: nextId("msg", messages.length), dealId: task.dealId, channelType: "email" as const, direction: "outbound" as const, subject: task.title, preview: "Sent approved System draft.", bodyText, occurredAt: new Date().toISOString(), visibility: "shared" as const, routingConfidence: null };
      messages.push(message);
      activityEvents.unshift({ id: nextId("act", activityEvents.length), actor: "System", action: "sent", summary: `Sent approved draft for ${task.title}`, type: "Approval", createdAt: message.occurredAt });
      await auditService.recordApprovalEvent({ organizationId: orgId, dealId: task.dealId, taskId: task.id, messageId: message.id, approvalType: "outbound_send", decision: "approved", decisionByMembershipId: "mem_am", ...(input.reason ? { decisionReason: input.reason } : {}) });
      await auditService.recordTaskOutcome({ organizationId: orgId, dealId: task.dealId, taskId: task.id, outcome: "completed", createdByMembershipId: "mem_am" });
      await auditService.recordAuditEvent({ organizationId: orgId, dealId: task.dealId, actorType: "system", eventType: "outbound_send.sent", entityType: "message", entityId: message.id, before: null, after: { ...message, providerMessageId: sendResult.providerMessageId } });
    } else {
      await auditService.recordApprovalEvent({ organizationId: orgId, dealId: task.dealId, taskId: task.id, approvalType: "next_action", decision: "approved", decisionByMembershipId: "mem_am", ...(input.reason ? { decisionReason: input.reason } : {}) });
      await auditService.recordTaskOutcome({ organizationId: orgId, dealId: task.dealId, taskId: task.id, outcome: "accepted", createdByMembershipId: "mem_am" });
    }
  }
  if (decision === "reject") {
    task.status = "rejected";
    await auditService.recordApprovalEvent({ organizationId: orgId, dealId: task.dealId, taskId: task.id, approvalType: "next_action", decision: "rejected", decisionByMembershipId: "mem_am", ...(input.reason ? { decisionReason: input.reason } : {}) });
    await auditService.recordTaskOutcome({ organizationId: orgId, dealId: task.dealId, taskId: task.id, outcome: "rejected", createdByMembershipId: "mem_am" });
  }
  if (decision === "defer") {
    task.status = "deferred";
    await auditService.recordTaskOutcome({ organizationId: orgId, dealId: task.dealId, taskId: task.id, outcome: "deferred", createdByMembershipId: "mem_am" });
  }
  if (decision === "route" && input.route) {
    task.route = input.route;
    await auditService.recordTaskOutcome({ organizationId: orgId, dealId: task.dealId, taskId: task.id, outcome: "rerouted", createdByMembershipId: "mem_am" });
  }
  await auditService.recordAuditEvent({ organizationId: orgId, dealId: task.dealId, actorType: "user", eventType: `task.${decision}`, entityType: "task", entityId: task.id, before, after: task, metadata: { reason: input.reason } });
  return task;
}
