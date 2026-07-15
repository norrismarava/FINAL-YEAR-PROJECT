import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
<<<<<<< HEAD
import { AlertCircle, Lock, User, ShieldCheck } from "lucide-react";

=======
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
>>>>>>> 1b9b1e0 (frontend: auth pages modified-next staff dashboard page(s))

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
    username: "",
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
<<<<<<< HEAD
      await login({ username: formData.username, password: formData.password });
      navigate("/dashboard");
=======
      const email = formData.email.trim();

      if (!email) {
        throw new Error("Please enter your email address.");
      }

      if (!formData.password) {
        throw new Error("Please enter your password.");
      }

      const username = email.split("@")[0];

      const session = await login({
        username,
        password: formData.password,
      });

      navigate(resolveStaffLandingPath(session.user));
>>>>>>> 1b9b1e0 (frontend: auth pages modified-next staff dashboard page(s))
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
            to="/staff-register"
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
          icon={User}
          label="Username"
          name="username"
          type="text"
          autoComplete="username"
          required
<<<<<<< HEAD
          placeholder="e.g. admin"
          value={formData.username}
          onChange={(event) =>
            setFormData({ ...formData, username: event.target.value })
          }
=======
          placeholder="name@hospital.gov.zw"
          value={formData.email}
          onChange={handleChange}
>>>>>>> 1b9b1e0 (frontend: auth pages modified-next staff dashboard page(s))
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
            to="/forgot-password"
            className="font-semibold text-cyan-100 transition hover:text-white"
          >
            Forgot password?
          </Link>
        </div>

        <AuthButton type="submit" loading={loading}>
          <span className="inline-flex items-center gap-2">
            {loading ? "Please wait..." : "SIGN IN"}

<<<<<<< HEAD
        <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-xs leading-5 text-cyan-50/72">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
            <div>
              <div className="font-semibold text-cyan-50">Demo staff accounts</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  "admin",
                  "reception",
                  "triage",
                  "clinician",
                ].map((account) => (
                  <span
                    key={account}
                    className="rounded-full border border-white/10 bg-white/8 px-2 py-1 text-[11px]"
                  >
                    {account}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
=======
            {!loading ? <ArrowRight className="h-4 w-4" /> : null}
          </span>
        </AuthButton>
>>>>>>> 1b9b1e0 (frontend: auth pages modified-next staff dashboard page(s))
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
        {visible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
