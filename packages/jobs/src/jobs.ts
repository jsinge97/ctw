import { z } from "zod";
import PgBoss from "pg-boss";

export const ingestEmailJobSchema = z.object({ raw: z.unknown(), normalized: z.unknown().optional() });
export const ingestTwilioJobSchema = z.object({ raw: z.unknown(), normalized: z.unknown().optional() });
export const classifyDocumentJobSchema = z.object({ documentId: z.string() });
export const extractDocumentTextJobSchema = z.object({ documentVersionId: z.string(), bytes: z.array(z.number()).optional() });
export const generateSystemDraftJobSchema = z.object({ taskId: z.string(), dealId: z.string() });
export const proposeNextActionJobSchema = z.object({ dealId: z.string(), sourceMessageId: z.string().optional(), sourceMessageSubject: z.string().optional() });

export const jobNames = {
  ingestEmail: "ingest-email",
  ingestTwilio: "ingest-twilio",
  classifyDocument: "classify-document",
  extractDocumentText: "extract-document-text",
  generateSystemDraft: "generate-system-draft",
  proposeNextAction: "propose-next-action"
} as const;

export type JobName = (typeof jobNames)[keyof typeof jobNames];
export const jobPayloadSchemas = {
  [jobNames.ingestEmail]: ingestEmailJobSchema,
  [jobNames.ingestTwilio]: ingestTwilioJobSchema,
  [jobNames.classifyDocument]: classifyDocumentJobSchema,
  [jobNames.extractDocumentText]: extractDocumentTextJobSchema,
  [jobNames.generateSystemDraft]: generateSystemDraftJobSchema,
  [jobNames.proposeNextAction]: proposeNextActionJobSchema
} as const;

export function parseJobPayload(name: JobName, payload: unknown): unknown {
  return jobPayloadSchemas[name].parse(payload);
}

export type QueuedJob = {
  id: string;
  name: JobName;
  payload: unknown;
  queuedAt: string;
};

const memoryJobs: QueuedJob[] = [];
let bossPromise: Promise<PgBoss> | undefined;

async function getBoss(): Promise<PgBoss> {
  bossPromise ??= (async () => {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for pg-boss jobs");
    const boss = new PgBoss({ connectionString: process.env.DATABASE_URL });
    await boss.start();
    return boss;
  })();
  return bossPromise;
}

export async function enqueueJob(name: JobName, payload: unknown): Promise<QueuedJob> {
  const job = {
    id: `job_${memoryJobs.length + 1}`,
    name,
    payload,
    queuedAt: new Date().toISOString()
  };
  if (process.env.CTW_JOBS_MODE === "pgboss") {
    const boss = await getBoss();
    const id = await boss.send(name, { payload });
    return { ...job, id: String(id) };
  }
  memoryJobs.push(job);
  return job;
}

export function listQueuedJobs(): QueuedJob[] {
  return [...memoryJobs];
}
