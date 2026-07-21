import { useEffect, useRef, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Bell,
  BellRing,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  Facebook,
  FileChartColumn,
  Globe,
  House,
  Instagram,
  LayoutDashboard,
  Linkedin,
  LogOut,
  Mail,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Search,
  Settings2,
  ShieldCheck,
  ShieldPlus,
  Stethoscope,
  Ticket,
  UserRound,
  UsersRound,
  X,
  Youtube,
} from "lucide-react";

import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import { PatientAuthProvider, usePatientAuth } from "@/auth/PatientAuthProvider";
import { LoadingPanel } from "@/components/ui/system-loader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WaitLessLogo } from "@/components/WaitLessLogo";
import { LiveRefreshProvider } from "@/context/LiveRefreshContext";
import {
  formatStaffRoleLabel,
  getStaffInitials,
  resolveStaffLandingPath,
} from "@/services/staffProfilePrefs";
import { QueueRealtimeProvider } from "@/sockets/QueueRealtimeProvider";
import { resolveProfileImageUrl } from "@/utils/profileImage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { to: "/", label: "Home", icon: House },
  { to: "/admin/register", label: "Register", roles: ["reception"], icon: ShieldPlus },
  { to: "/track", label: "Track Ticket", icon: Ticket },
  { to: "/admin/triage", label: "Triage", roles: ["triage"], icon: Stethoscope },
  { to: "/queue", label: "Queue Board", icon: Search },
  {
    to: "/admin/settings",
    label: "Settings",
    icon: Settings2,
    roles: ["admin", "triage", "clinician", "reception"],
  },
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    roles: ["triage", "clinician"],
    icon: LayoutDashboard,
  },
];

const STAFF_WORKSPACE_ITEMS = [
  {
    group: "Main",
    to: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["triage", "clinician"],
  },
  {
    group: "Main",
    to: "/admin/register",
    label: "Register Patient",
    icon: ShieldPlus,
    roles: ["reception"],
  },
  { group: "Main", to: "/admin/track", label: "Track Ticket", icon: Ticket },
  { group: "Main", to: "/admin/queue", label: "Queue Board", icon: Search },
  {
    group: "Clinical",
    to: "/admin/triage",
    label: "Triage",
    icon: Stethoscope,
    roles: ["triage"],
  },
  { group: "Clinical", to: "/admin/departments", label: "Departments", icon: Building2 },
  { group: "Clinical", to: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  { group: "Insights", to: "/admin/reports", label: "Reports", icon: FileChartColumn },
  {
    group: "Insights",
    to: "/admin/analytics",
    label: "Queue Analytics",
    icon: ChartNoAxesCombined,
  },
  { group: "Insights", to: "/admin/notifications", label: "Notifications", icon: BellRing },
  {
    group: "Admin",
    to: "/admin/staff",
    label: "Staff",
    icon: UsersRound,
    roles: ["admin"],
  },
  { group: "Admin", to: "/admin/settings", label: "Settings", icon: Settings2 },
  { group: "Account", to: "/admin/profile", label: "My Profile", icon: UserRound },
];

const AUTH_ROUTE_PREFIXES = [
  "/admin/login",
  "/admin/staff-register",
  "/admin/staff-signup",
  "/admin/forgot-password",
  "/admin/reset-password",
];

const STAFF_WORKSPACE_ROUTE_PREFIXES = ["/admin"];

function isAuthPath(pathname) {
  return AUTH_ROUTE_PREFIXES.some((path) => pathname.startsWith(path));
}

function isPatientPortalPath(pathname) {
  return (
    pathname.startsWith("/track") ||
    pathname.startsWith("/queue") ||
    pathname.startsWith("/self-register") ||
    pathname.startsWith("/patient/register") ||
    pathname.startsWith("/patient/login") ||
    pathname.startsWith("/patient/dashboard")
  );
}

function isStaffWorkspacePath(pathname) {
  return (
    STAFF_WORKSPACE_ROUTE_PREFIXES.some((path) => pathname.startsWith(path)) &&
    !isAuthPath(pathname)
  );
}

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
  return (
    <AuthProvider>
      <PatientAuthProvider>
        <LiveRefreshProvider>
          <QueueRealtimeProvider>
            <AppScaffold />
          </QueueRealtimeProvider>
        </LiveRefreshProvider>
      </PatientAuthProvider>
    </AuthProvider>
  );
}

