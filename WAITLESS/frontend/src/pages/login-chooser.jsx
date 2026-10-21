import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Lock, ShieldCheck, UserRound } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { resolveStaffLandingPath } from "@/services/staffProfilePrefs";
import { LogoLoader } from "@/components/LogoLoader";
import authBackground from "@/assets/BACKG.png";
import waitlessLogoIcon from "@/assets/waitless-logo-icon.png";

const REMEMBER_KEY = "waitless.rememberedIdentifier";
const RETURN_TO_KEY = "waitless:returnTo";

// After a forced sign-out (idle/session expiry) send the user back to the
// page they were on — only for the workspace matching their account type.
function consumeReturnTo(prefix) {
  const returnTo = window.sessionStorage.getItem(RETURN_TO_KEY);
  if (returnTo?.startsWith(prefix) && !returnTo.startsWith(`${prefix}//`)) {
    window.sessionStorage.removeItem(RETURN_TO_KEY);
    return returnTo;
  }
  return null;
}

export default function UnifiedLoginPage() {
  const navigate = useNavigate();
  const { login: staffLogin } = useAuth();

  const [rememberMe, setRememberMe] = useState(
    () => !!localStorage.getItem(REMEMBER_KEY),
  );
  const [form, setForm] = useState({
    identifier: localStorage.getItem(REMEMBER_KEY) || "",
    password: "",
  });
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

    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, identifier);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    try {
      const session = await staffLogin({
        username: identifier.toLowerCase(),
        password: form.password,
      });
      navigate(consumeReturnTo("/admin") ?? resolveStaffLandingPath(session.user));
    } catch (staffErr) {
      setError(
        staffErr?.message ||
          "Invalid staff credentials. Please check your details and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#04141f] px-4 py-8">
      {/* Same softened background as the register page */}
      <div className="pointer-events-none absolute inset-0">
        <img
          src={authBackground}
          alt=""
          className="h-full w-full scale-[1.04] object-cover blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#04141f]/88 via-[#062a35]/80 to-[#0a1f2e]/84" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04141f]/70 via-transparent to-[#04141f]/35" />
      </div>

      {/* Orbiting radiant ring */}
      <div className="relative w-full max-w-[22rem]">
        <div className="pointer-events-none absolute -inset-[3px] overflow-hidden rounded-[1.3rem]">
          <div
            className="absolute -inset-[150%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(45,212,191,0.85)_45deg,transparent_100deg,transparent_180deg,rgba(59,130,246,0.85)_225deg,transparent_280deg)]"
            style={{ animation: "auth-ring-spin 8s linear infinite" }}
          />
          <div className="absolute inset-[3px] rounded-2xl bg-[#04141f]" />
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#04141f]/60 shadow-[0_32px_80px_-28px_rgba(2,8,20,0.45)] backdrop-blur-2xl">
          <div className="relative z-10">
            {/* Header, same as register */}
            <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(4,20,31,0.82)_0%,rgba(6,42,53,0.72)_48%,rgba(10,31,46,0.78)_100%)] px-5 py-3 text-center sm:px-6">
              <img
                src={waitlessLogoIcon}
                alt="WaitLess"
                className="mx-auto h-12 w-12 object-contain drop-shadow-[0_8px_20px_rgba(20,184,166,0.25)]"
              />
              <div className="mt-1.5">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-400">
                  WaitLess staff portal
                </div>
                <h1 className="mt-0.5 inline-flex items-center gap-3 font-display text-xl font-bold tracking-tight text-white">
                  <span className="h-px w-8 bg-gradient-to-r from-transparent to-teal-300/60" />
                  Staff access
                  <span className="h-px w-8 bg-gradient-to-l from-transparent to-teal-300/60" />
                </h1>
              </div>
              <p className="mt-2 text-[13px] leading-5 text-slate-400">
                Sign in with your staff credentials to open the operations console.
              </p>
            </div>

            {/* Body */}
            <div className="px-5 py-3.5 sm:px-6">
        <form noValidate className="space-y-4" onSubmit={handleSubmit}>
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
                placeholder="Username or email"
                autoComplete="username"
                className="h-12 w-full rounded-full border border-white/8 bg-[#04101f]/80 pl-11 pr-4 text-sm text-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.5),inset_0_-1px_0_rgba(255,255,255,0.04)] placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5),0_0_0_3px_rgba(45,212,191,0.15)]"
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
                placeholder="Password"
                className="h-12 w-full rounded-full border border-white/8 bg-[#04101f]/80 pl-11 pr-11 text-sm text-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.5),inset_0_-1px_0_rgba(255,255,255,0.04)] placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5),0_0_0_3px_rgba(45,212,191,0.15)]"
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

          {/* Remember me + forgot password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/[0.06] accent-teal-500"
              />
              Remember me
            </label>
            <Link
              to="/admin/forgot-password"
              className="font-medium text-teal-300 hover:text-teal-200"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="relative inline-flex h-12 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-6 text-sm font-semibold text-white shadow-[0_14px_30px_-10px_rgba(13,148,136,0.55),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(4,60,54,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-10px_rgba(13,148,136,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              "Signing you in..."
            ) : (
              <>
                Sign in
                <span className="absolute right-1.5 grid h-9 w-9 place-items-center rounded-full bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-5 flex items-center justify-center gap-3 pt-1 text-xs text-slate-500">
          New staff member?{" "}
          <Link to="/admin/staff-signup" className="font-semibold text-teal-300 hover:text-teal-200">
            Use your access code
          </Link>
        </div>
        <div className="mt-3 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-teal-300 transition-colors hover:text-teal-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to portal
          </Link>
        </div>

        {/* Security message, same as register */}
        <div className="mt-4 flex items-center justify-center gap-1.5 border-t border-white/10 pt-2.5 text-[11px] font-medium text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-400/60" />
          Your health information is protected.
        </div>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#04141f]/90 backdrop-blur-md">
          <LogoLoader size={72} decorative />
          <div className="mt-4 text-sm font-semibold text-teal-300">Signing you in...</div>
        </div>
      )}
    </div>
  );
}
