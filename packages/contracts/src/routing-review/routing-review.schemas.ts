import { z } from "zod";

export const routingReviewItemSchema = z.object({
  id: z.string(),
  messageId: z.string(),
  suggestedDealId: z.string().nullable(),
  suggestedDealTitle: z.string().nullable(),
  confidence: z.number(),
  sender: z.string(),
  subject: z.string().nullable(),
  preview: z.string(),
  ageLabel: z.string(),
  explanation: z.string()
});
export const resolveRoutingReviewRequestSchema = z.object({ resolution: z.enum(["assign", "unrelated", "create_deal"]), dealId: z.string().optional(), newDealTitle: z.string().optional() });
export type RoutingReviewItemDto = z.infer<typeof routingReviewItemSchema>;
