import { canTransitionDealStage } from "@ctw/domain";
import type { CreateDealRequest, CurrentSession, DealDto, PatchDealRequest } from "@ctw/contracts";
import { getWorkflowProvider } from "../workflow-provider.js";

function provider() {
  return getWorkflowProvider();
}

export async function listDeals(session?: CurrentSession): Promise<DealDto[]> {
  const workflow = provider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    return workflow.prisma.listDeals(session?.activeOrganization.id ?? "org_northgate", session?.membership.id, session?.membership.role) as Promise<DealDto[]>;
  }
  const memory = workflow.memory;
  const activeDeals = memory.deals.filter((deal) => deal.status !== "archived");
  if (!session || ["admin", "am", "va"].includes(session.membership.role)) return activeDeals;
  const visibleDealIds = new Set(
    memory.participants
      .filter((participant) => participant.membershipId === session.membership.id && participant.status === "active" && participant.capabilities.some((capability) => capability.toLowerCase().replace(/\s+/g, "") === "viewdeal"))
      .map((participant) => participant.dealId)
  );
  return activeDeals.filter((deal) => visibleDealIds.has(deal.id));
}

export async function getDeal(dealId: string, session?: CurrentSession): Promise<DealDto> {
  const workflow = provider();
  if (workflow.mode === "prisma" && workflow.prisma) return workflow.prisma.getDeal(session?.activeOrganization.id ?? "org_northgate", dealId) as Promise<DealDto>;
  const deal = workflow.memory.deals.find((item) => item.id === dealId);
  if (!deal) throw Object.assign(new Error("Deal not found"), { statusCode: 404 });
  return deal;
}

export async function createDeal(input: CreateDealRequest, session?: CurrentSession): Promise<DealDto> {
  const workflow = provider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    const organizationId = session?.activeOrganization.id ?? "org_northgate";
    const ownerMembershipId = session?.membership.id ?? "mem_am";
    return workflow.prisma.createDeal({ organizationId, ownerMembershipId, title: input.title, primaryCompanyName: input.primaryCompanyName ?? null }) as Promise<DealDto>;
  }
  const memory = workflow.memory;
  const deal: DealDto = {
    id: memory.nextId("deal", memory.deals.length),
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
  memory.deals.push(deal);
  memory.activityEvents.unshift({ id: memory.nextId("act", memory.activityEvents.length), dealId: deal.id, actor: "Maria Reyes", action: "created", summary: `Created deal ${deal.title}`, type: "Deal", createdAt: new Date().toISOString() });
  return deal;
}

export async function patchDeal(dealId: string, input: PatchDealRequest, session?: CurrentSession): Promise<DealDto> {
  const workflow = provider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    const patch: { organizationId: string; dealId: string; title?: string; primaryCompanyName?: string | null; staleFlag?: boolean } = { organizationId: session?.activeOrganization.id ?? "org_northgate", dealId };
    if (input.title !== undefined) patch.title = input.title;
    if (input.primaryCompanyName !== undefined) patch.primaryCompanyName = input.primaryCompanyName ?? null;
    if (input.staleFlag !== undefined) patch.staleFlag = input.staleFlag;
    return workflow.prisma.patchDeal(patch) as Promise<DealDto>;
  }
  const deal = await getDeal(dealId, session);
  Object.assign(deal, input, { lastActivityAt: new Date().toISOString() });
  return deal;
}

export async function moveDealStage(dealId: string, stage: DealDto["stage"], session?: CurrentSession): Promise<DealDto> {
  const deal = await getDeal(dealId, session);
  if (!canTransitionDealStage(deal.stage, stage)) throw Object.assign(new Error("Invalid stage transition"), { statusCode: 409 });
  const workflow = provider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    return workflow.prisma.moveDealStage({ organizationId: session?.activeOrganization.id ?? "org_northgate", dealId, stage, membershipId: session?.membership.id ?? "mem_am" }) as Promise<DealDto>;
  }
  deal.stage = stage;
  deal.lastActivityAt = new Date().toISOString();
  workflow.memory.activityEvents.unshift({ id: workflow.memory.nextId("act", workflow.memory.activityEvents.length), dealId: deal.id, actor: "Maria Reyes", action: "moved stage", summary: `${deal.title} moved to ${stage}`, type: "Stage", createdAt: new Date().toISOString() });
  return deal;
}

export async function archiveDeal(dealId: string, session?: CurrentSession): Promise<DealDto> {
  const workflow = provider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    return workflow.prisma.archiveDeal({ organizationId: session?.activeOrganization.id ?? "org_northgate", dealId, membershipId: session?.membership.id ?? "mem_am" }) as Promise<DealDto>;
  }
  const deal = await getDeal(dealId, session);
  deal.status = "archived";
  return deal;
}
