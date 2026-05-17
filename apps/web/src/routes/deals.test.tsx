import { describe, expect, it } from "vitest";
import { parseKanbanCardData } from "../components/ui/kanban.js";
import type { DealCardModel } from "../lib/api/adapters/deals.js";
import { stageDropReason } from "./deals.js";

const deal: DealCardModel = {
  id: "deal_1",
  title: "Sutter Tower",
  company: "Halcyon",
  stage: "loi",
  nextAction: "Send LOI response",
  stale: false,
  pendingApprovals: 0,
  ownerInitials: "MR",
  lastActivityLabel: "May 17",
  canMove: true
};

describe("deal kanban transitions", () => {
  it("rejects same-stage drops and permission-limited drops", () => {
    expect(stageDropReason(deal, "loi")).toBe("Already in this stage.");
    expect(stageDropReason({ ...deal, canMove: false }, "close")).toBe("You do not have permission to move this deal.");
    expect(stageDropReason(deal, "close")).toBeNull();
  });

  it("ignores malformed kanban payloads", () => {
    expect(parseKanbanCardData("{nope")).toBeNull();
    expect(parseKanbanCardData(JSON.stringify({ id: "deal_1" }))).toMatchObject({ id: "deal_1" });
  });
});
