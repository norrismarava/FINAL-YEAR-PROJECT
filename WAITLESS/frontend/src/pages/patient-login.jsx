import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, AtSign, Eye, EyeOff, Lock, Search } from "lucide-react";

import { usePatientAuth } from "@/auth/PatientAuthProvider";
import { PatientAuthShell } from "@/components/PatientAuthShell";

export default function PatientLoginPage() {
  const navigate = useNavigate();
  const { patientLogin } = usePatientAuth();
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
      setError("Please enter your username or email address.");
      return;
    }
    if (!form.password) {
      setError("Please enter your password.");
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
      setError(err.message || "Unable to sign in. Please check your details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PatientAuthShell
      eyebrow="User portal"
      title="Welcome back"
      subtitle="Sign in to view your tickets, track your queue position, and manage your visits."
      footer={
        <>
          <Link to="/patient/register" className="font-semibold text-teal-700 hover:text-teal-800">
            New user? Create an account
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            to="/track"
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 font-medium text-slate-600 transition-colors hover:border-teal-400 hover:text-teal-700"
          >
            <Search className="h-3 w-3" />
            Track a ticket
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

        {/* Account identifier */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Username or email
          </label>
          <div className="relative">
            <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="identifier"
              value={form.identifier}
              onChange={handleChange}
              placeholder="Username or you@example.com"
              autoComplete="username"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/25"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
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

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600/25"
            />
            Remember me
          </label>
          <Link
            to="/admin/forgot-password"
            className="text-sm font-medium text-teal-700 hover:text-teal-800"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 text-sm font-semibold text-white shadow-[0_14px_34px_-14px_rgba(13,148,136,0.7)] transition-all hover:-translate-y-0.5 hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            "Signing in..."
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </PatientAuthShell>
  );
}
