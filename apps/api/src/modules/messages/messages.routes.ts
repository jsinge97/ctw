import type { FastifyInstance } from "fastify";
import { updateMessageRequestSchema } from "@ctw/contracts";
import { getRequiredSession } from "../authz.js";
import { parseBody } from "../validation.js";
import { listMessages, updateMessage } from "./messages.service.js";

export async function registerMessagesRoutes(app: FastifyInstance) {
  app.get<{ Params: { dealId: string } }>("/v1/deals/:dealId/messages", async (request) => listMessages(request.params.dealId, getRequiredSession(request)));
  app.patch<{ Params: { messageId: string } }>("/v1/deals/:dealId/messages/:messageId", async (request) => updateMessage(request.params.messageId, parseBody(updateMessageRequestSchema, request.body), getRequiredSession(request)));
}
