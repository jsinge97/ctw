import type { CurrentSession, ResolveRoutingReviewRequest, RoutingReviewItemDto } from "@ctw/contracts";
import { createDeal } from "../deals/deals.service.js";
import { getWorkflowProvider } from "../workflow-provider.js";

export async function listRoutingReviewItems(session?: CurrentSession): Promise<RoutingReviewItemDto[]> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) return workflow.prisma.listRoutingReviewItems(session?.activeOrganization.id ?? "org_northgate") as Promise<RoutingReviewItemDto[]>;
  return workflow.memory.routingReviewItems.filter((item) => item.status === "open");
}

export async function resolveRoutingReviewItem(itemId: string, input: ResolveRoutingReviewRequest, session?: CurrentSession): Promise<RoutingReviewItemDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    let resolvedDealId: string | null = null;
    let resolution: "assigned_to_deal" | "marked_unrelated" | "created_new_deal" = "marked_unrelated";
    if (input.resolution === "assign") {
      resolvedDealId = input.dealId;
      resolution = "assigned_to_deal";
    }
    if (input.resolution === "create_deal") {
      const deal = await createDeal({ title: input.newDealTitle }, session);
      resolvedDealId = deal.id;
      resolution = "created_new_deal";
    }
    return workflow.prisma.resolveRoutingReviewItem({ organizationId: session?.activeOrganization.id ?? "org_northgate", itemId, resolvedDealId, resolution, membershipId: session?.membership.id ?? "mem_am" }) as Promise<RoutingReviewItemDto>;
  }

  const item = workflow.memory.routingReviewItems.find((review) => review.id === itemId);
  if (!item) throw Object.assign(new Error("Routing review item not found"), { statusCode: 404 });
  const message = workflow.memory.messages.find((candidate) => candidate.id === item.messageId);
  if (input.resolution === "create_deal") {
    const deal = await createDeal({ title: input.newDealTitle }, session);
    item.suggestedDealId = deal.id;
    item.suggestedDealTitle = deal.title;
    item.resolvedDealId = deal.id;
    item.resolution = "created_new_deal";
  }
  if (input.resolution === "assign") {
    item.suggestedDealId = input.dealId;
    item.resolvedDealId = input.dealId;
    item.resolution = "assigned_to_deal";
  }
  if (input.resolution === "unrelated") {
    item.suggestedDealId = null;
    item.resolvedDealId = null;
    item.resolution = "marked_unrelated";
  }
  item.status = "resolved";
  item.resolvedAt = new Date().toISOString();
  if (message) {
    message.dealId = item.resolvedDealId;
    message.routingStatus = input.resolution === "unrelated" ? "unrelated" : "routed";
  }
  workflow.memory.activityEvents.unshift({ id: workflow.memory.nextId("act", workflow.memory.activityEvents.length), dealId: item.resolvedDealId, actor: "Maria Reyes", action: "resolved routing", summary: `${item.subject ?? "Message"} marked ${item.resolution}`, type: "Routing", createdAt: item.resolvedAt });
  return item;
}
