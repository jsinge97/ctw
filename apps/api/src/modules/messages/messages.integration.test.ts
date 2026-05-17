import { describe, expect, it } from "vitest";
import { listMessages, updateMessage } from "./messages.service.js";

describe("messages service", () => {
  it("redacts bodies through explicit redaction", () => {
    const [message] = listMessages("deal_sutter");
    if (!message) throw new Error("missing message");
    const updated = updateMessage(message.id, { redacted: true });
    expect(updated.bodyText).toBe("[redacted]");
  });
});
