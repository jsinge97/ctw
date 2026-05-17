import { z } from "zod";

export const participantSchema = z.object({
  id: z.string(),
  dealId: z.string(),
  name: z.string(),
  company: z.string().nullable(),
  role: z.enum(["am", "broker", "client", "client_contact", "va", "observer"]),
  visibility: z.enum(["internal", "shared"]),
  capabilities: z.array(z.string()),
  status: z.enum(["active", "invited", "removed"])
});
export const addParticipantRequestSchema = participantSchema.pick({ name: true, company: true, role: true }).extend({ capabilities: z.array(z.string()).default([]) });
export const updateParticipantRequestSchema = z.object({ visibility: z.enum(["internal", "shared"]).optional(), capabilities: z.array(z.string()).optional(), status: z.enum(["active", "removed"]).optional() });
export type ParticipantDto = z.infer<typeof participantSchema>;
