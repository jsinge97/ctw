import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type HttpMethod = "get" | "post" | "patch" | "delete";

export type OpenApiOperation = {
  description?: string;
  method: HttpMethod;
  path: string;
  requestSchema?: unknown;
  responseSchema?: unknown;
  summary?: string;
  tags: string[];
};

type OpenApiDocument = {
  paths: Record<string, Partial<Record<HttpMethod, {
    description?: string;
    requestBody?: {
      content?: {
        "application/json"?: {
          schema?: unknown;
        };
      };
    };
    responses?: Record<string, {
      content?: {
        "application/json"?: {
          schema?: unknown;
        };
      };
    }>;
    summary?: string;
    tags?: string[];
  }>>>;
};

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const document = JSON.parse(readFileSync(resolve(repoRoot, "packages/api-client/src/generated/openapi.json"), "utf8")) as OpenApiDocument;

export function listOpenApiOperations(): OpenApiOperation[] {
  return Object.entries(document.paths).flatMap(([path, pathItem]) =>
    (Object.entries(pathItem) as Array<[HttpMethod, NonNullable<typeof pathItem[HttpMethod]>]>).map(([method, operation]) => ({
      method,
      path,
      tags: operation.tags ?? [],
      ...(operation.description ? { description: operation.description } : {}),
      ...(operation.requestBody?.content?.["application/json"]?.schema ? { requestSchema: operation.requestBody.content["application/json"].schema } : {}),
      ...(operation.responses?.["200"]?.content?.["application/json"]?.schema ? { responseSchema: operation.responses["200"].content["application/json"].schema } : {}),
      ...(operation.summary ? { summary: operation.summary } : {})
    }))
  );
}

export function findOpenApiOperation(method: HttpMethod, path: string): OpenApiOperation {
  const operation = listOpenApiOperations().find((item) => item.method === method && item.path === path);
  if (!operation) throw new Error(`OpenAPI operation not found: ${method.toUpperCase()} ${path}`);
  return operation;
}

export function fillOpenApiPath(path: string, params: Record<string, string> = {}) {
  return path.replaceAll(/\{([^}]+)\}/g, (_match, key: string) => {
    const value = params[key];
    if (!value) throw new Error(`Missing path parameter: ${key}`);
    return encodeURIComponent(value);
  });
}
