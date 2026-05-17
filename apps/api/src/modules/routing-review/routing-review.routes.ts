import type { FastifyInstance } from "fastify";
import { resolveRoutingReviewRequestSchema } from "@ctw/contracts";
import { getRequiredSession } from "../authz.js";
import { parseBody } from "../validation.js";
import { listRoutingReviewItems, resolveRoutingReviewItem } from "./routing-review.service.js";

export async function registerRoutingReviewRoutes(app: FastifyInstance) {
  app.get("/v1/routing-review-items", async (request) => listRoutingReviewItems(getRequiredSession(request)));
  app.post<{ Params: { itemId: string } }>("/v1/routing-review-items/:itemId/resolve", async (request) => resolveRoutingReviewItem(request.params.itemId, parseBody(resolveRoutingReviewRequestSchema, request.body), getRequiredSession(request)));
}
