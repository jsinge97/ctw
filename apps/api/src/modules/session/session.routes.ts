import type { FastifyInstance } from "fastify";
import { sessionClearCookieHeader, sessionSetCookieHeader, sessionTokenFromCookieHeader } from "@ctw/auth";
import { acceptInvitationRequestSchema, loginRequestSchema } from "@ctw/contracts";
import { parseBody } from "../validation.js";
import { getRequiredSession } from "../authz.js";
import { acceptInvitation, loginWithEmailPassword, logoutSession } from "./session.service.js";

export async function registerSessionRoutes(app: FastifyInstance) {
  app.get("/v1/session/current", async (request) => {
    return getRequiredSession(request);
  });
  app.post("/v1/session/accept-invitation", async (request) => acceptInvitation(parseBody(acceptInvitationRequestSchema, request.body).token));
  app.post("/v1/session/login", async (request, reply) => {
    try {
      const result = await loginWithEmailPassword(parseBody(loginRequestSchema, request.body));
      reply.header("set-cookie", sessionSetCookieHeader(result.token));
      return result.session;
    } catch {
      throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
    }
  });
  app.post("/v1/session/logout", async (request, reply) => {
    await logoutSession(sessionTokenFromCookieHeader(request.headers.cookie));
    reply.header("set-cookie", sessionClearCookieHeader());
    return { ok: true as const };
  });
}
