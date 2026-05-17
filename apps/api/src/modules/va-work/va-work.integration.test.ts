import { describe, expect, it } from "vitest";
import { resolveSessionFromToken } from "../session/session.service.js";
import { listVaWork, submitVaWork } from "./va-work.service.js";

describe("va work service", () => {
  it("submits VA work", () => {
    const session = resolveSessionFromToken("va-token");
    const [item] = listVaWork(session);
    if (!item) throw new Error("missing item");
    item.assignedTo = session.membership.id;
    expect(submitVaWork(item.id, session, { submittedPayload: { found: true } }).status).toBe("submitted");
  });
});
