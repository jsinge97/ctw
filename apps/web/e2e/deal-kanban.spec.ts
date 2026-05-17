import { describe, expect, it } from "vitest";
import { createInjectedApiClient } from "./api-client.js";

describe("deal kanban smoke flow", () => {
  it("returns stage cards with exactly one next-action label per deal", async () => {
    const { api, close } = await createInjectedApiClient();

    try {
      const deals = await api.getDeals();
      const activeDeal = deals.find((deal) => deal.id === "deal_sutter");

      expect(activeDeal?.stage).toBe("loi");
      expect(activeDeal?.nextActionLabel).toBe("Send LOI response");
      expect(deals.every((deal) => !Array.isArray(deal.nextActionLabel))).toBe(true);
    } finally {
      await close();
    }
  });
});
