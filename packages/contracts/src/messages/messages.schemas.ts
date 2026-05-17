import { z } from "zod";

export const messageSchema = z.object({
  id: z.string(),
  dealId: z.string().nullable(),
  channelType: z.enum(["email", "sms", "voice", "note"]),
  direction: z.enum(["inbound", "outbound", "internal"]),
  messageStatus: z.enum(["received", "draft", "pending_approval", "sent", "failed", "hidden", "redacted"]),
  providerMessageId: z.string().nullable(),
  subject: z.string().nullable(),
  preview: z.string(),
  bodyText: z.string(),
  occurredAt: z.string(),
  visibility: z.enum(["internal", "shared"]),
  routingConfidence: z.number().nullable(),
  routingStatus: z.enum(["routed", "review_required", "unrelated"])
});
export const updateMessageRequestSchema = z.object({ dealId: z.string().optional(), visibility: z.enum(["internal", "shared"]).optional(), hidden: z.boolean().optional(), redacted: z.boolean().optional() });
export type MessageDto = z.infer<typeof messageSchema>;
export type UpdateMessageRequest = z.infer<typeof updateMessageRequestSchema>;
