import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Clock3,
  Edit3,
  IdCard,
  LoaderCircle,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/auth/AuthProvider";
import { ProfilePhotoPicker } from "@/components/ProfilePhotoPicker";
import { LoadingPanel } from "@/components/ui/system-loader";
import { changeStaffPassword, uploadStaffAvatar } from "@/services/authApi";
import {
  formatStaffRoleLabel,
  getAvailableLandingPages,
  getStaffInitials,
  resolveStaffLandingPath,
} from "@/services/staffProfilePrefs";
import { resolveProfileImageUrl } from "@/utils/profileImage";

const AVAILABILITY_OPTIONS = [
  { value: "on-shift", label: "On shift" },
  { value: "handover", label: "In handover" },
  { value: "off-duty", label: "Off duty" },
];

const ROLE_CAPABILITIES = {
  admin: ["Full command access", "Create staff accounts", "Review every department"],
  clinician: ["Live dashboard view", "Department service flow", "Patient alerts context"],
  doctor: ["Clinical queue visibility", "Service flow updates", "Patient progress tracking"],
  nurse: ["Patient flow visibility", "Department coordination", "Shift-ready queue view"],
  pharmacist: ["Pharmacy queue visibility", "Medication window awareness", "Alert context"],
  reception: ["Patient registration", "Ticket lookup", "Queue board support"],
  receptionist: ["Patient registration", "Ticket lookup", "Queue board support"],
  triage: ["Triage console", "Priority routing", "Operational dashboard"],
};

function buildPrefsForm(user) {
  return {
    preferredName: user?.workspaceProfile?.preferredName ?? "",
    statusMessage: user?.workspaceProfile?.statusMessage ?? "",
    preferredLandingPage: user?.workspaceProfile?.preferredLandingPage ?? "",
    availability: user?.workspaceProfile?.availability ?? "on-shift",
  };
}

