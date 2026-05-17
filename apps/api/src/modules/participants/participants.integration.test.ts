import { describe, expect, it } from "vitest";
import { addParticipant, listParticipants } from "./participants.service.js";

describe("participants service", () => {
  it("adds participants to a deal", () => {
    const participant = addParticipant("deal_sutter", { name: "Priya Nair", role: "client", capabilities: ["viewDeal"] });
    expect(listParticipants("deal_sutter")).toContainEqual(participant);
  });
});
