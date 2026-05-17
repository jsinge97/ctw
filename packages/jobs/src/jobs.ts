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

export type JobName = (typeof jobNames)[keyof typeof jobNames];
export type QueuedJob = {
  id: string;
  name: JobName;
  payload: unknown;
  queuedAt: string;
};

const memoryJobs: QueuedJob[] = [];

export function enqueueJob(name: JobName, payload: unknown): QueuedJob {
  const job = {
    id: `job_${memoryJobs.length + 1}`,
    name,
    payload,
    queuedAt: new Date().toISOString()
  };
  memoryJobs.push(job);
  return job;
}

export function listQueuedJobs(): QueuedJob[] {
  return [...memoryJobs];
}
