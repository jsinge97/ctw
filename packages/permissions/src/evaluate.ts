import type { Capability, Role } from "./capabilities.js";
import { roleDefaults } from "./role-defaults.js";

export type PermissionEffect = "allow" | "deny";

export type PermissionGrant = {
  capability: Capability;
  effect: PermissionEffect;
  scopeType: "organization" | "deal" | "document" | "task";
  scopeId: string;
  subjectType: "membership" | "participant" | "role";
  subjectId?: string;
};

export type PermissionActor = {
  membershipId: string;
  role: Role;
  participantIds?: string[];
};

export type PermissionScope = {
  scopeType: PermissionGrant["scopeType"];
  scopeId: string;
};

export type PermissionResult = {
  allowed: boolean;
  reason: string;
};

function grantMatches(actor: PermissionActor, capability: Capability, scope: PermissionScope, grant: PermissionGrant): boolean {
  if (grant.capability !== capability) return false;
  if (grant.scopeType !== scope.scopeType || grant.scopeId !== scope.scopeId) return false;
  if (grant.subjectType === "membership") return grant.subjectId === actor.membershipId;
  if (grant.subjectType === "participant") return actor.participantIds?.includes(grant.subjectId ?? "") ?? false;
  if (grant.subjectType === "role") return grant.subjectId === actor.role;
  return false;
}

export function can(actor: PermissionActor, capability: Capability, scope: PermissionScope, grants: PermissionGrant[] = []): PermissionResult {
  const matching = grants.filter((grant) => grantMatches(actor, capability, scope, grant));
  const explicitDeny = matching.find((grant) => grant.effect === "deny");
  if (explicitDeny) return { allowed: false, reason: "Explicit deny" };

  const explicitAllow = matching.find((grant) => grant.effect === "allow");
  if (explicitAllow) return { allowed: true, reason: "Explicit allow" };

  if (roleDefaults[actor.role].includes(capability)) return { allowed: true, reason: "Role default" };

  return { allowed: false, reason: "Deny by default" };
}

export function assertCan(actor: PermissionActor, capability: Capability, scope: PermissionScope, grants: PermissionGrant[] = []): void {
  const result = can(actor, capability, scope, grants);
  if (!result.allowed) throw new Error(`Permission denied: ${capability} (${result.reason})`);
}
