import type { FastifyInstance } from "fastify";
import { listMessages, updateMessage } from "./messages.service.js";

export async function registerMessagesRoutes(app: FastifyInstance) {
  app.get<{ Params: { dealId: string } }>("/v1/deals/:dealId/messages", async (request) => listMessages(request.params.dealId));
  app.patch<{ Params: { messageId: string }; Body: any }>("/v1/deals/:dealId/messages/:messageId", async (request) => updateMessage(request.params.messageId, request.body as any));
}
