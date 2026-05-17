import type { FastifyInstance } from "fastify";
import { updateOrganizationSettingsRequestSchema } from "@ctw/contracts";
import { getRequiredSession } from "../authz.js";
import { parseBody } from "../validation.js";
import { getOrganizationSettings, updateOrganizationSettings } from "./settings.service.js";

export async function registerSettingsRoutes(app: FastifyInstance) {
  app.get("/v1/settings/organization", async (request) => getOrganizationSettings(getRequiredSession(request)));
  app.patch("/v1/settings/organization", async (request) => updateOrganizationSettings(parseBody(updateOrganizationSettingsRequestSchema, request.body), getRequiredSession(request)));
}
