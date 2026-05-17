import type { SendBackVaWorkRequest, VaWorkDecisionRequest, VaWorkItemDto } from "@ctw/contracts";
import { activityEvents, nextId, tasks, vaWorkItems } from "../demo-store.js";

export function listVaWork(): VaWorkItemDto[] {
  return vaWorkItems;
}

function getVaWorkItem(itemId: string): VaWorkItemDto {
  const item = vaWorkItems.find((work) => work.id === itemId);
  if (!item) throw Object.assign(new Error("VA item not found"), { statusCode: 404 });
  return item;
}

function transitionVaWork(item: VaWorkItemDto, status: VaWorkItemDto["status"], notes?: string | null) {
  item.status = status;
  item.notes = notes ?? item.notes;
  const task = tasks.find((candidate) => candidate.id === item.taskId);
  if (task) {
    if (status === "in_progress") task.status = "in_progress";
    if (status === "submitted") task.status = "waiting_approval";
    if (status === "accepted") task.status = "completed";
    if (status === "canceled") task.status = "canceled";
    if (status === "sent_back") task.status = "deferred";
  }
  item.history.push({ status, actor: "VA", notes: notes ?? null, createdAt: new Date().toISOString() });
  activityEvents.unshift({ id: nextId("act", activityEvents.length), dealId: item.dealId, actor: "VA", action: status, summary: `${item.title} moved to ${status}`, type: "VA", createdAt: new Date().toISOString() });
  return item;
}

export function acceptVaWork(itemId: string, input: VaWorkDecisionRequest = {}): VaWorkItemDto {
  const item = getVaWorkItem(itemId);
  item.assignedTo = item.assignedTo ?? "mem_va";
  return transitionVaWork(item, "in_progress", input.notes);
}

export function submitVaWork(itemId: string, input: VaWorkDecisionRequest = {}): VaWorkItemDto {
  const item = getVaWorkItem(itemId);
  item.submittedPayload = input.submittedPayload ?? {};
  return transitionVaWork(item, "submitted", input.notes);
}

export function sendBackVaWork(itemId: string, input: SendBackVaWorkRequest): VaWorkItemDto {
  const item = getVaWorkItem(itemId);
  item.sentBackReason = input.reason;
  return transitionVaWork(item, "sent_back", input.notes ?? input.reason);
}

export function cancelVaWork(itemId: string, input: VaWorkDecisionRequest = {}): VaWorkItemDto {
  const item = getVaWorkItem(itemId);
  return transitionVaWork(item, "canceled", input.notes);
}

export function markVaWorkAccepted(itemId: string, input: VaWorkDecisionRequest = {}): VaWorkItemDto {
  const item = getVaWorkItem(itemId);
  return transitionVaWork(item, "accepted", input.notes);
}
