<<<<<<< HEAD
import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Save, UserRound } from "lucide-react";

import { apiRequest } from "@/services/api";

import { useAuth } from "@/auth/AuthProvider";

function debounce(fn, waitMs) {
  let t;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), waitMs);
  };
}

function canvasCropAndResize(imageBitmap, crop, outSize = 256) {
  const { x, y, width, height } = crop;
  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d");

  // Draw the cropped region scaled to outSize.
  ctx.drawImage(
    imageBitmap,
    x,
    y,
    width,
    height,
    0,
    0,
    outSize,
    outSize,
  );

  // JPEG for smaller size and broad browser support.
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      "image/jpeg",
      0.85,
    );
  });
}

export default function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    role: "",
  });

  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
  const [avatarSaving, setAvatarSaving] = useState(false);


  const [savingState, setSavingState] = useState("idle"); // idle|saving|saved|error
  const [saveError, setSaveError] = useState(null);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [sourceImageUrl, setSourceImageUrl] = useState(null);
  const [sourceImage, setSourceImage] = useState(null);

  const [crop, setCrop] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const imageRef = useRef(null);
  const objectUrlRef = useRef(null);

  const api = useMemo(() => {
    return {
      getMe: () => apiRequest("/api/auth/me"),
      saveProfile: (body) => apiRequest("/api/profile", { method: "POST", body }),
      saveAvatarBase64: ({ avatarBase64, mimeType }) =>
        apiRequest("/api/profile/avatar", {
          method: "POST",
          body: { avatarBase64, mimeType },
        }),
    };
  }, []);


  useEffect(() => {
    let mounted = true;
    api
      .getMe()
      .then((me) => {
        if (!mounted) return;
        setProfile({
          fullName: me?.user?.name ?? "",
          email: me?.user?.email ?? "",
          phone: me?.user?.phone ?? "",
          department: me?.user?.department ?? "",
          role: me?.user?.role ?? "",
        });
        setAvatarPreviewUrl(me?.user?.avatarUrl ?? null);
      })
      .catch((e) => {
        console.error(e);
      });

    return () => {
      mounted = false;
    };
  }, [api]);

  const dirtyFieldsRef = useRef({
    fullName: false,
    phone: false,
    department: false,
  });

  // Debounced auto-save for profile details.
  const debouncedSaveRef = useRef(
    debounce((next) => {
      // Mark fields clean right before we attempt saving.
      dirtyFieldsRef.current.fullName = false;
      dirtyFieldsRef.current.phone = false;
      dirtyFieldsRef.current.department = false;

      setSavingState("saving");
      setSaveError(null);

      api
        .saveProfile({
          fullName: next.fullName,
          phone: next.phone,
          department: next.department,
          // email/role typically derived from staff record; still send if present.
          email: next.email,
          role: next.role,
        })
        .then(() => {
          setSavingState("saved");
          setTimeout(() => setSavingState("idle"), 1200);
        })
        .catch((e) => {
          setSavingState("error");
          setSaveError(e.message ?? "Failed to save profile.");
          setTimeout(() => setSavingState("idle"), 2400);
        });
    }, 700),
  );

  useEffect(() => {
    // Only trigger if we have something to save.
    if (!user) return;

    // Mark fields as dirty while the user is editing.
    // (We flip it back to clean when the debounced save fires.)
    if (typeof profile.fullName === "string") dirtyFieldsRef.current.fullName = true;
    if (typeof profile.phone === "string") dirtyFieldsRef.current.phone = true;
    if (typeof profile.department === "string") dirtyFieldsRef.current.department = true;

    debouncedSaveRef.current(profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.fullName, profile.phone, profile.department]);

  // Real-time-ish profile sync across tabs/devices:
  // periodically re-fetch /api/auth/me while this page is mounted.
  // Dirty-field protection prevents overwriting active typing.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const REFRESH_MS = 8000;

    const applyServerProfile = (me) => {
      const next = {
        fullName: me?.user?.name ?? "",
        email: me?.user?.email ?? "",
        phone: me?.user?.phone ?? "",
        department: me?.user?.department ?? "",
        role: me?.user?.role ?? "",
      };

      // Only overwrite fields that are not actively dirty.
      setProfile((prev) => ({
        ...prev,
        fullName: dirtyFieldsRef.current.fullName ? prev.fullName : next.fullName,
        phone: dirtyFieldsRef.current.phone ? prev.phone : next.phone,
        department: dirtyFieldsRef.current.department ? prev.department : next.department,
        email: next.email,
        role: next.role,
      }));

      if (!dirtyFieldsRef.current.fullName && !dirtyFieldsRef.current.phone && !dirtyFieldsRef.current.department) {
        setAvatarPreviewUrl(me?.user?.avatarUrl ?? null);
      } else {
        // Avatar can still be updated safely; it isn't part of the dirty set.
        setAvatarPreviewUrl(me?.user?.avatarUrl ?? null);
      }
    };

    const tick = async () => {
      try {
        const me = await api.getMe();
        if (cancelled) return;
        applyServerProfile(me);
      } catch (e) {
        // ignore periodic refresh errors
      }
    };

    // Initial sync (quickly ensures we start from server state).
    tick();

    const id = window.setInterval(tick, REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [api, user]);



  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;
    const onLoad = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const size = Math.min(w, h);
      const x = Math.floor((w - size) / 2);
      const y = Math.floor((h - size) / 2);
      setCrop({ x, y, width: size, height: size });
    };

    if (img.complete) onLoad();
    else img.addEventListener("load", onLoad);
    return () => img.removeEventListener("load", onLoad);
  }, [sourceImageUrl]);

  async function onSelectAvatarFile(file) {
    if (!file) return;
    setSaveError(null);

    // Cleanup old object URL.
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    setSourceImageUrl(url);
    setCropModalOpen(true);

    try {
      const img = new Image();
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
      });
      setSourceImage(img);
    } catch (e) {
      console.error(e);
    }
  }

  function onCropBoxChange(e, axis) {
    const v = Number(e.target.value);
    setCrop((c) => {
      if (axis === "x") return { ...c, x: Math.max(0, v) };
      if (axis === "y") return { ...c, y: Math.max(0, v) };
      return c;
    });
  }

  async function applyCropAndUpload() {
    if (!sourceImage) return;

    setAvatarSaving(true);

    try {
      const bitmap = await createImageBitmap(sourceImage);
      const blob = await canvasCropAndResize(bitmap, crop, 256);

      // Convert blob -> base64 for the current backend (JSON-body only).
      const buf = await blob.arrayBuffer();
      // Base64 encode without requiring Node `Buffer` in the browser.
      const avatarBase64 = btoa(
        new Uint8Array(buf).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          "",
        ),
      );


      // Upload avatar and update preview immediately.
      const res = await api.saveAvatarBase64({
        avatarBase64,
        mimeType: "image/jpeg",
      });

      // Backend returns avatarUrl; prefer it to avoid waiting for /me refresh.
      setAvatarPreviewUrl(res?.avatarUrl ?? null);

      // Best-effort refresh of full user object in case other fields depend on it.
      // (DashboardLayout listens to auth.user, so we also try to update it via re-fetch.)
      try {
        const me = await api.getMe();
        setAvatarPreviewUrl(me?.user?.avatarUrl ?? null);
      } catch (e) {
        // ignore; preview is already updated.
      }


      setCropModalOpen(false);
      setSourceImageUrl(null);
      setSourceImage(null);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    } catch (e) {
      setSaveError(e.message ?? "Failed to upload avatar.");
    } finally {
      setAvatarSaving(false);
    }
  }

  const statusChip =
    savingState === "saving" ? (
      <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/55 px-3 py-1 text-xs font-semibold text-primary">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </span>
    ) : savingState === "saved" ? (
      <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/55 px-3 py-1 text-xs font-semibold text-primary">
        <Save className="h-3.5 w-3.5" />
        Saved
      </span>
    ) : savingState === "error" ? (
      <span className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
        Error
      </span>
    ) : (
      <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
        Auto-save on
      </span>
    );

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="surface-panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="eyebrow">Account</div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
              Profile & settings
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Your details auto-save in real time. Update your photo with crop/resize.
            </p>
          </div>
          <div>{statusChip}</div>
        </div>

        {saveError && (
          <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {saveError}
          </div>
        )}

        <div className="mt-7 grid gap-6 md:grid-cols-[0.7fr_1.3fr]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Profile photo
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {avatarSaving ? "Uploading…" : "Crop & resize"}
                  </div>
                </div>
                <label className="cursor-pointer rounded-xl border border-primary/20 bg-primary-soft/40 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary-soft/60">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onSelectAvatarFile(e.target.files?.[0])}
                  />
                  Change
                </label>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-muted/50">
                  {avatarPreviewUrl ? (
                    <img
                      src={avatarPreviewUrl}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  The cropped square image is saved and shown on your dashboard.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Details
              </div>

              <div className="mt-4 grid gap-4">
                <Field
                  label="Full name"
                  value={profile.fullName}
                  onChange={(v) => setProfile((p) => ({ ...p, fullName: v }))}
                />
                <Field
                  label="Phone"
                  value={profile.phone}
                  onChange={(v) => setProfile((p) => ({ ...p, phone: v }))}
                />
                <Field
                  label="Department"
                  value={profile.department}
                  onChange={(v) => setProfile((p) => ({ ...p, department: v }))}
                />
                <Field
                  label="Email"
                  value={profile.email}
                  onChange={(v) => setProfile((p) => ({ ...p, email: v }))}
                  disabled
                />
                <Field
                  label="Role"
                  value={profile.role}
                  onChange={(v) => setProfile((p) => ({ ...p, role: v }))}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>

        {cropModalOpen && sourceImageUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-border/70 bg-background p-5 shadow-elegant">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="eyebrow">Avatar crop</div>
                  <h2 className="mt-2 font-display text-2xl font-bold">Resize to square</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Adjust crop position, then apply. Output size is 256×256.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm font-semibold"
                  onClick={() => {
                    setCropModalOpen(false);
                    setSourceImageUrl(null);
                    setSourceImage(null);
                    if (objectUrlRef.current) {
                      URL.revokeObjectURL(objectUrlRef.current);
                      objectUrlRef.current = null;
                    }
                  }}
                >
                  Close
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_260px]">
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-background">
                    <img
                      ref={imageRef}
                      src={sourceImageUrl}
                      alt="Crop source"
                      className="absolute inset-0 h-full w-full object-contain"
                      style={{
                        // Display crop region visualization by scaling to container.
                        // This simplistic UI uses sliders below; crop box is applied on original pixels.
                      }}
                    />
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    Crop box (pixel coordinates) uses the original image dimensions.
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Position
                  </div>
                  <div className="mt-3 space-y-4">
                    <Slider
                      label="X"
                      value={crop.x}
                      min={0}
                      max={Math.max(0, (sourceImage?.naturalWidth ?? 0) - crop.width)}
                      onChange={(v) => setCrop((c) => ({ ...c, x: v }))}
                    />
                    <Slider
                      label="Y"
                      value={crop.y}
                      min={0}
                      max={Math.max(0, (sourceImage?.naturalHeight ?? 0) - crop.height)}
                      onChange={(v) => setCrop((c) => ({ ...c, y: v }))}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={avatarSaving}
                    onClick={applyCropAndUpload}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60"
                  >
                    {avatarSaving ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : null}
                    Apply & upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
=======
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
import { LoadingPanel } from "@/components/ui/system-loader";
import {
  formatStaffRoleLabel,
  getAvailableLandingPages,
  getStaffInitials,
  resolveStaffLandingPath,
} from "@/services/staffProfilePrefs";

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
      user?.workspaceProfile?.statusMessage ??
      "On shift and keeping live patient flow moving.",
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

  useEffect(() => {
    setFormState(buildProfileForm(auth.user));
  }, [auth.user]);

  useEffect(() => {
    if (!saved) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setSaved(false), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [saved]);

  const landingPages = useMemo(
    () => getAvailableLandingPages(auth.user?.role),
    [auth.user?.role],
  );

  const quickActions = useMemo(() => {
    if (!auth.user) {
      return [];
    }

    const items = [];

    if (auth.hasRole(["reception", "receptionist"])) {
      items.push({
        label: "Open registration",
        body: "Start a new patient ticket from the front desk.",
        to: "/register",
        icon: Ticket,
      });
    }

    if (auth.hasRole(["triage"])) {
      items.push({
        label: "Open triage",
        body: "Sort the next patient by priority and route.",
        to: "/triage",
        icon: Stethoscope,
      });
    }

    if (auth.hasRole(["triage", "clinician", "doctor", "nurse"])) {
      items.push({
        label: "Open dashboard",
        body: "Check queue pressure, alerts, and active service flow.",
        to: "/dashboard",
        icon: LayoutDashboard,
      });
    }

    items.push(
      {
        label: "Open queue board",
        body: "Review the live waiting-area display.",
        to: "/queue",
        icon: Search,
      },
      {
        label: "Open ticket tracker",
        body: "Track a patient’s queue movement live.",
        to: "/track",
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
    return <Navigate to="/login" replace />;
  }

  const user = auth.user;
  const preferredDisplayName =
    formState.preferredName.trim() || user.name || "WaitLess staff";
  const capabilityList = ROLE_CAPABILITIES[user.role] ?? [
    "Hospital queue access",
    "Staff-side operations view",
    "Role-based system access",
  ];
  const preferredLandingPath =
    landingPages.find((entry) => entry.value === formState.preferredLandingPage)?.path ??
    resolveStaffLandingPath(user);

  function handleSubmit(event) {
    event.preventDefault();
    auth.updateProfile(formState);
    setSaved(true);
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="surface-panel relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(240,253,250,0.62)_42%,rgba(219,234,254,0.56))]" />
        <div className="pointer-events-none absolute -left-10 top-0 h-32 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-48 rounded-full bg-accent/12 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="eyebrow">Staff identity</div>
            <div className="mt-4 flex flex-wrap items-start gap-4">
              <span className="grid h-20 w-20 place-items-center rounded-[1.75rem] bg-[linear-gradient(135deg,rgba(15,118,110,0.94),rgba(37,99,235,0.9))] font-display text-2xl font-bold text-white shadow-[0_20px_50px_-22px_rgba(37,99,235,0.42)]">
                {getStaffInitials(preferredDisplayName)}
              </span>
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
                    label={AVAILABILITY_OPTIONS.find((entry) => entry.value === formState.availability)?.label ?? "On shift"}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <ProfileStat
                label="Preferred launch"
                value={landingPages.find((entry) => entry.value === formState.preferredLandingPage)?.label ?? "Role default"}
              />
              <ProfileStat label="Focus area" value={formState.focusArea || "Queue operations"} />
              <ProfileStat label="Contact extension" value={formState.contactExtension || "Not set"} />
            </div>
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
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
                Staff record
              </h2>
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
              Your profile updates stay attached to this staff account on this device.
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
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(37,99,235,0.88))] font-display text-lg font-bold text-white">
              {getStaffInitials(preferredDisplayName)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-display text-xl font-bold tracking-tight">
                  {preferredDisplayName}
                </div>
                <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                  {AVAILABILITY_OPTIONS.find((entry) => entry.value === formState.availability)?.label}
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
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {action.body}
                </p>
              </Link>
            ))}
          </div>
        </article>
>>>>>>> 1b9b1e0 (frontend: auth pages modified-next staff dashboard page(s))
      </div>
    </section>
  );
}

<<<<<<< HEAD
function Field({ label, value, onChange, disabled }) {
  return (
    <label className="block">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </div>
      <input
        className="input-base mt-2 w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </label>
  );
}

function Slider({ label, value, min, max, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-muted-foreground">{label}</div>
        <div className="text-xs font-semibold text-foreground">{value}</div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full"
      />
=======
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
      <div className="mt-2 font-display text-2xl font-bold tracking-tight">
        {value}
      </div>
>>>>>>> 1b9b1e0 (frontend: auth pages modified-next staff dashboard page(s))
    </div>
  );
}

<<<<<<< HEAD
=======
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
          <div className="mt-1 text-sm font-medium text-primary-foreground">
            {value}
          </div>
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
>>>>>>> 1b9b1e0 (frontend: auth pages modified-next staff dashboard page(s))
