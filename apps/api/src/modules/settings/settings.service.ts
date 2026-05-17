import type { CurrentSession, OrganizationSettingsDto, UpdateOrganizationSettingsRequest } from "@ctw/contracts";
import { getWorkflowProvider } from "../workflow-provider.js";

export async function getOrganizationSettings(session?: CurrentSession): Promise<OrganizationSettingsDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) return workflow.prisma.getOrganizationSettings(session?.activeOrganization.id ?? "org_northgate") as Promise<OrganizationSettingsDto>;
  return workflow.memory.organizationSettings;
}

export async function updateOrganizationSettings(input: UpdateOrganizationSettingsRequest, session?: CurrentSession): Promise<OrganizationSettingsDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    const patch: { organizationId: string; name?: string; routingConfidenceThreshold?: number } = { organizationId: session?.activeOrganization.id ?? "org_northgate" };
    if (input.name !== undefined) patch.name = input.name;
    if (input.routingConfidenceThreshold !== undefined) patch.routingConfidenceThreshold = input.routingConfidenceThreshold;
    return workflow.prisma.updateOrganizationSettings(patch) as Promise<OrganizationSettingsDto>;
  }
  Object.assign(workflow.memory.organizationSettings, input);
  return workflow.memory.organizationSettings;
}
