import { describe, expect, it } from "vitest";
import { listDealActivity } from "./activity.service.js";

describe("activity service", () => {
  it("lists activity", async () => {
    expect((await listDealActivity("deal_sutter")).length).toBeGreaterThan(0);
  });
});
