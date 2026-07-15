<<<<<<< HEAD
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, LogOut, ShieldCheck, Stethoscope, Settings, HelpCircle, UserRound } from "lucide-react";
=======
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronDown,
  Facebook,
  Globe,
  House,
  Instagram,
  LayoutDashboard,
  Linkedin,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Search,
  Settings2,
  ShieldCheck,
  ShieldPlus,
  Stethoscope,
  Ticket,
  UserRound,
  Youtube,
} from "lucide-react";

>>>>>>> 1b9b1e0 (frontend: auth pages modified-next staff dashboard page(s))
import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import { WaitLessLogo } from "@/components/WaitLessLogo";
import { LiveRefreshProvider } from "@/context/LiveRefreshContext";
import {
  formatStaffRoleLabel,
  getStaffInitials,
  resolveStaffLandingPath,
} from "@/services/staffProfilePrefs";
import { QueueRealtimeProvider } from "@/sockets/QueueRealtimeProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


const navItems = [
  { to: "/", label: "Home", icon: House },
  { to: "/register", label: "Register", roles: ["reception"], icon: ShieldPlus },
  { to: "/track", label: "Track Ticket", icon: Ticket },
  { to: "/triage", label: "Triage", roles: ["triage"], icon: Stethoscope },
  { to: "/queue", label: "Queue Board", icon: Search },
  {
    to: "/dashboard",
    label: "Dashboard",
    roles: ["triage", "clinician"],
    icon: LayoutDashboard,
  },
];

const AUTH_ROUTE_PREFIXES = [
  "/login",
  "/staff-register",
  "/staff-signup",
  "/forgot-password",
  "/reset-password",
];

const STAFF_WORKSPACE_ROUTE_PREFIXES = [
  "/dashboard",
  "/profile",
  "/register",
  "/triage",
];

function isAuthPath(pathname) {
  return AUTH_ROUTE_PREFIXES.some((path) => pathname.startsWith(path));
}

function isStaffWorkspacePath(pathname) {
  return STAFF_WORKSPACE_ROUTE_PREFIXES.some((path) => pathname.startsWith(path));
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
      <LiveRefreshProvider>
        <QueueRealtimeProvider>
          <AppScaffold />
        </QueueRealtimeProvider>
      </LiveRefreshProvider>
    </AuthProvider>
  );
}

