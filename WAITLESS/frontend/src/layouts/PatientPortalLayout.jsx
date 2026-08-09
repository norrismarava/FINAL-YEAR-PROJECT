import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UserRound,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  Sun,
  Moon,
  Camera,
  CalendarDays,
  Globe,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import authBackground from "@/assets/BACKG.png";
import waitlessLogoIcon from "@/assets/waitless-logo-icon.png";
import { usePatientAuth } from "@/auth/PatientAuthProvider";
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [theme, setTheme] = useState(loadTheme);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("waitless_patient_avatar");
    if (stored) setAvatarUrl(stored);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    saveTheme(next);
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setAvatarUrl(dataUrl);
      window.localStorage.setItem("waitless_patient_avatar", dataUrl);
    };
    reader.readAsDataURL(file);
  }

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
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-teal-400/15 border-t-teal-400" />
        </div>
      </section>
    );
  }

  if (!isPatientAuthenticated) {
    return <Navigate to="/patient/login" replace />;
  }

  const sidebarBg = isLight
    ? "bg-white/80 border-slate-200"
    : "bg-[#04141f]/70 border-white/10";
  const sidebarText = isLight ? "text-slate-700" : "text-slate-300";
  const sidebarActive = isLight
    ? "bg-teal-500/10 text-teal-700"
    : "bg-teal-500/15 text-teal-300";
  const sidebarHover = isLight
    ? "hover:bg-slate-100 hover:text-slate-900"
    : "hover:bg-white/[0.06] hover:text-white";
  const logoText = isLight ? "text-slate-900" : "text-white/80";
  const logoAccent = isLight ? "text-teal-600" : "text-teal-400";
  const borderColor = isLight ? "border-slate-200" : "border-white/10";
  const mainBg = isLight ? "bg-[#f0f5f6]" : "";
  const mainText = isLight ? "text-slate-900" : "text-white";
  const mobileBarBg = isLight
    ? "bg-white/80 border-slate-200"
    : "bg-[#04141f]/80 border-white/10";

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

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-20 flex h-full w-72 flex-col border-r ${sidebarBg} backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6">
          <img src={waitlessLogoIcon} alt="WaitLess" className="h-11 w-11 rounded-lg object-contain" />
          <div>
            <div className={`text-[10px] font-bold uppercase tracking-[0.22em] ${logoAccent}`}>
              Patient Portal
            </div>
            <div className={`text-sm font-medium ${logoText}`}>WaitLess</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 px-4">
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
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  active ? sidebarActive : `${sidebarText} ${sidebarHover}`
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {t(item.labelKey)}
              </NavLink>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className={`border-t ${borderColor} px-4 py-4`}>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${sidebarText} hover:bg-red-500/10 hover:text-red-300`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {t("nav.signout")}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto lg:ml-72">
        <div className="min-h-screen pt-16 lg:pt-0">
          {/* Top bar */}
          <div className={`sticky top-0 z-10 flex items-center justify-end gap-3 border-b ${borderColor} px-4 py-3 backdrop-blur-xl sm:px-6 ${isLight ? "bg-white/60" : "bg-[#04141f]/40"}`}>
            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors ${
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
              onClick={toggleTheme}
              title={isLight ? "Switch to dark mode" : "Switch to light mode"}
              className={`grid h-9 w-9 place-items-center rounded-lg border transition-colors ${
                isLight
                  ? "border-slate-200 bg-slate-100 text-amber-500 hover:bg-slate-200"
                  : "border-white/15 bg-white/[0.06] text-amber-300 hover:bg-white/[0.12]"
              }`}
            >
              {isLight ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Profile avatar */}
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="h-10 w-10 rounded-xl object-cover"
                />
              ) : (
                <span className={`grid h-10 w-10 place-items-center rounded-xl text-xs font-bold ${isLight ? "bg-teal-500/15 text-teal-700" : "bg-teal-500/15 text-teal-300"}`}>
                  {getInitials(patientUser?.fullName)}
                </span>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 transition-transform hover:scale-110 ${
                  isLight
                    ? "border-white bg-teal-600 text-white"
                    : "border-[#04141f] bg-teal-500 text-white"
                }`}
                title="Upload photo"
              >
                <Camera className="h-3 w-3" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

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
