import type { FastifyInstance } from "fastify";
import { normalizeResendInbound } from "@ctw/integrations";
import { enqueueJob, jobNames } from "@ctw/jobs";
import { fileInboundEmail } from "./inbound-routing.service.js";

export async function registerResendWebhookRoutes(app: FastifyInstance) {
  app.post<{ Body: unknown }>("/v1/webhooks/resend", async (request) => {
    const normalized = normalizeResendInbound(request.body);
    const filed = await fileInboundEmail(normalized);
    const job = await enqueueJob(jobNames.ingestEmail, { raw: request.body, normalized });
    return { accepted: true, jobId: job.id, messageId: filed.message.id, reviewItemId: filed.reviewItem?.id ?? null };
  });
}
