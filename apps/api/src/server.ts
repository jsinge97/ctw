import Fastify from "fastify";
import { createRequestId } from "@ctw/observability";
import { openApiDocument } from "./openapi.js";

export function buildServer() {
  const app = Fastify({ logger: false });

  app.addHook("onRequest", async (request, reply) => {
    const requestId = createRequestId();
    request.headers["x-request-id"] = requestId;
    reply.header("x-request-id", requestId);
  });

  app.get("/healthz", async () => ({ ok: true }));
  app.get("/openapi.json", async () => openApiDocument);

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.API_PORT ?? 3000);
  const app = buildServer();
  await app.listen({ port, host: "0.0.0.0" });
}
