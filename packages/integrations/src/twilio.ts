import { z } from "zod";

export const twilioInboundSchema = z.object({
  From: z.string(),
  To: z.string(),
  Body: z.string().default(""),
  MessageSid: z.string().optional()
});

export function normalizeTwilioInbound(payload: unknown) {
  const parsed = twilioInboundSchema.parse(payload);
  return { provider: "twilio" as const, channelType: "sms" as const, sender: parsed.From, recipient: parsed.To, bodyText: parsed.Body, providerMessageId: parsed.MessageSid ?? null, rawProviderPayload: { provider: "twilio", from: parsed.From, to: parsed.To, messageSid: parsed.MessageSid ?? null, bodyBytes: parsed.Body.length } };
}
