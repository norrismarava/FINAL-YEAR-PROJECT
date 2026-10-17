import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UserRound,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  CalendarDays,
  Globe,
  ChevronDown,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Check,
  Ticket,
  Bell,
  MonitorSpeaker,
} from "lucide-react";
import { useEffect, useState } from "react";

import waitlessLogoIcon from "@/assets/waitless-logo-icon.png";
import { usePatientAuth } from "@/auth/PatientAuthProvider";
import { LogoLoader } from "@/components/LogoLoader";
import { useTranslation } from "@/i18n/useTranslation";
import { LANGUAGES } from "@/i18n/I18nProvider";

const THEME_KEY = "waitless_patient_theme";

function loadTheme() {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(THEME_KEY) || "dark";
}

function saveTheme(theme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, theme);
}

function getInitials(name) {
  return (name ?? "P")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const NAV_ITEMS = [
  { to: "/patient/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/patient/bookings", labelKey: "nav.bookings", icon: CalendarDays },
  { to: "/patient/track", labelKey: "nav.track", icon: Ticket },
  { to: "/patient/queue", labelKey: "nav.queueBoard", icon: MonitorSpeaker },
  { to: "/patient/updates", labelKey: "nav.updates", icon: Bell },
  { to: "/patient/feedback", labelKey: "nav.feedback", icon: MessageSquare },
  { to: "/patient/profile", labelKey: "nav.profile", icon: UserRound },
  { to: "/patient/settings", labelKey: "nav.settings", icon: SettingsIcon },
];

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 focus-visible:ring-offset-0";

/* Design tokens per theme, one place to tune the whole look */
function tokens(isLight) {
  return isLight
    ? {
        pageText: "text-slate-900",
        pageBg: "bg-[#eef6f5]",
        panel:
          "border-white/80 bg-white/75 shadow-[0_30px_80px_-40px_rgba(13,89,100,0.35),0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur-2xl",
        topbar:
          "border-b border-teal-900/[0.06] bg-white/70 shadow-[0_8px_30px_-20px_rgba(13,89,100,0.25)]",
        divider: "border-teal-900/[0.08]",
        title: "text-slate-900",
        muted: "text-slate-500",
        accent: "text-teal-600",
        chip: "border-teal-900/10 bg-white/80 text-slate-700 hover:border-teal-500/40 hover:bg-white hover:text-teal-800",
        navIdle: "text-slate-600 hover:bg-teal-500/[0.07] hover:text-slate-900",
        navActive:
          "font-semibold text-teal-900 bg-[linear-gradient(100deg,rgba(13,148,136,0.16),rgba(45,212,191,0.06))] shadow-[inset_0_0_0_1px_rgba(13,148,136,0.18)]",
        iconIdle: "bg-slate-100/90 text-slate-500 group-hover:text-teal-700",
        iconActive:
          "bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-[0_6px_16px_-6px_rgba(13,148,136,0.7)]",
        menu: "border-slate-200/80 bg-white/95 text-slate-800 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)]",
        menuItem: "text-slate-700 hover:bg-teal-500/[0.08] hover:text-slate-900",
        menuIcon: "text-teal-600",
        modal: "border-white/70 bg-white/95 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.45)]",
        secondaryBtn: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        userCard: "border-teal-900/[0.07] bg-gradient-to-br from-teal-50/90 to-white",
      }
    : {
        /* Dark theme mirrors the staff workspace sidebar exactly */
        pageText: "text-foreground",
        pageBg: "dashboard-workspace-shell bg-[#050817]",
        panel:
          "border-[#1b2a43] bg-[linear-gradient(180deg,#0b162a_0%,#081225_100%)] shadow-[0_26px_70px_-48px_rgba(0,0,0,0.92)]",
        topbar:
          "border-b border-white/[0.06] bg-[linear-gradient(135deg,rgba(8,14,27,0.92),rgba(6,22,34,0.9)_50%,rgba(8,36,60,0.82)_100%)] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)]",
        divider: "border-border/70",
        title: "text-foreground",
        muted: "text-muted-foreground",
        accent: "text-primary",
        chip: "border-border/70 bg-background/70 text-muted-foreground hover:border-primary/30 hover:text-foreground",
        navIdle: "staff-account-nav-link text-muted-foreground",
        navActive: "staff-account-nav-link--active font-semibold",
        iconIdle: "staff-account-nav-icon bg-background/70",
        iconActive: "staff-account-nav-icon",
        menu: "border-[#1b2a43] bg-[linear-gradient(180deg,rgba(11,22,42,0.98),rgba(8,18,37,0.98))] text-foreground shadow-[0_30px_80px_-24px_rgba(0,0,0,0.9)]",
        menuItem: "text-foreground/90 hover:bg-white/[0.07]",
        menuIcon: "text-cyan-300/80",
        modal: "border-[#1b2a43] bg-[linear-gradient(180deg,rgba(11,22,42,0.98),rgba(8,18,37,0.98))] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.95)]",
        secondaryBtn: "border-border/70 bg-background/60 text-foreground hover:bg-white/[0.08]",
        userCard: "border-[#1b2a43]/80 bg-white/[0.03]",
      };
}

export default function PatientPortalLayout() {
  const { patientUser, isPatientAuthenticated, isPatientReady, patientLogout } =
    usePatientAuth();
  const { t, lang, changeLang } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [theme, setTheme] = useState(loadTheme);
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("waitless_patient_avatar");
    if (stored) setAvatarUrl(stored);
  }, []);

  // Escape closes any open overlay
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setLangOpen(false);
      setAccountOpen(false);
      setShowLogoutConfirm(false);
      setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isLight = theme === "light";

  if (!isPatientReady) {
    return (
      <section className="dashboard-workspace-shell relative isolate min-h-screen overflow-hidden bg-[#050817] px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <div className="flex min-h-[40vh] items-center justify-center">
          <LogoLoader size={56} decorative />
        </div>
      </section>
    );
  }

  if (!isPatientAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const s = tokens(isLight);
  const firstName = patientUser?.fullName?.split(" ")[0] ?? "Patient";

  const Avatar = ({ size = "h-8 w-8", text = "text-[11px]" }) =>
    avatarUrl ? (
      <img
        src={avatarUrl}
        alt="Profile"
        onError={() => setAvatarUrl(null)}
        className={`${size} rounded-full object-cover ring-2 ${isLight ? "ring-teal-500/30" : "ring-teal-300/30"}`}
      />
    ) : (
      <span
        className={`grid ${size} place-items-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 ${text} font-bold text-white shadow-[0_6px_16px_-6px_rgba(13,148,136,0.8)] ring-2 ${
          isLight ? "ring-white" : "ring-white/10"
        }`}
      >
        {getInitials(patientUser?.fullName)}
      </span>
    );

  return (
    <section className={`relative isolate flex min-h-screen overflow-hidden ${s.pageText} ${s.pageBg}`}>
      {/* Background */}
      {isLight ? (
        <>
          <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(135deg,#e6f6f3_0%,#f1f7f8_45%,#e8f0fb_100%)]" />
          <div className="pointer-events-none absolute -left-24 top-16 -z-10 h-96 w-96 rounded-full bg-teal-300/30 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-10 -z-10 h-[28rem] w-[28rem] rounded-full bg-sky-300/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 -z-10 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
        </>
      ) : null}

      {/* Mobile top bar */}
      <div
        className={`absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 py-3 backdrop-blur-xl lg:hidden ${s.topbar}`}
      >
        <div className="flex items-center gap-2.5">
          <img src={waitlessLogoIcon} alt="WaitLess" className="h-8 w-8 rounded-xl object-contain" />
          <span className={`text-sm font-bold tracking-tight ${s.accent}`}>WaitLess</span>
        </div>
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          className={`grid h-10 w-10 place-items-center rounded-xl border transition-colors ${s.chip} ${FOCUS}`}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-20 h-full w-72 p-4 pt-20 transition-[width,transform] duration-300 ease-out lg:translate-x-0 ${
          navCollapsed ? "lg:w-24" : "lg:w-72"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className={`flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border p-3 ${s.panel}`}>
          {/* Header */}
          <div
            className={`flex shrink-0 items-center border-b ${s.divider} pb-3 ${
              navCollapsed ? "justify-center" : "justify-between px-2"
            }`}
          >
            {navCollapsed ? null : (
              <span className={`font-bold uppercase tracking-[0.22em] ${isLight ? "text-xs" : "text-[11px]"} ${s.title}`}>
                Navigation
              </span>
            )}
            <button
              type="button"
              onClick={() => setNavCollapsed((v) => !v)}
              aria-label={navCollapsed ? "Expand navigation" : "Collapse navigation"}
              title={navCollapsed ? "Expand navigation" : "Collapse navigation"}
              className={`hidden shrink-0 place-items-center rounded-xl border transition-all lg:grid ${s.chip} ${FOCUS} ${
                navCollapsed ? "h-9 w-9" : "h-9 w-9"
              }`}
            >
              {navCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>

          {/* Nav */}
          <nav className="patient-account-navigation min-h-0 flex-1 overflow-y-auto py-3" aria-label="Patient portal">
            <div className="space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active =
                  location.pathname === item.to ||
                  (item.to === "/patient/dashboard" && location.pathname === "/patient");
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    aria-current={active ? "page" : undefined}
                    title={navCollapsed ? t(item.labelKey) : undefined}
                    className={`group relative flex min-h-11 items-center rounded-xl py-2 text-sm transition-all duration-200 ${FOCUS} ${
                      navCollapsed ? "justify-center px-2" : "gap-3 px-2.5"
                    } ${active ? s.navActive : `font-medium ${s.navIdle}`}`}
                  >
                    {active && !navCollapsed ? (
                      <span
                        className={`absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full ${
                          isLight ? "bg-teal-500" : "bg-teal-300"
                        }`}
                      />
                    ) : null}
                    <span
                      className={`grid shrink-0 place-items-center transition-all duration-200 ${
                        isLight ? "h-9 w-9 rounded-xl" : "h-8 w-8 rounded-lg"
                      } ${active ? s.iconActive : s.iconIdle}`}
                    >
                      <Icon className={isLight ? "h-[18px] w-[18px]" : "h-4 w-4"} />
                    </span>
                    {navCollapsed ? null : <span className="truncate">{t(item.labelKey)}</span>}
                  </NavLink>
                );
              })}
            </div>
          </nav>

          {/* Footer: sign out */}
          <div className={`mt-auto shrink-0 border-t ${s.divider} pt-3`}>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              title={navCollapsed ? t("nav.signout") : undefined}
              className={`flex w-full items-center rounded-xl py-2.5 text-sm font-semibold ${isLight ? "text-rose-500" : "text-rose-400"} transition-colors hover:bg-rose-500/10 ${FOCUS} ${
                navCollapsed ? "justify-center px-2" : "gap-3 px-3"
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {navCollapsed ? null : <span>{t("nav.signout")}</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-slate-950/60 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop header */}
      <div
        className={`fixed inset-x-0 top-0 z-40 hidden items-center justify-between gap-3 px-4 py-3 backdrop-blur-xl sm:px-6 lg:flex ${s.topbar}`}
      >
        <div className="flex items-center gap-3">
          <img src={waitlessLogoIcon} alt="WaitLess" className="h-10 w-10 rounded-xl object-contain" />
          <div>
            <div className={`text-[15px] font-bold leading-tight tracking-tight ${s.title}`}>WaitLess</div>
            <div className={`text-[11px] font-medium leading-tight ${s.accent}`}>Patient Portal</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Language */}
          <div className="relative">
            <button
              onClick={() => {
                setLangOpen((v) => !v);
                setAccountOpen(false);
              }}
              aria-expanded={langOpen}
              aria-haspopup="menu"
              className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-all ${s.chip} ${FOCUS}`}
            >
              <Globe className="h-4 w-4" />
              {LANGUAGES[lang]?.flag ?? "EN"}
              <ChevronDown className={`h-3 w-3 transition-transform ${langOpen ? "rotate-180" : ""}`} />
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setLangOpen(false)} />
                <div className={`absolute right-0 top-[calc(100%+0.6rem)] z-30 w-48 rounded-2xl border p-1.5 backdrop-blur-2xl ${s.menu}`}>
                  {Object.entries(LANGUAGES).map(([code, info]) => (
                    <button
                      key={code}
                      onClick={() => {
                        changeLang(code);
                        setLangOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                        lang === code
                          ? isLight
                            ? "bg-teal-500/10 text-teal-800"
                            : "bg-teal-400/15 text-teal-200"
                          : s.menuItem
                      }`}
                    >
                      <span className="w-7 text-xs font-bold opacity-60">{info.flag}</span>
                      <span className="flex-1">{info.label}</span>
                      {lang === code ? <Check className="h-4 w-4" /> : null}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
            title={isLight ? "Switch to dark mode" : "Switch to light mode"}
            onClick={() => {
              const next = isLight ? "dark" : "light";
              setTheme(next);
              saveTheme(next);
            }}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-all ${s.chip} ${FOCUS}`}
          >
            {isLight ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
          </button>

          <span className={`mx-1 h-6 w-px ${isLight ? "bg-slate-200" : "bg-white/10"}`} />

          {/* Account menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setAccountOpen((v) => !v);
                setLangOpen(false);
              }}
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              className={`inline-flex h-12 items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-3.5 transition-all ${s.chip} ${FOCUS}`}
            >
              <Avatar size="h-9 w-9" />
              <span className="hidden min-w-0 text-left sm:flex sm:flex-col sm:justify-center">
                <span className={`truncate text-sm font-semibold leading-none ${s.title}`}>{firstName}</span>
                <span className={`mt-1 truncate text-[11px] leading-none ${s.accent}`}>Patient</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${accountOpen ? "rotate-180" : ""}`}
              />
            </button>

            {accountOpen ? (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setAccountOpen(false)} />
                <div
                  role="menu"
                  className={`absolute right-0 top-[calc(100%+0.7rem)] z-30 w-[min(16rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border backdrop-blur-2xl ${s.menu}`}
                >
                  <div className={`flex items-center gap-3 border-b px-4 pb-3.5 pt-4 ${s.divider}`}>
                    <Avatar size="h-11 w-11" text="text-sm" />
                    <div className="min-w-0">
                      <div className={`truncate text-sm font-bold ${s.title}`}>
                        {patientUser?.fullName ?? "Patient"}
                      </div>
                      <div className={`mt-0.5 truncate text-xs ${s.muted}`}>
                        {patientUser?.email ?? patientUser?.username ?? ""}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-0.5 p-2">
                    <NavLink
                      to="/patient/profile"
                      onClick={() => setAccountOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${s.menuItem}`}
                    >
                      <UserRound className={`h-4 w-4 ${s.menuIcon}`} />
                      My Profile
                    </NavLink>
                    <NavLink
                      to="/patient/settings"
                      onClick={() => setAccountOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${s.menuItem}`}
                    >
                      <SettingsIcon className={`h-4 w-4 ${s.menuIcon}`} />
                      Settings
                    </NavLink>
                  </div>

                  <div className={`border-t p-2 ${s.divider}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-500 transition-colors hover:bg-rose-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className={`flex-1 overflow-y-auto transition-[margin] duration-300 ease-out ${navCollapsed ? "lg:ml-24" : "lg:ml-72"}`}>
        <div className="min-h-screen pt-16 lg:pt-20">
          <Outlet context={{ theme, isLight }} />
        </div>
      </main>

      {/* Logout confirmation */}
      {showLogoutConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-md"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-3xl border p-7 ${s.modal}`}
          >
            <div className="flex flex-col items-center text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/15 text-amber-500 ring-8 ring-amber-500/[0.06]">
                <AlertTriangle className="h-7 w-7" />
              </span>
              <h3 className={`mt-5 font-display text-lg font-bold tracking-tight ${s.title}`}>
                {t("common.logoutConfirm")}
              </h3>
              <p className={`mt-2 text-sm leading-relaxed ${s.muted}`}>{t("common.logoutConfirmDesc")}</p>
            </div>
            <div className="mt-7 flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className={`h-11 flex-1 rounded-xl border text-sm font-semibold transition-colors ${s.secondaryBtn} ${FOCUS}`}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  patientLogout();
                }}
                className={`h-11 flex-1 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(244,63,94,0.7)] transition-all hover:brightness-110 ${FOCUS}`}
              >
                {t("common.yes")}, {t("common.logout").toLowerCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
