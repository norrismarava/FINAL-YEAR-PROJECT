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
import { createStaffAccessCode, listStaffAccessCodes, registerStaffAccount } from "@/services/authApi";


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
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  phone: "",
  role: "nurse",
  department: "OPD",
  password: "",
};

/**
 * Compact staff-creation form — credentials, role, department and a
 * temporary password the user changes from their own account later.
 * Used on /admin/staff and in the Users page modal.
 */
export function CreateStaffUserForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const fullName = `${form.firstName} ${form.lastName}`.trim();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Enter the staff member's first and last name.");
      return;
    }
    if (!/^[A-Za-z0-9._-]{3,32}$/.test(form.username.trim())) {
      setError("Username must be 3-32 characters: letters, numbers, dots, dashes or underscores.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (form.password.length < 10) {
      setError("Temporary password must be at least 10 characters long.");
      return;
    }
    const charGroups = [
      /[a-z]/.test(form.password),
      /[A-Z]/.test(form.password),
      /\d/.test(form.password),
      /[^A-Za-z0-9]/.test(form.password),
    ].filter(Boolean).length;
    if (charGroups < 3) {
      setError("Password must include at least three of: uppercase letters, lowercase letters, numbers, and symbols.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerStaffAccount({
        fullName,
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        department: form.department,
        role: form.role,
        password: form.password,
      });
      onSuccess?.(result?.user ?? result?.staff ?? result ?? null);
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <AuthError icon={AlertCircle} message={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <AuthInput icon={User} label="First name" name="firstName" type="text" required placeholder="First name" value={form.firstName} onChange={set("firstName")} />
        <AuthInput icon={User} label="Last name" name="lastName" type="text" required placeholder="Last name" value={form.lastName} onChange={set("lastName")} />
        <AuthInput icon={AtSign} label="Username" name="username" type="text" required maxLength={32} autoComplete="off" placeholder="Username" value={form.username} onChange={set("username")} />
        <AuthInput icon={Mail} label="Email" name="email" type="email" required placeholder="Email address" value={form.email} onChange={set("email")} />
        <AuthSelect icon={Shield} label="Role" name="role" value={form.role} onChange={set("role")}>
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </AuthSelect>
        <AuthSelect icon={Building} label="Department" name="department" value={form.department} onChange={set("department")}>
          {DEPARTMENTS.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </AuthSelect>
        <AuthInput icon={Phone} label="Phone number" name="phone" type="tel" placeholder="+263 77 000 0000" value={form.phone} onChange={set("phone")} />
        <AuthInput icon={Lock} label="Temporary password" name="password" type="password" required minLength={10} maxLength={72} autoComplete="new-password" placeholder="Temporary password" value={form.password} onChange={set("password")} />
      </div>

      <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs leading-relaxed text-slate-300">
        The staff member signs in with this temporary password once, then sets their own password from their account settings.
      </p>

      <div className="flex gap-3">
        <AuthButton type="submit" loading={loading} className="flex-1">
          Create user
        </AuthButton>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function StaffRegisterPage() {
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <AuthShell
        eyebrow="Staff onboarding"
        title="Account created"
        subtitle="The staff profile is ready for secure WaitLess access."
        footer={
          <Link to="/admin/users" className="font-semibold text-cyan-100 hover:text-white">
            View all staff accounts
          </Link>
        }
      >
        <div className="space-y-5 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-400/18 text-green-100">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <button
            type="button"
            onClick={() => setSuccess(false)}
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
      footer="Administrator-only account provisioning."
    >
      <CreateStaffUserForm onSuccess={() => setSuccess(true)} />
    </AuthShell>
  );
}

export function AccessCodePanel({ standalone = false }) {
  const [open, setOpen] = useState(standalone);
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
    <div className={standalone ? "" : "mt-8 border-t border-white/10 pt-6"}>
      {standalone ? null : (
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
      )}

      {open ? (
        <div className={standalone ? "space-y-4" : "mt-5 space-y-4"}>
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
