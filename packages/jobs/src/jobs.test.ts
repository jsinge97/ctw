import { describe, expect, it } from "vitest";
import { jobNames, parseJobPayload } from "./jobs.js";

describe("job payload schemas", () => {
  it("validates known job payloads", () => {
    expect(parseJobPayload(jobNames.classifyDocument, { organizationId: "org_1", documentId: "doc_1" })).toEqual({ organizationId: "org_1", documentId: "doc_1" });
    expect(parseJobPayload(jobNames.extractDocumentText, { organizationId: "org_1", documentVersionId: "ver_1", bytes: [1, 2, 3] })).toEqual({ organizationId: "org_1", documentVersionId: "ver_1", bytes: [1, 2, 3] });
    expect(parseJobPayload(jobNames.ingestEmail, { organizationId: "org_1", messageId: "msg_1", raw: { text: "secret" } })).toEqual({ organizationId: "org_1", messageId: "msg_1" });
  });

  it("rejects invalid payloads before handlers run", () => {
    expect(() => parseJobPayload(jobNames.generateSystemDraft, { organizationId: "org_1", taskId: "task_1" })).toThrow();
    expect(() => parseJobPayload(jobNames.ingestEmail, { organizationId: "org_1", providerMetadata: {} })).toThrow();
  });
});
