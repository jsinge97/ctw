import { organizationSettings } from "../demo-store.js";

export function getOrganizationSettings() {
  return organizationSettings;
}

export function updateOrganizationSettings(input: Partial<typeof organizationSettings>) {
  Object.assign(organizationSettings, input);
  return organizationSettings;
}
