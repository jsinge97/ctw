import type { FastifyInstance } from "fastify";
import { getRequiredSession } from "../authz.js";
import { listDealActivity } from "./activity.service.js";

export async function registerActivityRoutes(app: FastifyInstance) {
  app.get<{ Params: { dealId: string } }>("/v1/deals/:dealId/activity", async (request) => listDealActivity(request.params.dealId, getRequiredSession(request)));
}
