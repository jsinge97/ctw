import { describe, expect, it } from "vitest";
import { createInjectedApiClient } from "./api-client.js";

describe("task execution smoke flow", () => {
  it("approves the current system action and records an outbound message", async () => {
    const { api, close } = await createInjectedApiClient();

    try {
      const beforeMessages = await api.getDealsdealIdMessages({ dealId: "deal_sutter" });
      const task = (await api.getDealsdealIdTasks({ dealId: "deal_sutter" })).find((item) => item.id === "task_next");
      if (!task) throw new Error("missing current task");

      const approved = await api.postTaskstaskIdApprove({ taskId: task.id }, { reason: "Ready to send" });
      const afterMessages = await api.getDealsdealIdMessages({ dealId: "deal_sutter" });
      const newMessages = afterMessages.filter((message) => !beforeMessages.some((before) => before.id === message.id));

      expect(approved.status).toBe("completed");
      expect(newMessages.some((message) => message.direction === "outbound" && message.messageStatus === "sent" && message.providerMessageId?.startsWith("email_"))).toBe(true);
    } finally {
      await close();
    }
  });
});
