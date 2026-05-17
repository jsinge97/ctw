import { z } from "zod";

export const resendInboundSchema = z.object({
  from: z.string(),
  to: z.string(),
  subject: z.string().optional(),
  text: z.string().default(""),
  messageId: z.string().optional()
});

export function normalizeResendInbound(payload: unknown) {
  const parsed = resendInboundSchema.parse(payload);
  return { provider: "resend" as const, channelType: "email" as const, sender: parsed.from, recipient: parsed.to, subject: parsed.subject ?? null, bodyText: parsed.text, providerMessageId: parsed.messageId ?? null };
}
