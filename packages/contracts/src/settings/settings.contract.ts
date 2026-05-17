import { z } from "zod";
import { defineRoute } from "../common.js";
import { organizationSettingsSchema, routingThresholdPreviewSchema, updateOrganizationChannelRequestSchema, updateOrganizationSettingsRequestSchema } from "./settings.schemas.js";
const channelParams = z.object({ channelId: z.string() });
const thresholdParams = z.object({ threshold: z.string() });
export const settingsContract = [
  defineRoute({ method: "GET", path: "/v1/settings/organization", summary: "Get organization settings", tags: ["settings"], response: organizationSettingsSchema }),
  defineRoute({ method: "PATCH", path: "/v1/settings/organization", summary: "Update organization settings", tags: ["settings"], body: updateOrganizationSettingsRequestSchema, response: organizationSettingsSchema }),
  defineRoute({ method: "PATCH", path: "/v1/settings/organization/channels/:channelId", summary: "Update organization channel", tags: ["settings"], params: channelParams, body: updateOrganizationChannelRequestSchema, response: organizationSettingsSchema }),
  defineRoute({ method: "GET", path: "/v1/settings/organization/routing-preview/:threshold", summary: "Preview routing threshold impact", tags: ["settings"], params: thresholdParams, response: routingThresholdPreviewSchema })
];
