import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";

import {
  AuthButton,
  AuthError,
  AuthInput,
  AuthShell,
} from "@/components/AuthShell";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthShell
        eyebrow="Password reset"
        title="Access restored"
        subtitle="Your password has been reset. You can now sign in with the new credentials."
      >
        <div className="space-y-5 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-400/18 text-green-100">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <Link
            to="/login"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#062653] px-4 text-sm font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#083a73]"
          >
            Sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Password reset"
      title="Create new password"
      subtitle="Choose a strong password before returning to the WaitLess staff console."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthError icon={AlertCircle} message={error} />

        <PasswordInput
          icon={Lock}
          label="New password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          placeholder="Minimum 8 characters"
          value={formData.password}
          onChange={(event) =>
            setFormData({ ...formData, password: event.target.value })
          }
          onToggle={() => setShowPassword(!showPassword)}
          visible={showPassword}
        />

        <PasswordInput
          icon={Lock}
          label="Confirm password"
          name="confirmPassword"
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          placeholder="Repeat password"
          value={formData.confirmPassword}
          onChange={(event) =>
            setFormData({ ...formData, confirmPassword: event.target.value })
          }
          onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          visible={showConfirmPassword}
        />

        <AuthButton type="submit" loading={loading}>
          Reset password
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
        className="absolute bottom-3 right-3 grid h-6 w-6 place-items-center text-cyan-100/70 hover:text-white"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
