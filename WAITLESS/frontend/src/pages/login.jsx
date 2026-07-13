import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Lock, User, ShieldCheck } from "lucide-react";


import {
  AuthButton,
  AuthError,
  AuthInput,
  AuthShell,
} from "@/components/AuthShell";
import { useAuth } from "@/auth/AuthProvider";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ username: formData.username, password: formData.password });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
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
          <Link to="/staff-register" className="font-semibold text-cyan-100 hover:text-white">
            Create staff account
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
          placeholder="e.g. admin"
          value={formData.username}
          onChange={(event) =>
            setFormData({ ...formData, username: event.target.value })
          }
        />

        <AuthInput
          icon={Lock}
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Enter password"
          value={formData.password}
          onChange={(event) =>
            setFormData({ ...formData, password: event.target.value })
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <label className="inline-flex items-center gap-2 text-cyan-50/75">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-[#05325f] accent-cyan-300"
            />
            Keep me signed in
          </label>
          <Link to="/forgot-password" className="font-semibold text-cyan-100 hover:text-white">
            Forgot password?
          </Link>
        </div>

        <AuthButton type="submit" loading={loading}>
          Login
        </AuthButton>

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
      </form>
    </AuthShell>
  );
}
