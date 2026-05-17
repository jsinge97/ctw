import type { FastifyInstance } from "fastify";
import { acceptInvitationRequestSchema } from "@ctw/contracts";
import { parseBody } from "../validation.js";
import { getRequiredSession } from "../authz.js";
import { acceptInvitation } from "./session.service.js";

export async function registerSessionRoutes(app: FastifyInstance) {
  app.get("/v1/session/current", async (request) => {
    return getRequiredSession(request);
  });
  app.post("/v1/session/accept-invitation", async (request) => acceptInvitation(parseBody(acceptInvitationRequestSchema, request.body).token));
}
