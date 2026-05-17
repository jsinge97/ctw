import { describe, expect, it } from "vitest";
import { createDocument, listDocuments } from "./documents.service.js";

describe("documents service", () => {
  it("files new documents as pending classification", () => {
    const document = createDocument("deal_sutter", { title: "New lease.pdf" });
    expect(document.classificationStatus).toBe("pending");
    expect(listDocuments("deal_sutter")).toContainEqual(document);
  });
});