export default function ProfilePage() {
  const auth = useAuth();
  const [formState, setFormState] = useState(() => buildPrefsForm(auth.user));
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(() =>
    resolveProfileImageUrl(auth.user?.avatarUrl),
  );
  const [editingRecord, setEditingRecord] = useState(false);
  const [recordSaving, setRecordSaving] = useState(false);
  const [recordForm, setRecordForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    department: "",
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    setFormState(buildPrefsForm(auth.user));
    setAvatarPreview(resolveProfileImageUrl(auth.user?.avatarUrl));
    setRecordForm({
      fullName: auth.user?.name ?? "",
      phone: auth.user?.phone ?? "",
      email: auth.user?.email ?? "",
      department: auth.user?.department ?? "",
    });
  }, [auth.user]);

  useEffect(() => {
    if (!saved) return undefined;
    const timeoutId = window.setTimeout(() => setSaved(false), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [saved]);

  const landingPages = useMemo(
    () => getAvailableLandingPages(auth.user?.role),
    [auth.user?.role],
  );

  if (!auth.isReady) {
    return (
      <section className="staff-module-page mx-auto w-full max-w-[96rem] px-1 py-6 sm:py-8">
        <LoadingPanel
          title="Opening your profile"
          message="Loading staff identity and workspace settings."
        />
      </section>
    );
  }

  if (!auth.isAuthenticated || !auth.user) {
    return <Navigate to="/login" replace />;
  }

  const user = auth.user;
  const displayName = formState.preferredName.trim() || user.name || "WaitLess staff";
  const capabilityList = ROLE_CAPABILITIES[user.role] ?? [
    "Hospital queue access",
    "Staff-side operations view",
    "Role-based system access",
  ];
  const preferredLandingPath =
    landingPages.find((entry) => entry.value === formState.preferredLandingPage)?.path ??
    resolveStaffLandingPath(user);
  const availabilityLabel =
    AVAILABILITY_OPTIONS.find((entry) => entry.value === formState.availability)?.label ??
    "On shift";

  function handleSubmit(event) {
    event.preventDefault();
    auth.updateProfile(formState);
    setSaved(true);
  }

  async function handleAvatarChange({ base64, dataUrl }) {
    const previousAvatar = avatarPreview;
    setAvatarPreview(dataUrl);
    try {
      const response = await uploadStaffAvatar(base64);
      auth.updateAvatar(response.avatarUrl);
      setAvatarPreview(resolveProfileImageUrl(response.avatarUrl));
      setSaved(true);
    } catch (error) {
      setAvatarPreview(previousAvatar);
      throw error;
    }
  }

  function startEditRecord() {
    setRecordForm({
      fullName: user.name ?? "",
      phone: user.phone ?? "",
      email: user.email ?? "",
      department: user.department ?? "",
    });
    setEditingRecord(true);
  }

  async function handleRecordSave(e) {
    e.preventDefault();
    setRecordSaving(true);
    try {
      await auth.persistProfile(recordForm);
      setEditingRecord(false);
      setSaved(true);
      toast.success("Staff record updated");
    } catch (error) {
      toast.error(error.message || "Failed to update staff record");
    } finally {
      setRecordSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast.error("Enter your current and new password");
      return;
    }
    if (pwForm.newPassword.length < 10) {
      toast.error("New password must be at least 10 characters");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setPwSaving(true);
    try {
      await changeStaffPassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success("Password changed — sign in again with the new password");
      setTimeout(() => auth.logout(), 1200);
    } catch (error) {
      toast.error(error.message || "Failed to change password");
      setPwSaving(false);
    }
  }

  return (
    <section className="staff-module-page mx-auto min-h-[calc(100vh-7rem)] w-full max-w-[96rem] px-1 py-6 sm:py-8">
      {/* Identity header */}
      <header className="surface-panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 flex-wrap items-start gap-5">
            <ProfilePhotoPicker
              value={avatarPreview}
              initials={getStaffInitials(displayName)}
              onImageReady={handleAvatarChange}
              label="Change profile photo"
              cropSource={user.avatarUrl}
              showHint={false}
            />
            <div className="min-w-0">
              <div className="eyebrow">Staff profile</div>
              <div className="mt-2 flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {displayName}
                </h1>
                <span className="rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                  {formatStaffRoleLabel(user.role)}
                </span>
              </div>
              {formState.statusMessage ? (
                <p className="mt-2.5 max-w-xl text-sm leading-6 text-muted-foreground">
                  {formState.statusMessage}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <ProfileMetaChip icon={Building2} label={user.department || "No department"} />
                <ProfileMetaChip icon={ShieldCheck} label={availabilityLabel} />
                <ProfileMetaChip icon={IdCard} label={user.employeeId || "ID pending"} />
                <ProfileMetaChip
                  icon={Clock3}
                  label={`Last sign-in ${formatDateTime(user.lastLoginAt)}`}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2.5">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-priority-green/30 bg-priority-green/10 px-3 py-1.5 text-xs font-semibold text-priority-green">
                <Save className="h-3.5 w-3.5" />
                Saved
              </span>
            ) : null}
            <Link
              to={preferredLandingPath}
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant"
            >
              Go to workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        {/* Account details */}
        <article className="surface-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
                <UserRound className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold">Account details</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Your official staff record
                </p>
              </div>
            </div>
            {editingRecord ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
                <button
                  type="submit"
                  form="staff-record-form"
                  disabled={recordSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {recordSaving ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {recordSaving ? "Saving…" : "Save"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startEditRecord}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>

          <div className="p-5">
            {editingRecord ? (
              <form
                id="staff-record-form"
                onSubmit={handleRecordSave}
                className="grid gap-4 sm:grid-cols-2"
              >
                <Field label="Full name">
                  <input
                    value={recordForm.fullName}
                    onChange={(e) =>
                      setRecordForm((p) => ({ ...p, fullName: e.target.value }))
                    }
                    className="input-base h-9 text-sm"
                    placeholder="Full name"
                  />
                </Field>
                <Field label="Department">
                  <input
                    value={recordForm.department}
                    onChange={(e) =>
                      setRecordForm((p) => ({ ...p, department: e.target.value }))
                    }
                    className="input-base h-9 text-sm"
                    placeholder="Department"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={recordForm.email}
                    onChange={(e) =>
                      setRecordForm((p) => ({ ...p, email: e.target.value }))
                    }
                    className="input-base h-9 text-sm"
                    placeholder="Email address"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={recordForm.phone}
                    onChange={(e) =>
                      setRecordForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="input-base h-9 text-sm"
                    placeholder="Phone number"
                  />
                </Field>
                <ReadOnlyField label="Role" value={formatStaffRoleLabel(user.role)} />
                <ReadOnlyField label="Username" value={user.username || "—"} />
              </form>
            ) : (
              <div className="space-y-1">
                <DetailRow icon={UserRound} label="Full name" value={user.name} />
                <DetailRow icon={ShieldCheck} label="Role" value={formatStaffRoleLabel(user.role)} />
                <DetailRow icon={Building2} label="Department" value={user.department} />
                <DetailRow icon={IdCard} label="Username" value={user.username} />
                <DetailRow icon={Mail} label="Email" value={user.email} />
                <DetailRow icon={Phone} label="Phone" value={user.phone} />
                <DetailRow
                  icon={Clock3}
                  label="Member since"
                  value={formatDateTime(user.createdAt)}
                />
              </div>
            )}
          </div>

          <div className="border-t border-border/60 px-5 py-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Access scope
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {capabilityList.map((capability) => (
                <span
                  key={capability}
                  className="rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  {capability}
                </span>
              ))}
            </div>
          </div>
        </article>

        {/* Workspace preferences */}
        <form onSubmit={handleSubmit} className="surface-panel self-start">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
                <Edit3 className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold">Workspace preferences</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  How the staff workspace greets and routes you
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Preferred name">
              <input
                value={formState.preferredName}
                onChange={(e) =>
                  setFormState((c) => ({ ...c, preferredName: e.target.value }))
                }
                className="input-base h-9 text-sm"
                placeholder="What the workspace calls you"
              />
            </Field>

            <Field label="Availability">
              <select
                value={formState.availability}
                onChange={(e) =>
                  setFormState((c) => ({ ...c, availability: e.target.value }))
                }
                className="input-base h-9 text-sm"
              >
                {AVAILABILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Landing page" full>
              <select
                value={formState.preferredLandingPage}
                onChange={(e) =>
                  setFormState((c) => ({ ...c, preferredLandingPage: e.target.value }))
                }
                className="input-base h-9 text-sm"
              >
                <option value="">Use role default</option>
                {landingPages.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status message" full>
              <textarea
                rows={3}
                value={formState.statusMessage}
                onChange={(e) =>
                  setFormState((c) => ({ ...c, statusMessage: e.target.value }))
                }
                className="input-base resize-none text-sm"
                placeholder="Short message shown under your name"
              />
            </Field>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/60 px-5 py-4">
            <span className="text-xs text-muted-foreground">
              Preferences stay on this device; your photo is saved to the account.
            </span>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-elegant"
            >
              <Save className="h-3.5 w-3.5" />
              Save preferences
            </button>
          </div>
        </form>

        {/* Security / password */}
        <form onSubmit={handlePasswordChange} className="surface-panel self-start xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-rose-500/15 text-rose-500">
                <Lock className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold">Security</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Change your account password
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <Field label="Current password">
              <input
                type="password"
                autoComplete="current-password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                className="input-base h-9 text-sm"
                placeholder="Current password"
              />
            </Field>
            <Field label="New password">
              <input
                type="password"
                autoComplete="new-password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                className="input-base h-9 text-sm"
                placeholder="10+ characters"
              />
            </Field>
            <Field label="Confirm new password">
              <input
                type="password"
                autoComplete="new-password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                className="input-base h-9 text-sm"
                placeholder="Re-enter new password"
              />
            </Field>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/60 px-5 py-4">
            <span className="text-xs text-muted-foreground">
              You'll be signed out everywhere after changing it.
            </span>
            <button
              type="submit"
              disabled={pwSaving}
              className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-elegant disabled:opacity-60"
            >
              {pwSaving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
              {pwSaving ? "Updating…" : "Change password"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

/* ---------- Building blocks ---------- */

function ProfileMetaChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-primary" />
      {label}
    </span>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
      <span className="inline-flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="truncate text-sm font-semibold text-foreground">{value || "—"}</span>
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/50 px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value || "—"}</div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function formatDateTime(value) {
  if (!value) return "not recorded";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
