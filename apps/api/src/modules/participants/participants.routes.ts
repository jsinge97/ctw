import type { FastifyInstance } from "fastify";
import { addParticipantRequestSchema, updateParticipantRequestSchema } from "@ctw/contracts";
import { getRequiredSession } from "../authz.js";
import { parseBody } from "../validation.js";
import { addParticipant, listParticipants, updateParticipant } from "./participants.service.js";

export async function registerParticipantsRoutes(app: FastifyInstance) {
  app.get<{ Params: { dealId: string } }>("/v1/deals/:dealId/participants", async (request) => listParticipants(request.params.dealId, getRequiredSession(request)));
  app.post<{ Params: { dealId: string } }>("/v1/deals/:dealId/participants", async (request) => addParticipant(request.params.dealId, parseBody(addParticipantRequestSchema, request.body), getRequiredSession(request)));
  app.patch<{ Params: { dealId: string; participantId: string } }>("/v1/deals/:dealId/participants/:participantId", async (request) => updateParticipant(request.params.dealId, request.params.participantId, parseBody(updateParticipantRequestSchema, request.body), getRequiredSession(request)));
}
