import type { RoutingReviewItemDto } from "@ctw/contracts";
import { createDeal } from "../deals/deals.service.js";
import { routingReviewItems } from "../demo-store.js";

export function listRoutingReviewItems(): RoutingReviewItemDto[] {
  return routingReviewItems;
}

export function resolveRoutingReviewItem(itemId: string, input: { resolution: "assign" | "unrelated" | "create_deal"; dealId?: string; newDealTitle?: string }): RoutingReviewItemDto {
  const item = routingReviewItems.find((review) => review.id === itemId);
  if (!item) throw Object.assign(new Error("Routing review item not found"), { statusCode: 404 });
  if (input.resolution === "create_deal") {
    const deal = createDeal({ title: input.newDealTitle ?? item.subject ?? "New deal" });
    item.suggestedDealId = deal.id;
    item.suggestedDealTitle = deal.title;
  }
  if (input.resolution === "assign" && input.dealId) item.suggestedDealId = input.dealId;
  if (input.resolution === "unrelated") item.suggestedDealId = null;
  return item;
}
