import { z } from "zod";

export const organizationSettingsSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  routingConfidenceThreshold: z.number(),
  channels: z.array(z.object({ id: z.string(), type: z.string(), address: z.string(), provider: z.string(), mode: z.string(), status: z.string() }))
});
export const updateOrganizationSettingsRequestSchema = organizationSettingsSchema.pick({ name: true, routingConfidenceThreshold: true }).partial();
export type OrganizationSettingsDto = z.infer<typeof organizationSettingsSchema>;
