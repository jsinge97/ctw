import type { FastifyInstance } from "fastify";
import { listVaWork, sendBackVaWork, submitVaWork } from "./va-work.service.js";

export async function registerVaWorkRoutes(app: FastifyInstance) {
  app.get("/v1/va-work-items", async () => listVaWork());
  app.post<{ Params: { itemId: string } }>("/v1/va-work-items/:itemId/submit", async (request) => submitVaWork(request.params.itemId));
  app.post<{ Params: { itemId: string } }>("/v1/va-work-items/:itemId/send-back", async (request) => sendBackVaWork(request.params.itemId));
}
