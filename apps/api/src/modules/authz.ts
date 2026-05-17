import type { FastifyRequest } from "fastify";
import { assertCan, roleDefaults, type Capability, type Role } from "@ctw/permissions";
import { resolveSessionFromToken } from "./session/session.service.js";

export function tokenFromRequest(request: FastifyRequest): string | undefined {
  return request.headers.authorization?.replace("Bearer ", "");
}

export function isPublicPath(path: string): boolean {
  return path === "/healthz" || path === "/openapi.json" || path === "/v1/session/accept-invitation" || path.startsWith("/v1/webhooks/");
}

function requiredCapability(method: string, path: string): Capability | null {
  if (path === "/v1/session/current") return null;
  if (path === "/v1/deals" && method === "GET") return "viewKanban";
  if (path === "/v1/deals" && method === "POST") return "editDealFields";
  if (/^\/v1\/deals\/[^/]+$/.test(path)) return method === "GET" ? "viewDeal" : "editDealFields";
  if (/^\/v1\/deals\/[^/]+\/move-stage$/.test(path)) return "moveDealStage";
  if (/^\/v1\/deals\/[^/]+\/archive$/.test(path)) return "editDealFields";
  if (/^\/v1\/deals\/[^/]+\/participants/.test(path)) return method === "GET" ? "viewDeal" : "manageParticipants";
  if (/^\/v1\/deals\/[^/]+\/messages/.test(path)) return method === "GET" ? "viewMessages" : "routeWork";
  if (/^\/v1\/deals\/[^/]+\/documents/.test(path)) return method === "GET" ? "viewDocuments" : "uploadDocuments";
  if (/^\/v1\/deals\/[^/]+\/tasks/.test(path)) return method === "GET" ? "viewDeal" : "createTask";
  if (/^\/v1\/tasks\/[^/]+\/approve$/.test(path)) return "approveProposedAction";
  if (/^\/v1\/tasks\/[^/]+\/(reject|defer|route)$/.test(path)) return "editTask";
  if (path === "/v1/routing-review-items") return "viewRoutingReview";
  if (/^\/v1\/routing-review-items\/[^/]+\/resolve$/.test(path)) return "routeWork";
  if (path === "/v1/va-work-items") return "viewVaQueue";
  if (/^\/v1\/va-work-items\/[^/]+/.test(path)) return "completeAssignedTask";
  if (path === "/v1/activity") return "viewActivity";
  if (path === "/v1/settings/organization") return method === "GET" ? "viewSettingsOrganization" : "manageOrganizationSettings";
  if (path === "/v1/users") return method === "GET" ? "viewSettingsUsers" : "managePermissions";
  if (/^\/v1\/users\/[^/]+$/.test(path)) return "managePermissions";
  return null;
}

export function requireAuthenticated(request: FastifyRequest) {
  const path = request.url.split("?")[0] ?? request.url;
  if (isPublicPath(path)) return null;
  let session: ReturnType<typeof resolveSessionFromToken>;
  try {
    session = resolveSessionFromToken(tokenFromRequest(request));
  } catch {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
  const capability = requiredCapability(request.method, path);
  try {
    if (capability) requireCapabilityForSession(session, capability);
  } catch {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }
  return session;
}

function requireCapabilityForSession(session: ReturnType<typeof resolveSessionFromToken>, capability: Capability) {
  const role = session.membership.role as Role;
  assertCan(
    { membershipId: session.membership.id, role },
    capability,
    { scopeType: "organization", scopeId: session.activeOrganization.id },
    roleDefaults[role].includes(capability)
      ? [{ capability, effect: "allow", scopeType: "organization", scopeId: session.activeOrganization.id, subjectType: "membership", subjectId: session.membership.id }]
      : []
  );
}

export function requireCapability(request: FastifyRequest, capability: Capability) {
  const session = requireAuthenticated(request);
  if (!session) return;
  requireCapabilityForSession(session, capability);
}
