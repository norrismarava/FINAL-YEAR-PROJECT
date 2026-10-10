import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  AtSign,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";

import { AuthButton, AuthError, AuthInput, AuthShell } from "@/components/AuthShell";
import { staffSelfRegister } from "@/services/authApi";

const INITIAL_FORM = {
  accessCode: "",
  fullName: "",
  username: "",
  email: "",
  phone: "",
  employeeId: "",
  password: "",
  confirmPassword: "",
};

export default function StaffSignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: name === "accessCode" ? value.toUpperCase() : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!formData.accessCode.trim()) {
      setError("Enter the staff access code your administrator gave you.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 10) {
      setError("Password must be at least 10 characters long.");
      return;
    }

    const charGroups = [
      /[a-z]/.test(formData.password),
      /[A-Z]/.test(formData.password),
      /\d/.test(formData.password),
      /[^A-Za-z0-9]/.test(formData.password),
    ].filter(Boolean).length;

    if (charGroups < 3) {
      setError("Password must include at least three of: uppercase letters, lowercase letters, numbers, and symbols.");
      return;
    }

    setLoading(true);

    try {
      const response = await staffSelfRegister({
        accessCode: formData.accessCode.trim(),
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        employeeId: formData.employeeId,
        password: formData.password,
      });
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <AuthShell
        eyebrow="Staff onboarding"
        title="Account created"
        subtitle="Your staff account is ready. Sign in to open the operations console."
        footer={
          <Link to="/admin/login" className="font-semibold text-cyan-100 hover:text-white">
            Back to staff sign in
          </Link>
        }
      >
        <div className="space-y-5 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-400/15 text-emerald-200">
            <CheckCircle2 className="h-8 w-8" />
          </span>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3">
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">Assigned role</div>
              <div className="mt-1 font-semibold capitalize text-white">{result.assignedRole?.replace("-", " ")}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3">
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">Department</div>
              <div className="mt-1 font-semibold text-white">{result.assignedDepartment}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/login")}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#0d9488,#14b8a6_50%,#0f766e)] px-4 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[0_24px_48px_-28px_rgba(13,148,136,0.74)] transition hover:-translate-y-0.5 hover:brightness-110"
          >
            Sign in now
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Staff onboarding"
      title="Create your account"
      subtitle="Register with the staff access code sent to you by an administrator. Your role and department are assigned automatically."
      footer={
        <span>
          Already registered?{" "}
          <Link to="/admin/login" className="font-semibold text-cyan-100 hover:text-white">
            Sign in
          </Link>
        </span>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthError icon={AlertCircle} message={error} />

        <AuthInput
          icon={KeyRound}
          label="Staff access code"
          name="accessCode"
          type="text"
          required
          autoComplete="off"
          placeholder="WL-XXXXXX-XXXXXX"
          value={formData.accessCode}
          onChange={handleChange}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthInput
            icon={User}
            label="Full name"
            name="fullName"
            type="text"
            required
            placeholder="Dr. Sarah Chenaka"
            value={formData.fullName}
            onChange={handleChange}
          />

          <AuthInput
            icon={AtSign}
            label="Username"
            name="username"
            type="text"
            required
            minLength={3}
            maxLength={32}
            pattern="[A-Za-z0-9._-]+"
            autoComplete="username"
            placeholder="sarah.chenaka"
            value={formData.username}
            onChange={handleChange}
          />

          <AuthInput
            icon={Mail}
            label="Email address"
            name="email"
            type="email"
            required
            placeholder="sarah.chenaka@hospital.gov.zw"
            value={formData.email}
            onChange={handleChange}
          />

          <AuthInput
            icon={Phone}
            label="Phone number"
            name="phone"
            type="tel"
            required
            placeholder="+263 77 123 4567"
            value={formData.phone}
            onChange={handleChange}
          />

          <div className="sm:col-span-2">
            <AuthInput
              icon={Shield}
              label="Employee ID"
              name="employeeId"
              type="text"
              placeholder="EMP-2026-001 (optional)"
              value={formData.employeeId}
              onChange={handleChange}
            />
          </div>

          <AuthInput
            icon={Lock}
            label="Password"
            name="password"
            type="password"
            required
            minLength={10}
            maxLength={72}
            autoComplete="new-password"
            placeholder="10+ chars, 3 of: A-Z, a-z, 0-9, !@#"
            value={formData.password}
            onChange={handleChange}
          />

          <AuthInput
            icon={Lock}
            label="Confirm password"
            name="confirmPassword"
            type="password"
            required
            minLength={10}
            maxLength={72}
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold text-cyan-100/80">
            <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
            Your role and department are locked to the access code — you cannot change them here.
          </p>
        </div>

        <AuthButton type="submit" loading={loading}>
          <span className="inline-flex items-center gap-2">
            {loading ? "Verifying access code..." : "Create staff account"}
            {!loading ? <ArrowRight className="h-4 w-4" /> : null}
          </span>
        </AuthButton>
      </form>
    </AuthShell>
  );
}
