import type { UpdateOrganizationSettingsRequest } from "@ctw/contracts";
import { getWorkflowProvider } from "../workflow-provider.js";

const workflow = getWorkflowProvider().memory;

export function getOrganizationSettings() {
  return workflow.organizationSettings;
}

export function updateOrganizationSettings(input: UpdateOrganizationSettingsRequest) {
  Object.assign(workflow.organizationSettings, input);
  return workflow.organizationSettings;
}
