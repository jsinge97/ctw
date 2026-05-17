import { normalizeTwilioInbound } from "@ctw/integrations";

export function ingestTwilio(payload: unknown) {
  const normalized = normalizeTwilioInbound(payload);
  return {
    routed: normalized.sender ? "deal_sutter" : null,
    confidence: normalized.sender ? 0.72 : 0.2,
    normalized
  };
}
