import type { Capability, Role } from "@ctw/permissions";

export type ActorContext = {
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  membership: {
    id: string;
    role: Role;
  };
  capabilities: Capability[];
  requestId: string;
};

export function createSystemActor(requestId = "system"): ActorContext {
  return {
    user: { id: "system", email: "system@ctw.local", displayName: "System" },
    organization: { id: "org_demo", name: "Northgate CRE", slug: "northgate" },
    membership: { id: "mem_system", role: "admin" },
    capabilities: [],
    requestId
  };
}
