import type { Capability, Role } from "./capabilities.js";

export const roleDefaults: Record<Role, Capability[]> = {
  admin: [...capabilitiesForAdmin()],
  am: [
    "viewDeal",
    "viewKanban",
    "viewMessages",
    "viewDocuments",
    "uploadDocuments",
    "editDealFields",
    "moveDealStage",
    "createTask",
    "editTask",
    "completeAssignedTask",
    "approveProposedAction",
    "approveOutboundSend",
    "routeWork",
    "viewRoutingReview",
    "viewVaQueue",
    "viewSettingsUsers",
    "viewActivity",
    "manageParticipants"
  ],
  va: ["viewVaQueue"],
  broker: [],
  client: []
};

function capabilitiesForAdmin(): Capability[] {
  return [
    "viewDeal",
    "viewKanban",
    "viewMessages",
    "viewDocuments",
    "uploadDocuments",
    "editDealFields",
    "moveDealStage",
    "createTask",
    "editTask",
    "completeAssignedTask",
    "approveProposedAction",
    "approveOutboundSend",
    "routeWork",
    "viewRoutingReview",
    "viewVaQueue",
    "viewSettingsUsers",
    "viewSettingsOrganization",
    "viewActivity",
    "manageParticipants",
    "managePermissions",
    "manageOrganizationSettings"
  ];
}
