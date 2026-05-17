import { roleDefaults, type Role } from "@ctw/permissions";
import type { CurrentSession } from "@ctw/contracts";
import { assertProductionRuntimeSafety } from "@ctw/config";

export type SessionLookup = {
  userId: string;
  email: string;
  displayName: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  membershipId: string;
  role: Role;
};

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

export function acceptInvitation(token: string): CurrentSession {
  return resolveSessionFromToken(token.includes("broker") ? "broker-token" : "am-token");
}
