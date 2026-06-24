import { QueryClientProvider } from "@tanstack/react-query";
import { HeadContent, Link, Outlet, Scripts, useRouter } from "@tanstack/react-router";
import { Activity, ArrowUpRight, LogOut, ShieldCheck, Stethoscope } from "lucide-react";
import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import { QueueRealtimeProvider } from "@/sockets/QueueRealtimeProvider";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/register", label: "Register", roles: ["reception"] },
  { to: "/track", label: "Track Ticket" },
  { to: "/triage", label: "Triage", roles: ["triage"] },
  { to: "/queue", label: "Queue Board" },
  { to: "/dashboard", label: "Dashboard", roles: ["triage", "clinician"] },
];

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="surface-panel max-w-md p-8 text-center">
        <div className="eyebrow">System routing</div>
        <h1 className="mt-4 font-display text-7xl font-bold text-foreground">404</h1>
        <p className="mt-3 text-muted-foreground">
          This page does not exist in the current WaitLess workspace.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant"
        >
          Back to WaitLess
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export function AppErrorPage({ error, reset }) {
  const router = useRouter();

  console.error(error);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="surface-panel max-w-md p-8 text-center">
        <div className="eyebrow">Runtime exception</div>
        <h1 className="mt-4 font-display text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 inline-flex rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export function AppShellDocument({ children }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

export function AppLayout({ queryClient }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <QueueRealtimeProvider>
          <div className="relative min-h-screen overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary-soft/90 via-primary-soft/40 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-accent/12 blur-3xl" />
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">
                <Outlet />
              </main>
              <Footer />
            </div>
          </div>
        </QueueRealtimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function Header() {
  const auth = useAuth();
  const visibleNavItems = navItems.filter(
    (item) => !item.roles || auth.hasRole(item.roles),
  );

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="surface-panel px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-elegant">
                <Activity className="h-5 w-5" strokeWidth={2.4} />
              </span>
              <div className="leading-tight">
                <div className="font-display text-lg font-bold tracking-tight">WaitLess</div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                  Hospital Queue OS
                </div>
              </div>
            </Link>

            <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-background/75 p-1.5 lg:flex">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/70 hover:text-foreground"
                  activeProps={{
                    className:
                      "rounded-full gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elegant",
                  }}
                  activeOptions={{ exact: true }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {auth.isAuthenticated ? (
                <button
                  type="button"
                  onClick={auth.logout}
                  className="hidden items-center gap-2 rounded-full border border-border/70 bg-background/75 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted md:inline-flex"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {auth.user?.name}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="hidden items-center gap-2 rounded-full border border-primary/15 bg-primary-soft/65 px-3 py-2 text-xs font-semibold text-primary md:inline-flex"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Staff login
                </Link>
              )}
              <div className="hidden items-center gap-2 rounded-full border border-primary/15 bg-primary-soft/65 px-3 py-2 text-xs font-semibold text-primary xl:inline-flex">
                <ShieldCheck className="h-3.5 w-3.5" />
                Built for live clinical flow
              </div>
              <Link
                to={auth.hasRole(["reception"]) ? "/register" : "/login"}
                className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5"
              >
                New patient
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-4 hidden items-center justify-between gap-4 border-t border-border/70 pt-4 md:flex lg:hidden">
            <nav className="flex flex-wrap gap-2">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-full border border-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted/70 hover:text-foreground"
                  activeProps={{
                    className:
                      "rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary",
                  }}
                  activeOptions={{ exact: true }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Stethoscope className="h-3.5 w-3.5" />
              Registration, triage, tracking, and live operations in one system.
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto border-t border-border/70 pt-4 md:hidden">
              {visibleNavItems.map((item) => (
                <Link
                key={item.to}
                to={item.to}
                className="whitespace-nowrap rounded-full border border-transparent bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                activeProps={{
                  className:
                    "whitespace-nowrap rounded-full gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-elegant",
                }}
                activeOptions={{ exact: true }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="px-4 pb-6 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="surface-panel-muted flex flex-col gap-5 px-5 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="font-display text-base font-bold text-foreground">WaitLess</div>
            <p className="mt-1 max-w-2xl">
              A triage-aware hospital queue system built for Chinhoyi Provincial Hospital
              and the wider Zimbabwean public health network.
            </p>
          </div>
          <div className="space-y-1 text-sm sm:text-right">
            <div>Registration, tracking, queue boards, and staff command in one flow.</div>
            <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
              Powered by live routing and patient notifications
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
