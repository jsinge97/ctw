import { describe, expect, it } from "vitest";
import { sanitizeAuditPayload } from "./audit.js";

describe("sanitizeAuditPayload", () => {
  it("redacts message and document bodies", () => {
    expect(sanitizeAuditPayload({ bodyText: "secret", nested: { extractedText: "file text" } })).toEqual({
      bodyText: "[redacted]",
      nested: { extractedText: "[redacted]" }
    });
  });
});
