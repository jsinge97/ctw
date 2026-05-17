import type { CurrentSession } from "@ctw/contracts";
import { activityEvents } from "../demo-store.js";

export function listDealActivity(dealId: string, session?: CurrentSession) {
  const scoped = activityEvents.filter((event) => event.dealId === dealId);
  if (session && !["admin", "am"].includes(session.membership.role)) {
    return scoped.filter((event) => event.type !== "Approval" && event.type !== "VA");
  }
  return scoped;
}
