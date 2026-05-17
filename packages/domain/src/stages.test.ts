import { describe, expect, it } from "vitest";
import { canTransitionDealStage, transitionReason } from "./stages.js";

describe("deal stage rules", () => {
  it("allows nearby stage movement", () => {
    expect(canTransitionDealStage("prospect", "loi")).toBe(true);
    expect(canTransitionDealStage("loi", "diligence")).toBe(true);
  });

  it("blocks movement out of terminal stages", () => {
    expect(canTransitionDealStage("closed_won", "loi")).toBe(false);
    expect(transitionReason("closed_won", "loi")).toContain("cannot move");
  });
});
