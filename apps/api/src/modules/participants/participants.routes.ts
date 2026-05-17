import type { FastifyInstance } from "fastify";
import { addParticipant, listParticipants, updateParticipant } from "./participants.service.js";

export async function registerParticipantsRoutes(app: FastifyInstance) {
  app.get<{ Params: { dealId: string } }>("/v1/deals/:dealId/participants", async (request) => listParticipants(request.params.dealId));
  app.post<{ Params: { dealId: string }; Body: any }>("/v1/deals/:dealId/participants", async (request) => addParticipant(request.params.dealId, request.body as any));
  app.patch<{ Params: { participantId: string }; Body: any }>("/v1/deals/:dealId/participants/:participantId", async (request) => updateParticipant(request.params.participantId, request.body as any));
}
