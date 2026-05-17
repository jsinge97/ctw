import { normalizeTwilioInbound } from "@ctw/integrations";

export function ingestTwilio(payload: unknown, options: { routingConfidenceThreshold?: number } = {}) {
  const normalized = normalizeTwilioInbound(payload);
  const confidence = normalized.sender ? 0.72 : 0.2;
  const threshold = options.routingConfidenceThreshold ?? 0.8;
  const routed = confidence >= threshold ? "deal_sutter" : null;
  return {
    routed,
    requiresReview: !routed,
    confidence,
    normalized
  };
}
