import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AtSign,
  AlertCircle,
  Building,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react";

import { AuthButton, AuthError, AuthInput, AuthSelect, AuthShell } from "@/components/AuthShell";
import { ProfileCompleteness } from "@/components/ProfileCompleteness";
import { ProfilePhotoPicker } from "@/components/ProfilePhotoPicker";
import { registerStaffAccount } from "@/services/authApi";
import { getStaffInitials } from "@/services/staffProfilePrefs";

const DEPARTMENTS = [
  "OPD",
  "Pharmacy",
  "Laboratory",
  "Radiology",
  "OI Clinic",
  "Casualty / Triage",
];

const ROLES = [
  { value: "nurse", label: "Nurse" },
  { value: "doctor", label: "Doctor" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "lab-tech", label: "Lab Technician" },
  { value: "radiologist", label: "Radiologist" },
  { value: "receptionist", label: "Receptionist" },
  { value: "admin", label: "Administrator" },
];

const INITIAL_FORM = {
  fullName: "",
  username: "",
  email: "",
  phone: "",
  department: "",
  role: "nurse",
  employeeId: "",
  password: "",
  confirmPassword: "",
  avatarBase64: "",
  avatarPreview: "",
};

export default function StaffRegisterPage() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const profileCompletion = Math.round(
    ([
      formData.fullName,
      formData.username,
      formData.email,
      formData.phone,
      formData.department,
      formData.employeeId,
      formData.password,
      formData.confirmPassword,
      formData.avatarBase64,
    ].filter((value) => String(value).trim()).length /
      9) *
      100,
  );

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
      await registerStaffAccount({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        role: formData.role,
        employeeId: formData.employeeId,
        password: formData.password,
        avatarBase64: formData.avatarBase64 || undefined,
      });

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
        eyebrow="Staff onboarding"
        title="Account created"
        subtitle="The staff profile is ready for secure WaitLess access."
        footer={
          <Link to="/admin/login" className="font-semibold text-cyan-100 hover:text-white">
            Sign in to the staff console
          </Link>
        }
      >
        <div className="space-y-5 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-400/18 text-green-100">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <button
            type="button"
            onClick={() => {
              setSuccess(false);
              setFormData(INITIAL_FORM);
            }}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/14 bg-white/10 px-4 text-sm font-bold uppercase tracking-[0.08em] text-white transition hover:bg-white/15"
          >
            Register another staff member
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Staff onboarding"
      title="Create staff access"
      subtitle="Add a secure user profile with department and role permissions for the hospital workflow."
      wide
      footer={
        <>
          Already registered?{" "}
          <Link to="/admin/login" className="font-semibold text-cyan-100 hover:text-white">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthError icon={AlertCircle} message={error} />

        <div className="grid items-center gap-6 border-b border-white/10 pb-6 sm:grid-cols-[12rem_minmax(0,1fr)]">
          <ProfilePhotoPicker
            value={formData.avatarPreview}
            initials={getStaffInitials(formData.fullName || "New staff")}
            onImageReady={({ base64, dataUrl }) =>
              setFormData((current) => ({
                ...current,
                avatarBase64: base64,
                avatarPreview: dataUrl,
              }))
            }
            label="Choose staff profile photo"
            size="compact"
          />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/65">
              Profile photo
            </div>
            <h2 className="mt-2 font-display text-xl font-bold text-white">
              Give this account a recognisable face
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              The photo will appear in the staff header, profile, and account menu.
            </p>
            <ProfileCompleteness value={profileCompletion} className="mt-5" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthInput
            icon={User}
            label="Full name"
            name="fullName"
            type="text"
            required
            placeholder="Dr. Sarah Chenaka"
            value={formData.fullName}
            onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
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
            onChange={(event) => setFormData({ ...formData, username: event.target.value })}
          />

          <AuthInput
            icon={Mail}
            label="Email address"
            name="email"
            type="email"
            required
            placeholder="sarah.chenaka@hospital.gov.zw"
            value={formData.email}
            onChange={(event) => setFormData({ ...formData, email: event.target.value })}
          />

          <AuthInput
            icon={Phone}
            label="Phone number"
            name="phone"
            type="tel"
            required
            placeholder="+263 77 123 4567"
            value={formData.phone}
            onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
          />

          <AuthInput
            icon={Shield}
            label="Employee ID"
            name="employeeId"
            type="text"
            required
            placeholder="EMP-2026-001"
            value={formData.employeeId}
            onChange={(event) => setFormData({ ...formData, employeeId: event.target.value })}
          />

          <AuthSelect
            icon={Building}
            label="Department"
            name="department"
            required
            value={formData.department}
            onChange={(event) => setFormData({ ...formData, department: event.target.value })}
          >
            <option value="">Select department</option>
            {DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </AuthSelect>

          <AuthSelect
            icon={Shield}
            label="Role"
            name="role"
            required
            value={formData.role}
            onChange={(event) => setFormData({ ...formData, role: event.target.value })}
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </AuthSelect>

          <AuthInput
            icon={Lock}
            label="Password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Minimum 8 characters"
            value={formData.password}
            onChange={(event) => setFormData({ ...formData, password: event.target.value })}
          />

          <AuthInput
            icon={Lock}
            label="Confirm password"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            placeholder="Repeat password"
            value={formData.confirmPassword}
            onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })}
          />
        </div>

        <AuthButton type="submit" loading={loading}>
          Create staff account
        </AuthButton>
      </form>
    </AuthShell>
  );
}
