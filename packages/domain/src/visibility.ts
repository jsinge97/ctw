export const visibilityValues = [
  "internal",
  "shared_with_deal_participants",
  "participants_only",
  "uploader_only",
  "assignee_only",
  "external_activity"
] as const;

export type Visibility = (typeof visibilityValues)[number];

export function isExternallyVisible(visibility: Visibility): boolean {
  return visibility === "shared_with_deal_participants" || visibility === "participants_only" || visibility === "external_activity";
}

export function visibilityLabel(visibility: Visibility): string {
  switch (visibility) {
    case "internal":
      return "Internal";
    case "shared_with_deal_participants":
      return "Shared";
    case "participants_only":
      return "Participants only";
    case "uploader_only":
      return "Uploader only";
    case "assignee_only":
      return "Assignee only";
    case "external_activity":
      return "External activity";
  }
}
