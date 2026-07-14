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
      </div>
    </section>
  );
}

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
    </div>
  );
}

