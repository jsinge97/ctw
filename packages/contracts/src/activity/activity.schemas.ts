import { z } from "zod";

export const activityEventSchema = z.object({
  id: z.string(),
  actor: z.string(),
  action: z.string(),
  summary: z.string(),
  type: z.string(),
  createdAt: z.string()
});
export type ActivityEventDto = z.infer<typeof activityEventSchema>;
