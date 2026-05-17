import { describe, expect, it } from "vitest";
import { createInjectedApiClient } from "./api-client.js";

describe("ingestion routing smoke flow", () => {
  it("keeps low-confidence inbound messages in routing review", async () => {
    const { api, fetch: appFetch, close } = await createInjectedApiClient();

    try {
      const webhookResponse = await appFetch("http://ctw.test/v1/webhooks/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from: "newlead", to: "deals@northgate.cre", subject: "401 Bryant", text: "Saw the listing and can tour Friday.", messageId: "resend_e2e" })
      });
      const reviewItems = await api.getRoutingReviewItems();
      const lowConfidenceItem = reviewItems.find((item) => item.messageId === "msg_unknown");

      expect(webhookResponse.status).toBe(200);
      expect(lowConfidenceItem?.confidence).toBeLessThan(0.8);
      expect(lowConfidenceItem?.status).toBe("open");
      expect(lowConfidenceItem?.suggestedDealId).toBe("deal_bryant");
      if (!lowConfidenceItem) throw new Error("missing low-confidence item");

      const resolved = await api.postRoutingReviewItemsitemIdResolve({ itemId: lowConfidenceItem.id }, { resolution: "assign", dealId: "deal_bryant" });
      expect(resolved.status).toBe("resolved");
    } finally {
      await close();
    }
  });
});
