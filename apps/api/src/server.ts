import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { createRequestId } from "@ctw/observability";
import { registerActivityRoutes } from "./modules/activity/activity.routes.js";
import { registerDealsRoutes } from "./modules/deals/deals.routes.js";
import { registerDocumentsRoutes } from "./modules/documents/documents.routes.js";
import { registerMessagesRoutes } from "./modules/messages/messages.routes.js";
import { registerParticipantsRoutes } from "./modules/participants/participants.routes.js";
import { registerRoutingReviewRoutes } from "./modules/routing-review/routing-review.routes.js";
import { registerSessionRoutes } from "./modules/session/session.routes.js";
import { registerSettingsRoutes } from "./modules/settings/settings.routes.js";
import { registerTasksRoutes } from "./modules/tasks/tasks.routes.js";
import { registerUsersRoutes } from "./modules/users/users.routes.js";
import { registerVaWorkRoutes } from "./modules/va-work/va-work.routes.js";
import { registerResendWebhookRoutes } from "./modules/webhooks/resend.routes.js";
import { registerTwilioWebhookRoutes } from "./modules/webhooks/twilio.routes.js";
import { requireAuthenticated } from "./modules/authz.js";
import { registerHealthRoutes } from "./health.routes.js";

export async function buildServer() {
  const app = Fastify({ logger: false });
  await app.register(multipart);

  app.addHook("onRequest", async (request, reply) => {
    const requestId = createRequestId();
    request.headers["x-request-id"] = requestId;
    reply.header("x-request-id", requestId);
    await requireAuthenticated(request);
  });

  await registerHealthRoutes(app);
  await registerSessionRoutes(app);
  await registerDealsRoutes(app);
  await registerParticipantsRoutes(app);
  await registerMessagesRoutes(app);
  await registerDocumentsRoutes(app);
  await registerTasksRoutes(app);
  await registerRoutingReviewRoutes(app);
  await registerVaWorkRoutes(app);
  await registerActivityRoutes(app);
  await registerSettingsRoutes(app);
  await registerUsersRoutes(app);
  await registerResendWebhookRoutes(app);
  await registerTwilioWebhookRoutes(app);

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.API_PORT ?? 3000);
  const app = await buildServer();
  await app.listen({ port, host: "0.0.0.0" });
}
