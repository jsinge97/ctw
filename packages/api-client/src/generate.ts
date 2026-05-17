import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const source = resolve("openapi.json");
const target = resolve("packages/api-client/src/generated/openapi.json");
const routesTarget = resolve("packages/api-client/src/generated/routes.ts");
const clientTarget = resolve("packages/api-client/src/generated/client.ts");

mkdirSync(dirname(target), { recursive: true });
if (existsSync(source)) {
  copyFileSync(source, target);
} else {
  writeFileSync(target, "{}\n");
}

const openapi = existsSync(source) ? JSON.parse(readFileSync(source, "utf8")) as { paths?: Record<string, unknown> } : { paths: {} };
const paths = Object.keys(openapi.paths ?? {});
type Method = "get" | "post" | "patch" | "delete";

function methodsFor(path: string): Method[] {
  const item = (openapi.paths?.[path] ?? {}) as Record<string, unknown>;
  return (Object.keys(item) as Method[]).filter((method) => ["get", "post", "patch", "delete"].includes(method));
}

function operationKey(method: Method, path: string): string {
  return `${method.toUpperCase()} ${path}`;
}

function routeKey(path: string): string {
  return path
    .replace("/v1/", "")
    .replace("/", "")
    .replaceAll("/", "_")
    .replaceAll("-", "_")
    .replace(/[{}]/g, "")
    .replace(/\W/g, "_") || "root";
}

function methodName(method: Method, path: string): string {
  const parts = routeKey(path).split("_").filter(Boolean);
  const pascal = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
  return `${method}${pascal}`;
}

function responseType(method: Method, path: string): string {
  const key = operationKey(method, path);
  if (key === "GET /v1/session/current") return "CurrentSession";
  if (key === "POST /v1/session/accept-invitation") return "CurrentSession";
  if (key === "POST /v1/session/login") return "CurrentSession";
  if (key === "POST /v1/session/logout") return "{ ok: true }";
  if (key === "GET /healthz") return "{ ok: boolean }";
  if (key === "GET /openapi.json") return "unknown";
  if (path === "/v1/deals" && method === "get") return "DealDto[]";
  if (path.startsWith("/v1/deals") && path.includes("/participants") && method === "get") return "ParticipantDto[]";
  if (path.startsWith("/v1/deals") && path.includes("/participants")) return "ParticipantDto";
  if (path.startsWith("/v1/deals") && path.includes("/messages") && method === "get") return "MessageDto[]";
  if (path.startsWith("/v1/deals") && path.includes("/messages")) return "MessageDto";
  if (path.startsWith("/v1/deals") && path.includes("/documents") && method === "get") return "DocumentDto[]";
  if (path.startsWith("/v1/deals") && path.includes("/documents")) return "DocumentDto";
  if (path.startsWith("/v1/deals") && path.includes("/tasks") && method === "get") return "TaskDto[]";
  if (path.startsWith("/v1/deals") && path.includes("/tasks")) return "TaskDto";
  if (path.startsWith("/v1/deals") && path.includes("/activity")) return "ActivityEventDto[]";
  if (path.startsWith("/v1/deals")) return method === "get" && path === "/v1/deals" ? "DealDto[]" : "DealDto";
  if (path.startsWith("/v1/tasks/")) return "TaskDto";
  if (path === "/v1/routing-review-items") return "RoutingReviewItemDto[]";
  if (path.startsWith("/v1/routing-review-items/")) return "RoutingReviewItemDto";
  if (path === "/v1/va-work-items") return "VaWorkItemDto[]";
  if (path.startsWith("/v1/va-work-items/")) return "VaWorkItemDto";
  if (path === "/v1/settings/organization") return "OrganizationSettingsDto";
  if (path === "/v1/users" && method === "get") return "UserDto[]";
  if (path.startsWith("/v1/users")) return "UserDto";
  return "unknown";
}

function requestType(method: Method, path: string): string | null {
  const key = operationKey(method, path);
  if (key === "POST /v1/session/accept-invitation") return "{ token: string }";
  if (key === "POST /v1/session/login") return "LoginRequest";
  if (key === "POST /v1/session/logout") return "{}";
  if (key === "POST /v1/deals") return "CreateDealRequest";
  if (key === "PATCH /v1/deals/{dealId}") return "PatchDealRequest";
  if (key === "POST /v1/deals/{dealId}/move-stage") return "MoveDealStageRequest";
  if (key === "POST /v1/deals/{dealId}/participants") return "AddParticipantRequest";
  if (key === "PATCH /v1/deals/{dealId}/participants/{participantId}") return "UpdateParticipantRequest";
  if (key === "PATCH /v1/deals/{dealId}/messages/{messageId}") return "UpdateMessageRequest";
  if (key === "POST /v1/deals/{dealId}/documents") return "UpdateDocumentRequest";
  if (key === "PATCH /v1/deals/{dealId}/documents/{documentId}") return "UpdateDocumentRequest";
  if (key === "POST /v1/deals/{dealId}/tasks") return "CreateTaskRequest";
  if (path.startsWith("/v1/tasks/")) return "TaskDecisionRequest";
  if (key === "POST /v1/routing-review-items/{itemId}/resolve") return "ResolveRoutingReviewRequest";
  if (path.startsWith("/v1/va-work-items/") && path.endsWith("/send-back")) return "SendBackVaWorkRequest";
  if (path.startsWith("/v1/va-work-items/")) return "VaWorkDecisionRequest";
  if (key === "PATCH /v1/settings/organization") return "UpdateOrganizationSettingsRequest";
  if (key === "POST /v1/users") return "InviteUserRequest";
  if (key === "PATCH /v1/users/{userId}") return "UpdateUserRequest";
  return null;
}

