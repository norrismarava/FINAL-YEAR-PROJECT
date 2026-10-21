import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Bell,
  BellRing,
  Brain,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  Database,
  FileChartColumn,
  FlaskConical,
  HeartPulse,
  House,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftOpen,
  Pill,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  ShieldPlus,
  ScrollText,
  Stethoscope,
  Ticket,
  UserRound,
  UserSearch,
  Users,
  UsersRound,
  X,
  Youtube,
} from "lucide-react";

import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import { PatientAuthProvider, usePatientAuth } from "@/auth/PatientAuthProvider";
import ChatbotWidget from "@/components/ChatbotWidget";
import OfflineIndicator from "@/components/OfflineIndicator";
import { LoadingPanel } from "@/components/ui/system-loader";
import { LogoLoader } from "@/components/LogoLoader";
import SiteFooter from "@/components/SiteFooter";
import QuickNavSearch from "@/components/QuickNavSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useQueueRealtime } from "@/sockets/QueueRealtimeProvider";
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
import { useIdleTimer } from "@/hooks/useIdleTimer";
import { useApiResource } from "@/hooks/useApiResource";
import { fetchDashboardSummary } from "@/services/queueApi";
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
  { to: "/self-register", label: "Check In", icon: ShieldPlus },
  { to: "/admin/register", label: "Register", roles: ["reception", "receptionist"], icon: ShieldPlus },
  { to: "/track", label: "Track Ticket", icon: Ticket },
  { to: "/admin/triage", label: "Triage", roles: ["triage"], icon: Stethoscope },
  { to: "/queue", label: "Queue Board", icon: Search },
  {
    to: "/admin/settings",
    label: "Settings",
    icon: Settings2,
    roles: ["admin", "triage", "clinician", "reception", "receptionist"],
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
    roles: ["reception", "receptionist"],
  },

  { group: "Main", to: "/admin/queue", label: "Queue Board", icon: Search },
  {
    group: "Clinical",
    to: "/admin/triage",
    label: "Triage",
    icon: Stethoscope,
    roles: ["triage"],
  },
  { group: "Clinical", to: "/admin/patients", label: "Patients", icon: UserSearch },
  { group: "Clinical", to: "/admin/departments", label: "Departments", icon: Building2 },
  { group: "Clinical", to: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  { group: "Clinical", to: "/admin/follow-ups", label: "Follow-ups", icon: CalendarDays },
  { group: "Clinical", to: "/admin/reminders", label: "Reminders", icon: Send },
  { group: "Clinical", to: "/admin/pharmacy", label: "Pharmacy", icon: Pill, roles: ["clinician", "triage", "pharmacist"] },
  { group: "Clinical", to: "/admin/laboratory", label: "Laboratory", icon: FlaskConical, roles: ["clinician", "triage", "lab-tech", "radiologist"] },
  { group: "Clinical", to: "/admin/oi-clinic", label: "OI Clinic", icon: HeartPulse, roles: ["clinician", "triage"] },
  { group: "Insights", to: "/admin/reports", label: "Reports", icon: FileChartColumn },
  {
    group: "Insights",
    to: "/admin/analytics",
    label: "Queue Analytics",
    icon: ChartNoAxesCombined,
  },
  { group: "Insights", to: "/admin/ai-insights", label: "AI Insights", icon: Brain },
  { group: "Insights", to: "/admin/notifications", label: "Notifications", icon: BellRing },
  {
    group: "Admin",
    to: "/admin/admin-dashboard",
    label: "Admin Dashboard",
    icon: ShieldCheck,
    roles: ["admin"],
  },
  {
    group: "Admin",
    to: "/admin/hospitals",
    label: "Hospitals",
    icon: Building2,
    roles: ["admin"],
  },
  {
    group: "Admin",
    to: "/admin/sync",
    label: "Sync & Backup",
    icon: Database,
    roles: ["admin"],
  },
  {
    group: "Admin",
    to: "/admin/staff",
    label: "Staff",
    icon: UsersRound,
    roles: ["admin"],
  },
  {
    group: "Admin",
    to: "/admin/users",
    label: "Users",
    icon: Users,
    roles: ["admin"],
  },
  {
    group: "Admin",
    to: "/admin/access-codes",
    label: "Access Codes",
    icon: KeyRound,
    roles: ["admin"],
  },
  {
    group: "Admin",
    to: "/admin/audit",
    label: "Audit Trail",
    icon: ScrollText,
    roles: ["admin"],
  },
  { group: "Admin", to: "/admin/settings", label: "Settings", icon: Settings2 },
  { group: "Account", to: "/admin/profile", label: "My Profile", icon: UserRound },
];

