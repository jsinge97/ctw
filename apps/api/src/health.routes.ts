import type { FastifyInstance } from "fastify";
import { assertProductionRuntimeSafety } from "@ctw/config";
import { getPrismaClient } from "@ctw/db";
import { openApiDocument } from "./openapi.js";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/healthz", async () => ({ ok: true }));
  app.get("/readyz", async (_request, reply) => {
    try {
      const runtime = assertProductionRuntimeSafety();
      const database = runtime.CTW_DB_MODE === "prisma" ? await checkDatabase() : "skipped";
      return {
        ok: true,
        database,
        workflowMode: runtime.CTW_DB_MODE,
        queueMode: runtime.CTW_JOBS_MODE,
        providerMode: runtime.CTW_PROVIDER_MODE,
        storageMode: runtime.CTW_STORAGE_MODE
      };
    } catch (error) {
      reply.code(503);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "readiness check failed"
      };
    }
  });
  app.get("/openapi.json", async () => openApiDocument);
}

async function checkDatabase() {
  await getPrismaClient().$queryRaw`SELECT 1`;
  return "ok";
}
