import { describe, expect, it } from "vitest";
import { ingestEmail } from "./ingest-email.js";

describe("ingestEmail", () => {
  it("normalizes provider payloads", () => {
    expect(ingestEmail({ from: "broker@example.com", to: "deals@example.com", text: "LOI attached" }).confidence).toBeGreaterThan(0.8);
  });
});
