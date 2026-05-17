import { startWorker } from "./runtime.js";

export * from "./jobs/classify-document.js";
export * from "./jobs/document-intelligence.js";
export * from "./jobs/extract-document-text.js";
export * from "./jobs/generate-system-draft.js";
export * from "./jobs/ingest-email.js";
export * from "./jobs/ingest-twilio.js";
export * from "./jobs/propose-next-action.js";
export * from "./health.js";
export * from "./runtime.js";

if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = await startWorker();
  const stop = async () => {
    await worker.stop();
    process.exit(0);
  };
  process.once("SIGINT", () => {
    void stop();
  });
  process.once("SIGTERM", () => {
    void stop();
  });
}
