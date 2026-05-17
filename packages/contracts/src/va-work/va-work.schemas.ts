import { z } from "zod";

export const vaWorkItemSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  dealId: z.string(),
  title: z.string(),
  dealTitle: z.string(),
  status: z.enum(["queued", "in_progress", "blocked", "submitted", "accepted", "rejected", "canceled", "sent_back"]),
  instructions: z.string(),
  assignedTo: z.string().nullable()
});
export const vaWorkDecisionRequestSchema = z.object({ notes: z.string().optional(), submittedPayload: z.record(z.string(), z.unknown()).optional() });
export type VaWorkItemDto = z.infer<typeof vaWorkItemSchema>;
