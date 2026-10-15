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
} from "lucide-react";
import { useEffect, useState } from "react";

import authBackground from "@/assets/BACKG.png";
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
  { to: "/patient/feedback", labelKey: "nav.feedback", icon: MessageSquare },
  { to: "/patient/profile", labelKey: "nav.profile", icon: UserRound },
  { to: "/patient/settings", labelKey: "nav.settings", icon: SettingsIcon },
];

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

  const isLight = theme === "light";

  if (!isPatientReady) {
    return (
      <section className="relative isolate min-h-screen overflow-hidden px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-20 hidden lg:block">
          <img src={authBackground} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#04141f]/82 via-[#062a35]/72 to-[#0a1f2e]/78" />
        </div>
        <div className="absolute inset-0 -z-10 bg-[#04141f] lg:hidden" />
        <div className="flex min-h-[40vh] items-center justify-center">
          <LogoLoader size={56} decorative />
        </div>
      </section>
    );
  }

  if (!isPatientAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const sidebarText = isLight ? "text-slate-700" : "text-slate-300";
  const sidebarHover = isLight
    ? "hover:bg-slate-100 hover:text-slate-900"
    : "hover:bg-white/[0.06] hover:text-white";
  const logoAccent = isLight ? "text-teal-600" : "text-teal-400";
  const borderColor = isLight ? "border-slate-200" : "border-white/10";
  const mainBg = isLight ? "bg-[#f0f5f6]" : "";
  const mainText = isLight ? "text-slate-900" : "text-white";
  const mobileBarBg = isLight
    ? "bg-white/80 border-slate-200"
    : "border-white/[0.06] bg-[linear-gradient(135deg,rgba(10,15,28,0.97),rgba(6,20,31,0.96)_45%,rgba(8,40,68,0.88)_100%)]";

  return (
    <section className={`relative isolate flex min-h-screen overflow-hidden ${mainText} ${mainBg}`}>
      {/* Background */}
      {isLight ? (
        <>
          <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(135deg,#e8f5f3_0%,#f0f5f6_40%,#e6f0fa_100%)]" />
          <div className="pointer-events-none absolute -left-24 top-16 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-12 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 -z-20 hidden lg:block">
            <img src={authBackground} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#04141f]/88 via-[#062a35]/80 to-[#0a1f2e]/85" />
          </div>
          <div className="absolute inset-0 -z-10 bg-[#04141f] lg:hidden" />
        </>
      )}

      {/* Mobile top bar */}
      <div className={`absolute left-0 right-0 top-0 z-30 flex items-center justify-between border-b ${mobileBarBg} px-4 py-3 backdrop-blur-xl lg:hidden`}>
        <div className="flex items-center gap-2">
          <img src={waitlessLogoIcon} alt="WaitLess" className="h-8 w-8 rounded-lg object-contain" />
          <span className={`text-sm font-bold ${isLight ? "text-teal-600" : "text-teal-300"}`}>WaitLess</span>
        </div>
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className={`grid h-9 w-9 place-items-center rounded-lg border ${isLight ? "border-slate-200 bg-white text-slate-700" : "border-white/15 bg-white/[0.06] text-slate-100"}`}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar, floating panel styled like the staff workspace */}
      <aside
        className={`fixed left-0 top-0 z-20 h-full w-72 p-4 pt-20 transition-[width,transform] duration-300 lg:translate-x-0 ${
          navCollapsed ? "lg:w-24" : "lg:w-72"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div
          className={`flex max-h-full min-h-0 flex-col overflow-hidden rounded-[1.2rem] border p-3 ${
            isLight
              ? "border-slate-200 bg-white shadow-[0_26px_70px_-48px_rgba(15,23,42,0.35)]"
              : "border-[#1b2a43] bg-[linear-gradient(180deg,#0b162a_0%,#081225_100%)] shadow-[0_26px_70px_-48px_rgba(0,0,0,0.92)]"
          }`}
        >
          {/* Header, pinned, never scrolls */}
          <div className={`flex shrink-0 items-center border-b ${borderColor} pb-3 ${navCollapsed ? "justify-center" : "justify-between px-2"}`}>
            {navCollapsed ? null : (
              <span className={`text-[11px] font-bold uppercase tracking-[0.22em] ${isLight ? "text-slate-800" : "text-foreground"}`}>
                Navigation
              </span>
            )}
            <button
              type="button"
              onClick={() => setNavCollapsed((v) => !v)}
              aria-label={navCollapsed ? "Expand navigation" : "Collapse navigation"}
              title={navCollapsed ? "Expand navigation" : "Collapse navigation"}
              className={`grid shrink-0 place-items-center rounded-xl border transition-all ${
                isLight
                  ? "border-slate-200 bg-slate-100/80 text-slate-500 hover:border-teal-500/30 hover:text-slate-800"
                  : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-teal-400/30 hover:text-white"
              } ${navCollapsed ? "h-9 w-9" : "h-10 w-10"}`}
            >
              {navCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>

          {/* Scrollable nav, the only region that scrolls */}
          <nav className="patient-account-navigation min-h-0 flex-1 overflow-y-auto py-3" aria-label="Patient portal">
            <div className="space-y-1">
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
                  style={
                    active && navCollapsed && !isLight
                      ? { boxShadow: "inset 0 0 0 1px rgba(74,164,255,0.3)" }
                      : undefined
                  }
                  className={`relative flex min-h-11 items-center rounded-xl py-2 text-sm transition-colors ${navCollapsed ? "justify-center px-2" : "gap-3 px-3"} ${
                    active
                      ? isLight
                        ? "font-semibold text-teal-800 shadow-[inset_0_0_0_1px_rgba(13,148,136,0.25)] [background:linear-gradient(110deg,rgba(13,148,136,0.14),rgba(45,212,191,0.12))]"
                        : "staff-account-nav-link staff-account-nav-link--active font-semibold"
                      : isLight
                        ? `font-medium ${sidebarText} ${sidebarHover}`
                        : "staff-account-nav-link font-medium text-muted-foreground"
                  }`}
                >
                  <span className={`staff-account-nav-icon grid h-8 w-8 shrink-0 place-items-center rounded-lg ${isLight ? "bg-slate-100" : "bg-[#0b1427]/70"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {navCollapsed ? null : <span className="truncate">{t(item.labelKey)}</span>}
                </NavLink>
              );
            })}
            </div>
          </nav>

          {/* Sign out, pinned below the scrollable nav, always visible */}
          <div className={`mt-auto shrink-0 border-t ${borderColor} px-1 pt-4`}>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              title={navCollapsed ? t("nav.signout") : undefined}
              className={`flex w-full items-center rounded-xl py-3 text-sm font-semibold transition-colors ${navCollapsed ? "justify-center px-2" : "gap-3 px-3"} ${
                isLight
                  ? "text-rose-600 hover:bg-rose-500/10"
                  : "text-rose-400 hover:bg-rose-500/10"
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
          className="fixed inset-0 z-10 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed top header, spans full width, above the sidebar */}
      <div className={`fixed inset-x-0 top-0 z-40 hidden items-center justify-between gap-3 px-4 py-3 backdrop-blur-xl sm:px-6 lg:flex ${
        isLight
          ? "border-b border-slate-200 bg-white/80"
          : "bg-[linear-gradient(135deg,rgba(10,15,28,0.97),rgba(6,20,31,0.96)_45%,rgba(8,40,68,0.88)_100%)]"
      }`}>
        <div className="flex items-center gap-3">
          <img src={waitlessLogoIcon} alt="WaitLess" className="h-9 w-9 rounded-lg object-contain" />
          <div>
            <div className={`text-sm font-bold leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>WaitLess</div>
            <div className={`text-[10px] font-semibold uppercase leading-tight tracking-[0.22em] ${logoAccent}`}>Patient Portal</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${
                  isLight
                    ? "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "border-white/15 bg-white/[0.06] text-slate-100 hover:bg-white/[0.12]"
                }`}
              >
                <Globe className="h-4 w-4" />
                {LANGUAGES[lang]?.flag ?? "EN"}
                <ChevronDown className="h-3 w-3" />
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setLangOpen(false)} />
                  <div className={`absolute right-0 top-full z-30 mt-1 w-40 rounded-xl border py-1 shadow-xl ${isLight ? "border-slate-200 bg-white" : "border-white/15 bg-[#04141f]/95"}`}>
                    {Object.entries(LANGUAGES).map(([code, info]) => (
                      <button
                        key={code}
                        onClick={() => {
                          changeLang(code);
                          setLangOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium transition-colors ${
                          lang === code
                            ? isLight ? "bg-teal-500/10 text-teal-700" : "bg-teal-500/15 text-teal-300"
                            : isLight ? "text-slate-700 hover:bg-slate-100" : "text-slate-200 hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="w-7 text-xs font-bold opacity-60">{info.flag}</span>
                        {info.label}
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
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors ${
                isLight
                  ? "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "border-white/15 bg-white/[0.06] text-slate-100 hover:bg-white/[0.12]"
              }`}
            >
              {isLight ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
            </button>

            {/* Account menu, same style as staff workspace */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                className={`inline-flex h-11 items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-3 transition-all ${
                  isLight
                    ? "border-slate-200 bg-white text-slate-800 shadow-sm hover:border-teal-400/40 hover:shadow-[0_0_0_3px_rgba(45,212,191,0.12)]"
                    : "border-white/10 bg-white/[0.05] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl hover:border-teal-300/30 hover:bg-white/[0.08] hover:shadow-[0_0_0_3px_rgba(45,212,191,0.08)]"
                }`}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[linear-gradient(135deg,rgba(13,148,136,0.55),rgba(34,211,238,0.35))] text-[11px] font-bold text-white">
                    {getInitials(patientUser?.fullName)}
                  </span>
                )}
                <span className="hidden min-w-0 text-left sm:flex sm:flex-col sm:justify-center">
                  <span className={`truncate text-sm font-semibold leading-none ${isLight ? "text-slate-800" : "text-white"}`}>
                    {patientUser?.fullName?.split(" ")[0] ?? "Patient"}
                  </span>
                  <span className={`mt-1 truncate text-[11px] leading-none ${isLight ? "text-teal-700" : "text-teal-200/70"}`}>
                    Patient
                  </span>
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${accountOpen ? "rotate-180" : ""} ${isLight ? "text-slate-400" : "text-slate-400"}`} />
              </button>

              {accountOpen ? (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setAccountOpen(false)} />
                  <div className={`absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[min(15rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border shadow-[0_28px_80px_-28px_rgba(2,6,23,0.8)] backdrop-blur-2xl ${
                    isLight
                      ? "border-slate-200 bg-white text-slate-800"
                      : "border-cyan-200/12 bg-[linear-gradient(180deg,rgba(8,22,38,0.98),rgba(5,17,30,0.98))] text-white"
                  }`}>
                    <div className={`border-b px-4 pb-3.5 pt-4 ${isLight ? "border-slate-100" : "border-white/10"}`}>
                      <div className={`text-sm font-bold ${isLight ? "text-slate-800" : "text-white"}`}>
                        {patientUser?.fullName ?? "Patient"}
                      </div>
                      <div className={`mt-0.5 truncate text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        {patientUser?.email ?? patientUser?.username ?? ""}
                      </div>
                      <span className={`mt-2.5 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ring-1 ring-inset ${
                        isLight
                          ? "bg-teal-500/10 text-teal-700 ring-teal-500/25"
                          : "bg-teal-400/12 text-teal-300 ring-teal-400/25"
                      }`}>
                        Patient
                      </span>
                    </div>

                    <div className="space-y-1 p-2">
                      <NavLink
                        to="/patient/profile"
                        onClick={() => setAccountOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          isLight ? "text-slate-700 hover:bg-slate-100" : "text-slate-100 hover:bg-white/8"
                        }`}
                      >
                        <UserRound className={`h-4 w-4 ${isLight ? "text-teal-600" : "text-cyan-100/78"}`} />
                        My Profile
                      </NavLink>
                      <NavLink
                        to="/patient/settings"
                        onClick={() => setAccountOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          isLight ? "text-slate-700 hover:bg-slate-100" : "text-slate-100 hover:bg-white/8"
                        }`}
                      >
                        <SettingsIcon className={`h-4 w-4 ${isLight ? "text-teal-600" : "text-cyan-100/78"}`} />
                        Settings
                      </NavLink>
                    </div>

                    <div className={`my-1.5 border-t ${isLight ? "border-slate-100" : "border-white/10"}`} />

                    <div className="px-2 pb-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAccountOpen(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
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
      <main className={`flex-1 overflow-y-auto transition-[margin] duration-300 ${navCollapsed ? "lg:ml-24" : "lg:ml-72"}`}>
        <div className="min-h-screen pt-16 lg:pt-20">
          <Outlet context={{ theme, isLight }} />
        </div>
      </main>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`mx-4 w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${isLight ? "border-slate-200 bg-white" : "border-white/15 bg-[#04141f]/95"}`}>
            <div className="flex flex-col items-center text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/15 text-amber-500">
                <AlertTriangle className="h-7 w-7" />
              </span>
              <h3 className={`mt-4 font-display text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                {t("common.logoutConfirm")}
              </h3>
              <p className={`mt-2 text-sm ${isLight ? "text-slate-500" : "text-slate-300"}`}>
                {t("common.logoutConfirmDesc")}
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className={`h-11 flex-1 rounded-xl border text-sm font-semibold transition-colors ${isLight ? "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200" : "border-white/15 bg-white/[0.06] text-slate-100 hover:bg-white/[0.12]"}`}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  patientLogout();
                }}
                className="h-11 flex-1 rounded-xl bg-red-500/80 text-sm font-semibold text-white transition-colors hover:bg-red-500"
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
