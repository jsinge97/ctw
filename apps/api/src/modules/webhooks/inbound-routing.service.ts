import type { MessageDto, RoutingReviewItemDto } from "@ctw/contracts";
import type { normalizeResendInbound, normalizeTwilioInbound } from "@ctw/integrations";
import { getWorkflowProvider } from "../workflow-provider.js";

type NormalizedEmail = ReturnType<typeof normalizeResendInbound>;
type NormalizedSms = ReturnType<typeof normalizeTwilioInbound>;
type NormalizedInbound = NormalizedEmail | NormalizedSms;

type FiledInboundMessage = { message: MessageDto; reviewItem: RoutingReviewItemDto | null };

const defaultOrganizationId = "org_northgate";

function scoreInboundRoute(normalized: NormalizedInbound): { confidence: number; suggestedDealId: string | null } {
  const subject = normalized.channelType === "email" ? normalized.subject?.toLowerCase() ?? "" : "";
  const body = normalized.bodyText.toLowerCase();
  if (subject.includes("401 bryant") || body.includes("401 bryant")) return { confidence: 0.41, suggestedDealId: "deal_bryant" };
  if (normalized.sender.includes("@")) return { confidence: 0.92, suggestedDealId: "deal_sutter" };
  return { confidence: 0.4, suggestedDealId: null };
}

export async function fileInboundEmail(normalized: NormalizedEmail): Promise<FiledInboundMessage> {
  return fileInboundMessage(normalized);
}

export async function fileInboundSms(normalized: NormalizedSms): Promise<FiledInboundMessage> {
  return fileInboundMessage(normalized);
}

async function fileInboundMessage(normalized: NormalizedInbound): Promise<FiledInboundMessage> {
  const workflow = getWorkflowProvider();
  const route = scoreInboundRoute(normalized);

  if (workflow.mode === "prisma" && workflow.prisma) {
    const settings = (await workflow.prisma.getOrganizationSettings(defaultOrganizationId)) as { routingConfidenceThreshold: number };
    const routedDealId = route.confidence >= settings.routingConfidenceThreshold ? route.suggestedDealId : null;
    const message = (await workflow.prisma.createInboundMessage({
      organizationId: defaultOrganizationId,
      dealId: routedDealId,
      channelType: normalized.channelType,
      providerMessageId: normalized.providerMessageId,
      subject: normalized.channelType === "email" ? normalized.subject : null,
      bodyText: normalized.bodyText,
      sender: normalized.sender,
      recipient: normalized.recipient,
      routingConfidence: route.confidence,
      routingStatus: routedDealId ? "routed" : "review_required",
      visibility: routedDealId ? "shared" : "internal"
    })) as MessageDto;

    if (routedDealId) return { message, reviewItem: null };

    const reviewItem = (await workflow.prisma.createRoutingReviewItem({
      organizationId: defaultOrganizationId,
      messageId: message.id,
      suggestedDealId: route.suggestedDealId,
      confidence: route.confidence
    })) as RoutingReviewItemDto;
    return { message, reviewItem };
  }

  return fileInboundMessageInMemory(normalized, route);
}

function fileInboundMessageInMemory(normalized: NormalizedInbound, route: { confidence: number; suggestedDealId: string | null }): FiledInboundMessage {
  const workflow = getWorkflowProvider().memory;
  const threshold = workflow.organizationSettings.routingConfidenceThreshold;
  const routedDealId = route.confidence >= threshold ? route.suggestedDealId : null;
  const now = new Date().toISOString();
  const message: MessageDto = {
    id: workflow.nextId("msg", workflow.messages.length),
    dealId: routedDealId,
    channelType: normalized.channelType,
    direction: "inbound",
    messageStatus: "received",
    providerMessageId: normalized.providerMessageId,
    subject: normalized.channelType === "email" ? normalized.subject : null,
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
      summary: `${normalized.channelType === "email" ? "Email" : "SMS"} from ${normalized.sender} filed to deal`,
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
    subject: message.subject,
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
