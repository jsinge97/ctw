import type { CurrentSession, SendBackVaWorkRequest, VaWorkDecisionRequest, VaWorkItemDto } from "@ctw/contracts";
import { getWorkflowProvider } from "../workflow-provider.js";

const workflow = getWorkflowProvider().memory;

export function listVaWork(session?: CurrentSession): VaWorkItemDto[] {
  if (!session || ["admin", "am"].includes(session.membership.role)) return workflow.vaWorkItems;
  return workflow.vaWorkItems.filter((item) => item.assignedTo === null || item.assignedTo === session.membership.id);
}

function getVaWorkItem(itemId: string): VaWorkItemDto {
  const item = workflow.vaWorkItems.find((work) => work.id === itemId);
  if (!item) throw Object.assign(new Error("VA item not found"), { statusCode: 404 });
  return item;
}

function assertVaCanWorkItem(item: VaWorkItemDto, session: CurrentSession, action: "execute" | "review") {
  if (action === "review" && !["admin", "am"].includes(session.membership.role)) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  if (action === "execute" && session.membership.role === "va" && item.assignedTo !== null && item.assignedTo !== session.membership.id) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
}

function transitionVaWork(item: VaWorkItemDto, status: VaWorkItemDto["status"], notes?: string | null) {
  item.status = status;
  item.notes = notes ?? item.notes;
  const task = workflow.tasks.find((candidate) => candidate.id === item.taskId);
  if (task) {
    if (status === "in_progress") task.status = "in_progress";
    if (status === "submitted") task.status = "waiting_approval";
    if (status === "accepted") task.status = "completed";
    if (status === "canceled") task.status = "canceled";
    if (status === "sent_back") task.status = "deferred";
  }
  item.history.push({ status, actor: "VA", notes: notes ?? null, createdAt: new Date().toISOString() });
  workflow.activityEvents.unshift({ id: workflow.nextId("act", workflow.activityEvents.length), dealId: item.dealId, actor: "VA", action: status, summary: `${item.title} moved to ${status}`, type: "VA", createdAt: new Date().toISOString() });
  return item;
}

export function acceptVaWork(itemId: string, session: CurrentSession, input: VaWorkDecisionRequest = {}): VaWorkItemDto {
  const item = getVaWorkItem(itemId);
  assertVaCanWorkItem(item, session, "execute");
  item.assignedTo = item.assignedTo ?? session.membership.id;
  return transitionVaWork(item, "in_progress", input.notes);
}

export function submitVaWork(itemId: string, session: CurrentSession, input: VaWorkDecisionRequest = {}): VaWorkItemDto {
  const item = getVaWorkItem(itemId);
  assertVaCanWorkItem(item, session, "execute");
  if (session.membership.role === "va" && item.assignedTo !== session.membership.id) throw Object.assign(new Error("VA work must be started before submit"), { statusCode: 409 });
  item.submittedPayload = input.submittedPayload ?? {};
  return transitionVaWork(item, "submitted", input.notes);
}

export function sendBackVaWork(itemId: string, session: CurrentSession, input: SendBackVaWorkRequest): VaWorkItemDto {
  const item = getVaWorkItem(itemId);
  assertVaCanWorkItem(item, session, "execute");
  item.sentBackReason = input.reason;
  return transitionVaWork(item, "sent_back", input.notes ?? input.reason);
}

export function cancelVaWork(itemId: string, session: CurrentSession, input: VaWorkDecisionRequest = {}): VaWorkItemDto {
  const item = getVaWorkItem(itemId);
  assertVaCanWorkItem(item, session, "review");
  return transitionVaWork(item, "canceled", input.notes);
}

export function markVaWorkAccepted(itemId: string, session: CurrentSession, input: VaWorkDecisionRequest = {}): VaWorkItemDto {
  const item = getVaWorkItem(itemId);
  assertVaCanWorkItem(item, session, "review");
  return transitionVaWork(item, "accepted", input.notes);
}
