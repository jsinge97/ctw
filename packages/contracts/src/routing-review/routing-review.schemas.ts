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
  explanation: z.string(),
  status: z.enum(["open", "resolved", "dismissed"]),
  resolution: z.enum(["assigned_to_deal", "marked_unrelated", "created_new_deal"]).nullable(),
  resolvedDealId: z.string().nullable(),
  resolvedAt: z.string().nullable()
});
export const resolveRoutingReviewRequestSchema = z.discriminatedUnion("resolution", [
  z.object({ resolution: z.literal("assign"), dealId: z.string().min(1) }),
  z.object({ resolution: z.literal("unrelated") }),
  z.object({ resolution: z.literal("create_deal"), newDealTitle: z.string().min(1) })
]);
export type RoutingReviewItemDto = z.infer<typeof routingReviewItemSchema>;
export type ResolveRoutingReviewRequest = z.infer<typeof resolveRoutingReviewRequestSchema>;
