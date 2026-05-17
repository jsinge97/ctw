import type { DealDto } from "@ctw/contracts";
import { PrismaWorkflowRepository, getPrismaClient } from "@ctw/db";
import { normalizeResendInbound } from "@ctw/integrations";

export function ingestEmail(payload: unknown, options: { routingConfidenceThreshold?: number } = {}) {
  const normalized = normalizeResendInbound(payload);
  const confidence = normalized.sender.includes("@") ? 0.92 : 0.4;
  const threshold = options.routingConfidenceThreshold ?? 0.8;
  const routed = confidence >= threshold ? "deal_sutter" : null;
  return {
    routed,
    requiresReview: !routed,
    confidence,
    normalized
  };
}

export async function ingestEmailRecord(payload: unknown) {
  const normalized = normalizeResendInbound(payload);
  if (process.env.CTW_DB_MODE !== "prisma") return ingestEmail(payload);

  const repository = new PrismaWorkflowRepository(getPrismaClient());
  const channel = await repository.findOrganizationByChannelAddress("email", normalized.recipient);
  if (!channel) throw new Error("Inbound channel not found");
  const settings = (await repository.getOrganizationSettings(channel.organizationId)) as { routingConfidenceThreshold: number };
  const deals = (await repository.listDeals(channel.organizationId)) as Pick<DealDto, "id" | "title">[];
  const route = scoreRoute(normalized.subject ?? "", normalized.bodyText, deals);
  const routedDealId = route.confidence >= settings.routingConfidenceThreshold ? route.suggestedDealId : null;
  const message = await repository.createInboundMessage({
    organizationId: channel.organizationId,
    channelId: channel.channelId,
    dealId: routedDealId,
    channelType: "email",
    providerMessageId: normalized.providerMessageId,
    subject: normalized.subject,
    bodyText: normalized.bodyText,
    sender: normalized.sender,
    recipient: normalized.recipient,
    routingConfidence: route.confidence,
    routingStatus: routedDealId ? "routed" : "review_required",
    visibility: routedDealId ? "shared" : "internal"
  });
  if (!routedDealId) await repository.createRoutingReviewItem({ organizationId: channel.organizationId, messageId: (message as { id: string }).id, suggestedDealId: route.suggestedDealId, confidence: route.confidence });
  return { routed: routedDealId, requiresReview: !routedDealId, confidence: route.confidence, normalized };
}

function scoreRoute(subject: string, body: string, deals: Pick<DealDto, "id" | "title">[]) {
  const haystack = `${subject} ${body}`.toLowerCase();
  const deal = deals.find((candidate) => haystack.includes(candidate.title.toLowerCase().split("-")[0]?.trim() ?? candidate.title.toLowerCase()));
  if (!deal) return { confidence: 0.4, suggestedDealId: null };
  return { confidence: haystack.includes(deal.title.toLowerCase()) ? 0.92 : 0.41, suggestedDealId: deal.id };
}
