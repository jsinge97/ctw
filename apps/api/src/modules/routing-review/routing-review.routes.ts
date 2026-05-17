import type { FastifyInstance } from "fastify";
import { listRoutingReviewItems, resolveRoutingReviewItem } from "./routing-review.service.js";

export async function registerRoutingReviewRoutes(app: FastifyInstance) {
  app.get("/v1/routing-review-items", async () => listRoutingReviewItems());
  app.post<{ Params: { itemId: string }; Body: any }>("/v1/routing-review-items/:itemId/resolve", async (request) => resolveRoutingReviewItem(request.params.itemId, request.body as any));
}
