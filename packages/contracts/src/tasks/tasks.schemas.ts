import { z } from "zod";

export const taskSchema = z.object({
  id: z.string(),
  dealId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(["proposed", "approved", "in_progress", "waiting_approval", "completed", "rejected", "deferred", "canceled"]),
  route: z.enum(["system", "va", "self"]),
  isCurrentNextAction: z.boolean(),
  payload: z.record(z.string(), z.unknown()),
  dueAt: z.string().nullable()
});
export const createTaskRequestSchema = z.object({ title: z.string().min(1), description: z.string().optional(), route: z.enum(["system", "va", "self"]).default("self") });
export const taskDecisionRequestSchema = z.object({ reason: z.string().optional(), route: z.enum(["system", "va", "self"]).optional(), editedTitle: z.string().optional() });
export type TaskDto = z.infer<typeof taskSchema>;
