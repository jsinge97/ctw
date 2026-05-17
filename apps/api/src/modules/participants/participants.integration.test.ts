import { describe, expect, it } from "vitest";
import { addParticipant, listParticipants } from "./participants.service.js";

describe("participants service", () => {
  it("adds participants to a deal", async () => {
    const participant = await addParticipant("deal_sutter", { name: "Priya Nair", role: "client", capabilities: ["viewDeal"] });
    await expect(listParticipants("deal_sutter")).resolves.toContainEqual(participant);
  });
});
