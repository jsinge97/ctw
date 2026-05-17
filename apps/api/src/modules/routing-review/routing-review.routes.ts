import type { FastifyInstance } from "fastify";
import { resolveRoutingReviewRequestSchema } from "@ctw/contracts";
import { parseBody } from "../validation.js";
import { listRoutingReviewItems, resolveRoutingReviewItem } from "./routing-review.service.js";

export async function registerRoutingReviewRoutes(app: FastifyInstance) {
  app.get("/v1/routing-review-items", async () => listRoutingReviewItems());
  app.post<{ Params: { itemId: string } }>("/v1/routing-review-items/:itemId/resolve", async (request) => resolveRoutingReviewItem(request.params.itemId, parseBody(resolveRoutingReviewRequestSchema, request.body)));
}
