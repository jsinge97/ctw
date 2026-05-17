import { describe, expect, it } from "vitest";
import { jobNames } from "@ctw/jobs";
import { getWorkerHealth, getWorkerReadiness } from "./health.js";
import { handleQueuedJob, startWorker } from "./runtime.js";

describe("worker runtime", () => {
  it("validates payloads before dispatch", async () => {
    await expect(handleQueuedJob(jobNames.generateSystemDraft, { payload: { organizationId: "org_1", taskId: "task_1" } })).rejects.toThrow();
  });

  it("dispatches inline ingest jobs", async () => {
    await expect(handleQueuedJob(jobNames.ingestEmail, { payload: { organizationId: "org_1", messageId: "msg_1", providerMetadata: { provider: "resend" } } })).resolves.toMatchObject({ idempotent: true });
  });

  it("reports queue mode and handler count", async () => {
    const worker = await startWorker({ mode: "memory" });
    try {
      expect(getWorkerHealth({ queueMode: worker.mode, registeredHandlerCount: worker.handlerCount })).toMatchObject({ queueMode: "memory", registeredHandlerCount: Object.values(jobNames).length, queueConnection: "skipped" });
    } finally {
      await worker.stop();
    }
  });

  it("fails readiness for unsafe production settings", async () => {
    await expect(
      getWorkerReadiness({
        CTW_RUNTIME_MODE: "production",
        CTW_DB_MODE: "memory",
        CTW_JOBS_MODE: "memory",
        CTW_PROVIDER_MODE: "fake",
        CTW_STORAGE_MODE: "memory",
        CTW_ALLOW_DEMO_TOKENS: "true"
      })
    ).resolves.toMatchObject({ ok: false, queueConnection: "failed" });
  });
});
