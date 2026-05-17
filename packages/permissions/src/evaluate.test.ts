import { describe, expect, it } from "vitest";
import { can } from "./evaluate.js";

const actor = { membershipId: "m1", role: "broker" as const, participantIds: ["p1"] };

describe("can", () => {
  it("allows role defaults", () => {
    expect(can(actor, "viewDeal", { scopeType: "deal", scopeId: "d1" }).allowed).toBe(true);
  });

  it("lets explicit deny win", () => {
    expect(can(actor, "viewDeal", { scopeType: "deal", scopeId: "d1" }, [
      { capability: "viewDeal", effect: "deny", scopeType: "deal", scopeId: "d1", subjectType: "membership", subjectId: "m1" }
    ])).toEqual({ allowed: false, reason: "Explicit deny" });
  });

  it("uses explicit allow for overrides", () => {
    expect(can(actor, "moveDealStage", { scopeType: "deal", scopeId: "d1" }, [
      { capability: "moveDealStage", effect: "allow", scopeType: "deal", scopeId: "d1", subjectType: "participant", subjectId: "p1" }
    ]).allowed).toBe(true);
  });
});
