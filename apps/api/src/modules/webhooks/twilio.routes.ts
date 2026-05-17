import type { FastifyInstance } from "fastify";
import { normalizeTwilioInbound } from "@ctw/integrations";

export async function registerTwilioWebhookRoutes(app: FastifyInstance) {
  app.post<{ Body: unknown }>("/v1/webhooks/twilio", async (request) => ({ accepted: true, normalized: normalizeTwilioInbound(request.body as any) }));
}
