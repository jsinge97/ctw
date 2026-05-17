import { describe, expect, it } from "vitest";
import { createInjectedApiClient } from "./api-client.js";

describe("auth and permissions smoke flow", () => {
  it("lets broker participants log in and blocks unrelated deal access", async () => {
    const am = await createInjectedApiClient("am-token");
    const participant = await createInjectedApiClient("broker-token");
    const unrelated = await createInjectedApiClient("broker-2-token");

    try {
      const createdDeal = await am.api.postDeals({ title: "Mission Bay - Suite 500", primaryCompanyName: "Atlas Labs" });
      const addedParticipant = await am.api.postDealsdealIdParticipants(
        { dealId: createdDeal.id },
        { name: "Jordan Client", role: "client", company: "Atlas Labs", capabilities: ["viewDeal"] }
      );
      const updatedParticipant = await am.api.patchDealsdealIdParticipantsParticipantId(
        { dealId: createdDeal.id, participantId: addedParticipant.id },
        { capabilities: ["viewDeal", "uploadDocuments"] }
      );
      const session = await participant.api.getSessioncurrent();
      const visibleDeals = await participant.api.getDeals();

      expect(createdDeal.title).toBe("Mission Bay - Suite 500");
      expect(updatedParticipant.capabilities).toEqual(["viewDeal", "uploadDocuments"]);
      expect(session.membership.role).toBe("broker");
      expect(visibleDeals.map((deal) => deal.id)).toContain("deal_sutter");

      await expect(unrelated.api.getDealsdealId({ dealId: "deal_sutter" })).rejects.toThrow("403");
    } finally {
      await am.close();
      await participant.close();
      await unrelated.close();
    }
  });
});
