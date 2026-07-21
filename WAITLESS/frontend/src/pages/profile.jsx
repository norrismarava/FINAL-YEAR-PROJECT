import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  Clock3,
  ExternalLink,
  HeartPulse,
  IdCard,
  LayoutDashboard,
  Mail,
  Phone,
  Save,
  Search,
  ShieldCheck,
  Stethoscope,
  Ticket,
} from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { ProfileCompleteness } from "@/components/ProfileCompleteness";
import { ProfilePhotoPicker } from "@/components/ProfilePhotoPicker";
import { LoadingPanel } from "@/components/ui/system-loader";
import { uploadStaffAvatar } from "@/services/authApi";
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

function buildProfileForm(user) {
  return {
    preferredName: user?.workspaceProfile?.preferredName ?? "",
    statusMessage:
      user?.workspaceProfile?.statusMessage ?? "On shift and keeping live patient flow moving.",
    shiftLabel: user?.workspaceProfile?.shiftLabel ?? "Day shift",
    focusArea: user?.workspaceProfile?.focusArea ?? "Queue operations",
    contactExtension: user?.workspaceProfile?.contactExtension ?? "",
    preferredLandingPage: user?.workspaceProfile?.preferredLandingPage ?? "",
    availability: user?.workspaceProfile?.availability ?? "on-shift",
  };
}

