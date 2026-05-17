import type { FastifyRequest } from "fastify";
import { assertCan, roleDefaults, type Capability, type Role } from "@ctw/permissions";
import type { CurrentSession } from "@ctw/contracts";
import { getPrismaClient } from "@ctw/db";
import { resolveSessionFromHeaders } from "./session/session.service.js";
import { getWorkflowProvider } from "./workflow-provider.js";

const requestSessions = new WeakMap<FastifyRequest, CurrentSession>();

export function tokenFromRequest(request: FastifyRequest): string | undefined {
  return request.headers.authorization?.replace("Bearer ", "");
}

export function isPublicPath(path: string): boolean {
  return path === "/healthz" || path === "/openapi.json" || path === "/v1/session/accept-invitation" || path === "/v1/session/login" || path.startsWith("/v1/webhooks/");
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
  if (/^\/v1\/deals\/[^/]+\/activity$/.test(path)) return "viewActivity";
  if (/^\/v1\/tasks\/[^/]+\/approve$/.test(path)) return "approveProposedAction";
  if (/^\/v1\/tasks\/[^/]+\/(reject|defer|route)$/.test(path)) return "editTask";
  if (/^\/v1\/tasks\/[^/]+\/complete$/.test(path)) return "completeAssignedTask";
  if (path === "/v1/routing-review-items") return "viewRoutingReview";
  if (/^\/v1\/routing-review-items\/[^/]+\/resolve$/.test(path)) return "routeWork";
  if (path === "/v1/va-work-items") return "viewVaQueue";
  if (/^\/v1\/va-work-items\/[^/]+\/(start|submit)$/.test(path)) return "completeAssignedTask";
  if (/^\/v1\/va-work-items\/[^/]+\/(accept|cancel|send-back)$/.test(path)) return "approveProposedAction";
  if (path === "/v1/settings/organization") return method === "GET" ? "viewSettingsOrganization" : "manageOrganizationSettings";
  if (/^\/v1\/settings\/organization\/routing-preview\/[^/]+$/.test(path)) return "viewSettingsOrganization";
  if (/^\/v1\/settings\/organization\/channels\/[^/]+$/.test(path)) return "manageOrganizationSettings";
  if (path === "/v1/users") return method === "GET" ? "viewSettingsUsers" : "managePermissions";
  if (/^\/v1\/users\/[^/]+(\/resend-invitation)?$/.test(path)) return "managePermissions";
  return null;
}

function dealIdFromPath(path: string): string | null {
  return path.match(/^\/v1\/deals\/([^/]+)/)?.[1] ?? null;
}

async function participantAllows(session: CurrentSession, capability: Capability, dealId: string | null): Promise<boolean> {
  if (!["broker", "client"].includes(session.membership.role)) return false;
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma") return prismaParticipantAllows(session, capability, dealId);
  const memory = workflow.memory;
  if (!dealId && capability === "viewKanban") {
    return memory.participants.some((item) => item.membershipId === session.membership.id && item.status === "active" && item.capabilities.some((grant) => grant.toLowerCase().replace(/\s+/g, "") === "viewdeal"));
  }
  if (!dealId) return false;
  const participant = memory.participants.find((item) => item.dealId === dealId && item.status === "active" && item.membershipId === session.membership.id);
  if (!participant) return false;
  const normalized = participant.capabilities.map((item) => item.toLowerCase().replace(/\s+/g, ""));
  const capabilityName = capability.toLowerCase();
  return normalized.includes(capabilityName) || (capability === "viewKanban" && normalized.includes("viewdeal"));
}

async function prismaParticipantAllows(session: CurrentSession, capability: Capability, dealId: string | null): Promise<boolean> {
  const prisma = getPrismaClient();
  const dbCapability = dbCapabilityFor(capability);
  if (!dealId && capability === "viewKanban") {
    const participants = await prisma.dealParticipant.findMany({
      where: { organizationId: session.activeOrganization.id, subjectType: "membership", subjectId: session.membership.id, status: "active" },
      select: { id: true, dealId: true }
    });
    if (participants.length === 0) return false;
    const grant = await prisma.permissionGrant.findFirst({
      where: {
        organizationId: session.activeOrganization.id,
        scopeType: "deal",
        scopeId: { in: participants.map((participant) => participant.dealId) },
        effect: "allow",
        revokedAt: null,
        capability: dbCapability,
        OR: [{ subjectId: session.membership.id }, { subjectId: { in: participants.map((participant) => participant.id) } }]
      }
    });
    return Boolean(grant);
  }
  if (!dealId) return false;
  const participant = await prisma.dealParticipant.findFirst({
    where: { organizationId: session.activeOrganization.id, dealId, subjectType: "membership", subjectId: session.membership.id, status: "active" }
  });
  if (!participant) return false;
  const grants = await prisma.permissionGrant.findMany({
    where: {
      organizationId: session.activeOrganization.id,
      scopeType: "deal",
      scopeId: dealId,
      effect: "allow",
      revokedAt: null,
      capability: dbCapability,
      OR: [{ subjectId: session.membership.id }, { subjectId: participant.id }]
    }
  });
  return grants.length > 0;
}

export async function requireAuthenticated(request: FastifyRequest) {
  const path = request.url.split("?")[0] ?? request.url;
  if (isPublicPath(path)) return null;
  let session: CurrentSession;
  try {
    session = await resolveSessionFromHeaders(request.headers);
  } catch {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
  const capability = requiredCapability(request.method, path);
  try {
    if (capability) await requireCapabilityForSession(session, capability, dealIdFromPath(path));
  } catch {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }
  requestSessions.set(request, session);
  return session;
}

async function requireCapabilityForSession(session: CurrentSession, capability: Capability, dealId: string | null = null) {
  if (await participantAllows(session, capability, dealId)) return;
  if (dealId && getWorkflowProvider().mode === "prisma") await assertDealBelongsToSessionOrganization(session, dealId);
  const role = session.membership.role as Role;
  const scope = dealId ? { scopeType: "deal" as const, scopeId: dealId } : { scopeType: "organization" as const, scopeId: session.activeOrganization.id };
  assertCan(
    { membershipId: session.membership.id, role },
    capability,
    scope,
    roleDefaults[role].includes(capability)
      ? [{ capability, effect: "allow", scopeType: scope.scopeType, scopeId: scope.scopeId, subjectType: "membership", subjectId: session.membership.id }]
      : []
  );
}

async function assertDealBelongsToSessionOrganization(session: CurrentSession, dealId: string) {
  const deal = await getPrismaClient().deal.findFirst({ where: { id: dealId, organizationId: session.activeOrganization.id }, select: { id: true } });
  if (!deal) throw new Error("Deal not found");
}

function dbCapabilityFor(capability: Capability): string {
  if (capability === "viewDeal" || capability === "viewKanban") return "deal.view";
  if (capability === "viewMessages") return "message.view";
  if (capability === "viewDocuments") return "document.view";
  if (capability === "uploadDocuments") return "document.upload";
  return capability;
}

export async function requireCapability(request: FastifyRequest, capability: Capability) {
  const session = await requireAuthenticated(request);
  if (!session) return;
  await requireCapabilityForSession(session, capability);
}

export function getRequiredSession(request: FastifyRequest): CurrentSession {
  const session = requestSessions.get(request);
  if (!session) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  return session;
}
