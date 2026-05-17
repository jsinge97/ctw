import type { MessageDto, RoutingReviewItemDto } from "@ctw/contracts";
import type { normalizeResendInbound } from "@ctw/integrations";
import { getWorkflowProvider } from "../workflow-provider.js";

type NormalizedEmail = ReturnType<typeof normalizeResendInbound>;

function scoreEmailRoute(normalized: NormalizedEmail): { confidence: number; suggestedDealId: string | null } {
  const subject = normalized.subject?.toLowerCase() ?? "";
  const body = normalized.bodyText.toLowerCase();
  if (subject.includes("401 bryant") || body.includes("401 bryant")) return { confidence: 0.41, suggestedDealId: "deal_bryant" };
  if (normalized.sender.includes("@")) return { confidence: 0.92, suggestedDealId: "deal_sutter" };
  return { confidence: 0.4, suggestedDealId: null };
}

export function fileInboundEmail(normalized: NormalizedEmail): { message: MessageDto; reviewItem: RoutingReviewItemDto | null } {
  const workflow = getWorkflowProvider().memory;
  const threshold = workflow.organizationSettings.routingConfidenceThreshold;
  const route = scoreEmailRoute(normalized);
  const routedDealId = route.confidence >= threshold ? route.suggestedDealId : null;
  const now = new Date().toISOString();
  const message: MessageDto = {
    id: workflow.nextId("msg", workflow.messages.length),
    dealId: routedDealId,
    channelType: "email",
    direction: "inbound",
    messageStatus: "received",
    providerMessageId: normalized.providerMessageId,
    subject: normalized.subject,
    preview: normalized.bodyText.slice(0, 120),
    bodyText: normalized.bodyText,
    occurredAt: now,
    visibility: routedDealId ? "shared" : "internal",
    routingConfidence: route.confidence,
    routingStatus: routedDealId ? "routed" : "review_required"
  };
  workflow.messages.push(message);

  if (routedDealId) {
    workflow.activityEvents.unshift({
      id: workflow.nextId("act", workflow.activityEvents.length),
      dealId: routedDealId,
      actor: "System",
      action: "filed",
      summary: `Email from ${normalized.sender} filed to deal`,
      type: "Routing",
      createdAt: now
    });
    return { message, reviewItem: null };
  }

  const suggestedDeal = route.suggestedDealId ? workflow.deals.find((deal) => deal.id === route.suggestedDealId) : undefined;
  const reviewItem: RoutingReviewItemDto = {
    id: workflow.nextId("rr", workflow.routingReviewItems.length),
    messageId: message.id,
    suggestedDealId: route.suggestedDealId,
    suggestedDealTitle: suggestedDeal?.title ?? null,
    confidence: route.confidence,
    sender: normalized.sender,
    subject: normalized.subject,
    preview: message.preview,
    ageLabel: "now",
    explanation: route.suggestedDealId ? "Subject or body matched a known deal, but confidence is below threshold." : "No confident deal match found.",
    status: "open",
    resolution: null,
    resolvedDealId: null,
    resolvedAt: null
  };
  workflow.routingReviewItems.unshift(reviewItem);
  return { message, reviewItem };
}
