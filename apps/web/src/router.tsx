import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { DealActivityRoute } from "./routes/deals.$dealId.activity.js";
import { DealDocumentsRoute } from "./routes/deals.$dealId.documents.js";
import { DealMessagesRoute } from "./routes/deals.$dealId.messages.js";
import { DealParticipantsRoute } from "./routes/deals.$dealId.participants.js";
import { DealTasksRoute } from "./routes/deals.$dealId.tasks.js";
import { DealsRoute } from "./routes/deals.js";
import { DealWorkspaceRoute } from "./routes/deals.$dealId.js";
import { IndexRoute } from "./routes/index.js";
import { LoginRoute } from "./routes/login.js";
import { RoutingReviewRoute } from "./routes/routing-review.js";
import { SettingsRoute } from "./routes/settings.js";
import { SettingsUsersRoute } from "./routes/settings.users.js";
import { VaRoute } from "./routes/va.js";

const rootRoute = createRootRoute({
  component: () => <Outlet />
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexRoute
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginRoute
});

const dealsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/deals",
  component: DealsRoute
});

const dealWorkspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/deals/$dealId",
  component: DealWorkspaceRoute
});

const dealMessagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/deals/$dealId/messages",
  component: DealMessagesRoute
});

const dealDocumentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/deals/$dealId/documents",
  component: DealDocumentsRoute
});

const dealTasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/deals/$dealId/tasks",
  component: DealTasksRoute
});

const dealParticipantsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/deals/$dealId/participants",
  component: DealParticipantsRoute
});

const dealActivityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/deals/$dealId/activity",
  component: DealActivityRoute
});

const routingReviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/routing-review",
  component: RoutingReviewRoute
});

const vaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/va",
  component: VaRoute
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/organization",
  component: SettingsRoute
});

const settingsUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/users",
  component: SettingsUsersRoute
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dealsRoute,
  dealWorkspaceRoute,
  dealMessagesRoute,
  dealDocumentsRoute,
  dealTasksRoute,
  dealParticipantsRoute,
  dealActivityRoute,
  routingReviewRoute,
  vaRoute,
  settingsRoute,
  settingsUsersRoute
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
