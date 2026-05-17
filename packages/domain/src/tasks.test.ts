import { describe, expect, it } from "vitest";
import { buildTaskOutcome, canMarkCurrentNextAction, isTerminalTaskStatus } from "./tasks.js";

describe("task rules", () => {
  it("knows terminal statuses", () => {
    expect(isTerminalTaskStatus("completed")).toBe(true);
    expect(isTerminalTaskStatus("in_progress")).toBe(false);
  });

  it("prevents deferred tasks from becoming current next action", () => {
    expect(canMarkCurrentNextAction({ status: "deferred" })).toBe(false);
  });

  it("builds reroute outcomes", () => {
    expect(buildTaskOutcome(
      { route: "system", status: "approved", isCurrentNextAction: true },
      { route: "va", status: "approved", isCurrentNextAction: true }
    )).toEqual({ outcome: "rerouted", fromRoute: "system", toRoute: "va" });
  });
});
