import { describe, expect, it } from "vitest";
import { listDealActivity } from "./activity.service.js";

describe("activity service", () => {
  it("lists activity", () => {
    expect(listDealActivity("deal_sutter").length).toBeGreaterThan(0);
  });
});
