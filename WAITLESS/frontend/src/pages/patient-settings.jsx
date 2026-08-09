import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Bell,
  Lock,
  ShieldCheck,
  Save,
  LoaderCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Smartphone,
  MessageSquare,
  BellRing,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";

import { usePatientAuth } from "@/auth/PatientAuthProvider";
import { changePatientPassword } from "@/services/patientAuthApi";
import { useWebPush } from "@/hooks/useWebPush";
import { useTranslation } from "@/i18n/useTranslation";

const PREFS_KEY = "waitless_patient_prefs_v1";

const DEFAULT_PREFS = {
  whatsappNotifications: true,
  emailNotifications: true,
  turnReminders: true,
  missedTurnAlerts: true,
  prescriptionReadyAlerts: true,
};

function loadPrefs() {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(prefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export default function PatientSettingsPage() {
  const { patientUser } = usePatientAuth();
  const { isLight } = useOutletContext() || { isLight: false };
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState(loadPrefs);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const push = useWebPush({
    onSubscription: () => toast.success(t("settings.pushSubscribed")),
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  function togglePref(key) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    savePrefs(next);
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  }

  function handlePasswordChange(e) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setPasswordSaving(true);
    setPasswordSaved(false);
    changePatientPassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
      .then(() => {
        setPasswordSaved(true);
        toast.success("Password changed successfully");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setPasswordSaved(false), 3000);
      })
      .catch((err) => {
        toast.error(err.message || "Failed to change password");
      })
      .finally(() => setPasswordSaving(false));
  }

  const headingText = isLight ? "text-slate-900" : "text-white";
  const subtext = isLight ? "text-slate-500" : "text-slate-300";
  const tealAccent = isLight ? "text-teal-600" : "text-teal-300";
  const cardClass = isLight
    ? "rounded-2xl border border-slate-200 bg-white/80 p-6"
    : "rounded-2xl border border-white/15 bg-white/[0.06] p-6";
  const inputClass = isLight
    ? "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-teal-500/50 focus:bg-slate-50"
    : "w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 pr-11 text-sm text-white placeholder-slate-400 outline-none transition-colors focus:border-teal-400/50 focus:bg-white/[0.08]";
  const labelClass = isLight
    ? "mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600"
    : "mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-300";
  const toggleRowClass = isLight
    ? "flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
    : "flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4";
  const toggleTitleClass = isLight ? "font-semibold text-slate-900" : "font-semibold text-white";
  const toggleDescClass = isLight ? "mt-1 text-xs text-slate-500" : "mt-1 text-xs text-slate-300";
  const toggleIconClass = isLight ? "h-4 w-4 text-teal-600/80" : "h-4 w-4 text-teal-400/80";
  const securityRowClass = isLight
    ? "flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
    : "flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3";
  const securityLabelClass = isLight ? "text-slate-600" : "text-slate-300";
  const securityValueClass = isLight ? "font-medium text-slate-900" : "font-medium text-slate-100";
  const eyeBtnClass = isLight ? "text-slate-400 hover:text-slate-600" : "text-slate-400 hover:text-slate-200";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className={`font-display text-2xl font-bold tracking-tight ${headingText}`}>
          Settings
        </h1>
        <p className={`mt-1 text-sm ${subtext}`}>
          Manage your notification preferences and account security.
        </p>
      </div>

      {/* Notification preferences */}
      <div className={`mb-6 ${cardClass}`}>
        <div className="mb-5 flex items-center gap-2">
          <Bell className={`h-5 w-5 ${tealAccent}`} />
          <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
            Notification Preferences
          </h2>
        </div>

        <div className="space-y-4">
          <ToggleRow
            icon={MessageSquare}
            title="WhatsApp notifications"
            description="Receive queue updates via WhatsApp"
            checked={prefs.whatsappNotifications}
            onChange={() => togglePref("whatsappNotifications")}
            toggleRowClass={toggleRowClass}
            toggleTitleClass={toggleTitleClass}
            toggleDescClass={toggleDescClass}
            toggleIconClass={toggleIconClass}
          />
          <ToggleRow
            icon={Bell}
            title="Email notifications"
            description="Receive queue updates via email"
            checked={prefs.emailNotifications}
            onChange={() => togglePref("emailNotifications")}
            toggleRowClass={toggleRowClass}
            toggleTitleClass={toggleTitleClass}
            toggleDescClass={toggleDescClass}
            toggleIconClass={toggleIconClass}
          />
          <ToggleRow
            icon={Smartphone}
            title="Turn reminders"
            description="Get notified when your turn is approaching"
            checked={prefs.turnReminders}
            onChange={() => togglePref("turnReminders")}
            toggleRowClass={toggleRowClass}
            toggleTitleClass={toggleTitleClass}
            toggleDescClass={toggleDescClass}
            toggleIconClass={toggleIconClass}
          />
          <ToggleRow
            icon={Bell}
            title="Missed turn alerts"
            description="Get alerted if you miss your turn"
            checked={prefs.missedTurnAlerts}
            onChange={() => togglePref("missedTurnAlerts")}
            toggleRowClass={toggleRowClass}
            toggleTitleClass={toggleTitleClass}
            toggleDescClass={toggleDescClass}
            toggleIconClass={toggleIconClass}
          />
          <ToggleRow
            icon={Bell}
            title="Prescription ready alerts"
            description="Get notified when your prescription is ready for collection"
            checked={prefs.prescriptionReadyAlerts}
            onChange={() => togglePref("prescriptionReadyAlerts")}
            toggleRowClass={toggleRowClass}
            toggleTitleClass={toggleTitleClass}
            toggleDescClass={toggleDescClass}
            toggleIconClass={toggleIconClass}
          />
        </div>

        {prefsSaved && (
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Preferences saved
          </div>
        )}
      </div>

      {/* Change password */}
      <form
        onSubmit={handlePasswordChange}
        className={`mb-6 ${cardClass}`}
      >
        <div className="mb-5 flex items-center gap-2">
          <Lock className={`h-5 w-5 ${tealAccent}`} />
          <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
            Change Password
          </h2>
        </div>

        <div className="space-y-5">
          {/* Current password */}
          <div>
            <label className={labelClass}>
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                }
                className={inputClass}
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${eyeBtnClass}`}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className={labelClass}>
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                }
                className={inputClass}
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${eyeBtnClass}`}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className={labelClass}>
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                }
                className={inputClass}
                placeholder="Re-enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${eyeBtnClass}`}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={passwordSaving}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {passwordSaving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : passwordSaved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {passwordSaving ? "Updating..." : passwordSaved ? "Password Updated!" : "Update Password"}
          </button>
        </div>
      </form>

      {/* Web push notifications */}
      <div className={`mb-6 ${cardClass}`}>
        <div className="mb-5 flex items-center gap-2">
          <BellRing className={`h-5 w-5 ${tealAccent}`} />
          <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
            {t("settings.pushTitle")}
          </h2>
        </div>
        <p className={`mb-4 text-sm ${subtext}`}>
          {t("settings.pushDesc")}
        </p>
        {!push.supported ? (
          <div className={`rounded-xl border px-4 py-3 text-sm ${isLight ? "border-amber-200 bg-amber-50 text-amber-700" : "border-amber-500/20 bg-amber-500/10 text-amber-300"}`}>
            {t("settings.pushUnsupported")}
          </div>
        ) : push.subscribed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {t("settings.pushActive")}
            </div>
            <button
              onClick={() => push.unsubscribe().then(() => toast.success(t("settings.pushUnsubscribed")))}
              className={`inline-flex h-9 items-center gap-2 rounded-xl border px-4 text-xs font-semibold transition-colors ${isLight ? "border-slate-200 text-slate-600 hover:bg-slate-100" : "border-white/15 text-slate-300 hover:bg-white/10"}`}
            >
              {t("settings.pushUnsubscribe")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => push.subscribe()}
            disabled={push.permission === "denied"}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            <BellRing className="h-4 w-4" />
            {t("settings.pushEnable")}
          </button>
        )}
        {push.permission === "denied" && (
          <p className={`mt-2 text-xs ${isLight ? "text-red-600" : "text-red-400"}`}>
            {t("settings.pushDenied")}
          </p>
        )}
      </div>

      {/* Security info */}
      <div className={cardClass}>
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className={`h-5 w-5 ${tealAccent}`} />
          <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
            Account Security
          </h2>
        </div>
        <div className={`space-y-3 text-sm ${subtext}`}>
          <div className={securityRowClass}>
            <span className={securityLabelClass}>Account username</span>
            <span className={`font-medium ${securityValueClass}`}>
              {patientUser?.username ?? "N/A"}
            </span>
          </div>
          <div className={securityRowClass}>
            <span className={securityLabelClass}>Last login</span>
            <span className={`font-medium ${securityValueClass}`}>
              {patientUser?.lastLoginAt
                ? new Date(patientUser.lastLoginAt).toLocaleString()
                : "N/A"}
            </span>
          </div>
          <div className={securityRowClass}>
            <span className={securityLabelClass}>Account created</span>
            <span className={`font-medium ${securityValueClass}`}>
              {patientUser?.createdAt
                ? new Date(patientUser.createdAt).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ icon: Icon, title, description, checked, onChange, toggleRowClass, toggleTitleClass, toggleDescClass, toggleIconClass }) {
  return (
    <div className={toggleRowClass}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Icon className={toggleIconClass} />
          <div className={toggleTitleClass}>{title}</div>
        </div>
        <div className={toggleDescClass}>{description}</div>
      </div>
      <label className="relative inline-flex shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <div className="h-6 w-11 rounded-full bg-white/10 transition-colors peer-checked:bg-teal-500/60 peer-focus:outline-none" />
        <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </label>
    </div>
  );
}
