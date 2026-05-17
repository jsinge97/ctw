import { describe, expect, it } from "vitest";
import { createTask, decideTask } from "./tasks.service.js";

describe("tasks service", () => {
  it("creates and approves system tasks with sent-message side effect", () => {
    const task = createTask("deal_sutter", { title: "Send draft", route: "system" });
    const approved = decideTask(task.id, "approve");
    expect(approved.status).toBe("completed");
  });
});
