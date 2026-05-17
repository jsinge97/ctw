import type { ResolveRoutingReviewRequest, RoutingReviewItemDto } from "@ctw/contracts";
import { createDeal } from "../deals/deals.service.js";
import { getWorkflowProvider } from "../workflow-provider.js";

const workflow = getWorkflowProvider().memory;

export function listRoutingReviewItems(): RoutingReviewItemDto[] {
  return workflow.routingReviewItems.filter((item) => item.status === "open");
}

export async function resolveRoutingReviewItem(itemId: string, input: ResolveRoutingReviewRequest): Promise<RoutingReviewItemDto> {
  const item = workflow.routingReviewItems.find((review) => review.id === itemId);
  if (!item) throw Object.assign(new Error("Routing review item not found"), { statusCode: 404 });
  const message = workflow.messages.find((candidate) => candidate.id === item.messageId);
  if (input.resolution === "create_deal") {
    const deal = await createDeal({ title: input.newDealTitle });
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
  workflow.activityEvents.unshift({ id: workflow.nextId("act", workflow.activityEvents.length), dealId: item.resolvedDealId, actor: "Maria Reyes", action: "resolved routing", summary: `${item.subject ?? "Message"} marked ${item.resolution}`, type: "Routing", createdAt: item.resolvedAt });
  return item;
}
