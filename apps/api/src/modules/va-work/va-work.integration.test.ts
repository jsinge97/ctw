import { describe, expect, it } from "vitest";
import { resolveSessionFromToken } from "../session/session.service.js";
import { acceptVaWork, listVaWork, submitVaWork } from "./va-work.service.js";

describe("va work service", () => {
  it("submits VA work", async () => {
    const session = resolveSessionFromToken("va-token");
    const [item] = await listVaWork(session);
    if (!item) throw new Error("missing item");
    await acceptVaWork(item.id, session);
    const submitted = await submitVaWork(item.id, session, { submittedPayload: { found: true } });
    expect(submitted.status).toBe("submitted");
  });
});
