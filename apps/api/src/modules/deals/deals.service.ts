import { canTransitionDealStage } from "@ctw/domain";
import type { DealDto } from "@ctw/contracts";
import { activityEvents, deals, nextId } from "../demo-store.js";

export function listDeals(): DealDto[] {
  return deals.filter((deal) => deal.status !== "archived");
}

export function getDeal(dealId: string): DealDto {
  const deal = deals.find((item) => item.id === dealId);
  if (!deal) throw Object.assign(new Error("Deal not found"), { statusCode: 404 });
  return deal;
}

export function createDeal(input: { title: string; primaryCompanyName?: string }): DealDto {
  const deal: DealDto = {
    id: nextId("deal", deals.length),
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
  deals.push(deal);
  activityEvents.unshift({ id: nextId("act", activityEvents.length), actor: "Maria Reyes", action: "created", summary: `Created deal ${deal.title}`, type: "Deal", createdAt: new Date().toISOString() });
  return deal;
}

export function patchDeal(dealId: string, input: Partial<Pick<DealDto, "title" | "primaryCompanyName" | "staleFlag">>): DealDto {
  const deal = getDeal(dealId);
  Object.assign(deal, input, { lastActivityAt: new Date().toISOString() });
  return deal;
}

export function moveDealStage(dealId: string, stage: DealDto["stage"]): DealDto {
  const deal = getDeal(dealId);
  if (!canTransitionDealStage(deal.stage, stage)) throw Object.assign(new Error("Invalid stage transition"), { statusCode: 409 });
  deal.stage = stage;
  deal.lastActivityAt = new Date().toISOString();
  activityEvents.unshift({ id: nextId("act", activityEvents.length), actor: "Maria Reyes", action: "moved stage", summary: `${deal.title} moved to ${stage}`, type: "Stage", createdAt: new Date().toISOString() });
  return deal;
}

export function archiveDeal(dealId: string): DealDto {
  const deal = getDeal(dealId);
  deal.status = "archived";
  return deal;
}
