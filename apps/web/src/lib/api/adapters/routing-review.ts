import type { ResolveRoutingReviewRequest, RoutingReviewItemDto } from "@ctw/contracts";
import { api } from "../runtime.js";

export async function listRoutingReviewItems(): Promise<RoutingReviewItemDto[]> {
  return api.getRoutingReviewItems();
}

export async function resolveRoutingReviewItem(itemId: string, body: ResolveRoutingReviewRequest): Promise<RoutingReviewItemDto> {
  return api.postRoutingReviewItemsitemIdResolve({ itemId }, body);
}
