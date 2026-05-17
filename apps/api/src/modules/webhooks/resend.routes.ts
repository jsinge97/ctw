import type { FastifyInstance } from "fastify";
import { normalizeResendInbound } from "@ctw/integrations";

export async function registerResendWebhookRoutes(app: FastifyInstance) {
  app.post<{ Body: unknown }>("/v1/webhooks/resend", async (request) => ({ accepted: true, normalized: normalizeResendInbound(request.body as any) }));
}
