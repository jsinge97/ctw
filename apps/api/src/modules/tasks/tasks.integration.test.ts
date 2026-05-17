import { describe, expect, it } from "vitest";
import { resolveSessionFromToken } from "../session/session.service.js";
import { createTask, decideTask } from "./tasks.service.js";

describe("tasks service", () => {
  it("creates and approves system tasks with sent-message side effect", async () => {
    const task = await createTask("deal_sutter", { title: "Send draft", route: "system" });
    const approved = await decideTask(task.id, resolveSessionFromToken("am-token"), "approve");
    expect(approved.status).toBe("completed");
  });
});
