import type { FastifyInstance } from "fastify";
import { getOrganizationSettings, updateOrganizationSettings } from "./settings.service.js";

export async function registerSettingsRoutes(app: FastifyInstance) {
  app.get("/v1/settings/organization", async () => getOrganizationSettings());
  app.patch<{ Body: any }>("/v1/settings/organization", async (request) => updateOrganizationSettings(request.body as any));
}
