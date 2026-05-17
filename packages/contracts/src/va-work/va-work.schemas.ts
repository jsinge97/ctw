import { z } from "zod";

export const vaWorkItemSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  dealId: z.string(),
  title: z.string(),
  dealTitle: z.string(),
  status: z.enum(["queued", "in_progress", "blocked", "submitted", "accepted", "rejected", "canceled", "sent_back"]),
  instructions: z.string(),
  assignedTo: z.string().nullable(),
  submittedPayload: z.record(z.string(), z.unknown()).nullable(),
  notes: z.string().nullable(),
  sentBackReason: z.string().nullable(),
  history: z.array(z.object({ status: z.string(), actor: z.string(), notes: z.string().nullable(), createdAt: z.string() }))
});
export const vaWorkDecisionRequestSchema = z.object({ notes: z.string().optional(), submittedPayload: z.record(z.string(), z.unknown()).optional() });
export const sendBackVaWorkRequestSchema = z.object({ reason: z.string().min(1), notes: z.string().optional() });
export type VaWorkItemDto = z.infer<typeof vaWorkItemSchema>;
export type VaWorkDecisionRequest = z.infer<typeof vaWorkDecisionRequestSchema>;
export type SendBackVaWorkRequest = z.infer<typeof sendBackVaWorkRequestSchema>;
