import { describe, expect, it } from "vitest";
import { resolveSessionFromToken } from "../session/session.service.js";
import { createDocument, listDocuments, uploadDocument } from "./documents.service.js";

describe("documents service", () => {
  it("files new documents as pending classification", async () => {
    const document = await createDocument("deal_sutter", { title: "New lease.pdf" });
    expect(document.classificationStatus).toBe("pending");
    await expect(listDocuments("deal_sutter")).resolves.toContainEqual(document);
  });

  it("stores uploaded documents without exposing object keys", async () => {
    const document = await uploadDocument("deal_sutter", { filename: "Lease.pdf", contentType: "application/pdf", bytes: new TextEncoder().encode("lease") }, resolveSessionFromToken("am-token"));
    expect(document).toMatchObject({ title: "Lease.pdf", latestVersion: "v1" });
    expect(document).not.toHaveProperty("storageKey");
  });
});
