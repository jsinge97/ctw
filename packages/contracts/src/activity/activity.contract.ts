import { z } from "zod";
import { defineRoute } from "../common.js";
import { activityEventSchema } from "./activity.schemas.js";
const dealParams = z.object({ dealId: z.string() });
export const activityContract = [
  defineRoute({ method: "GET", path: "/v1/deals/:dealId/activity", summary: "List deal activity", tags: ["activity"], params: dealParams, response: z.array(activityEventSchema) })
];