<<<<<<< HEAD
function AccountMenu({ userName, onLogout, className }) {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={className} aria-label="Account menu">
          <UserRound className="h-3.5 w-3.5" />
          {userName}
        </button>
      </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={() => {
            navigate("/settings");
          }}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={() => {
            navigate("/profile");
          }}
        >
          <UserRound className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>


        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={() => {
            onLogout();
            navigate("/login");
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
=======
function AppScaffold() {
  const auth = useAuth();
  const location = useLocation();
  const isAuthRoute = isAuthPath(location.pathname);
  const showStaffSidebar =
    auth.isAuthenticated && isStaffWorkspacePath(location.pathname);

  return (
    <div
      className={`relative min-h-screen overflow-hidden ${
        isAuthRoute ? "bg-[#020814]" : ""
      }`}
    >
      {isAuthRoute ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-[#081523] via-[#092138]/75 to-transparent" />
          <div className="pointer-events-none absolute -left-12 top-0 h-72 w-72 rounded-full bg-sky-400/12 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-500/12 blur-3xl" />
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary-soft/90 via-primary-soft/40 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-accent/12 blur-3xl" />
        </>
      )}

      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {showStaffSidebar ? (
            <StaffWorkspaceShell auth={auth}>
              <div
                key={`${location.pathname}${location.search}`}
                className="page-route-shell"
              >
                <Outlet />
              </div>
            </StaffWorkspaceShell>
          ) : (
            <div
              key={`${location.pathname}${location.search}`}
              className="page-route-shell"
            >
              <Outlet />
            </div>
          )}
        </main>
        <Footer />
      </div>
    </div>
>>>>>>> 1b9b1e0 (frontend: auth pages modified-next staff dashboard page(s))
  );
}

function Header() {
  const auth = useAuth();
  const location = useLocation();
  const isHomeRoute = location.pathname === "/";
  const isAuthRoute = isAuthPath(location.pathname);
  const canRegisterPatient = auth.hasRole(["reception", "receptionist"]);
  const displayName =
    auth.user?.workspaceProfile?.preferredName?.trim() || auth.user?.name || "Staff";
  const headerPrimaryAction = auth.isAuthenticated
    ? canRegisterPatient
      ? { to: "/register", label: "New patient" }
      : { to: resolveStaffLandingPath(auth.user), label: "My workspace" }
    : { to: "/login", label: "New patient" };
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
              : isAuthRoute
                ? "relative overflow-hidden rounded-[1.85rem] border border-cyan-200/12 bg-[linear-gradient(135deg,rgba(2,12,24,0.96),rgba(5,24,44,0.94)_34%,rgba(8,40,68,0.9)_72%,rgba(12,66,94,0.84)_100%)] px-5 py-4 shadow-[0_26px_76px_rgba(2,6,23,0.42)] backdrop-blur-2xl sm:px-8"
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
          {isAuthRoute && (
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
                  className={isAuthRoute ? "origin-left scale-[0.9] text-white" : ""}
                  subtitle={
                    isHomeRoute && !isAuthRoute
                      ? "Smarter Queues, Better Care"
                      : isAuthRoute
                        ? "Hospital Flow"
                        : "Hospital Queue OS"
                  }
                  subtitleClassName={
                    isHomeRoute && !isAuthRoute
                      ? "text-[9px] tracking-[0.18em] text-primary opacity-90 sm:text-[10px]"
                      : isAuthRoute
                        ? "text-[9px] tracking-[0.22em] text-cyan-100/70 sm:text-[10px]"
                      : ""
                  }
                />
              </Link>

              <div
                className={`hidden items-center gap-2 rounded-full p-1.5 lg:flex lg:justify-self-center ${
                  isHomeRoute && !isAuthRoute
                    ? "bg-white/34 shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_12px_28px_rgba(15,23,42,0.05)] backdrop-blur-md"
                    : isAuthRoute
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
                            isHomeRoute && !isAuthRoute
                              ? "bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(37,99,235,0.88))] text-primary-foreground backdrop-blur"
                              : isAuthRoute
                                ? "h-10 gap-2 border border-cyan-200/18 bg-[linear-gradient(135deg,rgba(12,104,138,0.96),rgba(18,126,173,0.92)_48%,rgba(29,78,216,0.9))] px-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_12px_28px_-16px_rgba(34,211,238,0.42)] backdrop-blur"
                              : "gradient-primary text-primary-foreground shadow-elegant"
                          }`
                        : `inline-flex h-12 items-center rounded-full px-4 text-sm font-medium transition-all ${
                            isHomeRoute && !isAuthRoute
                              ? "bg-white/12 text-slate-600 hover:bg-white/42 hover:text-slate-950"
                              : isAuthRoute
                                ? "h-10 gap-2 px-4 text-slate-100/82 hover:bg-cyan-300/8 hover:text-white"
                              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                          }`
                    }
                  >
                    {isAuthRoute && item.icon ? <item.icon className="h-4 w-4" /> : null}
                    {item.label}
                  </NavLink>
                ))}
              </div>

              <div className="flex items-center gap-3 lg:justify-self-end">
                {auth.isAuthenticated ? (
                  <AccountMenu
                    auth={auth}
                    displayName={displayName}
                    isAuthRoute={isAuthRoute}
                    isHomeRoute={isHomeRoute}
                  />
                ) : !isAuthRoute ? (
                  <Link
                    to="/login"
                    className={`hidden h-11 items-center gap-2 rounded-full px-4 text-xs font-semibold md:inline-flex ${
                      isHomeRoute && !isAuthRoute
                        ? "bg-white/28 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_10px_24px_rgba(15,118,110,0.08)] backdrop-blur"
                        : isAuthRoute
                          ? "border border-white/10 bg-white/8 text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur"
                        : "border border-primary/15 bg-primary-soft/65 text-primary"
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Staff login
                  </Link>
                ) : null}
                <Link
                  to={headerPrimaryAction.to}
                  className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5 ${
                    isHomeRoute && !isAuthRoute
                      ? "bg-[linear-gradient(135deg,rgba(15,118,110,0.94),rgba(37,99,235,0.90))] backdrop-blur"
                      : isAuthRoute
                        ? "rounded-[1.05rem] bg-[linear-gradient(135deg,rgba(34,197,94,0.96),rgba(20,184,166,0.94))] px-6 shadow-[0_16px_34px_-18px_rgba(16,185,129,0.48)] backdrop-blur"
                      : "gradient-primary"
                  }`}
                >
                  {headerPrimaryAction.label}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div
              className={`mt-4 hidden items-center justify-between gap-4 pt-4 md:flex lg:hidden ${
                isHomeRoute && !isAuthRoute
                  ? "border-t border-white/50"
                  : isAuthRoute
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
                        : isAuthRoute
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
                isHomeRoute && !isAuthRoute
                  ? "border-t border-white/50"
                  : isAuthRoute
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
<<<<<<< HEAD
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
                <AccountMenu
                  userName={auth.user?.name}
                  onLogout={auth.logout}
                  className={`hidden h-11 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-colors md:inline-flex ${
                    isHomeRoute && !isAuthRoute
                      ? "bg-white/58 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur hover:bg-white/72"
                      : "border border-border/70 bg-background/75 text-muted-foreground hover:bg-muted"
                  }`}
                />
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
=======
                      ? "whitespace-nowrap rounded-full gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-elegant"
                      : isAuthRoute
                        ? "whitespace-nowrap rounded-full border border-cyan-200/12 bg-[rgba(4,18,34,0.42)] px-3 py-1.5 text-xs font-medium text-slate-100/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                        : "whitespace-nowrap rounded-full border border-transparent bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground"
>>>>>>> 1b9b1e0 (frontend: auth pages modified-next staff dashboard page(s))
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

function AccountMenu({ auth, displayName, isAuthRoute, isHomeRoute }) {
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const roleLabel = formatStaffRoleLabel(auth.user?.role);
  const email = auth.user?.email || `${auth.user?.username}@waitless.local`;
  const department = auth.user?.department || "Hospital operations";
  const canRegisterPatient = auth.hasRole(["reception", "receptionist"]);
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

  function handleSignOut() {
    auth.logout();
    navigate("/login");
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`inline-flex h-11 items-center gap-3 rounded-full px-2.5 pr-3 transition-colors ${triggerClassName}`}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[linear-gradient(135deg,rgba(101,163,13,0.96),rgba(132,204,22,0.9))] text-[11px] font-bold uppercase tracking-[0.14em] text-[#08110a] shadow-[0_10px_22px_-12px_rgba(132,204,22,0.5)]">
          {getStaffInitials(displayName)}
        </span>
        <span className="hidden min-w-0 text-left sm:flex sm:flex-col sm:justify-center">
          <span className="truncate text-sm font-semibold leading-none">{displayName}</span>
          <span className={`mt-1 truncate text-[10px] uppercase tracking-[0.2em] ${subtleTextClassName}`}>
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
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgba(101,163,13,0.96),rgba(132,204,22,0.9))] text-sm font-bold uppercase tracking-[0.14em] text-[#08110a] shadow-[0_16px_30px_-18px_rgba(132,204,22,0.52)]">
                {getStaffInitials(displayName)}
              </span>
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
            <Link
              to={defaultWorkspacePath}
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-base font-medium transition-colors ${menuItemClassName}`}
            >
              <LayoutDashboard className={`h-4.5 w-4.5 ${iconTintClassName}`} />
              Open workspace
            </Link>
            <Link
              to="/profile"
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-base font-medium transition-colors ${menuItemClassName}`}
            >
              <UserRound className={`h-4.5 w-4.5 ${iconTintClassName}`} />
              My Profile
            </Link>
            <Link
              to="/profile#workspace-settings"
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-base font-medium transition-colors ${menuItemClassName}`}
            >
              <Settings2 className={`h-4.5 w-4.5 ${iconTintClassName}`} />
              Settings
            </Link>
            {canRegisterPatient ? (
              <Link
                to="/register"
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-base font-medium transition-colors ${menuItemClassName}`}
              >
                <ShieldPlus className={`h-4.5 w-4.5 ${iconTintClassName}`} />
                Register patient
              </Link>
            ) : null}
          </div>

          <div className={`my-2 border-t ${dividerClassName}`} />

          <div className="px-1 pt-1">
            <button
              type="button"
              onClick={handleSignOut}
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
    </div>
  );
}

function StaffWorkspaceShell({ auth, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = auth.user;
  const displayName =
    user?.workspaceProfile?.preferredName?.trim() || user?.name || "Staff";
  const statusMessage =
    user?.workspaceProfile?.statusMessage?.trim() ||
    "Signed in and ready to manage live patient flow.";
  const roleLabel = formatStaffRoleLabel(user?.role);
  const department = user?.department || "Hospital operations";
  const canRegisterPatient = auth.hasRole(["reception", "receptionist"]);
  const preferredLandingPath = resolveStaffLandingPath(user);
  const workspaceLinks = navItems.filter(
    (item) => item.to !== "/" && (!item.roles || auth.hasRole(item.roles)),
  );
  const availabilityLabel = user?.workspaceProfile?.availability
    ?.replaceAll("-", " ")
    ?.replace(/\b\w/g, (character) => character.toUpperCase());

  function handleSignOut() {
    auth.logout();
    navigate("/login");
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

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {statusMessage}
              </p>

              <div className="mt-5 grid gap-2">
                {canRegisterPatient ? (
                  <Link
                    to="/register"
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
                  to="/profile"
                  className="inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <UserRound className="h-4 w-4 text-primary" />
                  My profile
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
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
                    {preferredLandingPath.replace("/", "").replaceAll("-", " ") || "dashboard"}
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
                to="/profile#workspace-settings"
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
                  <div className="mt-1 text-sm text-muted-foreground">
                    {department}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canRegisterPatient ? (
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant"
                    >
                      Register patient
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                  <Link
                    to="/profile"
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
    </div>
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
                A triage-aware hospital queue system built for Chinhoyi Provincial Hospital
                and the wider Zimbabwean public health network.
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
