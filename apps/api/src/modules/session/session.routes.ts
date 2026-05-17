import type { FastifyInstance } from "fastify";
import { buildDemoSession } from "./session.service.js";

export async function registerSessionRoutes(app: FastifyInstance) {
  app.get("/v1/session/current", async () => buildDemoSession("am"));
  app.post("/v1/session/accept-invitation", async () => buildDemoSession("broker"));
}
