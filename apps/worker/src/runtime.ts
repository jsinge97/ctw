import PgBoss from "pg-boss";
import { assertProductionRuntimeSafety } from "@ctw/config";
import { ensureJobQueues, jobNames, type JobName } from "@ctw/jobs";
import { classifyDocumentRecord } from "./jobs/classify-document.js";
import { extractDocumentTextRecord } from "./jobs/extract-document-text.js";
import { generateSystemDraftRecord } from "./jobs/generate-system-draft.js";
import { ingestEmailRecord } from "./jobs/ingest-email.js";
import { ingestTwilioRecord } from "./jobs/ingest-twilio.js";
import { proposeNextActionRecord } from "./jobs/propose-next-action.js";

type WorkerMode = "memory" | "pgboss";

export type StartedWorker = {
  mode: WorkerMode;
  handlerCount: number;
  stop: () => Promise<void>;
};

type WrappedJobPayload = {
  payload?: unknown;
};

function unwrapPayload(jobData: WrappedJobPayload): unknown {
  return jobData.payload ?? jobData;
}

export async function handleQueuedJob(name: JobName, data: WrappedJobPayload): Promise<unknown> {
  const payload = parseWorkerJobPayload(name, unwrapPayload(data));
  if (name === jobNames.ingestEmail) {
    return ingestEmailRecord(payload as { organizationId: string; messageId: string });
  }
  if (name === jobNames.ingestTwilio) {
    return ingestTwilioRecord(payload as { organizationId: string; messageId: string });
  }
  if (name === jobNames.classifyDocument) {
    return classifyDocumentRecord(payload as { organizationId: string; documentId: string });
  }
  if (name === jobNames.extractDocumentText) {
    return extractDocumentTextRecord(payload as { organizationId: string; documentVersionId: string; bytes?: number[] });
  }
  if (name === jobNames.generateSystemDraft) {
    return generateSystemDraftRecord(payload as { organizationId: string; taskId: string; dealId: string });
  }
  if (name === jobNames.proposeNextAction) {
    return proposeNextActionRecord(payload as { organizationId: string; dealId: string; sourceMessageSubject?: string });
  }
  return null;
}

function parseWorkerJobPayload(name: JobName, payload: unknown): unknown {
  if (!payload || typeof payload !== "object") throw new Error(`Invalid ${name} payload`);
  if (typeof (payload as { organizationId?: unknown }).organizationId !== "string") throw new Error(`Invalid ${name} payload`);
  if ((name === jobNames.ingestEmail || name === jobNames.ingestTwilio) && typeof (payload as { messageId?: unknown }).messageId === "string") {
    const input = payload as { organizationId: string; messageId: string; providerMetadata?: unknown };
    return {
      organizationId: input.organizationId,
      messageId: input.messageId,
      ...(input.providerMetadata !== undefined ? { providerMetadata: input.providerMetadata } : {})
    };
  }
  if (name === jobNames.classifyDocument && typeof (payload as { documentId?: unknown }).documentId === "string") return payload;
  if (name === jobNames.extractDocumentText && typeof (payload as { documentVersionId?: unknown }).documentVersionId === "string") return payload;
  if (name === jobNames.generateSystemDraft && typeof (payload as { taskId?: unknown }).taskId === "string" && typeof (payload as { dealId?: unknown }).dealId === "string") return payload;
  if (name === jobNames.proposeNextAction && typeof (payload as { dealId?: unknown }).dealId === "string") return payload;
  throw new Error(`Invalid ${name} payload`);
}

export async function startWorker(options: { mode?: WorkerMode } = {}): Promise<StartedWorker> {
  assertProductionRuntimeSafety();
  const mode = options.mode ?? (process.env.CTW_JOBS_MODE === "pgboss" ? "pgboss" : "memory");
  if (mode === "pgboss") {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for pg-boss worker mode");
    const boss = new PgBoss({ connectionString: process.env.DATABASE_URL });
    boss.on("error", (error) => {
      console.error(error);
    });
    await boss.start();
    await ensureJobQueues(boss);
    await Promise.all(
      Object.values(jobNames).map((name) =>
        boss.work<WrappedJobPayload>(name, { pollingIntervalSeconds: 2 }, async (jobs) => Promise.all(jobs.map((job) => handleQueuedJob(name, job.data))))
      )
    );
    return { mode, handlerCount: Object.values(jobNames).length, stop: () => boss.stop({ graceful: true, wait: true }) };
  }

  const heartbeat = setInterval(() => undefined, 60_000);
  return {
    mode,
    handlerCount: Object.values(jobNames).length,
    stop: async () => {
      clearInterval(heartbeat);
    }
  };
}
