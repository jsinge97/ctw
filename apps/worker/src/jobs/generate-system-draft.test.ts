import { describe, expect, it } from "vitest";
import { generateSystemDraft } from "./generate-system-draft.js";

describe("generateSystemDraft", () => {
  it("creates deterministic draft text", () => {
    expect(generateSystemDraft({ dealTitle: "Sutter Tower", taskTitle: "Send LOI response" }).bodyText).toContain("Sutter Tower");
  });
});
