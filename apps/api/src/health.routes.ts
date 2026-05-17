import type { FastifyInstance } from "fastify";
import { openApiDocument } from "./openapi.js";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/healthz", async () => ({ ok: true }));
  app.get("/openapi.json", async () => openApiDocument);
}
