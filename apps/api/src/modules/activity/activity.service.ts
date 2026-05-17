import type { ActivityEventDto, CurrentSession } from "@ctw/contracts";
import { getWorkflowProvider } from "../workflow-provider.js";

export async function listDealActivity(dealId: string, session?: CurrentSession): Promise<ActivityEventDto[]> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    const includeInternal = !session || ["admin", "am"].includes(session.membership.role);
    return workflow.prisma.listDealActivity(session?.activeOrganization.id ?? "org_northgate", dealId, includeInternal) as Promise<ActivityEventDto[]>;
  }
  const scoped = workflow.memory.activityEvents.filter((event) => event.dealId === dealId);
  if (session && !["admin", "am"].includes(session.membership.role)) {
    return scoped.filter((event) => event.type !== "Approval" && event.type !== "VA");
  }
  return scoped;
}
