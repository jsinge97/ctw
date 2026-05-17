import { describe, expect, it } from "vitest";
import { listRoutingReviewItems, resolveRoutingReviewItem } from "./routing-review.service.js";

describe("routing review", () => {
  it("resolves an item to unrelated", async () => {
    const [item] = await listRoutingReviewItems();
    if (!item) throw new Error("missing item");
    await expect(resolveRoutingReviewItem(item.id, { resolution: "unrelated" })).resolves.toMatchObject({ suggestedDealId: null });
  });
});
