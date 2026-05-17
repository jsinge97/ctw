import { createRootRoute, createRoute, createRouter, Outlet, redirect } from "@tanstack/react-router";
import { DealsRoute } from "./routes/deals.js";
import { IndexRoute } from "./routes/index.js";
import { LoginRoute } from "./routes/login.js";
import { RoutingReviewRoute } from "./routes/routing-review.js";
import { SettingsRoute } from "./routes/settings.js";
import { VaRoute } from "./routes/va.js";

const rootRoute = createRootRoute({
  component: () => <Outlet />
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexRoute,
  beforeLoad: () => {
    throw redirect({ to: "/deals" });
  }
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

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, dealsRoute, routingReviewRoute, vaRoute, settingsRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
