import { z } from "zod";

export const resendInboundSchema = z.object({
  from: z.string(),
  to: z.string(),
  subject: z.string().optional(),
  text: z.string().default(""),
  messageId: z.string().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        contentType: z.string().optional(),
        content: z.string().optional(),
        contentBase64: z.string().optional(),
        size: z.number().optional()
      })
    )
    .default([])
});

export function normalizeResendInbound(payload: unknown) {
  const parsed = resendInboundSchema.parse(payload);
  return {
    provider: "resend" as const,
    channelType: "email" as const,
    sender: parsed.from,
    recipient: parsed.to,
    subject: parsed.subject ?? null,
    bodyText: parsed.text,
    providerMessageId: parsed.messageId ?? null,
    attachments: parsed.attachments.map((attachment) => ({
      filename: attachment.filename,
      contentType: attachment.contentType ?? "application/octet-stream",
      contentBase64: attachment.contentBase64 ?? attachment.content ?? null,
      size: attachment.size ?? null
    })),
    rawProviderPayload: payload
  };
}
