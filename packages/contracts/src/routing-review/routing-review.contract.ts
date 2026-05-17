import { z } from "zod";
import { defineRoute } from "../common.js";
import { resolveRoutingReviewRequestSchema, routingReviewItemSchema } from "./routing-review.schemas.js";
const itemParams = z.object({ itemId: z.string() });
export const routingReviewContract = [
  defineRoute({ method: "GET", path: "/v1/routing-review-items", summary: "List routing review", tags: ["routing-review"], response: z.array(routingReviewItemSchema) }),
  defineRoute({ method: "POST", path: "/v1/routing-review-items/:itemId/resolve", summary: "Resolve routing review", tags: ["routing-review"], params: itemParams, body: resolveRoutingReviewRequestSchema, response: routingReviewItemSchema })
];
