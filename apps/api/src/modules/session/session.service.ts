import { roleDefaults, type Role } from "@ctw/permissions";
import type { CurrentSession } from "@ctw/contracts";

function allowedSurfaces(role: Role, capabilities: string[]): string[] {
  const surfaces = ["/deals"];
  if (capabilities.includes("viewRoutingReview")) surfaces.push("/routing-review");
  if (capabilities.includes("viewVaQueue")) surfaces.push("/va");
  if (capabilities.includes("viewSettingsUsers")) surfaces.push("/settings/users");
  if (capabilities.includes("viewSettingsOrganization")) surfaces.push("/settings/organization");
  return role === "va" ? ["/va", ...surfaces.filter((surface) => surface !== "/va")] : surfaces;
}

export function buildDemoSession(role: Role = "am"): CurrentSession {
  const capabilities = roleDefaults[role];
  return {
    user: { id: `user_${role}`, email: `${role}@northgate.cre`, displayName: role === "am" ? "Maria Reyes" : role.toUpperCase() },
    activeOrganization: { id: "org_demo", name: "Northgate CRE", slug: "northgate" },
    membership: { id: `mem_${role}`, role },
    capabilities,
    allowedSurfaces: allowedSurfaces(role, capabilities),
    homeRoute: role === "va" ? "/va" : "/deals"
  };
}
