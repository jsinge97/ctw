import type { CurrentSession, SendBackVaWorkRequest, VaWorkDecisionRequest, VaWorkItemDto } from "@ctw/contracts";
import { getRuntimeAuditService } from "../audit/audit.service.js";
import { getWorkflowProvider } from "../workflow-provider.js";

export async function listVaWork(session?: CurrentSession): Promise<VaWorkItemDto[]> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    const membershipId = session?.membership.role === "va" ? session.membership.id : undefined;
    return workflow.prisma.listVaWorkItems(session?.activeOrganization.id ?? "org_northgate", membershipId) as Promise<VaWorkItemDto[]>;
  }
  if (!session || ["admin", "am"].includes(session.membership.role)) return workflow.memory.vaWorkItems;
  return workflow.memory.vaWorkItems.filter((item) => item.assignedTo === null || item.assignedTo === session.membership.id);
}

export async function acceptVaWork(itemId: string, session: CurrentSession, input: VaWorkDecisionRequest = {}): Promise<VaWorkItemDto> {
  return transitionVaWork(itemId, session, "in_progress", input, "execute");
}

export async function submitVaWork(itemId: string, session: CurrentSession, input: VaWorkDecisionRequest = {}): Promise<VaWorkItemDto> {
  return transitionVaWork(itemId, session, "submitted", input, "execute");
}

export async function sendBackVaWork(itemId: string, session: CurrentSession, input: SendBackVaWorkRequest): Promise<VaWorkItemDto> {
  const item = await transitionVaWork(itemId, session, "sent_back", { notes: input.notes ?? input.reason }, "review");
  if (getWorkflowProvider().mode === "memory") item.sentBackReason = input.reason;
  return item;
}

export async function cancelVaWork(itemId: string, session: CurrentSession, input: VaWorkDecisionRequest = {}): Promise<VaWorkItemDto> {
  return transitionVaWork(itemId, session, "canceled", input, "review");
}

export async function markVaWorkAccepted(itemId: string, session: CurrentSession, input: VaWorkDecisionRequest = {}): Promise<VaWorkItemDto> {
  return transitionVaWork(itemId, session, "accepted", input, "review");
}

async function transitionVaWork(itemId: string, session: CurrentSession, status: VaWorkItemDto["status"], input: VaWorkDecisionRequest, action: "execute" | "review"): Promise<VaWorkItemDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    const item = await getVaWorkItemWithPrisma(itemId, session);
    assertVaCanWorkItem(item, session, action);
    if (status === "submitted" && session.membership.role === "va" && item.assignedTo !== session.membership.id) throw Object.assign(new Error("VA work must be started before submit"), { statusCode: 409 });
    const updated = (await workflow.prisma.updateVaWorkItem({
      organizationId: session.activeOrganization.id,
      itemId,
      status,
      assignedToMembershipId: item.assignedTo ?? session.membership.id,
      ...(input.submittedPayload !== undefined ? { submittedPayload: input.submittedPayload } : {})
    })) as VaWorkItemDto;
    await recordVaTransition(session, item, updated, input.notes);
    return updated;
  }
  return transitionVaWorkInMemory(itemId, session, status, input, action);
}

async function getVaWorkItemWithPrisma(itemId: string, session: CurrentSession): Promise<VaWorkItemDto> {
  const items = await listVaWork(session);
  const item = items.find((work) => work.id === itemId);
  if (!item) throw Object.assign(new Error("VA item not found"), { statusCode: 404 });
  return item;
}

function assertVaCanWorkItem(item: VaWorkItemDto, session: CurrentSession, action: "execute" | "review") {
  if (action === "review" && !["admin", "am"].includes(session.membership.role)) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  if (action === "execute" && session.membership.role === "va" && item.assignedTo !== null && item.assignedTo !== session.membership.id) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
}

async function recordVaTransition(session: CurrentSession, before: VaWorkItemDto, after: VaWorkItemDto, notes?: string | null) {
  const auditService = getRuntimeAuditService();
  const approvalDecisionByStatus: Partial<Record<VaWorkItemDto["status"], "approved" | "sent_back" | "canceled">> = {
    accepted: "approved",
    sent_back: "sent_back",
    canceled: "canceled"
  };
  const outcomeByStatus: Partial<Record<VaWorkItemDto["status"], "accepted" | "deferred" | "completed">> = {
    submitted: "accepted",
    sent_back: "deferred",
    accepted: "completed"
  };
  const decision = approvalDecisionByStatus[after.status];
  if (decision) {
    await auditService.recordApprovalEvent({
      organizationId: session.activeOrganization.id,
      dealId: after.dealId,
      taskId: after.taskId,
      approvalType: "va_submission",
      decision,
      decisionByMembershipId: session.membership.id,
      ...(notes ? { decisionReason: notes } : {})
    });
  }
  const outcome = outcomeByStatus[after.status];
  if (outcome) await auditService.recordTaskOutcome({ organizationId: session.activeOrganization.id, dealId: after.dealId, taskId: after.taskId, outcome, createdByMembershipId: session.membership.id });
  await auditService.recordAuditEvent({
    organizationId: session.activeOrganization.id,
    dealId: after.dealId,
    actorType: "user",
    eventType: `va_work.${after.status}`,
    entityType: "va_work_item",
    entityId: after.id,
    before,
    after,
    metadata: { notes: notes ?? null }
  });
}

async function transitionVaWorkInMemory(itemId: string, session: CurrentSession, status: VaWorkItemDto["status"], input: VaWorkDecisionRequest, action: "execute" | "review"): Promise<VaWorkItemDto> {
  const workflow = getWorkflowProvider().memory;
  const item = workflow.vaWorkItems.find((work) => work.id === itemId);
  if (!item) throw Object.assign(new Error("VA item not found"), { statusCode: 404 });
  assertVaCanWorkItem(item, session, action);
  if (status === "submitted" && session.membership.role === "va" && item.assignedTo !== session.membership.id) throw Object.assign(new Error("VA work must be started before submit"), { statusCode: 409 });
  const before = { ...item, history: [...item.history] };
  item.assignedTo = item.assignedTo ?? session.membership.id;
  item.status = status;
  item.submittedPayload = input.submittedPayload ?? item.submittedPayload;
  item.notes = input.notes ?? item.notes;
  const task = workflow.tasks.find((candidate) => candidate.id === item.taskId);
  if (task) {
    if (status === "in_progress") task.status = "in_progress";
    if (status === "submitted") task.status = "waiting_approval";
    if (status === "accepted") task.status = "completed";
    if (status === "canceled") task.status = "canceled";
    if (status === "sent_back") task.status = "deferred";
  }
  item.history.push({ status, actor: "VA", notes: input.notes ?? null, createdAt: new Date().toISOString() });
  workflow.activityEvents.unshift({ id: workflow.nextId("act", workflow.activityEvents.length), dealId: item.dealId, actor: "VA", action: status, summary: `${item.title} moved to ${status}`, type: "VA", createdAt: new Date().toISOString() });
  await recordVaTransition(session, before, item, input.notes);
  return item;
}
