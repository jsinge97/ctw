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
