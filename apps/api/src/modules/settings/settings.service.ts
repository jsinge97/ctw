import type { CurrentSession, OrganizationSettingsDto, RoutingThresholdPreviewDto, UpdateOrganizationChannelRequest, UpdateOrganizationSettingsRequest } from "@ctw/contracts";
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

export async function updateOrganizationChannel(channelId: string, input: UpdateOrganizationChannelRequest, session: CurrentSession): Promise<OrganizationSettingsDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    return workflow.prisma.updateOrganizationChannel({
      organizationId: session.activeOrganization.id,
      channelId,
      ...(input.mode !== undefined ? { mode: input.mode } : {}),
      ...(input.status !== undefined ? { status: input.status } : {})
    }) as Promise<OrganizationSettingsDto>;
  }
  const channel = workflow.memory.organizationSettings.channels.find((item) => item.id === channelId);
  if (!channel) throw Object.assign(new Error("Channel not found"), { statusCode: 404 });
  Object.assign(channel, input);
  return workflow.memory.organizationSettings;
}

export async function previewRoutingThreshold(threshold: number, session: CurrentSession): Promise<RoutingThresholdPreviewDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) return workflow.prisma.previewRoutingThreshold(session.activeOrganization.id, threshold) as Promise<RoutingThresholdPreviewDto>;
  const messages = workflow.memory.messages.filter((message) => message.routingConfidence !== null);
  return {
    threshold,
    wouldEnterReview: messages.filter((message) => message.routingStatus === "routed" && (message.routingConfidence ?? 0) < threshold).length,
    wouldAutoRoute: messages.filter((message) => message.routingStatus === "review_required" && (message.routingConfidence ?? 0) >= threshold).length
  };
}
