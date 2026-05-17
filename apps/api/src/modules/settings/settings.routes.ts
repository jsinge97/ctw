import type { FastifyInstance } from "fastify";
import { updateOrganizationChannelRequestSchema, updateOrganizationSettingsRequestSchema } from "@ctw/contracts";
import { getRequiredSession } from "../authz.js";
import { parseBody } from "../validation.js";
import { getOrganizationSettings, previewRoutingThreshold, updateOrganizationChannel, updateOrganizationSettings } from "./settings.service.js";

export async function registerSettingsRoutes(app: FastifyInstance) {
  app.get("/v1/settings/organization", async (request) => getOrganizationSettings(getRequiredSession(request)));
  app.patch("/v1/settings/organization", async (request) => updateOrganizationSettings(parseBody(updateOrganizationSettingsRequestSchema, request.body), getRequiredSession(request)));
  app.patch<{ Params: { channelId: string } }>("/v1/settings/organization/channels/:channelId", async (request) => updateOrganizationChannel(request.params.channelId, parseBody(updateOrganizationChannelRequestSchema, request.body), getRequiredSession(request)));
  app.get<{ Params: { threshold: string } }>("/v1/settings/organization/routing-preview/:threshold", async (request) => previewRoutingThreshold(Number(request.params.threshold), getRequiredSession(request)));
}
