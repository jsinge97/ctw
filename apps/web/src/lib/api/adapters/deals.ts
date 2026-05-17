import type { ActivityEventDto, DealDto, DocumentDto, MessageDto, MoveDealStageRequest, ParticipantDto, TaskDto } from "@ctw/contracts";
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
};

export async function getDealWorkspace(dealId: string): Promise<DealWorkspaceModel> {
  const [deal, participants, messages, documents, tasks, activity] = await Promise.all([
    api.getDealsdealId({ dealId }),
    api.getDealsdealIdParticipants({ dealId }),
    api.getDealsdealIdMessages({ dealId }),
    api.getDealsdealIdDocuments({ dealId }),
    api.getDealsdealIdTasks({ dealId }),
    api.getDealsdealIdActivity({ dealId })
  ]);
  return { deal, participants, messages, documents, tasks, activity };
}