function pathParamNames(path: string): string[] {
  return [...path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1] as string);
}

const entries = paths
  .map((path) => {
    return `  ${JSON.stringify(routeKey(path))}: ${JSON.stringify(path)}`;
  });

writeFileSync(routesTarget, `// Generated by packages/api-client/src/generate.ts from openapi.json.
export const generatedRoutes = {
${entries.join(",\n")}
} as const;
`);

const operations = paths.flatMap((path) => methodsFor(path).map((method) => ({ path, method })));
const operationEntries = operations.map(({ path, method }) => {
  const request = requestType(method, path);
  const params = pathParamNames(path);
  const paramsPart = params.length > 0 ? ` params: { ${params.map((param) => `${param}: string`).join("; ")} };` : "";
  const requestPart = request ? ` request: ${request};` : "";
  return `  ${JSON.stringify(operationKey(method, path))}: {${paramsPart}${requestPart} response: ${responseType(method, path)} };`;
});

const operationMethods = operations.map(({ path, method }) => {
  const name = methodName(method, path);
  const key = operationKey(method, path);
  const request = requestType(method, path);
  const hasParams = pathParamNames(path).length > 0;
  const route = `generatedRoutes[${JSON.stringify(routeKey(path))}]`;
  const httpMethod = method.toUpperCase();
  const paramsArg = hasParams ? `params: GeneratedOperationMap[${JSON.stringify(key)}]["params"]` : "";
  const requestArg = request ? `body: GeneratedOperationMap[${JSON.stringify(key)}]["request"]` : "";
  const args = [paramsArg, requestArg].filter(Boolean).join(", ");
  const pathExpression = hasParams ? `this.fillPath(${route}, params)` : route;
  if (method === "get" && !request) {
    return `  ${name}(${args}): Promise<GeneratedOperationMap[${JSON.stringify(key)}]["response"]> {
    return this.request(${pathExpression});
  }`;
  }
  return `  ${name}(${args}): Promise<GeneratedOperationMap[${JSON.stringify(key)}]["response"]> {
    const init: RequestInit = {
      method: ${JSON.stringify(httpMethod)},
      headers: { "content-type": "application/json" }
    };
    ${request ? "init.body = JSON.stringify(body);" : ""}
    return this.request(${pathExpression}, init);
  }`;
});

writeFileSync(clientTarget, `// Generated by packages/api-client/src/generate.ts from openapi.json.
import type {
  ActivityEventDto,
  AddParticipantRequest,
  CreateDealRequest,
  CreateTaskRequest,
  CurrentSession,
  DealDto,
  DocumentDto,
  InviteUserRequest,
  LoginRequest,
  MessageDto,
  MoveDealStageRequest,
  OrganizationSettingsDto,
  ParticipantDto,
  PatchDealRequest,
  ResolveRoutingReviewRequest,
  RoutingReviewItemDto,
  SendBackVaWorkRequest,
  TaskDecisionRequest,
  TaskDto,
  UpdateDocumentRequest,
  UpdateMessageRequest,
  UpdateOrganizationSettingsRequest,
  UpdateParticipantRequest,
  UpdateUserRequest,
  UserDto,
  VaWorkDecisionRequest,
  VaWorkItemDto
} from "@ctw/contracts";
import { generatedRoutes } from "./routes.js";

export type GeneratedOperationMap = {
${operationEntries.join("\n")}
};

export type GeneratedApiClientOptions = {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

export class GeneratedApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: GeneratedApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.fetchImpl(\`\${this.baseUrl}\${path}\`, init);
    if (!response.ok) throw new Error(\`API request failed: \${response.status}\`);
    return response.json() as Promise<T>;
  }

  private fillPath(path: string, params: Record<string, string>): string {
    return path.replaceAll(/\\{([^}]+)\\}/g, (_match, key: string) => {
      const value = params[key];
      if (!value) throw new Error(\`Missing path parameter: \${key}\`);
      return encodeURIComponent(value);
    });
  }

${operationMethods.join("\n\n")}
}

export const apiClient = new GeneratedApiClient();
`);
