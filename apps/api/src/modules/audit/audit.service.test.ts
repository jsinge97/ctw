import { describe, expect, it } from "vitest";
import { createAuditService } from "./audit.service.js";

describe("audit service", () => {
  it("sanitizes full bodies before writing audit history", () => {
    const service = createAuditService();
    const event = service.recordAuditEvent({
      organizationId: "org_1",
      actorType: "system",
      eventType: "message.received",
      entityType: "message",
      entityId: "msg_1",
      before: { bodyText: "secret" },
      after: { extractedText: "document text" }
    });

    expect(event.before).toEqual({ bodyText: "[redacted]" });
    expect(event.after).toEqual({ extractedText: "[redacted]" });
  });
});
