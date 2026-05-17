import { normalizeResendInbound } from "@ctw/integrations";

export function ingestEmail(payload: unknown) {
  const normalized = normalizeResendInbound(payload);
  return {
    routed: normalized.sender.includes("@") ? "deal_sutter" : null,
    confidence: normalized.sender.includes("@") ? 0.92 : 0.4,
    normalized
  };
}
