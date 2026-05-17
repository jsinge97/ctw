import type { FastifyInstance } from "fastify";
import { normalizeResendInbound } from "@ctw/integrations";
import { enqueueJob, jobNames } from "@ctw/jobs";

export async function registerResendWebhookRoutes(app: FastifyInstance) {
  app.post<{ Body: unknown }>("/v1/webhooks/resend", async (request) => {
    const normalized = normalizeResendInbound(request.body);
    const job = enqueueJob(jobNames.ingestEmail, { raw: request.body, normalized });
    return { accepted: true, jobId: job.id };
  });
}
