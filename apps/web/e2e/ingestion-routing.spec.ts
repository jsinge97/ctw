import { describe, expect, it } from "vitest";
import { createInjectedApiClient } from "./api-client.js";

describe("ingestion routing smoke flow", () => {
  it("keeps low-confidence inbound messages in routing review", async () => {
    const { api, close } = await createInjectedApiClient();

    try {
      const reviewItems = await api.getRoutingReviewItems();
      const lowConfidenceItem = reviewItems.find((item) => item.messageId === "msg_unknown");

      expect(lowConfidenceItem?.confidence).toBeLessThan(0.8);
      expect(lowConfidenceItem?.status).toBe("open");
      expect(lowConfidenceItem?.suggestedDealId).toBe("deal_bryant");
    } finally {
      await close();
    }
  });
});
