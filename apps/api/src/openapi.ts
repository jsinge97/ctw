import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildOpenApiDocument, defineRoute } from "@ctw/contracts";
import { z } from "zod";

export const healthRoutes = [
  defineRoute({
    method: "GET",
    path: "/healthz",
    summary: "Health check",
    tags: ["system"],
    response: z.object({ ok: z.boolean() })
  }),
  defineRoute({
    method: "GET",
    path: "/openapi.json",
    summary: "OpenAPI document",
    tags: ["system"],
    response: z.unknown()
  })
];

export const openApiDocument = buildOpenApiDocument(healthRoutes);

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(resolve("openapi.json"), `${JSON.stringify(openApiDocument, null, 2)}\n`);
}
