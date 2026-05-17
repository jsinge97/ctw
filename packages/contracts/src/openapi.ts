import type { RouteContract } from "./common.js";
import { z } from "zod";

export type OpenApiDocument = {
  openapi: "3.1.0";
  info: { title: string; version: string };
  paths: Record<string, Record<string, unknown>>;
};

function normalizePath(path: string): string {
  return path
    .replaceAll(":dealId", "{dealId}")
    .replaceAll(":taskId", "{taskId}")
    .replaceAll(":itemId", "{itemId}")
    .replaceAll(":participantId", "{participantId}")
    .replaceAll(":messageId", "{messageId}")
    .replaceAll(":documentId", "{documentId}")
    .replaceAll(":userId", "{userId}")
    .replaceAll(":channelId", "{channelId}")
    .replaceAll(":threshold", "{threshold}");
}

function toJsonSchema(schema: z.ZodType | undefined): unknown {
  if (!schema) return undefined;
  return z.toJSONSchema(schema, { io: "output" });
}

function pathParameters(path: string): unknown[] {
  return [...path.matchAll(/\{([^}]+)\}/g)].map((match) => ({
    name: match[1],
    in: "path",
    required: true,
    schema: { type: "string" }
  }));
}

export function buildOpenApiDocument(routes: RouteContract[]): OpenApiDocument {
  const paths: OpenApiDocument["paths"] = {};
  for (const route of routes) {
    const path = normalizePath(route.path);
    paths[path] ??= {};
    paths[path][route.method.toLowerCase()] = {
      summary: route.summary,
      tags: route.tags,
      parameters: pathParameters(path),
      ...(route.body ? {
        requestBody: {
          required: true,
          content: { "application/json": { schema: toJsonSchema(route.body) } }
        }
      } : {}),
      responses: {
        "200": {
          description: "Success",
          content: { "application/json": { schema: toJsonSchema(route.response) } }
        },
        default: {
          description: "Error",
          content: { "application/json": { schema: {} } }
        }
      }
    };
  }

  return {
    openapi: "3.1.0",
    info: { title: "CTW 2.0 API", version: "0.1.0" },
    paths
  };
}
