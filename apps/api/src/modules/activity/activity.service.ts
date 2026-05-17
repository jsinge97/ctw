import type { CurrentSession } from "@ctw/contracts";
import { getWorkflowProvider } from "../workflow-provider.js";

const workflow = getWorkflowProvider().memory;

export function listDealActivity(dealId: string, session?: CurrentSession) {
  const scoped = workflow.activityEvents.filter((event) => event.dealId === dealId);
  if (session && !["admin", "am"].includes(session.membership.role)) {
    return scoped.filter((event) => event.type !== "Approval" && event.type !== "VA");
  }
  return scoped;
}
