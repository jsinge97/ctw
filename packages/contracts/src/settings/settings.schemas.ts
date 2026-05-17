import { z } from "zod";

export const organizationSettingsSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  routingConfidenceThreshold: z.number(),
  channels: z.array(z.object({ id: z.string(), type: z.string(), address: z.string(), provider: z.string(), mode: z.string(), status: z.string() }))
});
export const updateOrganizationSettingsRequestSchema = organizationSettingsSchema.pick({ name: true, routingConfidenceThreshold: true }).partial();
export const updateOrganizationChannelRequestSchema = z.object({ mode: z.string().optional(), status: z.string().optional() });
export const routingThresholdPreviewSchema = z.object({ threshold: z.number(), wouldEnterReview: z.number().int().nonnegative(), wouldAutoRoute: z.number().int().nonnegative() });
export type OrganizationSettingsDto = z.infer<typeof organizationSettingsSchema>;
export type UpdateOrganizationSettingsRequest = z.infer<typeof updateOrganizationSettingsRequestSchema>;
export type UpdateOrganizationChannelRequest = z.infer<typeof updateOrganizationChannelRequestSchema>;
export type RoutingThresholdPreviewDto = z.infer<typeof routingThresholdPreviewSchema>;
