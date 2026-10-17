import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  AtSign,
  CalendarDays,
  Eye,
  EyeOff,
  Lock,
  Mail,
  PhoneCall,
  UserRound,
} from "lucide-react";

import { usePatientAuth } from "@/auth/PatientAuthProvider";
import { PatientAuthShell } from "@/components/PatientAuthShell";
import { registerPatientAccount } from "@/services/patientAuthApi";
import { useTranslation } from "@/i18n/useTranslation";

const INITIAL_FORM = {
  fullName: "",
  username: "",
  email: "",
  phone: "",
  nationalId: "",
  dob: "",
  gender: "female",
  password: "",
  confirmPassword: "",
};

export default function PatientRegisterPage() {
  const navigate = useNavigate();
  const { patientLogin } = usePatientAuth();
  const { t } = useTranslation();
  const [form, setForm] = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.fullName.trim()) {
      setError(t("register.errorFullName"));
      return;
    }
    if (!form.username.trim()) {
      setError(t("register.errorUsername"));
      return;
    }
    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(form.username.trim())) {
      setError(t("register.errorUsernameFormat"));
      return;
    }
    if (!form.email.trim()) {
      setError(t("register.errorEmail"));
      return;
    }
    if (!form.phone.trim()) {
      setError(t("register.errorPhone"));
      return;
    }
    if (!form.nationalId.trim()) {
      setError(t("register.errorNationalId"));
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError(t("register.errorPassword"));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t("register.errorPasswordMatch"));
      return;
    }

    setLoading(true);
    try {
      await registerPatientAccount({
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        phone: form.phone,
        nationalId: form.nationalId,
        dob: form.dob,
        gender: form.gender,
        password: form.password,
      });

      await patientLogin({
        identifier: form.username,
        password: form.password,
      });

      navigate("/patient/dashboard");
    } catch (err) {
      setError(err.message || t("register.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <PatientAuthShell
      eyebrow={t("register.eyebrow")}
      title={t("register.title")}
      subtitle={t("register.subtitle")}
      maxWidth="max-w-lg"
      footer={
        <>
          <Link to="/login" className="font-semibold text-teal-300 hover:text-teal-200">
            {t("register.haveAccount")}
          </Link>
          <span className="text-white/20">|</span>
          <Link to="/self-register" className="font-medium text-slate-300 hover:text-teal-300">
            {t("register.bookWithout")}
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Full name */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-white">
              {t("register.fullName")} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder={t("register.fullNamePlaceholder")}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                required
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white">
              {t("register.username")} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder={t("register.usernamePlaceholder")}
                minLength={3}
                maxLength={32}
                pattern="[A-Za-z0-9._-]+"
                autoComplete="username"
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white">
              {t("register.email")} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder={t("register.emailPlaceholder")}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white">
              {t("register.phone")} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <PhoneCall className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder={t("register.phonePlaceholder")}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                required
              />
            </div>
          </div>

          {/* National ID */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white">
              {t("register.nationalId")} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="nationalId"
              value={form.nationalId}
              onChange={handleChange}
              placeholder={t("register.nationalIdPlaceholder")}
              required
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
            />
          </div>

          {/* Date of birth */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white">
              {t("register.dob")}
            </label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white">
              {t("register.password")} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder={t("register.passwordPlaceholder")}
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

          {/* Confirm password */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white">
              {t("register.confirmPassword")} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder={t("register.confirmPasswordPlaceholder")}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            t("register.creating")
          ) : (
            <>
              {t("register.createAccount")}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </PatientAuthShell>
  );
}
