import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext } from "@tanstack/react-router";
import {
  AppErrorPage,
  AppLayout,
  AppShellDocument,
  NotFoundPage,
} from "@/layouts/AppLayout";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title: "WaitLess - Digital Queue Management for Zimbabwean Hospitals",
      },
      {
        name: "description",
        content:
          "WaitLess digitises patient registration, triage and queueing for Zimbabwean public hospitals, with WhatsApp and web push notifications.",
      },
      {
        property: "og:title",
        content: "WaitLess - Digital Queue for Public Hospitals",
      },
      {
        property: "og:description",
        content:
          "Triage-aware queueing, zero-cost WhatsApp alerts, real-time staff dashboards.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Sora:wght@500;600;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: AppShellDocument,
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: AppErrorPage,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return <AppLayout queryClient={queryClient} />;
}
