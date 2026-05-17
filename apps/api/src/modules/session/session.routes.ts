import type { FastifyInstance } from "fastify";
import { acceptInvitation, resolveSessionFromToken } from "./session.service.js";

export async function registerSessionRoutes(app: FastifyInstance) {
  app.get("/v1/session/current", async (request) => {
    const token = request.headers.authorization?.replace("Bearer ", "");
    try {
      return resolveSessionFromToken(token);
    } catch {
      throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
    }
  });
  app.post<{ Body: { token: string } }>("/v1/session/accept-invitation", async (request) => acceptInvitation(request.body.token));
}
