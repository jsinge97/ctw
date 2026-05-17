import { describe, expect, it } from "vitest";
import { listVaWork, submitVaWork } from "./va-work.service.js";

describe("va work service", () => {
  it("submits VA work", () => {
    const [item] = listVaWork();
    if (!item) throw new Error("missing item");
    expect(submitVaWork(item.id, { submittedPayload: { found: true } }).status).toBe("submitted");
  });
});
