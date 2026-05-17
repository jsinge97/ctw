import { z } from "zod";
import { defineRoute } from "../common.js";
import { vaWorkDecisionRequestSchema, vaWorkItemSchema } from "./va-work.schemas.js";
const itemParams = z.object({ itemId: z.string() });
export const vaWorkContract = [
  defineRoute({ method: "GET", path: "/v1/va-work-items", summary: "List VA work", tags: ["va-work"], response: z.array(vaWorkItemSchema) }),
  defineRoute({ method: "POST", path: "/v1/va-work-items/:itemId/submit", summary: "Submit VA work", tags: ["va-work"], params: itemParams, body: vaWorkDecisionRequestSchema, response: vaWorkItemSchema }),
  defineRoute({ method: "POST", path: "/v1/va-work-items/:itemId/send-back", summary: "Send VA work back", tags: ["va-work"], params: itemParams, body: vaWorkDecisionRequestSchema, response: vaWorkItemSchema })
];
