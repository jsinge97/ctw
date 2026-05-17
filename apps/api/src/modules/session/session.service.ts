import { randomUUID } from "node:crypto";
import { lookupBetterAuthSession, sessionTokenFromCookieHeader, type DurableSessionLookup } from "@ctw/auth";
import { roleDefaults, type Role } from "@ctw/permissions";
import type { CurrentSession } from "@ctw/contracts";
import { assertProductionRuntimeSafety } from "@ctw/config";
import { getPrismaClient } from "@ctw/db";

export type SessionLookup = DurableSessionLookup & {
  userId: string;
  email: string;
  displayName: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  membershipId: string;
  role: Role;
};

let durableSessionLookup = (token: string) => lookupBetterAuthSession(getPrismaClient(), token);

export function setDurableSessionLookupForTests(lookup: typeof durableSessionLookup) {
  durableSessionLookup = lookup;
}

export function resetDurableSessionLookupForTests() {
  durableSessionLookup = (token: string) => lookupBetterAuthSession(getPrismaClient(), token);
}

const demoSessions: Record<string, SessionLookup> = {
  "am-token": {
    userId: "user_am",
    email: "am@northgate.cre",
    displayName: "Maria Reyes",
    organizationId: "org_demo",
    organizationName: "Northgate CRE",
    organizationSlug: "northgate",
    membershipId: "mem_am",
    role: "am"
  },
  "broker-token": {
    userId: "user_broker",
    email: "broker@halcyon.com",
    displayName: "Devon Asherton",
    organizationId: "org_demo",
    organizationName: "Northgate CRE",
    organizationSlug: "northgate",
    membershipId: "mem_broker",
    role: "broker"
  },
  "broker-2-token": {
    userId: "user_broker_2",
    email: "other-broker@example.com",
    displayName: "Other Broker",
    organizationId: "org_demo",
    organizationName: "Northgate CRE",
    organizationSlug: "northgate",
    membershipId: "mem_broker_2",
    role: "broker"
  },
  "va-token": {
    userId: "user_va",
    email: "va@northgate.cre",
    displayName: "Tomas Vega",
    organizationId: "org_demo",
    organizationName: "Northgate CRE",
    organizationSlug: "northgate",
    membershipId: "mem_va",
    role: "va"
  }
};

const demoLoginSessions: Record<string, { cookieToken: string; bearerToken: keyof typeof demoSessions }> = {
  "am@northgate.cre": { cookieToken: "demo-session-am", bearerToken: "am-token" },
  "broker@halcyon.com": { cookieToken: "demo-session-broker", bearerToken: "broker-token" },
  "va@northgate.cre": { cookieToken: "demo-session-va", bearerToken: "va-token" }
};

const demoCookieSessions = Object.fromEntries(Object.values(demoLoginSessions).map((entry) => [entry.cookieToken, entry.bearerToken]));

function allowedSurfaces(role: Role, capabilities: string[]): string[] {
  const surfaces = ["/deals"];
  if (capabilities.includes("viewRoutingReview")) surfaces.push("/routing-review");
  if (capabilities.includes("viewVaQueue")) surfaces.push("/va");
  if (capabilities.includes("viewSettingsUsers")) surfaces.push("/settings/users");
  if (capabilities.includes("viewSettingsOrganization")) surfaces.push("/settings/organization");
  return role === "va" ? ["/va", ...surfaces.filter((surface) => surface !== "/va")] : surfaces;
}

export function buildSession(lookup: SessionLookup): CurrentSession {
  const capabilities = roleDefaults[lookup.role];
  return {
    user: { id: lookup.userId, email: lookup.email, displayName: lookup.displayName },
    activeOrganization: { id: lookup.organizationId, name: lookup.organizationName, slug: lookup.organizationSlug },
    membership: { id: lookup.membershipId, role: lookup.role },
    capabilities,
    allowedSurfaces: allowedSurfaces(lookup.role, capabilities),
    homeRoute: lookup.role === "va" ? "/va" : "/deals"
  };
}

export function resolveSessionFromToken(token: string | undefined): CurrentSession {
  const runtimeEnv = assertProductionRuntimeSafety();
  if (runtimeEnv.CTW_RUNTIME_MODE === "production" && runtimeEnv.CTW_ALLOW_DEMO_TOKENS !== "true") throw new Error("Demo bearer tokens are not allowed in production");
  if (!token) throw new Error("Unauthorized");
  const lookup = demoSessions[token];
  if (!lookup) throw new Error("Unauthorized");
  return buildSession(lookup);
}

export async function resolveSessionFromCookieHeader(cookieHeader: string | undefined): Promise<CurrentSession> {
  const token = sessionTokenFromCookieHeader(cookieHeader);
  if (!token) throw new Error("Unauthorized");
  const runtimeEnv = assertProductionRuntimeSafety();
  const demoBearerToken = demoCookieSessions[token];
  const demoLookup = demoBearerToken ? demoSessions[demoBearerToken] : undefined;
  if (runtimeEnv.CTW_DB_MODE === "memory" && runtimeEnv.CTW_RUNTIME_MODE !== "production" && demoLookup) return buildSession(demoLookup);
  const lookup = await durableSessionLookup(token);
  if (lookup) return buildSession(lookup);
  throw new Error("Unauthorized");
}

export async function resolveSessionFromHeaders(headers: { authorization?: string | string[] | undefined; cookie?: string | string[] | undefined }): Promise<CurrentSession> {
  const cookieHeader = Array.isArray(headers.cookie) ? headers.cookie.join("; ") : headers.cookie;
  if (sessionTokenFromCookieHeader(cookieHeader)) return resolveSessionFromCookieHeader(cookieHeader);
  const authorization = Array.isArray(headers.authorization) ? headers.authorization[0] : headers.authorization;
  return resolveSessionFromToken(authorization?.replace("Bearer ", ""));
}

export async function loginWithEmailPassword(input: { email: string; password: string }): Promise<{ token: string; session: CurrentSession }> {
  if (input.password !== "password") throw new Error("Unauthorized");
  const runtimeEnv = assertProductionRuntimeSafety();
  if (runtimeEnv.CTW_RUNTIME_MODE === "production") throw new Error("Better Auth credential login is not configured for production yet");
  const demoLogin = demoLoginSessions[input.email];
  if (runtimeEnv.CTW_DB_MODE === "memory" && demoLogin) {
    const lookup = demoSessions[demoLogin.bearerToken];
    if (!lookup) throw new Error("Unauthorized");
    return { token: demoLogin.cookieToken, session: buildSession(lookup) };
  }
  const prisma = getPrismaClient();
  const user = await prisma.user.findFirst({
    where: { email: input.email, status: "active" },
    include: {
      memberships: {
        where: { status: "active" },
        include: { organization: true },
        orderBy: { createdAt: "asc" }
      }
    }
  });
  const membership = user?.memberships[0];
  if (!user || !membership) throw new Error("Unauthorized");

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await prisma.authSession.create({
    data: {
      token,
      userId: user.id,
      activeOrganizationId: membership.organizationId,
      expiresAt
    }
  });

  return {
    token,
    session: buildSession({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      organizationId: membership.organization.id,
      organizationName: membership.organization.name,
      organizationSlug: membership.organization.slug,
      membershipId: membership.id,
      role: membership.role
    })
  };
}

export async function logoutSession(token: string | null): Promise<void> {
  if (!token) return;
  await getPrismaClient().authSession.deleteMany({ where: { token } });
}

export function acceptInvitation(token: string): CurrentSession {
  return resolveSessionFromToken(token.includes("broker") ? "broker-token" : "am-token");
}
