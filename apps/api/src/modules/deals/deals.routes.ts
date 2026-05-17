import type { FastifyInstance } from "fastify";
import { createDealRequestSchema, moveDealStageRequestSchema, patchDealRequestSchema } from "@ctw/contracts";
import { getRequiredSession } from "../authz.js";
import { parseBody } from "../validation.js";
import { archiveDeal, createDeal, getDeal, listDeals, moveDealStage, patchDeal } from "./deals.service.js";

export async function registerDealsRoutes(app: FastifyInstance) {
  app.get("/v1/deals", async (request) => listDeals(getRequiredSession(request)));
  app.post("/v1/deals", async (request) => createDeal(parseBody(createDealRequestSchema, request.body), getRequiredSession(request)));
  app.get<{ Params: { dealId: string } }>("/v1/deals/:dealId", async (request) => getDeal(request.params.dealId, getRequiredSession(request)));
  app.patch<{ Params: { dealId: string } }>("/v1/deals/:dealId", async (request) => patchDeal(request.params.dealId, parseBody(patchDealRequestSchema, request.body), getRequiredSession(request)));
  app.post<{ Params: { dealId: string } }>("/v1/deals/:dealId/move-stage", async (request) => moveDealStage(request.params.dealId, parseBody(moveDealStageRequestSchema, request.body).stage, getRequiredSession(request)));
  app.post<{ Params: { dealId: string } }>("/v1/deals/:dealId/archive", async (request) => archiveDeal(request.params.dealId, getRequiredSession(request)));
}
