import type { ResolveRoutingReviewRequest, RoutingReviewItemDto } from "@ctw/contracts";
import { createDeal } from "../deals/deals.service.js";
import { activityEvents, messages, nextId, routingReviewItems } from "../demo-store.js";

export function listRoutingReviewItems(): RoutingReviewItemDto[] {
  return routingReviewItems.filter((item) => item.status === "open");
}

export function resolveRoutingReviewItem(itemId: string, input: ResolveRoutingReviewRequest): RoutingReviewItemDto {
  const item = routingReviewItems.find((review) => review.id === itemId);
  if (!item) throw Object.assign(new Error("Routing review item not found"), { statusCode: 404 });
  const message = messages.find((candidate) => candidate.id === item.messageId);
  if (input.resolution === "create_deal") {
    const deal = createDeal({ title: input.newDealTitle ?? item.subject ?? "New deal" });
    item.suggestedDealId = deal.id;
    item.suggestedDealTitle = deal.title;
    item.resolvedDealId = deal.id;
    item.resolution = "created_new_deal";
  }
  if (input.resolution === "assign" && input.dealId) {
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
  if (message) message.dealId = item.resolvedDealId;
  activityEvents.unshift({ id: nextId("act", activityEvents.length), actor: "Maria Reyes", action: "resolved routing", summary: `${item.subject ?? "Message"} marked ${item.resolution}`, type: "Routing", createdAt: item.resolvedAt });
  return item;
}
