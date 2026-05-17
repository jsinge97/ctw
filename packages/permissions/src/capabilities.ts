export const capabilities = [
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
] as const;

export type Capability = (typeof capabilities)[number];

export type Role = "admin" | "am" | "va" | "broker" | "client";
