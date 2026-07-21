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
      setError("Please enter your full name.");
      return;
    }
    if (!form.username.trim()) {
      setError("Please choose a username.");
      return;
    }
    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(form.username.trim())) {
      setError(
        "Username must be 3 to 32 characters and use only letters, numbers, dots, underscores, or hyphens.",
      );
      return;
    }
    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
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
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PatientAuthShell
      eyebrow="Patient account"
      title="Create your account"
      subtitle="Sign up to book queue spots, track your tickets, and get WhatsApp updates — all from your phone."
      maxWidth="max-w-xl"
      footer={
        <>
          <Link to="/patient/login" className="font-semibold text-teal-700 hover:text-teal-800">
            Already have an account? Sign in
          </Link>
          <span className="text-slate-300">|</span>
          <Link to="/self-register" className="font-medium text-slate-600 hover:text-teal-700">
            Book without an account
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Full name */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Full name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="e.g. Tendai Mukamuri"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                required
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="e.g. tendai.m"
                minLength={3}
                maxLength={32}
                pattern="[A-Za-z0-9._-]+"
                autoComplete="username"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Phone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <PhoneCall className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="077 123 4567"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                required
              />
            </div>
          </div>

          {/* National ID */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">National ID</label>
            <input
              type="text"
              name="nationalId"
              value={form.nationalId}
              onChange={handleChange}
              placeholder="e.g. 63-1234567A83"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/25"
            />
          </div>

          {/* Date of birth */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Date of birth
            </label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/25"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Confirm password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 text-sm font-semibold text-white shadow-[0_14px_34px_-14px_rgba(13,148,136,0.7)] transition-all hover:-translate-y-0.5 hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            "Creating your account..."
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </PatientAuthShell>
  );
}
