import { z } from "zod";

export const documentTypeSchema = z.enum(["unknown", "loi", "lease", "om", "estoppel", "comp_set", "other"]);
export const documentSchema = z.object({
  id: z.string(),
  dealId: z.string().nullable(),
  title: z.string(),
  documentType: documentTypeSchema,
  classificationStatus: z.enum(["pending", "classified", "failed"]),
  latestVersion: z.string(),
  visibility: z.enum(["internal", "shared"]),
  folder: z.string().nullable(),
  tags: z.array(z.string())
});
export const updateDocumentRequestSchema = z.object({ title: z.string().optional(), documentType: documentTypeSchema.optional(), visibility: z.enum(["internal", "shared"]).optional(), folder: z.string().nullable().optional(), tags: z.array(z.string()).optional() });
export type DocumentDto = z.infer<typeof documentSchema>;
export type UpdateDocumentRequest = z.infer<typeof updateDocumentRequestSchema>;
