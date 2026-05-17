import { z } from "zod";
import { defineRoute } from "../common.js";
import { createDealRequestSchema, dealSchema, moveDealStageRequestSchema, patchDealRequestSchema } from "./deals.schemas.js";

const dealParams = z.object({ dealId: z.string() });

export const dealsContract = [
  defineRoute({ method: "GET", path: "/v1/deals", summary: "List deals", tags: ["deals"], response: z.array(dealSchema) }),
  defineRoute({ method: "POST", path: "/v1/deals", summary: "Create deal", tags: ["deals"], body: createDealRequestSchema, response: dealSchema }),
  defineRoute({ method: "GET", path: "/v1/deals/:dealId", summary: "Get deal", tags: ["deals"], params: dealParams, response: dealSchema }),
  defineRoute({ method: "PATCH", path: "/v1/deals/:dealId", summary: "Patch deal", tags: ["deals"], params: dealParams, body: patchDealRequestSchema, response: dealSchema }),
  defineRoute({ method: "POST", path: "/v1/deals/:dealId/move-stage", summary: "Move deal stage", tags: ["deals"], params: dealParams, body: moveDealStageRequestSchema, response: dealSchema }),
  defineRoute({ method: "POST", path: "/v1/deals/:dealId/archive", summary: "Archive deal", tags: ["deals"], params: dealParams, response: dealSchema })
];
