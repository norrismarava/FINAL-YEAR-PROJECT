/* eslint-disable */

// Runtime route tree used by the app.
// TanStack's own generated file is redirected to src/.generated so this stays valid JavaScript.

import { Route as rootRouteImport } from "./pages/__root";
import { Route as TriageRouteImport } from "./pages/triage";
import { Route as RegisterRouteImport } from "./pages/register";
import { Route as QueueRouteImport } from "./pages/queue";
import { Route as DashboardRouteImport } from "./pages/dashboard";
import { Route as IndexRouteImport } from "./pages/index";

const TriageRoute = TriageRouteImport.update({
  id: "/triage",
  path: "/triage",
  getParentRoute: () => rootRouteImport,
});

const RegisterRoute = RegisterRouteImport.update({
  id: "/register",
  path: "/register",
  getParentRoute: () => rootRouteImport,
});

const QueueRoute = QueueRouteImport.update({
  id: "/queue",
  path: "/queue",
  getParentRoute: () => rootRouteImport,
});

const DashboardRoute = DashboardRouteImport.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => rootRouteImport,
});

const IndexRoute = IndexRouteImport.update({
  id: "/",
  path: "/",
  getParentRoute: () => rootRouteImport,
});

const rootRouteChildren = {
  IndexRoute,
  DashboardRoute,
  QueueRoute,
  RegisterRoute,
  TriageRoute,
};

export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren);
