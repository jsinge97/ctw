import { describe, expect, it } from "vitest";
import { listRoutingReviewItems, resolveRoutingReviewItem } from "./routing-review.service.js";

describe("routing review", () => {
  it("resolves an item to unrelated", () => {
    const [item] = listRoutingReviewItems();
    if (!item) throw new Error("missing item");
    expect(resolveRoutingReviewItem(item.id, { resolution: "unrelated" }).suggestedDealId).toBeNull();
  });
});
