import type { UpdateOrganizationSettingsRequest } from "@ctw/contracts";
import { organizationSettings } from "../demo-store.js";

export function getOrganizationSettings() {
  return organizationSettings;
}

export function updateOrganizationSettings(input: UpdateOrganizationSettingsRequest) {
  Object.assign(organizationSettings, input);
  return organizationSettings;
}
