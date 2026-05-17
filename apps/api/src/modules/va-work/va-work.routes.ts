import type { FastifyInstance } from "fastify";
import { sendBackVaWorkRequestSchema, vaWorkDecisionRequestSchema } from "@ctw/contracts";
import { parseBody } from "../validation.js";
import { acceptVaWork, cancelVaWork, listVaWork, markVaWorkAccepted, sendBackVaWork, submitVaWork } from "./va-work.service.js";

export async function registerVaWorkRoutes(app: FastifyInstance) {
  app.get("/v1/va-work-items", async () => listVaWork());
  app.post<{ Params: { itemId: string } }>("/v1/va-work-items/:itemId/start", async (request) => acceptVaWork(request.params.itemId, parseBody(vaWorkDecisionRequestSchema, request.body ?? {})));
  app.post<{ Params: { itemId: string } }>("/v1/va-work-items/:itemId/accept", async (request) => markVaWorkAccepted(request.params.itemId, parseBody(vaWorkDecisionRequestSchema, request.body ?? {})));
  app.post<{ Params: { itemId: string } }>("/v1/va-work-items/:itemId/submit", async (request) => submitVaWork(request.params.itemId, parseBody(vaWorkDecisionRequestSchema, request.body ?? {})));
  app.post<{ Params: { itemId: string } }>("/v1/va-work-items/:itemId/send-back", async (request) => sendBackVaWork(request.params.itemId, parseBody(sendBackVaWorkRequestSchema, request.body)));
  app.post<{ Params: { itemId: string } }>("/v1/va-work-items/:itemId/cancel", async (request) => cancelVaWork(request.params.itemId, parseBody(vaWorkDecisionRequestSchema, request.body ?? {})));
}
