import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowUpRight, LogOut, ShieldCheck, Stethoscope } from "lucide-react";
import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import { WaitLessLogo } from "@/components/WaitLessLogo";
import { LiveRefreshProvider } from "@/context/LiveRefreshContext";
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
  console.error(error);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="surface-panel max-w-md p-8 text-center">
        <div className="eyebrow">Runtime exception</div>
        <h1 className="mt-4 font-display text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            reset?.();
            window.location.reload();
          }}
          className="mt-6 inline-flex rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export function AppLayout() {
  const location = useLocation();

  return (
    <AuthProvider>
      <LiveRefreshProvider>
        <QueueRealtimeProvider>
          <div className="relative min-h-screen overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary-soft/90 via-primary-soft/40 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-accent/12 blur-3xl" />
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">
                <div
                  key={`${location.pathname}${location.search}`}
                  className="page-route-shell"
                >
                  <Outlet />
                </div>
              </main>
              <Footer />
            </div>
          </div>
        </QueueRealtimeProvider>
      </LiveRefreshProvider>
    </AuthProvider>
  );
}

function Header() {
  const auth = useAuth();
  const location = useLocation();
  const isHomeRoute = location.pathname === "/";
  const isAuthRoute = [
    "/login",
    "/staff-register",
    "/staff-signup",
    "/forgot-password",
    "/reset-password",
  ].some((path) => location.pathname.startsWith(path));
  const visibleNavItems = navItems.filter(
    (item) => !item.roles || auth.hasRole(item.roles),
  );

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div
          className={
            isHomeRoute && !isAuthRoute
              ? "relative overflow-hidden rounded-[2rem] bg-white/72 px-4 py-3.5 shadow-[0_22px_70px_rgba(15,23,42,0.16)] backdrop-blur-2xl sm:px-6"
              : "surface-panel px-4 py-3 sm:px-5"
          }
        >
          {isHomeRoute && !isAuthRoute && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(240,253,250,0.72)_42%,rgba(219,234,254,0.64))]" />
              <div className="pointer-events-none absolute -left-10 top-0 h-24 w-32 rounded-full bg-primary/10 blur-3xl" />
              <div className="pointer-events-none absolute right-0 top-0 h-24 w-40 rounded-full bg-accent/12 blur-3xl" />
            </>
          )}

          <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-4 lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-6">
            <Link to="/" aria-label="Go to WaitLess home">
              <WaitLessLogo />
            </Link>

            <div
              className={`hidden items-center gap-2 rounded-full p-1.5 lg:flex lg:justify-self-center ${
                isHomeRoute && !isAuthRoute
                  ? "bg-white/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_26px_rgba(15,23,42,0.06)] backdrop-blur"
                  : "border border-border/70 bg-background/75"
              }`}
            >
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    isActive
                      ? "inline-flex h-12 items-center rounded-full gradient-primary px-5 text-sm font-semibold text-primary-foreground shadow-elegant"
                      : `inline-flex h-12 items-center rounded-full px-4 text-sm font-medium transition-all ${
                          isHomeRoute && !isAuthRoute
                            ? "text-slate-600 hover:bg-white/70 hover:text-slate-950"
                            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="flex items-center gap-3 lg:justify-self-end">
              {auth.isAuthenticated ? (
                <button
                  type="button"
                  onClick={auth.logout}
                  className={`hidden h-11 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-colors md:inline-flex ${
                    isHomeRoute && !isAuthRoute
                      ? "bg-white/58 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur hover:bg-white/72"
                      : "border border-border/70 bg-background/75 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {auth.user?.name}
                </button>
              ) : !isAuthRoute ? (
                <Link
                  to="/login"
                  className={`hidden h-11 items-center gap-2 rounded-full px-4 text-xs font-semibold md:inline-flex ${
                    isHomeRoute && !isAuthRoute
                      ? "bg-primary-soft/82 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_24px_rgba(15,118,110,0.08)]"
                      : "border border-primary/15 bg-primary-soft/65 text-primary"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Staff login
                </Link>
              ) : null}
              <Link
                to={auth.hasRole(["reception"]) ? "/register" : "/login"}
                className="inline-flex h-11 items-center gap-2 rounded-xl gradient-primary px-5 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5"
              >
                New patient
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div
            className={`mt-4 hidden items-center justify-between gap-4 pt-4 md:flex lg:hidden ${
              isHomeRoute && !isAuthRoute ? "border-t border-white/50" : "border-t border-border/70"
            }`}
          >
            <nav className="flex flex-wrap gap-2">
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    isActive
                      ? "rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary"
                      : "rounded-full border border-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted/70 hover:text-foreground"
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Stethoscope className="h-3.5 w-3.5" />
              Registration, triage, tracking, and live operations in one system.
            </div>
          </div>

          <nav
            className={`mt-4 flex gap-2 overflow-x-auto pt-4 md:hidden ${
              isHomeRoute && !isAuthRoute ? "border-t border-white/50" : "border-t border-border/70"
            }`}
          >
              {visibleNavItems.map((item) => (
                <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  isActive
                    ? "whitespace-nowrap rounded-full gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-elegant"
                    : "whitespace-nowrap rounded-full border border-transparent bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-800/80 bg-[#071523] px-4 pb-8 pt-10 text-slate-200 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(20,184,166,0.18),transparent_28%),radial-gradient(circle_at_82%_0%,rgba(37,99,235,0.18),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(148,163,184,0.32)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.24)_1px,transparent_1px)] [background-size:88px_88px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="rounded-[1.75rem] bg-white/6 px-5 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <WaitLessLogo />
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                A triage-aware hospital queue system built for Chinhoyi Provincial Hospital
                and the wider Zimbabwean public health network.
              </p>
            </div>
            <div className="space-y-2 text-sm sm:max-w-md sm:text-right">
              <div className="font-medium text-slate-100">
                Registration, tracking, queue boards, and staff command in one flow.
              </div>
              <div className="text-xs uppercase tracking-[0.28em] text-cyan-100/68">
                Powered by live routing and patient notifications
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <div>WaitLess Hospital Queue OS</div>
            <div className="uppercase tracking-[0.24em] text-slate-500">
              Public health workflow platform
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
