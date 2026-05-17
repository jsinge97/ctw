import { defineRoute } from "../common.js";
import { organizationSettingsSchema, updateOrganizationSettingsRequestSchema } from "./settings.schemas.js";
export const settingsContract = [
  defineRoute({ method: "GET", path: "/v1/settings/organization", summary: "Get organization settings", tags: ["settings"], response: organizationSettingsSchema }),
  defineRoute({ method: "PATCH", path: "/v1/settings/organization", summary: "Update organization settings", tags: ["settings"], body: updateOrganizationSettingsRequestSchema, response: organizationSettingsSchema })
];
