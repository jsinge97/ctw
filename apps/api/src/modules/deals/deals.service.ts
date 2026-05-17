import { canTransitionDealStage } from "@ctw/domain";
import type { CreateDealRequest, CurrentSession, DealDto, PatchDealRequest } from "@ctw/contracts";
import { getWorkflowProvider } from "../workflow-provider.js";

const workflow = getWorkflowProvider().memory;

export function listDeals(session?: CurrentSession): DealDto[] {
  const activeDeals = workflow.deals.filter((deal) => deal.status !== "archived");
  if (!session || ["admin", "am", "va"].includes(session.membership.role)) return activeDeals;
  const visibleDealIds = new Set(
    workflow.participants
      .filter((participant) => participant.membershipId === session.membership.id && participant.status === "active" && participant.capabilities.some((capability) => capability.toLowerCase().replace(/\s+/g, "") === "viewdeal"))
      .map((participant) => participant.dealId)
  );
  return activeDeals.filter((deal) => visibleDealIds.has(deal.id));
}

export function getDeal(dealId: string): DealDto {
  const deal = workflow.deals.find((item) => item.id === dealId);
  if (!deal) throw Object.assign(new Error("Deal not found"), { statusCode: 404 });
  return deal;
}

export function createDeal(input: CreateDealRequest): DealDto {
  const deal: DealDto = {
    id: workflow.nextId("deal", workflow.deals.length),
    organizationId: "org_demo",
    title: input.title,
    primaryCompanyName: input.primaryCompanyName ?? null,
    stage: "prospect",
    status: "active",
    ownerInitials: "MR",
    staleFlag: false,
    lastActivityAt: new Date().toISOString(),
    nextActionLabel: null,
    pendingApprovals: 0,
    capabilities: ["viewDeal", "moveDealStage"]
  };
  workflow.deals.push(deal);
  workflow.activityEvents.unshift({ id: workflow.nextId("act", workflow.activityEvents.length), dealId: deal.id, actor: "Maria Reyes", action: "created", summary: `Created deal ${deal.title}`, type: "Deal", createdAt: new Date().toISOString() });
  return deal;
}

export function patchDeal(dealId: string, input: PatchDealRequest): DealDto {
  const deal = getDeal(dealId);
  Object.assign(deal, input, { lastActivityAt: new Date().toISOString() });
  return deal;
}

export function moveDealStage(dealId: string, stage: DealDto["stage"]): DealDto {
  const deal = getDeal(dealId);
  if (!canTransitionDealStage(deal.stage, stage)) throw Object.assign(new Error("Invalid stage transition"), { statusCode: 409 });
  deal.stage = stage;
  deal.lastActivityAt = new Date().toISOString();
  workflow.activityEvents.unshift({ id: workflow.nextId("act", workflow.activityEvents.length), dealId: deal.id, actor: "Maria Reyes", action: "moved stage", summary: `${deal.title} moved to ${stage}`, type: "Stage", createdAt: new Date().toISOString() });
  return deal;
}

export function archiveDeal(dealId: string): DealDto {
  const deal = getDeal(dealId);
  deal.status = "archived";
  return deal;
}
