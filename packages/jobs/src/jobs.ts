import { z } from "zod";

export const ingestEmailJobSchema = z.object({ payload: z.unknown() });
export const ingestTwilioJobSchema = z.object({ payload: z.unknown() });
export const classifyDocumentJobSchema = z.object({ documentId: z.string() });
export const generateSystemDraftJobSchema = z.object({ taskId: z.string(), dealId: z.string() });
export const proposeNextActionJobSchema = z.object({ dealId: z.string(), sourceMessageId: z.string().optional() });

export const jobNames = {
  ingestEmail: "ingest-email",
  ingestTwilio: "ingest-twilio",
  classifyDocument: "classify-document",
  extractDocumentText: "extract-document-text",
  generateSystemDraft: "generate-system-draft",
  proposeNextAction: "propose-next-action"
} as const;
