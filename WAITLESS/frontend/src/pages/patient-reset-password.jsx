import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";

import { PatientAuthShell } from "@/components/PatientAuthShell";
import { resetPatientPassword } from "@/services/patientAuthApi";
import { useTranslation } from "@/i18n/useTranslation";

export default function PatientResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError(t("reset.errorMismatch"));
      return;
    }

    if (form.password.length < 6) {
      setError(t("reset.errorLength"));
      return;
    }

    setLoading(true);
    try {
      await resetPatientPassword({ token, password: form.password });
      setSuccess(true);
    } catch (err) {
      setError(err.message || t("reset.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <PatientAuthShell
        eyebrow={t("reset.eyebrow")}
        title={t("reset.successTitle")}
        subtitle={t("reset.successSubtitle")}
      >
        <div className="space-y-4 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal-500/15 text-teal-300">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <Link
            to="/login"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5"
          >
            {t("reset.signIn")}
          </Link>
        </div>
      </PatientAuthShell>
    );
  }

  return (
    <PatientAuthShell
      eyebrow={t("reset.eyebrow")}
      title={t("reset.title")}
      subtitle={token ? t("reset.subtitle") : t("reset.missingToken")}
      footer={
        <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-teal-300 hover:text-teal-200">
          <ArrowLeft className="h-3 w-3" />
          {t("forgot.backToLogin")}
        </Link>
      }
    >
      <form noValidate className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-white">
            {t("reset.newPassword")}
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder={t("reset.newPasswordPlaceholder")}
              autoComplete="new-password"
              minLength={6}
              maxLength={72}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-11 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-white">
            {t("reset.confirmPassword")}
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              placeholder={t("reset.confirmPasswordPlaceholder")}
              autoComplete="new-password"
              minLength={6}
              maxLength={72}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t("reset.submitting") : t("reset.submit")}
        </button>
      </form>
    </PatientAuthShell>
  );
}
