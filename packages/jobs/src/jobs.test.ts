import { describe, expect, it } from "vitest";
import { jobNames, parseJobPayload } from "./jobs.js";

describe("job payload schemas", () => {
  it("validates known job payloads", () => {
    expect(parseJobPayload(jobNames.classifyDocument, { documentId: "doc_1" })).toEqual({ documentId: "doc_1" });
    expect(parseJobPayload(jobNames.extractDocumentText, { documentVersionId: "ver_1", bytes: [1, 2, 3] })).toEqual({ documentVersionId: "ver_1", bytes: [1, 2, 3] });
  });

  it("rejects invalid payloads before handlers run", () => {
    expect(() => parseJobPayload(jobNames.generateSystemDraft, { taskId: "task_1" })).toThrow();
  });
});
