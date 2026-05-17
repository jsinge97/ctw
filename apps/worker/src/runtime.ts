import PgBoss from "pg-boss";
import { jobNames, type JobName } from "@ctw/jobs";
import { classifyDocument } from "./jobs/classify-document.js";
import { extractDocumentText } from "./jobs/extract-document-text.js";
import { generateSystemDraft } from "./jobs/generate-system-draft.js";
import { ingestEmail } from "./jobs/ingest-email.js";
import { ingestTwilio } from "./jobs/ingest-twilio.js";
import { proposeNextAction } from "./jobs/propose-next-action.js";

type WorkerMode = "memory" | "pgboss";

export type StartedWorker = {
  mode: WorkerMode;
  stop: () => Promise<void>;
};

type WrappedJobPayload = {
  payload?: unknown;
};

function unwrapPayload(jobData: WrappedJobPayload): unknown {
  return jobData.payload ?? jobData;
}

export async function handleQueuedJob(name: JobName, data: WrappedJobPayload): Promise<unknown> {
  const payload = unwrapPayload(data);
  if (name === jobNames.ingestEmail) {
    const raw = typeof payload === "object" && payload !== null && "raw" in payload ? (payload as { raw: unknown }).raw : payload;
    return ingestEmail(raw);
  }
  if (name === jobNames.ingestTwilio) {
    const raw = typeof payload === "object" && payload !== null && "raw" in payload ? (payload as { raw: unknown }).raw : payload;
    return ingestTwilio(raw);
  }
  if (name === jobNames.classifyDocument) {
    const documentId = typeof payload === "object" && payload !== null && "documentId" in payload ? String((payload as { documentId: unknown }).documentId) : "unknown";
    return classifyDocument(documentId);
  }
  if (name === jobNames.extractDocumentText) {
    return extractDocumentText(new Uint8Array([1]));
  }
  if (name === jobNames.generateSystemDraft) {
    const input = typeof payload === "object" && payload !== null ? payload as { dealTitle?: unknown; taskTitle?: unknown } : {};
    return generateSystemDraft({ dealTitle: String(input.dealTitle ?? "Deal"), taskTitle: String(input.taskTitle ?? "Follow up") });
  }
  if (name === jobNames.proposeNextAction) {
    const input = typeof payload === "object" && payload !== null ? payload as { dealId?: unknown; sourceMessageSubject?: unknown } : {};
    return proposeNextAction({
      dealId: String(input.dealId ?? "unknown"),
      ...(typeof input.sourceMessageSubject === "string" ? { sourceMessageSubject: input.sourceMessageSubject } : {})
    });
  }
  return null;
}

export async function startWorker(options: { mode?: WorkerMode } = {}): Promise<StartedWorker> {
  const mode = options.mode ?? (process.env.CTW_JOBS_MODE === "pgboss" ? "pgboss" : "memory");
  if (mode === "pgboss") {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for pg-boss worker mode");
    const boss = new PgBoss({ connectionString: process.env.DATABASE_URL });
    boss.on("error", (error) => {
      console.error(error);
    });
    await boss.start();
    await Promise.all(
      Object.values(jobNames).map((name) =>
        boss.work<WrappedJobPayload>(name, { pollingIntervalSeconds: 2 }, async (jobs) => Promise.all(jobs.map((job) => handleQueuedJob(name, job.data))))
      )
    );
    return { mode, stop: () => boss.stop({ graceful: true, wait: true }) };
  }

  const heartbeat = setInterval(() => undefined, 60_000);
  return {
    mode,
    stop: async () => {
      clearInterval(heartbeat);
    }
  };
}
