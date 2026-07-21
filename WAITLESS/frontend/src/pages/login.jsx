import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import {
  AuthButton,
  AuthError,
  AuthInput,
  AuthShell,
} from "@/components/AuthShell";
import { resolveStaffLandingPath } from "@/services/staffProfilePrefs";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const identifier = formData.identifier.trim().toLowerCase();

      if (!identifier) {
        throw new Error("Please enter your username or email address.");
      }

      if (!formData.password) {
        throw new Error("Please enter your password.");
      }

      const session = await login({
        username: identifier,
        password: formData.password,
      });

      navigate(resolveStaffLandingPath(session.user));
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
    <AuthShell
      eyebrow="Staff access"
      title="Welcome back"
      subtitle="Sign in to the hospital operations console and continue managing live patient flow."
      footer={
        <>
          New staff member?{" "}
          <Link
            to="/admin/staff-register"
            className="inline-flex items-center gap-1 font-semibold text-cyan-100 transition hover:text-white"
          >
            Create staff account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthError icon={AlertCircle} message={error} />

        <AuthInput
          icon={UserRound}
          label="Username or email"
          name="identifier"
          type="text"
          autoComplete="username"
          required
          placeholder="admin or name@hospital.gov.zw"
          value={formData.identifier}
          onChange={handleChange}
        />

        <PasswordInput
          icon={Lock}
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          placeholder="Enter password"
          value={formData.password}
          onChange={handleChange}
          visible={showPassword}
          onToggle={() => setShowPassword((current) => !current)}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <label className="group inline-flex cursor-pointer items-center gap-2.5 text-slate-200/76">
            <span className="relative">
              <input
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="peer sr-only"
              />
              <span className="flex h-5 w-5 items-center justify-center rounded-md border border-cyan-200/18 bg-[rgba(2,12,22,0.42)] backdrop-blur-xl transition peer-checked:border-emerald-300 peer-checked:bg-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5 scale-0 text-[#022c2d] transition peer-checked:scale-100" />
              </span>
            </span>
            <span className="transition group-hover:text-white">
              Keep me signed in
            </span>
          </label>

          <Link
            to="/admin/forgot-password"
            className="font-semibold text-cyan-100 transition hover:text-white"
          >
            Forgot password?
          </Link>
        </div>

        <AuthButton type="submit" loading={loading}>
          <span className="inline-flex items-center gap-2">
            {loading ? "Please wait..." : "SIGN IN"}
            {!loading ? <ArrowRight className="h-4 w-4" /> : null}
          </span>
        </AuthButton>
      </form>
    </AuthShell>
  );
}

function PasswordInput({ onToggle, visible, ...props }) {
  return (
    <div className="relative">
      <AuthInput {...props} className="[&_input]:pr-12" />

      <button
        type="button"
        onClick={onToggle}
        className="absolute bottom-3 right-3 grid h-6 w-6 place-items-center rounded-md text-cyan-100/68 transition hover:bg-white/[0.08] hover:text-white"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