export default function ProfilePage() {
  const auth = useAuth();
  const [formState, setFormState] = useState(() => buildProfileForm(auth.user));
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(() =>
    resolveProfileImageUrl(auth.user?.avatarUrl),
  );

  useEffect(() => {
    setFormState(buildProfileForm(auth.user));
    setAvatarPreview(resolveProfileImageUrl(auth.user?.avatarUrl));
  }, [auth.user]);

  useEffect(() => {
    if (!saved) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setSaved(false), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [saved]);

  const landingPages = useMemo(() => getAvailableLandingPages(auth.user?.role), [auth.user?.role]);

  const quickActions = useMemo(() => {
    if (!auth.user) {
      return [];
    }

    const items = [];

    if (auth.hasRole(["reception", "receptionist"])) {
      items.push({
        label: "Open registration",
        body: "Start a new patient ticket from the front desk.",
        to: "/admin/register",
        icon: Ticket,
      });
    }

    if (auth.hasRole(["triage"])) {
      items.push({
        label: "Open triage",
        body: "Sort the next patient by priority and route.",
        to: "/admin/triage",
        icon: Stethoscope,
      });
    }

    if (auth.hasRole(["triage", "clinician", "doctor", "nurse"])) {
      items.push({
        label: "Open dashboard",
        body: "Check queue pressure, alerts, and active service flow.",
        to: "/admin/dashboard",
        icon: LayoutDashboard,
      });
    }

    items.push(
      {
        label: "Open queue board",
        body: "Review the live waiting-area display.",
        to: "/admin/queue",
        icon: Search,
      },
      {
        label: "Open ticket tracker",
        body: "Track a patient's queue movement live.",
        to: "/admin/track",
        icon: HeartPulse,
      },
    );

    return items.slice(0, 4);
  }, [auth]);

  if (!auth.isReady) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <LoadingPanel
          title="Opening your profile"
          message="Loading staff identity, access scope, and saved workspace settings."
        />
      </section>
    );
  }

  if (!auth.isAuthenticated || !auth.user) {
    return <Navigate to="/admin/login" replace />;
  }

  const user = auth.user;
  const preferredDisplayName = formState.preferredName.trim() || user.name || "WaitLess staff";
  const capabilityList = ROLE_CAPABILITIES[user.role] ?? [
    "Hospital queue access",
    "Staff-side operations view",
    "Role-based system access",
  ];
  const preferredLandingPath =
    landingPages.find((entry) => entry.value === formState.preferredLandingPage)?.path ??
    resolveStaffLandingPath(user);
  const profileCompletion = Math.round(
    ([
      user.name,
      user.email,
      user.phone,
      user.department,
      user.employeeId,
      avatarPreview,
      formState.preferredName,
      formState.shiftLabel,
      formState.focusArea,
      formState.contactExtension,
      formState.statusMessage,
    ].filter((value) => String(value ?? "").trim()).length /
      11) *
      100,
  );

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

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="surface-panel relative overflow-hidden p-6 sm:p-8">
        <div className="relative grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="eyebrow">Staff identity</div>
            <div className="mt-4 flex flex-wrap items-start gap-4">
              <ProfilePhotoPicker
                value={avatarPreview}
                initials={getStaffInitials(preferredDisplayName)}
                onImageReady={handleAvatarChange}
                label="Change profile photo"
                showHint={false}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                    {preferredDisplayName}
                  </h1>
                  <span className="rounded-full border border-primary/15 bg-primary-soft/70 px-3 py-1 text-xs font-semibold text-primary">
                    {formatStaffRoleLabel(user.role)}
                  </span>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                  {formState.statusMessage}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ProfileChip icon={Building2} label={user.department || "Department pending"} />
                  <ProfileChip icon={Clock3} label={formState.shiftLabel} />
                  <ProfileChip
                    icon={ShieldCheck}
                    label={
                      AVAILABILITY_OPTIONS.find((entry) => entry.value === formState.availability)
                        ?.label ?? "On shift"
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <ProfileStat
                label="Preferred launch"
                value={
                  landingPages.find((entry) => entry.value === formState.preferredLandingPage)
                    ?.label ?? "Role default"
                }
              />
              <ProfileStat label="Focus area" value={formState.focusArea || "Queue operations"} />
              <ProfileStat
                label="Contact extension"
                value={formState.contactExtension || "Not set"}
              />
            </div>

            <ProfileCompleteness
              value={profileCompletion}
              className="mt-6 rounded-xl border border-border/70 bg-background/55 px-4 py-4"
            />
          </div>

          <div className="surface-panel-dark p-5 sm:p-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-foreground/70">
              Account snapshot
            </div>
            <div className="mt-4 space-y-3">
              <AccountMetaRow icon={Mail} label="Email" value={user.email || "Not provided"} />
              <AccountMetaRow icon={Phone} label="Phone" value={user.phone || "Not provided"} />
              <AccountMetaRow
                icon={IdCard}
                label="Employee ID"
                value={user.employeeId || "Awaiting staff ID"}
              />
              <AccountMetaRow
                icon={BadgeCheck}
                label="Last sign-in"
                value={formatDateTime(user.lastLoginAt)}
              />
            </div>

            <Link
              to={preferredLandingPath}
              className="mt-5 inline-flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-white/14"
            >
              Continue to your workspace
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="surface-panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Official account</div>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">Staff record</h2>
            </div>
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
              Secure session active
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ReadOnlyField label="Full name" value={user.name || "Not available"} />
            <ReadOnlyField label="Role" value={formatStaffRoleLabel(user.role)} />
            <ReadOnlyField label="Department" value={user.department || "Not assigned"} />
            <ReadOnlyField label="Username" value={user.username || "Not available"} />
            <ReadOnlyField label="Staff email" value={user.email || "Not provided"} />
            <ReadOnlyField label="Mobile number" value={user.phone || "Not provided"} />
            <ReadOnlyField label="Employee ID" value={user.employeeId || "Not provided"} />
            <ReadOnlyField label="Created" value={formatDateTime(user.createdAt)} />
          </div>

          <div className="surface-panel-muted mt-6 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Access scope
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {capabilityList.map((capability) => (
                <span
                  key={capability}
                  className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  {capability}
                </span>
              ))}
            </div>
          </div>
        </article>

        <form
          id="workspace-settings"
          onSubmit={handleSubmit}
          className="surface-panel scroll-mt-28 p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Workspace profile</div>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
                Personalise this account
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Shape how your staff workspace presents itself each time you sign in.
              </p>
            </div>
            {saved ? (
              <span className="rounded-full border border-priority-green/20 bg-priority-green/10 px-3 py-1 text-xs font-semibold text-priority-green">
                Saved
              </span>
            ) : null}
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Preferred name">
              <input
                value={formState.preferredName}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    preferredName: event.target.value,
                  }))
                }
                className="input-base"
                placeholder="How your workspace should address you"
              />
            </Field>

            <Field label="Shift label">
              <input
                value={formState.shiftLabel}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    shiftLabel: event.target.value,
                  }))
                }
                className="input-base"
                placeholder="Day shift, Night duty, Weekend call"
              />
            </Field>

            <Field label="Focus area">
              <input
                value={formState.focusArea}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    focusArea: event.target.value,
                  }))
                }
                className="input-base"
                placeholder="Patient registration, queue command, triage"
              />
            </Field>

            <Field label="Contact extension">
              <input
                value={formState.contactExtension}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    contactExtension: event.target.value,
                  }))
                }
                className="input-base"
                placeholder="Desk extension or internal line"
              />
            </Field>

            <Field label="Availability mode">
              <select
                value={formState.availability}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    availability: event.target.value,
                  }))
                }
                className="input-base"
              >
                {AVAILABILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Preferred landing page">
              <select
                value={formState.preferredLandingPage}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    preferredLandingPage: event.target.value,
                  }))
                }
                className="input-base"
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
                rows={4}
                value={formState.statusMessage}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    statusMessage: event.target.value,
                  }))
                }
                className="input-base resize-none"
                placeholder="Short message that describes your current focus."
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Workspace preferences stay on this device; profile photos are saved to your account.
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant"
            >
              <Save className="h-4 w-4" />
              Save profile
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <article className="surface-panel p-6">
          <div className="eyebrow">Presence</div>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
            How your account appears
          </h2>

          <div className="surface-panel-muted mt-5 flex items-start gap-4 px-5 py-5">
            <span className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(37,99,235,0.88))]">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center font-display text-lg font-bold text-white">
                  {getStaffInitials(preferredDisplayName)}
                </span>
              )}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-display text-xl font-bold tracking-tight">
                  {preferredDisplayName}
                </div>
                <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                  {
                    AVAILABILITY_OPTIONS.find((entry) => entry.value === formState.availability)
                      ?.label
                  }
                </span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {formatStaffRoleLabel(user.role)} in {user.department || "hospital operations"}
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {formState.statusMessage}
              </p>
            </div>
          </div>
        </article>

        <article className="surface-panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Shortcuts</div>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
                Jump back into work
              </h2>
            </div>
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
              Role-aware
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="surface-panel-muted group px-4 py-4 transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <action.icon className="h-4.5 w-4.5" />
                </span>
                <div className="mt-4 font-display text-lg font-bold tracking-tight">
                  {action.label}
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{action.body}</p>
              </Link>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function ProfileChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/85 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-primary" />
      {label}
    </span>
  );
}

function ProfileStat({ label, value }) {
  return (
    <div className="surface-panel-muted px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function AccountMetaRow({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/10 text-primary-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/65">
            {label}
          </div>
          <div className="mt-1 text-sm font-medium text-primary-foreground">{value}</div>
        </div>
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <label className={`flex flex-col gap-2 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "Not recorded";
  }

  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
