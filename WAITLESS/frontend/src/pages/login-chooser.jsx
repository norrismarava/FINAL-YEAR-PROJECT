import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, UserRound } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { usePatientAuth } from "@/auth/PatientAuthProvider";
import { PatientAuthShell } from "@/components/PatientAuthShell";
import { resolveStaffLandingPath } from "@/services/staffProfilePrefs";
import { LogoLoader } from "@/components/LogoLoader";

export default function UnifiedLoginPage() {
  const navigate = useNavigate();
  const { login: staffLogin } = useAuth();
  const { patientLogin } = usePatientAuth();

  const [form, setForm] = useState({ identifier: "", password: "" });
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

    const identifier = form.identifier.trim();
    if (!identifier) {
      setError("Please enter your username or email address.");
      return;
    }
    if (!form.password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const session = await staffLogin({
        username: identifier.toLowerCase(),
        password: form.password,
      });
      navigate(resolveStaffLandingPath(session.user));
      return;
    } catch {
      // Not a staff account — fall through to patient.
    }

    try {
      await patientLogin({
        identifier,
        password: form.password,
      });
      navigate("/patient/dashboard");
    } catch (err) {
      setError(
        err?.message ||
          "Unable to sign in. Please confirm your details and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PatientAuthShell
      eyebrow="Sign in"
      title="Welcome back"
      subtitle="Enter your credentials to continue."
      footer={
        <Link to="/patient/register" className="font-semibold text-teal-300 hover:text-teal-200">
          Create an account
        </Link>
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
            Username or email
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="identifier"
              value={form.identifier}
              onChange={handleChange}
              placeholder="Enter your username or email"
              autoComplete="username"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-white">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
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

        {/* Forgot password */}
        <div className="flex items-center justify-end text-sm">
          <Link
            to="/patient/forgot-password"
            className="font-medium text-teal-300 hover:text-teal-200"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            "Signing you in..."
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#04141f]/90 backdrop-blur-md">
          <LogoLoader size={72} decorative />
          <div className="mt-4 text-sm font-semibold text-teal-300">Signing you in...</div>
        </div>
      )}
    </PatientAuthShell>
  );
}
