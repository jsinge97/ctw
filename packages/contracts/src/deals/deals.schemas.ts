import { z } from "zod";

export const dealStageSchema = z.enum(["prospect", "loi", "negotiation", "diligence", "close", "closed_won", "lost"]);
export const dealSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  title: z.string(),
  primaryCompanyName: z.string().nullable(),
  stage: dealStageSchema,
  status: z.enum(["active", "archived", "closed"]),
  ownerInitials: z.string(),
  staleFlag: z.boolean(),
  lastActivityAt: z.string().nullable(),
  nextActionLabel: z.string().nullable(),
  pendingApprovals: z.number().int().nonnegative(),
  capabilities: z.array(z.string())
});
export const createDealRequestSchema = z.object({ title: z.string().min(1), primaryCompanyName: z.string().optional() });
export const patchDealRequestSchema = createDealRequestSchema.partial().extend({ staleFlag: z.boolean().optional() });
export const moveDealStageRequestSchema = z.object({ stage: dealStageSchema });
export type DealDto = z.infer<typeof dealSchema>;
export type CreateDealRequest = z.infer<typeof createDealRequestSchema>;
export type PatchDealRequest = z.infer<typeof patchDealRequestSchema>;
export type MoveDealStageRequest = z.infer<typeof moveDealStageRequestSchema>;
