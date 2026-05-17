import type {
  ActivityEventDto,
  AddParticipantRequest,
  CreateTaskRequest,
  DealDto,
  DocumentDto,
  MessageDto,
  MoveDealStageRequest,
  ParticipantDto,
  TaskDecisionRequest,
  TaskDto,
  UpdateDocumentRequest,
  UpdateMessageRequest,
  UpdateParticipantRequest
} from "@ctw/contracts";
import { api } from "../runtime.js";

export type DealCardModel = {
  id: string;
  title: string;
  company: string;
  stage: DealDto["stage"];
  nextAction: string;
  stale: boolean;
  pendingApprovals: number;
  ownerInitials: string;
  lastActivityLabel: string;
  canMove: boolean;
};

export async function listDealCards(): Promise<DealCardModel[]> {
  const deals = await api.getDeals();
  return deals.map((deal) => ({
    id: deal.id,
    title: deal.title,
    company: deal.primaryCompanyName ?? "No company",
    stage: deal.stage,
    nextAction: deal.nextActionLabel ?? "No next action",
    stale: deal.staleFlag,
    pendingApprovals: deal.pendingApprovals,
    ownerInitials: deal.ownerInitials,
    lastActivityLabel: deal.lastActivityAt ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric" }).format(new Date(deal.lastActivityAt)) : "No activity",
    canMove: deal.capabilities.includes("moveDealStage")
  }));
}

export async function moveDealStage(dealId: string, body: MoveDealStageRequest) {
  return api.postDealsdealIdMoveStage({ dealId }, body);
}

export type DealWorkspaceModel = {
  deal: DealDto;
  participants: ParticipantDto[];
  messages: MessageDto[];
  documents: DocumentDto[];
  tasks: TaskDto[];
  activity: ActivityEventDto[];
  unavailable: Array<"participants" | "messages" | "documents" | "tasks" | "activity">;
};

export async function getDealWorkspace(dealId: string): Promise<DealWorkspaceModel> {
  const deal = await api.getDealsdealId({ dealId });
  const [participants, messages, documents, tasks, activity] = await Promise.all([
    optionalWorkspaceList("participants", () => api.getDealsdealIdParticipants({ dealId })),
    optionalWorkspaceList("messages", () => api.getDealsdealIdMessages({ dealId })),
    optionalWorkspaceList("documents", () => api.getDealsdealIdDocuments({ dealId })),
    optionalWorkspaceList("tasks", () => api.getDealsdealIdTasks({ dealId })),
    optionalWorkspaceList("activity", () => api.getDealsdealIdActivity({ dealId }))
  ]);
  return {
    deal,
    participants: participants.data,
    messages: messages.data,
    documents: documents.data,
    tasks: tasks.data,
    activity: activity.data,
    unavailable: [participants, messages, documents, tasks, activity].filter((result) => !result.available).map((result) => result.key)
  };
}

async function optionalWorkspaceList<TKey extends DealWorkspaceModel["unavailable"][number], TValue>(
  key: TKey,
  fetchList: () => Promise<TValue[]>
): Promise<{ available: boolean; data: TValue[]; key: TKey }> {
  try {
    return { available: true, data: await fetchList(), key };
  } catch {
    return { available: false, data: [], key };
  }
}

export async function updateMessage(dealId: string, messageId: string, body: UpdateMessageRequest): Promise<MessageDto> {
  return api.patchDealsdealIdMessagesMessageId({ dealId, messageId }, body);
}

export async function createDocument(dealId: string, body: UpdateDocumentRequest): Promise<DocumentDto> {
  return api.postDealsdealIdDocuments({ dealId }, body);
}

export async function updateDocument(dealId: string, documentId: string, body: UpdateDocumentRequest): Promise<DocumentDto> {
  return api.patchDealsdealIdDocumentsDocumentId({ dealId, documentId }, body);
}

export async function archiveDocument(dealId: string, documentId: string): Promise<DocumentDto> {
  return api.postDealsdealIdDocumentsDocumentIdArchive({ dealId, documentId });
}

export async function uploadDocument(dealId: string, file: File): Promise<DocumentDto> {
  const body = new FormData();
  body.set("file", file);
  const response = await fetch(`/v1/deals/${encodeURIComponent(dealId)}/documents/upload`, {
    method: "POST",
    credentials: "include",
    body
  });
  if (!response.ok) throw new Error(`Document upload failed: ${response.status}`);
  return response.json() as Promise<DocumentDto>;
}

export async function createTask(dealId: string, body: CreateTaskRequest): Promise<TaskDto> {
  return api.postDealsdealIdTasks({ dealId }, body);
}

export type TaskDecisionKind = "approve" | "reject" | "defer" | "route" | "complete";

export async function decideTask(taskId: string, decision: TaskDecisionKind, body: TaskDecisionRequest): Promise<TaskDto> {
  if (decision === "approve") return api.postTaskstaskIdApprove({ taskId }, body);
  if (decision === "reject") return api.postTaskstaskIdReject({ taskId }, body);
  if (decision === "defer") return api.postTaskstaskIdDefer({ taskId }, body);
  if (decision === "route") return api.postTaskstaskIdRoute({ taskId }, body);
  return api.postTaskstaskIdComplete({ taskId }, body);
}

export async function addParticipant(dealId: string, body: AddParticipantRequest): Promise<ParticipantDto> {
  return api.postDealsdealIdParticipants({ dealId }, body);
}

export async function updateParticipant(dealId: string, participantId: string, body: UpdateParticipantRequest): Promise<ParticipantDto> {
  return api.patchDealsdealIdParticipantsParticipantId({ dealId, participantId }, body);
}