function AppScaffold() {
  const auth = useAuth();
  const patientAuth = usePatientAuth();
  const location = useLocation();
  const isAuthRoute = isAuthPath(location.pathname);
  const isPatientPortalRoute = isPatientPortalPath(location.pathname);
  const isWorkspaceRoute = isStaffWorkspacePath(location.pathname);
  const isDashboardRoute = location.pathname.startsWith("/admin/dashboard");
  const isStaffWorkspaceTheme = isWorkspaceRoute && auth.isAuthenticated;
  const showStaffSidebar = isStaffWorkspaceTheme;
  const isHomeRoute = location.pathname === "/";

  if (isWorkspaceRoute && auth.isReady && !auth.isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (isPatientPortalRoute) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#eef7f8] text-slate-900">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[linear-gradient(180deg,rgba(204,251,241,0.78),rgba(219,234,254,0.62)_45%,rgba(248,250,252,0))]" />
        <div className="pointer-events-none absolute -left-24 top-16 h-80 w-80 rounded-full bg-teal-300/18 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-12 h-96 w-96 rounded-full bg-blue-400/16 blur-3xl" />

        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <div key={`${location.pathname}${location.search}`} className="page-route-shell">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden ${
        isAuthRoute
          ? "bg-[#020814]"
          : isStaffWorkspaceTheme
            ? "dashboard-workspace-shell bg-[#050817]"
            : ""
      }`}
    >
      {isAuthRoute ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-[#081523] via-[#092138]/75 to-transparent" />
          <div className="pointer-events-none absolute -left-12 top-0 h-72 w-72 rounded-full bg-sky-400/12 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-500/12 blur-3xl" />
        </>
      ) : isStaffWorkspaceTheme ? null : (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary-soft/90 via-primary-soft/40 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-accent/12 blur-3xl" />
        </>
      )}

      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {isWorkspaceRoute && !auth.isReady ? (
            <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
              <LoadingPanel
                title="Opening your workspace"
                message="Loading your staff session, profile controls, and role-based access."
              />
            </section>
          ) : showStaffSidebar ? (
            <StaffWorkspaceShell auth={auth} dark={isStaffWorkspaceTheme}>
              <div key={`${location.pathname}${location.search}`} className="page-route-shell">
                <Outlet />
              </div>
            </StaffWorkspaceShell>
          ) : (
            <div key={`${location.pathname}${location.search}`} className="page-route-shell">
              <Outlet />
            </div>
          )}
        </main>
        {isStaffWorkspaceTheme ? null : <Footer />}
      </div>
    </div>
  );
}

function Header() {
  const auth = useAuth();
  const patientAuth = usePatientAuth();
  const location = useLocation();
  const isHomeRoute = location.pathname === "/";
  const isAuthRoute = isAuthPath(location.pathname);
  const isWorkspaceRoute = isStaffWorkspacePath(location.pathname);
  const isStaffWorkspaceTheme = isWorkspaceRoute && auth.isAuthenticated;
  const isDarkHeader = isAuthRoute || isStaffWorkspaceTheme;
  const isPatientPortalRoute = isPatientPortalPath(location.pathname);
  const isPublicGlassRoute =
    (isHomeRoute || isPatientPortalRoute) && !isAuthRoute && !isStaffWorkspaceTheme;
  const canRegisterPatient = auth.hasRole(["reception", "receptionist"]);
  const displayName =
    auth.user?.workspaceProfile?.preferredName?.trim() || auth.user?.name || "Staff";
  const activeWorkspaceItem = STAFF_WORKSPACE_ITEMS.find((item) => item.to === location.pathname);
  const ActiveWorkspaceIcon = activeWorkspaceItem?.icon ?? LayoutDashboard;
  const headerPrimaryAction = auth.isAuthenticated
    ? canRegisterPatient
      ? { to: "/admin/register", label: "New patient" }
      : { to: resolveStaffLandingPath(auth.user), label: "My workspace" }
    : patientAuth.isPatientAuthenticated
      ? { to: "/patient/dashboard", label: "My dashboard" }
      : { to: "/patient/register", label: "Get started" };
  const visibleNavItems = navItems.filter((item) => !item.roles || auth.hasRole(item.roles));

  return (
    <header
      className={`sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8 ${
        isStaffWorkspaceTheme ? "dashboard-account-header" : ""
      }`}
    >
      <div className={`mx-auto ${isStaffWorkspaceTheme ? "max-w-[118rem]" : "max-w-7xl"}`}>
        <div
          className={
            isPublicGlassRoute
              ? "relative overflow-hidden rounded-2xl bg-white/72 px-5 py-3 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:px-7"
              : isDarkHeader
                ? "relative overflow-hidden rounded-[1.85rem] border border-cyan-200/12 bg-[linear-gradient(135deg,rgba(2,12,24,0.96),rgba(5,24,44,0.94)_34%,rgba(8,40,68,0.9)_72%,rgba(12,66,94,0.84)_100%)] px-5 py-4 shadow-[0_26px_76px_rgba(2,6,23,0.42)] backdrop-blur-2xl sm:px-8"
                : "surface-panel px-4 py-3 sm:px-5"
          }
        >
          {isPublicGlassRoute && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(240,253,250,0.58)_42%,rgba(204,251,241,0.48))]" />
              <div className="pointer-events-none absolute -left-8 top-0 h-20 w-28 rounded-full bg-teal-300/12 blur-3xl" />
              <div className="pointer-events-none absolute right-0 top-0 h-20 w-36 rounded-full bg-teal-200/10 blur-3xl" />
            </>
          )}
          {isDarkHeader && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(3,18,34,0.18),rgba(37,99,235,0.1)_42%,rgba(14,165,233,0.08)_76%,rgba(255,255,255,0.01)_100%)]" />
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/70 to-transparent" />
              <div className="pointer-events-none absolute -left-10 top-0 h-24 w-36 rounded-full bg-blue-400/18 blur-3xl" />
              <div className="pointer-events-none absolute right-0 top-0 h-24 w-44 rounded-full bg-sky-400/18 blur-3xl" />
            </>
          )}

          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-4 lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-6">
              <Link to="/" aria-label="Go to WaitLess home">
                <WaitLessLogo
                  className={isDarkHeader ? "origin-left scale-[0.9] text-white" : ""}
                  subtitle={
                    isPublicGlassRoute
                      ? "Smarter Queues, Better Care"
                      : isDarkHeader
                        ? "Hospital Flow"
                        : "Hospital Queue OS"
                  }
                  subtitleClassName={
                    isPublicGlassRoute
                      ? "text-[9px] tracking-[0.18em] text-primary opacity-90 sm:text-[10px]"
                      : isDarkHeader
                        ? "text-[9px] tracking-[0.22em] text-cyan-100/70 sm:text-[10px]"
                        : ""
                  }
                />
              </Link>

              {isStaffWorkspaceTheme ? (
                <div className="hidden items-center gap-3 text-slate-100 lg:flex">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-cyan-200/12 bg-white/5 text-cyan-200">
                    <ActiveWorkspaceIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Staff workspace
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {activeWorkspaceItem?.label ?? "Dashboard"}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`hidden items-center gap-2 rounded-full p-1.5 lg:flex lg:justify-self-center ${
                    isPublicGlassRoute
                      ? "bg-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_20px_rgba(15,23,42,0.04)] backdrop-blur-md p-1"
                      : isDarkHeader
                        ? "border border-cyan-300/14 bg-[linear-gradient(135deg,rgba(4,18,34,0.78),rgba(8,29,52,0.82)_52%,rgba(10,40,66,0.72))] px-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(34,211,238,0.04),0_18px_40px_-24px_rgba(37,99,235,0.5)] backdrop-blur-md"
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
                          ? `inline-flex h-12 items-center rounded-full px-5 text-sm font-semibold shadow-[0_16px_30px_-20px_rgba(37,99,235,0.45)] ${
                              isPublicGlassRoute
                                ? "bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] text-primary-foreground backdrop-blur shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)]"
                                : isDarkHeader
                                  ? "h-10 gap-2 border border-cyan-200/18 bg-[linear-gradient(135deg,rgba(12,104,138,0.96),rgba(18,126,173,0.92)_48%,rgba(29,78,216,0.9))] px-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_12px_28px_-16px_rgba(34,211,238,0.42)] backdrop-blur"
                                  : "gradient-primary text-primary-foreground shadow-elegant"
                            }`
                          : `inline-flex h-12 items-center rounded-full px-4 text-sm font-medium transition-all ${
                              isPublicGlassRoute
                                ? "bg-transparent text-slate-700 hover:bg-white/50 hover:text-slate-950"
                                : isDarkHeader
                                  ? "h-10 gap-2 px-4 text-slate-100/82 hover:bg-cyan-300/8 hover:text-white"
                                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                            }`
                      }
                    >
                      {isDarkHeader && item.icon ? <item.icon className="h-4 w-4" /> : null}
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 lg:justify-self-end">
                {isStaffWorkspaceTheme ? (
                  <Link
                    to="/admin/notifications"
                    title="Notifications"
                    className="relative grid h-10 w-10 shrink-0 place-items-center text-slate-300 transition-colors hover:text-white"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#08243d] bg-red-500" />
                  </Link>
                ) : null}
                {isStaffWorkspaceTheme ? (
                  <StaffAccountMenu auth={auth} displayName={displayName} />
                ) : auth.isAuthenticated ? (
                  <Link
                    to={resolveStaffLandingPath(auth.user)}
                    className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                      isPublicGlassRoute
                        ? "border border-teal-200/50 bg-white/40 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_18px_rgba(15,118,110,0.08)] backdrop-blur-md hover:bg-white/55 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_10px_28px_rgba(15,118,110,0.12)]"
                        : isDarkHeader
                          ? "border border-cyan-200/15 bg-white/8 text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur hover:border-cyan-200/25 hover:bg-white/12 hover:text-white"
                          : "border border-primary/20 bg-primary-soft/70 text-primary hover:border-primary/30 hover:bg-primary-soft hover:shadow-sm"
                    }`}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Back to workspace
                  </Link>
                ) : null}
                {!isStaffWorkspaceTheme && !isAuthRoute && !auth.isAuthenticated ? (
                  patientAuth.isPatientAuthenticated ? (
                    <PatientAccountMenu
                      patientAuth={patientAuth}
                      isPublicGlassRoute={isPublicGlassRoute}
                    />
                  ) : (
                    <Link
                      to="/patient/login"
                      className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                        isPublicGlassRoute
                          ? "border border-teal-200/50 bg-white/40 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_18px_rgba(15,118,110,0.08)] backdrop-blur-md hover:bg-white/55"
                          : "border border-primary/20 bg-primary-soft/70 text-primary hover:border-primary/30 hover:bg-primary-soft"
                      }`}
                    >
                      <UserRound className="h-3.5 w-3.5" />
                      Sign in
                    </Link>
                  )
                ) : null}
                {!isStaffWorkspaceTheme && !isAuthRoute ? (
                  <Link
                    to={headerPrimaryAction.to}
                    className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5 ${
                      isPublicGlassRoute
                        ? "rounded-full bg-[linear-gradient(135deg,rgba(15,118,110,0.94),rgba(13,148,136,0.90))] shadow-[0_10px_28px_-12px_rgba(13,148,136,0.5)] backdrop-blur"
                        : isDarkHeader
                          ? "rounded-[1.05rem] bg-[linear-gradient(135deg,rgba(34,197,94,0.96),rgba(20,184,166,0.94))] px-6 shadow-[0_16px_34px_-18px_rgba(16,185,129,0.48)] backdrop-blur"
                          : "gradient-primary"
                    }`}
                  >
                    {headerPrimaryAction.label}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </div>

            {!isStaffWorkspaceTheme ? (
              <>
                <div
                  className={`mt-4 hidden items-center justify-between gap-4 pt-4 md:flex lg:hidden ${
                    isPublicGlassRoute
                      ? "border-t border-slate-200/60"
                      : isDarkHeader
                        ? "border-t border-white/10"
                        : "border-t border-border/70"
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
                            : isDarkHeader
                              ? "rounded-full border border-cyan-200/10 bg-[rgba(4,18,34,0.42)] px-3 py-1.5 text-sm font-medium text-slate-100/82 transition-colors hover:border-cyan-200/16 hover:bg-cyan-300/8 hover:text-white"
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
                    isPublicGlassRoute
                      ? "border-t border-slate-200/60"
                      : isDarkHeader
                        ? "border-t border-white/10"
                        : "border-t border-border/70"
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
                          : isDarkHeader
                            ? "whitespace-nowrap rounded-full border border-cyan-200/12 bg-[rgba(4,18,34,0.42)] px-3 py-1.5 text-xs font-medium text-slate-100/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                            : "whitespace-nowrap rounded-full border border-transparent bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function PatientAccountMenu({ patientAuth, isPublicGlassRoute }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const patient = patientAuth.patientUser;
  const initials = patient?.fullName
    ? patient.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "P";

  function handleLogout() {
    patientAuth.patientLogout();
    setIsOpen(false);
    navigate("/");
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`inline-flex h-11 items-center gap-2 rounded-full px-3 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
          isPublicGlassRoute
            ? "border border-white/40 bg-white/30 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-md hover:bg-white/45"
            : "border border-primary/20 bg-primary-soft/70 text-primary hover:border-primary/30 hover:bg-primary-soft"
        }`}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
          {initials}
        </span>
        <span className="hidden sm:inline">{patient?.fullName?.split(" ")[0] || "Patient"}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
          <div className="border-b border-border px-4 py-3">
            <div className="text-sm font-semibold text-foreground">{patient?.fullName}</div>
            <div className="text-xs text-muted-foreground">{patient?.email}</div>
          </div>
          <div className="p-1.5">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/patient/dashboard");
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              My dashboard
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/self-register");
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Ticket className="h-4 w-4 text-muted-foreground" />
              Book a queue spot
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/track");
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              Track a ticket
            </button>
            <div className="my-1.5 h-px bg-border" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StaffAvatar({ user, displayName, className = "", fallbackClassName = "" }) {
  const avatarUrl = resolveProfileImageUrl(user?.avatarUrl);

  return (
    <span className={`shrink-0 overflow-hidden ${className}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className={`grid h-full w-full place-items-center ${fallbackClassName}`}>
          {getStaffInitials(displayName)}
        </span>
      )}
    </span>
  );
}

function StaffSignOutDialog({ auth, open, onOpenChange }) {
  const navigate = useNavigate();
  const email = auth.user?.email || auth.user?.username || "your staff account";

  function handleSignOut() {
    auth.logout();
    onOpenChange(false);
    navigate("/admin/login");
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="z-[100] w-[calc(100%-2rem)] max-w-md gap-0 rounded-2xl border border-cyan-200/20 bg-[#081225] p-5 text-white shadow-[0_32px_90px_-30px_rgba(0,0,0,0.95)] sm:rounded-2xl sm:p-6">
        <AlertDialogCancel
          aria-label="Close sign out warning"
          className="absolute right-4 top-4 mt-0 grid h-9 w-9 place-items-center rounded-lg border-0 bg-transparent p-0 text-slate-400 hover:bg-white/8 hover:text-white"
        >
          <X className="h-4 w-4" />
        </AlertDialogCancel>

        <AlertDialogHeader className="pr-10 text-left">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-lime-300/20 bg-lime-300/10 text-lime-300">
              <LogOut className="h-5 w-5" />
            </span>
            <div>
              <AlertDialogTitle className="font-display text-2xl font-bold text-lime-300">
                Sign out?
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm leading-6 text-slate-300">
                You will be logged out of the WaitLess staff portal. Any unsaved changes will be
                lost.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-lime-300/15 bg-lime-300/8 px-4 py-3 text-sm text-slate-300">
          <span className="font-bold text-lime-300">@</span>
          <span className="min-w-0 truncate">
            Logged in as <strong className="font-semibold text-lime-300">{email}</strong>
          </span>
        </div>

        <AlertDialogFooter className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:space-x-0">
          <AlertDialogCancel className="mt-0 h-12 rounded-xl border border-slate-600 bg-transparent text-slate-200 hover:bg-white/8 hover:text-white">
            Stay logged in
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSignOut}
            className="h-12 rounded-xl bg-lime-300 font-bold text-[#0a160b] hover:bg-lime-200"
          >
            Sign out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AccountMenu({ auth, displayName, isAuthRoute, isHomeRoute }) {
  const location = useLocation();
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const roleLabel = formatStaffRoleLabel(auth.user?.role);
  const email = auth.user?.email || `${auth.user?.username}@waitless.local`;
  const department = auth.user?.department || "Hospital operations";
  const defaultWorkspacePath = resolveStaffLandingPath(auth.user);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const triggerClassName =
    isHomeRoute && !isAuthRoute
      ? "bg-white/56 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur hover:bg-white/72"
      : isAuthRoute
        ? "border border-white/10 bg-white/8 text-slate-100/88 hover:bg-white/12"
        : "border border-border/70 bg-background/75 text-foreground hover:bg-muted";
  const dropdownSurfaceClassName = isAuthRoute
    ? "border border-cyan-200/12 bg-[linear-gradient(180deg,rgba(8,22,38,0.98),rgba(5,17,30,0.98))] text-white shadow-[0_28px_80px_-28px_rgba(2,6,23,0.8),0_0_0_1px_rgba(34,211,238,0.04)]"
    : "border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,252,0.98))] text-slate-900 shadow-[0_28px_80px_-28px_rgba(15,23,42,0.32)]";
  const subtleTextClassName = isAuthRoute ? "text-cyan-100/62" : "text-slate-500";
  const dividerClassName = isAuthRoute ? "border-white/10" : "border-slate-200/80";
  const menuItemClassName = isAuthRoute
    ? "text-slate-100 hover:bg-white/8"
    : "text-slate-700 hover:bg-slate-100/90";
  const iconTintClassName = isAuthRoute ? "text-cyan-100/78" : "text-slate-500";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`inline-flex h-11 items-center gap-3 rounded-full px-2.5 pr-3 transition-colors ${triggerClassName}`}
      >
        <StaffAvatar
          user={auth.user}
          displayName={displayName}
          className="h-8 w-8 rounded-full bg-[linear-gradient(135deg,rgba(101,163,13,0.96),rgba(132,204,22,0.9))] shadow-[0_10px_22px_-12px_rgba(132,204,22,0.5)]"
          fallbackClassName="text-[11px] font-bold uppercase tracking-[0.14em] text-[#08110a]"
        />
        <span className="hidden min-w-0 text-left sm:flex sm:flex-col sm:justify-center">
          <span className="truncate text-sm font-semibold leading-none">{displayName}</span>
          <span
            className={`mt-1 truncate text-[10px] uppercase tracking-[0.2em] ${subtleTextClassName}`}
          >
            {roleLabel}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""} ${subtleTextClassName}`}
        />
      </button>

      {isOpen ? (
        <div
          className={`absolute right-0 top-[calc(100%+0.85rem)] z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-[1.7rem] p-3 backdrop-blur-2xl ${dropdownSurfaceClassName}`}
        >
          <div className="rounded-[1.25rem] px-3 py-3">
            <div className="flex items-start gap-3">
              <StaffAvatar
                user={auth.user}
                displayName={displayName}
                className="h-11 w-11 rounded-full bg-[linear-gradient(135deg,rgba(101,163,13,0.96),rgba(132,204,22,0.9))] shadow-[0_16px_30px_-18px_rgba(132,204,22,0.52)]"
                fallbackClassName="text-sm font-bold uppercase tracking-[0.14em] text-[#08110a]"
              />
              <div className="min-w-0">
                <div className="truncate text-xl font-semibold leading-tight">{displayName}</div>
                <div className={`mt-1 truncate text-sm ${subtleTextClassName}`}>{email}</div>
                <div className="mt-3 inline-flex items-center rounded-full bg-lime-400/14 px-3 py-1 text-xs font-semibold text-lime-300">
                  {roleLabel}
                </div>
              </div>
            </div>
          </div>

          <div className={`my-2 border-t ${dividerClassName}`} />

          <div className="space-y-1 px-1 pb-1">
            {defaultWorkspacePath !== "/admin/register" ? (
              <Link
                to={defaultWorkspacePath}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-base font-medium transition-colors ${menuItemClassName}`}
              >
                <LayoutDashboard className={`h-4.5 w-4.5 ${iconTintClassName}`} />
                Open workspace
              </Link>
            ) : null}
            <Link
              to="/admin/profile"
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-base font-medium transition-colors ${menuItemClassName}`}
            >
              <UserRound className={`h-4.5 w-4.5 ${iconTintClassName}`} />
              My Profile
            </Link>
            <Link
              to="/admin/profile#workspace-settings"
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-base font-medium transition-colors ${menuItemClassName}`}
            >
              <Settings2 className={`h-4.5 w-4.5 ${iconTintClassName}`} />
              Settings
            </Link>
          </div>

          <div className={`my-2 border-t ${dividerClassName}`} />

          <div className="px-1 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsSignOutOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-base font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-4.5 w-4.5" />
              Sign Out
            </button>
          </div>

          <div
            className={`mt-3 rounded-[1.2rem] px-3 py-3 text-xs ${
              isAuthRoute ? "bg-white/5 text-cyan-100/62" : "bg-slate-100/90 text-slate-500"
            }`}
          >
            <div className="font-semibold uppercase tracking-[0.18em]">{department}</div>
            <div className="mt-1 text-[11px]">Signed in to your live hospital workspace.</div>
          </div>
        </div>
      ) : null}
      <StaffSignOutDialog auth={auth} open={isSignOutOpen} onOpenChange={setIsSignOutOpen} />
    </div>
  );
}

function StaffAccountMenu({ auth, displayName }) {
  const location = useLocation();
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const roleLabel = formatStaffRoleLabel(auth.user?.role);
  const accountName = auth.user?.role === "admin" ? "Admin" : displayName;
  const accountContext = auth.user?.department?.trim() || roleLabel;

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="inline-flex h-11 items-center gap-3 px-1 text-slate-100 transition-colors hover:text-white"
      >
        <StaffAvatar
          user={auth.user}
          displayName={accountName}
          className="h-9 w-9 rounded-full bg-lime-400 shadow-[0_10px_24px_-14px_rgba(163,230,53,0.72)]"
          fallbackClassName="text-xs font-bold text-[#0b1a0c]"
        />
        <span className="hidden min-w-0 text-left sm:flex sm:flex-col sm:justify-center">
          <span className="truncate text-sm font-semibold leading-none text-white">
            {accountName}
          </span>
          <span className="mt-1 truncate text-xs leading-none text-slate-400">
            {accountContext}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-cyan-200/12 bg-[linear-gradient(180deg,rgba(8,22,38,0.98),rgba(5,17,30,0.98))] p-2 text-white shadow-[0_28px_80px_-28px_rgba(2,6,23,0.8),0_0_0_1px_rgba(34,211,238,0.04)] backdrop-blur-2xl">
          <div className="space-y-1 px-1 py-1">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-white/8"
            >
              <House className="h-4 w-4 text-cyan-100/78" />
              Main page
            </Link>
            <Link
              to="/admin/profile"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-white/8"
            >
              <UserRound className="h-4 w-4 text-cyan-100/78" />
              My Profile
            </Link>
            <Link
              to="/admin/profile#workspace-settings"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-white/8"
            >
              <Settings2 className="h-4 w-4 text-cyan-100/78" />
              Settings
            </Link>
          </div>

          <div className="my-1.5 border-t border-white/10" />

          <div className="px-1 py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsSignOutOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
      <StaffSignOutDialog auth={auth} open={isSignOutOpen} onOpenChange={setIsSignOutOpen} />
    </div>
  );
}

function StaffWorkspaceShell({ auth, children, dark = false }) {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const user = auth.user;
  const displayName = user?.workspaceProfile?.preferredName?.trim() || user?.name || "Staff";
  const statusMessage =
    user?.workspaceProfile?.statusMessage?.trim() ||
    "Signed in and ready to manage live patient flow.";
  const roleLabel = formatStaffRoleLabel(user?.role);
  const department = user?.department || "Hospital operations";
  const canRegisterPatient = auth.hasRole(["reception", "receptionist"]);
  const preferredLandingPath = resolveStaffLandingPath(user);
  const workspaceLinks = STAFF_WORKSPACE_ITEMS.filter(
    (item) => !item.roles || auth.hasRole(item.roles),
  );
  const preferredLandingLabel =
    workspaceLinks.find((item) => item.to === preferredLandingPath)?.label ?? "Dashboard";
  const availabilityLabel = user?.workspaceProfile?.availability
    ?.replaceAll("-", " ")
    ?.replace(/\b\w/g, (character) => character.toUpperCase());
  const sidebarGroups = ["Main", "Clinical", "Insights", "Admin", "Account"]
    .map((group) => ({
      label: group,
      items: workspaceLinks.filter((item) => item.group === group),
    }))
    .filter((group) => group.items.length);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.hash, location.pathname]);

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsMobileSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    if (!dark || !location.hash) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      const sectionId = decodeURIComponent(location.hash.slice(1));
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [dark, location.hash, location.pathname]);

  if (dark) {
    return (
      <div className="staff-account-shell mx-auto w-full max-w-[118rem] px-4 sm:px-6 lg:px-8">
        <div
          className={`staff-account-grid grid gap-5 ${
            isSidebarCollapsed ? "staff-account-grid--collapsed" : ""
          }`}
        >
          <aside className="hidden xl:block">
            <div
              className={`staff-account-sidebar surface-panel sticky top-28 mt-5 flex max-h-[calc(100vh-8rem)] flex-col overflow-y-auto p-3 ${
                isSidebarCollapsed ? "staff-account-sidebar--collapsed" : ""
              }`}
            >
              <div
                className={`flex items-center border-b border-border/70 pb-3 ${
                  isSidebarCollapsed ? "justify-center" : "justify-between px-2"
                }`}
              >
                {!isSidebarCollapsed ? (
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground">
                    Navigation
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed((current) => !current)}
                  aria-label={isSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
                  title={isSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
                  className={`grid shrink-0 place-items-center rounded-xl border border-border/70 bg-background/70 text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground ${
                    isSidebarCollapsed ? "h-9 w-9" : "h-10 w-10"
                  }`}
                >
                  {isSidebarCollapsed ? (
                    <PanelLeftOpen className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}
                </button>
              </div>

              <DashboardSidebarNavigation groups={sidebarGroups} collapsed={isSidebarCollapsed} />

              <div className="mt-auto border-t border-border/70 px-1 pt-4">
                <button
                  type="button"
                  onClick={() => setIsSignOutOpen(true)}
                  title={isSidebarCollapsed ? "Sign out" : undefined}
                  className={`flex w-full items-center rounded-xl py-3 text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-500/10 ${
                    isSidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"
                  }`}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!isSidebarCollapsed ? <span>Sign out</span> : null}
                </button>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            {isMobileSidebarOpen ? (
              <div className="staff-account-drawer fixed inset-0 z-[70] xl:hidden">
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="absolute inset-0 bg-[#020713]/80 backdrop-blur-sm"
                />
                <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col border-r border-border bg-[#081225] p-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-border/70 px-1 pb-4">
                    <span className="text-xs font-bold uppercase tracking-[0.22em] text-foreground">
                      Navigation
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsMobileSidebarOpen(false)}
                      aria-label="Close navigation"
                      className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background/75 text-muted-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <DashboardSidebarNavigation
                      groups={sidebarGroups}
                      onNavigate={() => setIsMobileSidebarOpen(false)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileSidebarOpen(false);
                      setIsSignOutOpen(true);
                    }}
                    className="mt-3 flex w-full items-center gap-3 border-t border-border/70 px-3 pt-4 text-sm font-semibold text-rose-400"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </aside>
              </div>
            ) : null}
            {children}
          </div>
        </div>
        <StaffSignOutDialog auth={auth} open={isSignOutOpen} onOpenChange={setIsSignOutOpen} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[104rem] px-4 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[18.5rem_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-28 space-y-4 pt-8">
            <div className="surface-panel overflow-hidden p-5">
              <div className="eyebrow">Staff workspace</div>
              <div className="mt-4 flex items-start gap-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[1.2rem] bg-[linear-gradient(135deg,rgba(101,163,13,0.96),rgba(132,204,22,0.88))] text-sm font-bold uppercase tracking-[0.16em] text-[#08110a] shadow-[0_22px_40px_-22px_rgba(132,204,22,0.55)]">
                  {getStaffInitials(displayName)}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-display text-xl font-bold tracking-tight text-foreground">
                    {displayName}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {roleLabel}
                  </div>
                  <div className="mt-2 inline-flex items-center rounded-full border border-primary/15 bg-primary-soft/70 px-3 py-1 text-[11px] font-semibold text-primary">
                    {department}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">{statusMessage}</p>

              <div className="mt-5 grid gap-2">
                {canRegisterPatient ? (
                  <Link
                    to="/admin/register"
                    className="inline-flex items-center justify-between rounded-2xl gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elegant"
                  >
                    Register patient
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    to={preferredLandingPath}
                    className="inline-flex items-center justify-between rounded-2xl gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elegant"
                  >
                    Open workspace
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                )}

                <Link
                  to="/admin/profile"
                  className="inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <UserRound className="h-4 w-4 text-primary" />
                  My profile
                </Link>

                <button
                  type="button"
                  onClick={() => setIsSignOutOpen(true)}
                  className="inline-flex items-center gap-3 rounded-2xl border border-rose-400/18 bg-rose-500/6 px-4 py-3 text-sm font-semibold text-rose-500 transition-colors hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>

            <div className="surface-panel p-3">
              <div className="px-2 pb-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  Workspace navigation
                </div>
              </div>
              <nav className="space-y-1">
                {workspaceLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      isActive
                        ? "flex items-center gap-3 rounded-2xl bg-[linear-gradient(135deg,rgba(15,118,110,0.14),rgba(37,99,235,0.14))] px-3 py-3 text-sm font-semibold text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="surface-panel p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                Session snapshot
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Preferred launch</span>
                  <span className="text-right font-semibold text-foreground">
                    {preferredLandingLabel}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Availability</span>
                  <span className="text-right font-semibold text-foreground">
                    {availabilityLabel || "On Shift"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Extension</span>
                  <span className="text-right font-semibold text-foreground">
                    {user?.workspaceProfile?.contactExtension || "Not set"}
                  </span>
                </div>
              </div>

              <Link
                to="/admin/profile#workspace-settings"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-accent"
              >
                <Settings2 className="h-4 w-4" />
                Update workspace settings
              </Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="xl:hidden">
            <div className="mx-auto max-w-7xl px-4 pb-2 pt-6 sm:px-6 lg:px-8">
              <div className="surface-panel flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                    Staff workspace
                  </div>
                  <div className="mt-1 truncate font-display text-lg font-bold tracking-tight text-foreground">
                    {displayName}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{department}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canRegisterPatient ? (
                    <Link
                      to="/admin/register"
                      className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant"
                    >
                      Register patient
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                  <Link
                    to="/admin/profile"
                    className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    <UserRound className="h-4 w-4 text-primary" />
                    Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {children}
        </div>
      </div>
      <StaffSignOutDialog auth={auth} open={isSignOutOpen} onOpenChange={setIsSignOutOpen} />
    </div>
  );
}

function DashboardSidebarNavigation({ groups, collapsed = false, onNavigate }) {
  const location = useLocation();

  return (
    <nav className="staff-account-navigation flex-1 py-3" aria-label="Staff workspace modules">
      {groups.map((group, groupIndex) => (
        <section
          key={group.label}
          className={`staff-account-nav-group ${groupIndex ? "mt-3 border-t border-border/60 pt-3" : ""}`}
        >
          {collapsed ? (
            <div className="mx-auto mb-2 h-px w-7 bg-border/80" aria-hidden="true" />
          ) : (
            <div className="px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              {group.label}
            </div>
          )}

          <div className={`${collapsed ? "mt-1" : "mt-2"} space-y-1`}>
            {group.items.map((item) => {
              const [itemPath, itemHashValue] = item.to.split("#");
              const itemHash = itemHashValue ? `#${itemHashValue}` : "";
              const isActive = itemHash
                ? location.pathname === itemPath && location.hash === itemHash
                : location.pathname === itemPath &&
                  !(itemPath === "/admin/dashboard" && location.hash);
              const ItemIcon = item.icon;

              function handleNavigation() {
                if (isActive && itemHashValue) {
                  document.getElementById(itemHashValue)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }
                onNavigate?.();
              }

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={handleNavigation}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={`staff-account-nav-link flex min-h-11 items-center rounded-xl py-2 text-sm transition-colors ${
                    isActive
                      ? "staff-account-nav-link--active font-semibold"
                      : "font-medium text-muted-foreground"
                  } ${collapsed ? "justify-center px-2" : "gap-3 px-3"}`}
                >
                  <span className="staff-account-nav-icon grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-background/70">
                    <ItemIcon className="h-4 w-4" />
                  </span>
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

function Footer() {
  const rolloutItems = [
    {
      icon: MapPin,
      label: "Pilot hospital",
      value: "Chinhoyi Provincial Hospital, Chinhoyi, Zimbabwe",
    },
    {
      icon: Globe,
      label: "Coverage goal",
      value: "Designed for provincial, district and central hospitals nationwide",
    },
  ];

  const supportItems = [
    {
      icon: Phone,
      label: "National support desk",
      value: "+263 78 700 1200",
      href: "tel:+263787001200",
    },
    {
      icon: Phone,
      label: "Reception line",
      value: "+263 67 212 2201",
      href: "tel:+263672122201",
    },
    {
      icon: Mail,
      label: "Implementation email",
      value: "support@waitless.co.zw",
      href: "mailto:support@waitless.co.zw",
    },
  ];

  const socialItems = [
    {
      icon: Facebook,
      label: "Facebook",
      value: "/WaitLessZW",
      href: "https://facebook.com/WaitLessZW",
    },
    {
      icon: Instagram,
      label: "Instagram",
      value: "@waitless.zw",
      href: "https://instagram.com/waitless.zw",
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      value: "WaitLess Zimbabwe",
      href: "https://linkedin.com/company/waitless-zimbabwe",
    },
    {
      icon: Youtube,
      label: "YouTube",
      value: "waitlessZW",
      href: "https://youtube.com/@waitlesshospitalflow",
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-slate-800/80 bg-[#071523] px-4 pb-8 pt-10 text-slate-200 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(20,184,166,0.18),transparent_28%),radial-gradient(circle_at_82%_0%,rgba(37,99,235,0.18),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(148,163,184,0.32)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.24)_1px,transparent_1px)] [background-size:88px_88px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="px-1 py-2 sm:px-2">
          <div className="grid gap-10 xl:grid-cols-[1.2fr_0.9fr_0.9fr_0.95fr]">
            <div>
              <WaitLessLogo
                className="text-white"
                subtitle="Smarter Queues, Better Care"
                subtitleClassName="text-cyan-100/72"
              />
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                A triage-aware hospital queue system built for Chinhoyi Provincial Hospital and the
                wider Zimbabwean public health network.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-cyan-100/82">
                {["Triage-aware routing", "WhatsApp alerts", "Offline-first LAN mode"].map(
                  (item) => (
                    <span key={item} className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-200/78" />
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-100/68">
                Rollout base
              </div>
              <div className="mt-4 space-y-4">
                {rolloutItems.map((item) => (
                  <FooterMetaRow key={item.label} {...item} />
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-100/68">
                Contacts
              </div>
              <div className="mt-4 space-y-4">
                {supportItems.map((item) => (
                  <FooterMetaRow key={item.label} {...item} />
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-100/68">
                Follow WaitLess
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                {socialItems.map((item) => (
                  <FooterSocialLink key={item.label} {...item} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 border-t border-white/10 pt-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-2 text-sm">
              <div className="font-medium text-slate-100">
                Registration, tracking, queue boards, and staff command in one flow.
              </div>
              <div className="text-xs uppercase tracking-[0.28em] text-cyan-100/68">
                Built with love for Zimbabwean hospitals
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs text-slate-400 sm:items-end">
              <div>WaitLess Hospital Queue OS</div>
              <div className="uppercase tracking-[0.24em] text-slate-500">
                Public health workflow platform
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterMetaRow({ icon: Icon, label, value, href }) {
  const content = (
    <div className="flex items-start gap-3 py-1 transition-colors">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/6 text-cyan-100/92">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400/92">
          {label}
        </div>
        <div className="mt-1 text-sm leading-6 text-slate-200">{value}</div>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <a
      href={href}
      className="block rounded-xl transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/24"
    >
      {content}
    </a>
  );
}

function FooterSocialLink({ icon: Icon, label, value, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 py-1 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/24"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/6 text-cyan-100 transition-colors group-hover:bg-cyan-200/10">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400/92">
          {label}
        </div>
        <div className="mt-1 truncate text-sm text-slate-200">{value}</div>
      </div>
    </a>
  );
}
