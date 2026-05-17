import type { DealDto, MessageDto, RoutingReviewItemDto } from "@ctw/contracts";
import type { normalizeResendInbound, normalizeTwilioInbound } from "@ctw/integrations";
import { Buffer } from "node:buffer";
import { createStoredDocument } from "../documents/documents.service.js";
import { getWorkflowProvider } from "../workflow-provider.js";

type NormalizedEmail = ReturnType<typeof normalizeResendInbound>;
type NormalizedSms = ReturnType<typeof normalizeTwilioInbound>;
type NormalizedInbound = NormalizedEmail | NormalizedSms;

type FiledInboundMessage = { message: MessageDto; reviewItem: RoutingReviewItemDto | null };

function scoreInboundRoute(normalized: NormalizedInbound, candidates: Pick<DealDto, "id" | "title">[]): { confidence: number; suggestedDealId: string | null } {
  const subject = normalized.channelType === "email" ? normalized.subject?.toLowerCase() ?? "" : "";
  const body = normalized.bodyText.toLowerCase();
  const haystack = `${subject} ${body}`;
  const matchedDeal = candidates.find((deal) => dealTitleSignals(deal.title).some((signal) => haystack.includes(signal)));
  if (matchedDeal) {
    const exactTitle = matchedDeal.title.toLowerCase();
    return { confidence: subject.includes(exactTitle) || body.includes(exactTitle) ? 0.92 : 0.41, suggestedDealId: matchedDeal.id };
  }
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

  if (workflow.mode === "prisma" && workflow.prisma) {
    const channel = await workflow.prisma.findOrganizationByChannelAddress(normalized.channelType, normalized.recipient);
    if (!channel) throw Object.assign(new Error("Inbound channel not found"), { statusCode: 404 });
    const candidates = (await workflow.prisma.listDeals(channel.organizationId)) as Pick<DealDto, "id" | "title">[];
    const route = scoreInboundRoute(normalized, candidates);
    const settings = (await workflow.prisma.getOrganizationSettings(channel.organizationId)) as { routingConfidenceThreshold: number };
    const routedDealId = route.confidence >= settings.routingConfidenceThreshold ? route.suggestedDealId : null;
    const message = (await workflow.prisma.createInboundMessage({
      organizationId: channel.organizationId,
      dealId: routedDealId,
      channelId: channel.channelId,
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

    if (message.dealId && normalized.channelType === "email") {
      await fileEmailAttachments({ organizationId: channel.organizationId, dealId: message.dealId, attachments: normalized.attachments });
    }

    if (routedDealId) return { message, reviewItem: null };

    const reviewItem = (await workflow.prisma.createRoutingReviewItem({
      organizationId: channel.organizationId,
      messageId: message.id,
      suggestedDealId: route.suggestedDealId,
      confidence: route.confidence
    })) as RoutingReviewItemDto;
    return { message, reviewItem };
  }

  const route = scoreInboundRoute(normalized, getWorkflowProvider().memory.deals);
  return fileInboundMessageInMemory(normalized, route);
}

async function fileEmailAttachments(options: { organizationId: string; dealId: string; attachments: NormalizedEmail["attachments"] }) {
  for (const attachment of options.attachments) {
    if (!attachment.contentBase64) continue;
    await createStoredDocument({
      organizationId: options.organizationId,
      dealId: options.dealId,
      uploadedByMembershipId: null,
      input: {
        filename: attachment.filename,
        contentType: attachment.contentType,
        bytes: Buffer.from(attachment.contentBase64, "base64"),
        title: attachment.filename,
        visibility: "internal",
        tags: ["email-attachment"]
      }
    });
  }
}

function dealTitleSignals(title: string): string[] {
  const normalized = title.toLowerCase();
  const primary = normalized.split("-")[0]?.trim();
  return [primary, normalized].filter((signal): signal is string => Boolean(signal && signal.length >= 4));
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
