import { describe, expect, it } from "vitest";
import { createInjectedApiClient } from "./api-client.js";

describe("va work smoke flow", () => {
  it("lets VAs execute work while AMs accept submitted work", async () => {
    const va = await createInjectedApiClient("va-token");
    const am = await createInjectedApiClient("am-token");

    try {
      const [item] = await va.api.getVaWorkItems();
      if (!item) throw new Error("missing VA item");

      const started = await va.api.postVaWorkItemsitemIdStart({ itemId: item.id }, { notes: "Taking this" });
      const submitted = await va.api.postVaWorkItemsitemIdSubmit({ itemId: item.id }, { submittedPayload: { completed: true } });
      const accepted = await am.api.postVaWorkItemsitemIdAccept({ itemId: item.id }, { notes: "Looks good" });

      expect(started.assignedTo).toBe("mem_va");
      expect(submitted.status).toBe("submitted");
      expect(accepted.status).toBe("accepted");
    } finally {
      await va.close();
      await am.close();
    }
  });
});
