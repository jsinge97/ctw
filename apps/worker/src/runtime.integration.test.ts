import { describe, expect, it } from "vitest";
import { jobNames } from "@ctw/jobs";
import { getWorkerHealth } from "./health.js";
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
      expect(getWorkerHealth({ queueMode: worker.mode, registeredHandlerCount: worker.handlerCount })).toMatchObject({ queueMode: "memory", registeredHandlerCount: Object.values(jobNames).length });
    } finally {
      await worker.stop();
    }
  });
});
