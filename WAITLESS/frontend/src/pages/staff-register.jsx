import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AtSign,
  AlertCircle,
  Building,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react";

import { AuthButton, AuthError, AuthInput, AuthSelect, AuthShell } from "@/components/AuthShell";
import { ProfileCompleteness } from "@/components/ProfileCompleteness";
import { ProfilePhotoPicker } from "@/components/ProfilePhotoPicker";
import { createStaffAccessCode, listStaffAccessCodes, registerStaffAccount } from "@/services/authApi";
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
          <Link to="/admin/dashboard" className="font-semibold text-cyan-100 hover:text-white">
            Return to the staff dashboard
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
      footer="Administrator-only account provisioning."
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
            minLength={10}
            maxLength={72}
            autoComplete="new-password"
            placeholder="10+ chars, 3 of: A-Z, a-z, 0-9, !@#"
            value={formData.password}
            onChange={(event) => setFormData({ ...formData, password: event.target.value })}
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
            onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })}
          />

          <div className="col-span-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-slate-300">
            <p className="font-semibold text-cyan-100/80">Password requirements:</p>
            <ul className="mt-1.5 space-y-0.5">
              <li>• At least 10 characters</li>
              <li>• At least 3 of: uppercase letter, lowercase letter, number, symbol</li>
              <li>• Not a commonly used password</li>
            </ul>
          </div>
        </div>

        <AuthButton type="submit" loading={loading}>
          Create staff account
        </AuthButton>
      </form>

      <AccessCodePanel />
    </AuthShell>
  );
}

function AccessCodePanel() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ role: "nurse", department: "", note: "" });
  const [codes, setCodes] = useState([]);
  const [latest, setLatest] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => {
    if (!open) return;
    listStaffAccessCodes()
      .then((res) => setCodes(res?.codes ?? []))
      .catch(() => {});
  }, [open, latest]);

  async function generate() {
    setError("");
    if (!form.department) {
      setError("Choose the department this code should unlock.");
      return;
    }
    setLoading(true);
    try {
      const code = await createStaffAccessCode(form);
      setLatest(code);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code.code);
    } catch {
      /* clipboard unavailable */
    }
    setCopiedId(code.id);
    setTimeout(() => setCopiedId(""), 1600);
  }

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/65">
          <KeyRound className="h-4 w-4" />
          Or invite via staff access code
        </span>
        <span className="text-xs font-semibold text-cyan-100">{open ? "Hide" : "Show"}</span>
      </button>

      {open ? (
        <div className="mt-5 space-y-4">
          <p className="text-sm leading-6 text-slate-300">
            Generate a one-time access code, send it to the staff member, and they
            create their own account at{" "}
            <span className="font-semibold text-cyan-100">Staff sign in → Register</span>.
            Codes expire after 72 hours and can only be used once.
          </p>

          <AuthError icon={AlertCircle} message={error} />

          <div className="grid gap-4 sm:grid-cols-2">
            <AuthSelect
              icon={Shield}
              label="Role"
              name="codeRole"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </AuthSelect>

            <AuthSelect
              icon={Building}
              label="Department"
              name="codeDepartment"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </AuthSelect>
          </div>

          <AuthInput
            icon={KeyRound}
            label="Note (optional)"
            name="codeNote"
            type="text"
            placeholder="e.g. For the new triage nurse starting Monday"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />

          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-teal-300/25 bg-teal-400/10 px-4 text-sm font-bold uppercase tracking-[0.08em] text-teal-100 transition hover:bg-teal-400/15 disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate access code"}
          </button>

          {latest ? (
            <div className="rounded-xl border border-teal-300/30 bg-teal-400/[0.08] px-4 py-4">
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-teal-200/80">
                New code, send to the staff member
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="font-display text-2xl font-bold tracking-[0.12em] text-white">
                  {latest.code}
                </span>
                <button
                  type="button"
                  onClick={() => copyCode(latest)}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  {copiedId === latest.id ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedId === latest.id ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="mt-1 text-xs text-slate-300">
                {latest.role.replace("-", " ")} · {latest.department} · expires{" "}
                {new Date(latest.expiresAt).toLocaleDateString()}
              </div>
            </div>
          ) : null}

          {codes.length ? (
            <div>
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Issued codes
              </div>
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
                {codes.map((code) => (
                  <div
                    key={code.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-semibold tracking-wider text-white">
                        {code.code}
                      </div>
                      <div className="truncate text-xs text-slate-400">
                        {code.role.replace("-", " ")} · {code.department}
                        {code.note ? ` · ${code.note}` : ""}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {code.usedAt ? (
                        <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-emerald-200">
                          Used
                        </span>
                      ) : new Date(code.expiresAt).getTime() < Date.now() ? (
                        <span className="rounded-full bg-rose-400/15 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-rose-200">
                          Expired
                        </span>
                      ) : (
                        <>
                          <span className="rounded-full bg-cyan-400/15 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-cyan-200">
                            Active
                          </span>
                          <button
                            type="button"
                            onClick={() => copyCode(code)}
                            className="grid h-7 w-7 place-items-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white"
                            aria-label="Copy code"
                          >
                            {copiedId === code.id ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