const AUTH_ROUTE_PREFIXES = [
  "/login",
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
  "/admin/staff-signup",
  "/patient/register",
  "/patient/forgot-password",
  "/patient/reset-password",
  "/self-register",
];

const STAFF_WORKSPACE_ROUTE_PREFIXES = ["/admin"];

const PUBLIC_DARK_HEADER_ROUTES = new Set([
  "/",
  "/self-register",
  "/kiosk",
  "/track",
  "/queue",
  "/department-board",
]);

function isAuthPath(pathname) {
  return AUTH_ROUTE_PREFIXES.some((path) => pathname.startsWith(path));
}

function isPatientPortalPath(pathname) {
  if (isAuthPath(pathname)) return false;
  return (
    pathname.startsWith("/track") ||
    pathname.startsWith("/queue") ||
    pathname.startsWith("/department-board") ||
    pathname.startsWith("/self-register") ||
    pathname.startsWith("/kiosk") ||
    pathname.startsWith("/patient/register") ||
    pathname.startsWith("/patient/dashboard")
  );
}

function isPatientShellPath(pathname) {
  return (
    (pathname === "/patient" || pathname.startsWith("/patient/")) &&
    !isAuthPath(pathname)
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

function IdleLogoutManager() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isStaffRoute = location.pathname.startsWith("/admin");
  const idle = useIdleTimer({ enabled: auth.isAuthenticated && isStaffRoute });

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    // Remember where the user was so a forced sign-out can bring them back.
    function saveReturnTo() {
      const path = location.pathname + location.search;
      if (path.startsWith("/admin") || path.startsWith("/patient")) {
        window.sessionStorage.setItem("waitless:returnTo", path);
      }
    }

    function handleIdleTimeout() {
      saveReturnTo();
      auth.logout();
      navigate("/login", { replace: true });
    }

    window.addEventListener("waitless:idle-timeout", handleIdleTimeout);
    window.addEventListener("waitless:auth-expired", saveReturnTo);
    return () => {
      window.removeEventListener("waitless:idle-timeout", handleIdleTimeout);
      window.removeEventListener("waitless:auth-expired", saveReturnTo);
    };
  }, [auth, navigate, location]);

  if (!auth.isAuthenticated || !isStaffRoute) return null;

  return (
    <AlertDialog open={idle.isWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session expiring due to inactivity</AlertDialogTitle>
          <AlertDialogDescription>
            You will be automatically logged out in{" "}
            <span className="font-bold text-destructive">{idle.remainingSeconds}s</span>.{" "}
            Click "Stay signed in" to continue your session.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={idle.dismissWarning}>
            Stay signed in
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              auth.logout();
              navigate("/login", { replace: true });
            }}
          >
            Log out now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AppScaffold() {
  const auth = useAuth();
  const patientAuth = usePatientAuth();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const isAuthRoute = isAuthPath(location.pathname);
  const isPatientPortalRoute = isPatientPortalPath(location.pathname);
  const isPatientShellRoute = isPatientShellPath(location.pathname);
  const isWorkspaceRoute = isStaffWorkspacePath(location.pathname);
  const isDashboardRoute = location.pathname.startsWith("/admin/dashboard");
  const isStaffWorkspaceTheme = isWorkspaceRoute && auth.isAuthenticated;
  const showStaffSidebar = isStaffWorkspaceTheme;
  const isHomeRoute = location.pathname === "/";

  if (!auth.isReady && isWorkspaceRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#04141f]">
        <div className="flex flex-col items-center gap-5">
          <LogoLoader size={88} decorative />
          <span className="text-[0.8rem] font-semibold uppercase tracking-[0.24em] text-white/40">
            Loading workspace
          </span>
        </div>
      </div>
    );
  }

  if (isWorkspaceRoute && auth.isReady && !auth.isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (isPatientShellRoute) {
    return (
      <div className="relative min-h-screen bg-[#04141f]">
        <div key={`${location.pathname}${location.search}`} className="page-route-shell">
          <Outlet />
        </div>
      </div>
    );
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
          <SiteFooter />
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
        {isAuthRoute ? null : (
          <Header onOpenMobileNav={() => setIsMobileNavOpen(true)} />
        )}
        <main className="flex-1">
          {isWorkspaceRoute && !auth.isReady ? (
            <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
              <LoadingPanel
                title="Opening your workspace"
                message="Loading your staff session, profile controls, and role-based access."
              />
            </section>
          ) : showStaffSidebar ? (
            <StaffWorkspaceShell
              auth={auth}
              dark={isStaffWorkspaceTheme}
              mobileOpen={isMobileNavOpen}
              onMobileOpenChange={setIsMobileNavOpen}
            >
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
        {isStaffWorkspaceTheme || isAuthRoute ? null : <SiteFooter />}
        <IdleLogoutManager />
        {location.pathname === "/" ? <ChatbotWidget /> : null}
        <OfflineIndicator />
      </div>
    </div>
  );
}

function Header({ onOpenMobileNav }) {
  const auth = useAuth();
  const patientAuth = usePatientAuth();
  const location = useLocation();
  const isPublicDarkRoute = PUBLIC_DARK_HEADER_ROUTES.has(location.pathname);
  const isAuthRoute = isAuthPath(location.pathname);
  const isWorkspaceRoute = isStaffWorkspacePath(location.pathname);
  const isStaffWorkspaceTheme = isWorkspaceRoute && auth.isAuthenticated;
  const isDarkHeader = isAuthRoute || isStaffWorkspaceTheme || isPublicDarkRoute;
  const isFullBleedHeader = isPublicDarkRoute || isAuthRoute || isStaffWorkspaceTheme;
  const isPatientPortalRoute = isPatientPortalPath(location.pathname);
  const isPublicGlassRoute =
    isPatientPortalRoute && !isAuthRoute && !isStaffWorkspaceTheme && !isPublicDarkRoute;
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
      className={`sticky top-0 z-40 ${
        isFullBleedHeader ? "" : "px-4 pt-4 sm:px-6 lg:px-8"
      } ${isStaffWorkspaceTheme ? "dashboard-account-header" : ""}`}
    >
      <div className={`mx-auto ${isFullBleedHeader ? "max-w-none" : "max-w-7xl"}`}>
        <div
          className={
            isPublicGlassRoute
              ? "relative overflow-hidden rounded-2xl bg-white/72 px-5 py-3 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:px-7"
              : isDarkHeader
                ? `relative overflow-hidden ${isFullBleedHeader ? "border-x-0 border-t-0" : "rounded-[1.85rem] border"} ${
                    isStaffWorkspaceTheme
                      ? "border-transparent bg-[linear-gradient(135deg,rgba(10,15,28,0.97),rgba(6,20,31,0.96)_45%,rgba(8,40,68,0.88)_100%)] px-5 py-3 shadow-[0_12px_36px_rgba(2,6,23,0.35)] backdrop-blur-2xl sm:px-8"
                      : "border-cyan-200/12 bg-[linear-gradient(135deg,rgba(2,12,24,0.96),rgba(5,24,44,0.94)_34%,rgba(8,40,68,0.9)_72%,rgba(12,66,94,0.84)_100%)] px-5 py-4 shadow-[0_26px_76px_rgba(2,6,23,0.42)] backdrop-blur-2xl sm:px-8"
                  }`
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
            <div className="flex flex-wrap items-center justify-between gap-4 lg:grid lg:grid-cols-[auto_auto_1fr] lg:items-center lg:gap-6">
              <div className="flex items-center gap-3">
                {isStaffWorkspaceTheme ? (
                  <button
                    type="button"
                    onClick={onOpenMobileNav}
                    aria-label="Open workspace navigation"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-200/15 bg-white/6 text-slate-200 transition-colors hover:bg-white/10 hover:text-white xl:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                ) : null}
                <Link to="/" aria-label="Go to WaitLess home">
                <WaitLessLogo
                  className={isDarkHeader ? "origin-left text-white" : ""}
                  subtitle={
                    isPublicGlassRoute || isDarkHeader
                      ? "Smarter Queues, Better Care"
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
              </div>

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
                <div className="hidden items-center gap-1 lg:flex lg:justify-self-start">
                  {visibleNavItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        isActive
                          ? `inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
                              isPublicGlassRoute
                                ? "bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] text-primary-foreground shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)]"
                                : isDarkHeader
                                  ? "bg-cyan-300/12 text-cyan-50 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.14)]"
                                  : "gradient-primary text-primary-foreground shadow-elegant"
                            }`
                          : `inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
                              isPublicGlassRoute
                                ? "text-slate-700 hover:bg-white/50 hover:text-slate-950"
                                : isDarkHeader
                                  ? "text-slate-300/90 hover:bg-cyan-300/8 hover:text-white"
                                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                            }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}

              <div
                className={`flex items-center gap-3 ${
                  isStaffWorkspaceTheme ? "lg:w-full" : "lg:justify-self-end"
                }`}
              >
                {isStaffWorkspaceTheme ? (
                  <WorkspaceSearch auth={auth} />
                ) : (
                  <QuickNavSearch />
                )}
                {isStaffWorkspaceTheme ? <ThemeToggle variant="ghost" /> : null}
                {isStaffWorkspaceTheme ? <NotificationsBell /> : null}
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
                {!isStaffWorkspaceTheme && patientAuth.isPatientAuthenticated ? (
                  <Link
                    to="/patient/dashboard"
                    className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                      isPublicGlassRoute
                        ? "border border-teal-200/50 bg-white/40 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_18px_rgba(15,118,110,0.08)] backdrop-blur-md hover:bg-white/55"
                        : isDarkHeader
                          ? "border border-cyan-200/15 bg-white/8 text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur hover:border-cyan-200/25 hover:bg-white/12 hover:text-white"
                          : "border border-primary/20 bg-primary-soft/70 text-primary hover:border-primary/30 hover:bg-primary-soft"
                    }`}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Patient portal
                  </Link>
                ) : null}
                {!isStaffWorkspaceTheme && !patientAuth.isPatientAuthenticated ? (
                  auth.isAuthenticated ? (
                    <Link
                      to={headerPrimaryAction.to}
                      className="inline-flex h-10 items-center gap-2 rounded-xl gradient-primary px-5 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5"
                    >
                      {headerPrimaryAction.label}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <>
                      <NavLink
                        to="/login"
                        className={({ isActive }) =>
                          isActive
                            ? isDarkHeader
                              ? "inline-flex h-10 items-center gap-1.5 rounded-full border border-cyan-300/35 bg-cyan-300/12 px-4 text-sm font-semibold text-cyan-50"
                              : "inline-flex h-10 items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft px-4 text-sm font-semibold text-primary"
                            : isDarkHeader
                              ? "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-slate-100/82 transition-colors hover:bg-cyan-300/8 hover:text-white"
                              : "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                        }
                      >
                        Sign in
                      </NavLink>
                      <Link
                        to="/patient/register"
                        className={`inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${
                          isDarkHeader
                            ? "bg-[linear-gradient(135deg,#34d399,#14b8a6)] text-[#052e22] shadow-[0_14px_32px_-14px_rgba(52,211,153,0.55)]"
                            : "gradient-primary text-primary-foreground shadow-elegant"
                        }`}
                      >
                        Get started
                      </Link>
                    </>
                  )
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
                            ? isDarkHeader
                              ? "rounded-full border border-cyan-300/35 bg-cyan-300/12 px-3 py-1.5 text-sm font-semibold text-cyan-50"
                              : "rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary"
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
                          ? isDarkHeader
                            ? "whitespace-nowrap rounded-full border border-cyan-300/35 bg-cyan-300/12 px-3 py-1.5 text-xs font-semibold text-cyan-50"
                            : "whitespace-nowrap rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary"
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

function PatientAccountMenu({ patientAuth, isPublicGlassRoute, isDark = false }) {
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
          isDark
            ? "border border-cyan-200/15 bg-white/8 text-cyan-100 backdrop-blur hover:border-cyan-200/25 hover:bg-white/12 hover:text-white"
            : isPublicGlassRoute
              ? "border border-white/40 bg-white/30 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-md hover:bg-white/45"
              : "border border-primary/20 bg-primary-soft/70 text-primary hover:border-primary/30 hover:bg-primary-soft"
        }`}
      >
        <span
          className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${
            isDark
              ? "bg-cyan-300/15 text-cyan-100"
              : "bg-primary/15 text-primary"
          }`}
        >
          {initials}
        </span>
        <span className="hidden sm:inline">{patient?.fullName?.split(" ")[0] || "Patient"}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {isOpen ? (
        <div
          className={`absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border ${
            isDark
              ? "border-cyan-200/12 bg-[linear-gradient(180deg,rgba(8,22,38,0.98),rgba(5,17,30,0.98))] text-white shadow-[0_28px_80px_-28px_rgba(2,6,23,0.8)]"
              : "border-border bg-card shadow-[0_24px_60px_rgba(15,23,42,0.16)]"
          }`}
        >
          <div className={`border-b px-4 py-3 ${isDark ? "border-white/10" : "border-border"}`}>
            <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-foreground"}`}>{patient?.fullName}</div>
            <div className={`text-xs ${isDark ? "text-slate-400" : "text-muted-foreground"}`}>{patient?.email}</div>
          </div>
          <div className="p-1.5">
            {[
              ["/patient/dashboard", LayoutDashboard, "My dashboard"],
              ["/self-register", Ticket, "Book a queue spot"],
              ["/track", Search, "Track a ticket"],
            ].map(([to, Icon, label]) => (
              <button
                key={to}
                onClick={() => {
                  setIsOpen(false);
                  navigate(to);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isDark ? "text-slate-100 hover:bg-white/8" : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon className={`h-4 w-4 ${isDark ? "text-cyan-100/70" : "text-muted-foreground"}`} />
                {label}
              </button>
            ))}
            <div className={`my-1.5 h-px ${isDark ? "bg-white/10" : "bg-border"}`} />
            <button
              onClick={handleLogout}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isDark ? "text-red-300 hover:bg-red-400/10" : "text-red-600 hover:bg-red-50"
              }`}
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
    navigate("/login");
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

  const useDarkMenu = isAuthRoute || isHomeRoute;
  const triggerClassName = useDarkMenu
    ? "border border-white/10 bg-white/8 text-slate-100/88 hover:bg-white/12"
    : "border border-border/70 bg-background/75 text-foreground hover:bg-muted";
  const dropdownSurfaceClassName = useDarkMenu
    ? "border border-cyan-200/12 bg-[linear-gradient(180deg,rgba(8,22,38,0.98),rgba(5,17,30,0.98))] text-white shadow-[0_28px_80px_-28px_rgba(2,6,23,0.8),0_0_0_1px_rgba(34,211,238,0.04)]"
    : "border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,252,0.98))] text-slate-900 shadow-[0_28px_80px_-28px_rgba(15,23,42,0.32)]";
  const subtleTextClassName = useDarkMenu ? "text-cyan-100/62" : "text-slate-500";
  const dividerClassName = useDarkMenu ? "border-white/10" : "border-slate-200/80";
  const menuItemClassName = useDarkMenu
    ? "text-slate-100 hover:bg-white/8"
    : "text-slate-700 hover:bg-slate-100/90";
  const iconTintClassName = useDarkMenu ? "text-cyan-100/78" : "text-slate-500";

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
        className="inline-flex h-11 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.05] py-1.5 pl-1.5 pr-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl transition-all hover:border-teal-300/30 hover:bg-white/[0.08] hover:shadow-[0_0_0_3px_rgba(45,212,191,0.08)]"
      >
        <StaffAvatar
          user={auth.user}
          displayName={accountName}
          className="h-8 w-8 rounded-full bg-[linear-gradient(135deg,rgba(13,148,136,0.55),rgba(34,211,238,0.35))]"
          fallbackClassName="text-[11px] font-bold text-white"
        />
        <span className="hidden min-w-0 text-left sm:flex sm:flex-col sm:justify-center">
          <span className="truncate text-sm font-semibold leading-none text-white">
            {accountName}
          </span>
          <span className="mt-1 truncate text-[11px] leading-none text-teal-200/70">
            {accountContext}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(15rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-cyan-200/12 bg-[linear-gradient(180deg,rgba(8,22,38,0.98),rgba(5,17,30,0.98))] text-white shadow-[0_28px_80px_-28px_rgba(2,6,23,0.8),0_0_0_1px_rgba(34,211,238,0.04)] backdrop-blur-2xl">
          {/* Account header */}
          <div className="border-b border-white/10 px-4 pb-3.5 pt-4">
            <div className="text-sm font-bold text-white">{displayName}</div>
            <div className="mt-0.5 truncate text-xs text-slate-400">
              {auth.user?.email ?? ""}
            </div>
            <span className="mt-2.5 inline-flex items-center rounded-full bg-teal-400/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-300 ring-1 ring-inset ring-teal-400/25">
              {roleLabel}
            </span>
          </div>

          <div className="space-y-1 p-2">
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

          <div className="px-2 pb-2">
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

function NotificationsBell() {
  const location = useLocation();
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const loader = useCallback(() => fetchDashboardSummary(), []);
  const query = useApiResource(loader);
  const notifications = query.data?.notifications ?? [];
  const attentionCount = notifications.filter((n) =>
    ["failed", "retrying"].includes(n.status),
  ).length;
  const latest = notifications.slice(0, 7);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isOpen) return undefined;
    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    }
    function handleEscape(event) {
      if (event.key === "Escape") setIsOpen(false);
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
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title="Notifications"
        className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-all duration-200 ${
          isOpen
            ? "bg-white/10 text-white"
            : "text-slate-300 hover:bg-white/6 hover:text-white"
        }`}
      >
        <Bell className="h-5 w-5" />
        {attentionCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full border-2 border-[#08243d] bg-red-500 px-0.5 text-[9px] font-bold leading-none text-white">
            {attentionCount > 9 ? "9+" : attentionCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-cyan-200/12 bg-[linear-gradient(180deg,rgba(8,22,38,0.98),rgba(5,17,30,0.98))] text-white shadow-[0_28px_80px_-28px_rgba(2,6,23,0.8),0_0_0_1px_rgba(34,211,238,0.04)] backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-sm font-semibold text-white">Notifications</span>
            <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
              {notifications.length} total
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto p-1.5">
            {query.isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                Loading notifications...
              </div>
            ) : latest.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <BellRing className="mx-auto h-8 w-8 text-slate-500" />
                <div className="mt-3 text-sm text-slate-400">
                  No notifications right now.
                </div>
              </div>
            ) : (
              latest.map((n, i) => {
                const isAttention = ["failed", "retrying"].includes(n.status);
                const isInflight = ["queued", "sending", "sent"].includes(n.status);
                return (
                  <div
                    key={n.id ?? i}
                    className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/6"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        isAttention
                          ? "bg-red-400"
                          : isInflight
                            ? "bg-amber-400"
                            : "bg-teal-400"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-100">
                        {n.title || n.ticket || "Notification"}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-400">
                        {[n.patientName, n.department, n.status]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Link
            to="/admin/notifications"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2 border-t border-white/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition-colors hover:bg-white/6 hover:text-cyan-200"
          >
            View all notifications
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

const noop = () => {};

function StaffWorkspaceShell({
  auth,
  children,
  dark = false,
  mobileOpen = false,
  onMobileOpenChange = noop,
}) {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isMobileSidebarOpen = mobileOpen;
  const setIsMobileSidebarOpen = onMobileOpenChange;
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
  }, [location.hash, location.pathname, setIsMobileSidebarOpen]);

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
  }, [isMobileSidebarOpen, setIsMobileSidebarOpen]);

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
                    <X className="h-4 w-4" />
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
                <StaffAvatar
                  user={user}
                  displayName={displayName}
                  className="h-14 w-14 rounded-[1.2rem] shadow-[0_22px_40px_-22px_rgba(132,204,22,0.55)]"
                  fallbackClassName="bg-[linear-gradient(135deg,rgba(101,163,13,0.96),rgba(132,204,22,0.88))] text-sm font-bold uppercase tracking-[0.16em] text-[#08110a]"
                />
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

function WorkspaceSearch({ auth }) {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const searchableItems = STAFF_WORKSPACE_ITEMS.filter(
    (item) => !item.roles || auth.hasRole(item.roles),
  );
  const results = query.trim()
    ? searchableItems
        .filter((item) =>
          item.label.toLowerCase().includes(query.trim().toLowerCase()),
        )
        .slice(0, 6)
    : [];

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    setQuery("");
  }, [location.pathname]);

  function openItem(item) {
    setQuery("");
    navigate(item.to);
  }

  return (
    <div className="relative hidden w-full max-w-md lg:mx-auto lg:block">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/50" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => window.setTimeout(() => setIsFocused(false), 150)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && results[0]) {
            openItem(results[0]);
          }
        }}
        placeholder="Search modules…"
        className="h-10 w-full rounded-full border border-cyan-200/15 bg-white/6 pl-10 pr-14 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-200/35 focus:bg-white/8"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/15 bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
        ⌘K
      </span>
      {isFocused && results.length > 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[90] overflow-hidden rounded-2xl border border-white/10 bg-[#08182b]/95 py-1.5 shadow-[0_24px_60px_rgba(2,6,23,0.6)] backdrop-blur-xl">
          {results.map((item) => {
            const ResultIcon = item.icon;
            return (
              <button
                key={item.to}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  openItem(item);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-200 transition-colors hover:bg-white/8 hover:text-white"
              >
                <ResultIcon className="h-4 w-4 shrink-0 text-cyan-100/70" />
                <span className="truncate">{item.label}</span>
                <span className="ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.group}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function DashboardSidebarNavigation({ groups, collapsed = false, onNavigate }) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState(() =>
    groups.map((group) => group.label),
  );

  function toggleGroup(label) {
    setOpenGroups((previous) =>
      previous.includes(label)
        ? previous.filter((entry) => entry !== label)
        : [...previous, label],
    );
  }

  return (
    <nav className="staff-account-navigation flex-1 py-3" aria-label="Staff workspace modules">
      {groups.map((group, groupIndex) => {
        const isOpen = collapsed || openGroups.includes(group.label);
        return (
        <section
          key={group.label}
          className={`staff-account-nav-group ${groupIndex ? "mt-3 border-t border-border/60 pt-3" : ""}`}
        >
          {collapsed ? (
            <div className="mx-auto mb-2 h-px w-7 bg-border/80" aria-hidden="true" />
          ) : (
            <button
              type="button"
              onClick={() => toggleGroup(group.label)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {group.label}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${isOpen ? "" : "-rotate-90"}`}
              />
            </button>
          )}

          <div className={`${collapsed ? "mt-1" : "mt-2"} space-y-1 ${isOpen ? "" : "hidden"}`}>
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
        );
      })}
    </nav>
  );
}

