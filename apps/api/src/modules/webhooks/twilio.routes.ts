import type { FastifyInstance } from "fastify";
import { normalizeTwilioInbound } from "@ctw/integrations";
import { enqueueJob, jobNames } from "@ctw/jobs";

export async function registerTwilioWebhookRoutes(app: FastifyInstance) {
  app.post<{ Body: unknown }>("/v1/webhooks/twilio", async (request) => {
    const normalized = normalizeTwilioInbound(request.body);
    const job = await enqueueJob(jobNames.ingestTwilio, { raw: request.body, normalized });
    return { accepted: true, jobId: job.id };
  });
}
