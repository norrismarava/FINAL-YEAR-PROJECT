import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, AtSign, Eye, EyeOff, Lock, LoaderCircle } from "lucide-react";

import { usePatientAuth } from "@/auth/PatientAuthProvider";
import { PatientAuthShell } from "@/components/PatientAuthShell";
import { useTranslation } from "@/i18n/useTranslation";
import { LANGUAGES } from "@/i18n/I18nProvider";
import { LogoLoader } from "@/components/LogoLoader";

export default function PatientLoginPage() {
  const navigate = useNavigate();
  const { patientLogin } = usePatientAuth();
  const { t, lang, changeLang } = useTranslation();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.identifier.trim()) {
      setError(t("login.errorIdentifier"));
      return;
    }
    if (!form.password) {
      setError(t("login.errorPassword"));
      return;
    }

    setLoading(true);
    try {
      await patientLogin({
        identifier: form.identifier,
        password: form.password,
      });
      navigate("/patient/dashboard");
    } catch (err) {
      setError(err.message || t("login.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <PatientAuthShell
      eyebrow={t("login.eyebrow")}
      title={t("login.title")}
      subtitle={t("login.subtitle")}
      footer={
        <>
          <Link to="/patient/register" className="font-semibold text-teal-300 hover:text-teal-200">
            {t("login.newUser")}
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        {/* Account identifier */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-white">
            {t("login.identifier")}
          </label>
          <div className="relative">
            <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="identifier"
              value={form.identifier}
              onChange={handleChange}
              placeholder={t("login.identifierPlaceholder")}
              autoComplete="username"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-white">{t("login.password")}</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={t("login.passwordPlaceholder")}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-11 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 text-teal-500 focus:ring-teal-400/20"
            />
            {t("login.rememberMe")}
          </label>
          <Link
            to="/patient/forgot-password"
            className="text-sm font-medium text-teal-300 hover:text-teal-200"
          >
            {t("login.forgotPassword")}
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            t("login.signingIn")
          ) : (
            <>
              {t("login.signin")}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#04141f]/90 backdrop-blur-md">
          <LogoLoader size={72} decorative />
          <div className="mt-4 text-sm font-semibold text-teal-300">{t("login.signingYouIn")}</div>
          <div className="mt-1 text-xs text-slate-400">{t("login.loadingDashboard")}</div>
        </div>
      )}
    </PatientAuthShell>
  );
}
