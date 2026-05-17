import { describe, expect, it } from "vitest";
import { createInjectedApiClient } from "./api-client.js";

describe("auth and permissions smoke flow", () => {
  it("lets broker participants log in and blocks unrelated deal access", async () => {
    const participant = await createInjectedApiClient("broker-token");
    const unrelated = await createInjectedApiClient("broker-2-token");

    try {
      const session = await participant.api.getSessioncurrent();
      const visibleDeals = await participant.api.getDeals();

      expect(session.membership.role).toBe("broker");
      expect(visibleDeals.map((deal) => deal.id)).toContain("deal_sutter");

      await expect(unrelated.api.getDealsdealId({ dealId: "deal_sutter" })).rejects.toThrow("403");
    } finally {
      await participant.close();
      await unrelated.close();
    }
  });
});
