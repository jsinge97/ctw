import { z } from "zod";

export const participantSchema = z.object({
  id: z.string(),
  dealId: z.string(),
  subjectType: z.enum(["membership", "contact"]),
  subjectId: z.string(),
  membershipId: z.string().nullable(),
  contactId: z.string().nullable(),
  name: z.string(),
  company: z.string().nullable(),
  role: z.enum(["am", "broker", "client", "client_contact", "va", "observer"]),
  visibility: z.enum(["internal", "shared"]),
  capabilities: z.array(z.string()),
  status: z.enum(["active", "invited", "removed"])
});
export const addParticipantRequestSchema = participantSchema.pick({ name: true, role: true }).extend({ company: z.string().nullable().optional(), capabilities: z.array(z.string()).default([]) });
export const updateParticipantRequestSchema = z.object({ visibility: z.enum(["internal", "shared"]).optional(), capabilities: z.array(z.string()).optional(), status: z.enum(["active", "removed"]).optional() });
export type ParticipantDto = z.infer<typeof participantSchema>;
export type AddParticipantRequest = z.infer<typeof addParticipantRequestSchema>;
export type UpdateParticipantRequest = z.infer<typeof updateParticipantRequestSchema>;
