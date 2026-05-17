import type { FastifyInstance } from "fastify";
import { archiveDeal, createDeal, getDeal, listDeals, moveDealStage, patchDeal } from "./deals.service.js";

export async function registerDealsRoutes(app: FastifyInstance) {
  app.get("/v1/deals", async () => listDeals());
  app.post<{ Body: { title: string; primaryCompanyName?: string } }>("/v1/deals", async (request) => createDeal(request.body as any));
  app.get<{ Params: { dealId: string } }>("/v1/deals/:dealId", async (request) => getDeal(request.params.dealId));
  app.patch<{ Params: { dealId: string }; Body: Record<string, unknown> }>("/v1/deals/:dealId", async (request) => patchDeal(request.params.dealId, request.body as any));
  app.post<{ Params: { dealId: string }; Body: { stage: any } }>("/v1/deals/:dealId/move-stage", async (request) => moveDealStage(request.params.dealId, (request.body as { stage: any }).stage));
  app.post<{ Params: { dealId: string } }>("/v1/deals/:dealId/archive", async (request) => archiveDeal(request.params.dealId));
}
