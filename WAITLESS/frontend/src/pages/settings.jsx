import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  MapPin,
  MessageCircle,
  Monitor,
  Moon,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  Timer,
  Trash2,
  Wifi,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { useLiveRefresh } from "@/context/LiveRefreshContext";
import { useApiResource } from "@/hooks/useApiResource";
import {
  DEFAULT_IDLE_SETTINGS,
  DEFAULT_SYSTEM_SETTINGS,
  useIdleSettings,
  useSystemSettings,
} from "@/hooks/useSystemSettings";
import { useQueueRealtime } from "@/sockets/QueueRealtimeProvider";
import {
  fetchHospitalInfo,
  fetchRuntimeConfig,
  fetchWhatsAppStatus,
  resetRuntimeConfig,
  updateRuntimeConfig,
} from "@/services/queueApi";

const isBrowser = typeof window !== "undefined";

function clampInt(value, min, max) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/* ---------- Building blocks ---------- */

function Section({ icon: Icon, title, description, actions, children }) {
  return (
    <section className="surface-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Switch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`inline-block h-[1.125rem] w-[1.125rem] transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[1.375rem]" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SettingRow({ icon: Icon, title, description, control, disabled }) {
  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-background/50 px-4 py-3.5 ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> : null}
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">{description}</div>
        </div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function NumberField({ label, hint, value, min, max, step, onChange }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/50 p-4">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input-base mt-2 h-9 w-full text-sm"
      />
      {hint ? <div className="mt-1.5 text-[10px] leading-4 text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

function StatusPill({ ok, warn, label }) {
  const cls = ok
    ? "bg-priority-green/15 text-priority-green"
    : warn
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-300"
      : "bg-destructive/15 text-destructive";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-priority-green" : warn ? "bg-amber-500" : "bg-destructive"}`} />
      {label}
    </span>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/50 px-1 py-2.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-xs font-semibold text-foreground">{children}</span>
    </div>
  );
}

/* ---------- Page ---------- */

export default function SettingsPage() {
  const { refreshLiveData } = useLiveRefresh();
  const { user } = useAuth();
  const realtime = useQueueRealtime();
  const isAdmin = user?.role === "admin";

  const [settings, updateSettings] = useSystemSettings();
  const [idleSettings, updateIdleSettings] = useIdleSettings();
  const [saveState, setSaveState] = useState("idle"); // idle | saved
  const [configSaveState, setConfigSaveState] = useState("idle"); // idle | saving | saved | error
  const [configDraft, setConfigDraft] = useState(null);

  const hospitalQuery = useApiResource(
    useCallback(() => fetchHospitalInfo(), []),
    { enabled: isBrowser },
  );

  const whatsappQuery = useApiResource(
    useCallback(() => fetchWhatsAppStatus(), []),
    { enabled: isBrowser },
  );

  const configQuery = useApiResource(
    useCallback(() => fetchRuntimeConfig(), []),
    { enabled: isBrowser && isAdmin },
  );

  useEffect(() => {
    if (configQuery.data) {
      setConfigDraft(configQuery.data);
    }
  }, [configQuery.data]);

  function persistSettings(next) {
    updateSettings(next);
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 1200);
  }

  async function handleDesktopNotifications(checked) {
    if (checked && typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    persistSettings({ ...settings, notificationDesktop: checked });
  }

  function persistIdle(next) {
    updateIdleSettings(next);
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 1200);
  }

  function updateConfigField(path, value) {
    if (!configDraft) return;
    const next = { ...configDraft };
    const keys = path.split(".");
    let obj = next;
    for (let i = 0; i < keys.length - 1; i++) {
      obj[keys[i]] = { ...obj[keys[i]] };
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setConfigDraft(next);
  }

  async function saveConfig() {
    if (!configDraft) return;
    setConfigSaveState("saving");
    try {
      const updated = await updateRuntimeConfig({
        triageReassessmentThresholdsMinutes: configDraft.triageReassessmentThresholdsMinutes,
        etaMinutesPerPatientAhead: configDraft.etaMinutesPerPatientAhead,
        etaBaselineMinutes: configDraft.etaBaselineMinutes,
        etaActiveDepartmentBonusMinutes: configDraft.etaActiveDepartmentBonusMinutes,
        missedRecallGracePeriodMinutes: configDraft.missedRecallGracePeriodMinutes,
        oiPrivacyMode: configDraft.oiPrivacyMode,
      });
      setConfigDraft(updated);
      setConfigSaveState("saved");
      setTimeout(() => setConfigSaveState("idle"), 1500);
    } catch {
      setConfigSaveState("error");
      setTimeout(() => setConfigSaveState("idle"), 2000);
    }
  }

  async function handleResetConfig() {
    setConfigSaveState("saving");
    try {
      const reset = await resetRuntimeConfig();
      setConfigDraft(reset);
      setConfigSaveState("saved");
      setTimeout(() => setConfigSaveState("idle"), 1500);
    } catch {
      setConfigSaveState("error");
      setTimeout(() => setConfigSaveState("idle"), 2000);
    }
  }

  const hospital = hospitalQuery.data?.current;
  const whatsapp = whatsappQuery.data;
  const vitalThresholds = configDraft?.emergencyVitalThresholds ?? configQuery.data?.emergencyVitalThresholds;
  const departments = configDraft?.departments ?? configQuery.data?.departments ?? [];
  const tokenPrefixes = configDraft?.departmentTokenPrefixes ?? configQuery.data?.departmentTokenPrefixes ?? {};
  const routingRules = configDraft?.departmentRoutingRules ?? configQuery.data?.departmentRoutingRules ?? [];
  const retryDelays = whatsapp?.retryDelaysMs ?? configDraft?.notificationRetryDelaysMs ?? [];

  return (
    <section className="staff-module-page mx-auto min-h-[calc(100vh-7rem)] w-full max-w-[96rem] px-1 py-6 sm:py-8">
      {/* Page header */}
      <header className="surface-panel flex flex-wrap items-start justify-between gap-5 p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="eyebrow">System</div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Settings
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            Runtime workflow configuration, notification delivery, and workspace preferences for
            this station.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveState === "saved" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft/55 px-3 py-1.5 text-xs font-semibold text-primary">
              <Save className="h-3.5 w-3.5" />
              Saved
            </span>
          ) : null}
          <button
            type="button"
            onClick={refreshLiveData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </header>

      {/* Facility banner */}
      {hospital ? (
        <div className="surface-panel mt-5 flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display text-lg font-bold">{hospital.name}</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {hospital.location}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <StatusPill ok={hospital.active} warn={false} label={hospital.active ? "Active" : "Inactive"} />
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {hospitalQuery.data?.multiTenant ? "Multi-tenant" : "Single facility"}
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        {/* ------ Left column ------ */}
        <div className="space-y-5">
          {/* Workflow configuration — admin only */}
          {isAdmin ? (
            <Section
              icon={SlidersHorizontal}
              title="Workflow configuration"
              description="Runtime thresholds applied across triage, ETA estimation, and recalls. Changes take effect immediately."
              actions={
                <>
                  {configSaveState === "saving" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Saving…
                    </span>
                  ) : null}
                  {configSaveState === "saved" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft/55 px-2.5 py-1 text-xs font-semibold text-primary">
                      <CheckCircle2 className="h-3 w-3" /> Saved
                    </span>
                  ) : null}
                  {configSaveState === "error" ? (
                    <span className="text-xs font-semibold text-destructive">Save failed</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleResetConfig}
                    disabled={configSaveState === "saving" || !configDraft}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={saveConfig}
                    disabled={configSaveState === "saving" || !configDraft}
                    className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save changes
                  </button>
                </>
              }
            >
              {configQuery.isLoading && !configDraft ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin" /> Loading configuration…
                </div>
              ) : configQuery.isError && !configDraft ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {configQuery.error?.message ?? "Failed to load configuration."}
                </div>
              ) : configDraft ? (
                <div className="space-y-5">
                  <SettingRow
                    icon={configDraft.oiPrivacyMode !== false ? EyeOff : Eye}
                    title="OI Clinic privacy mode"
                    description="Masks patient names on public queue boards and tracking pages to protect HIV/TB confidentiality."
                    control={
                      <Switch
                        checked={configDraft.oiPrivacyMode !== false}
                        onChange={(v) => updateConfigField("oiPrivacyMode", v)}
                      />
                    }
                  />

                  <div>
                    <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                      Triage reassessment thresholds
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <NumberField
                        label="Red priority (minutes)"
                        hint="Alert when critical patients wait beyond this"
                        min={1}
                        max={120}
                        value={configDraft.triageReassessmentThresholdsMinutes?.red ?? 10}
                        onChange={(v) => updateConfigField("triageReassessmentThresholdsMinutes.red", clampInt(v, 1, 120))}
                      />
                      <NumberField
                        label="Yellow priority (minutes)"
                        hint="Alert when serious patients wait beyond this"
                        min={1}
                        max={120}
                        value={configDraft.triageReassessmentThresholdsMinutes?.yellow ?? 30}
                        onChange={(v) => updateConfigField("triageReassessmentThresholdsMinutes.yellow", clampInt(v, 1, 120))}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                      ETA estimation
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <NumberField
                        label="Per patient ahead (min)"
                        min={0}
                        max={30}
                        step={0.5}
                        value={configDraft.etaMinutesPerPatientAhead ?? 7}
                        onChange={(v) => updateConfigField("etaMinutesPerPatientAhead", clampInt(v, 0, 30))}
                      />
                      <NumberField
                        label="Baseline (min)"
                        min={0}
                        max={30}
                        value={configDraft.etaBaselineMinutes ?? 3}
                        onChange={(v) => updateConfigField("etaBaselineMinutes", clampInt(v, 0, 30))}
                      />
                      <NumberField
                        label="Active dept bonus (min)"
                        min={0}
                        max={30}
                        value={configDraft.etaActiveDepartmentBonusMinutes ?? 4}
                        onChange={(v) => updateConfigField("etaActiveDepartmentBonusMinutes", clampInt(v, 0, 30))}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <NumberField
                      label="Missed recall grace period (min)"
                      hint="How long a missed patient can be recalled before being marked absent"
                      min={0}
                      max={60}
                      value={configDraft.missedRecallGracePeriodMinutes ?? 5}
                      onChange={(v) => updateConfigField("missedRecallGracePeriodMinutes", clampInt(v, 0, 60))}
                    />
                  </div>

                  {configDraft.updatedAt ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      Last updated {new Date(configDraft.updatedAt).toLocaleString()}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Section>
          ) : (
            <Section
              icon={Lock}
              title="Workflow configuration"
              description="Runtime thresholds for triage, ETA, and recalls."
            >
              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/50 px-4 py-3.5 text-sm text-muted-foreground">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                Runtime workflow configuration is restricted to administrators. Contact an admin to
                change triage thresholds, ETA parameters, or privacy mode.
              </div>
            </Section>
          )}

          {/* Live sync & refresh — local, wired into QueueRealtimeProvider */}
          <Section
            icon={Monitor}
            title="Live sync & refresh"
            description="Controls how this workstation receives queue events and refreshes data. Changes apply instantly."
            actions={
              <StatusPill
                ok={realtime.status === "connected"}
                warn={realtime.status === "connecting" || realtime.status === "reconnecting" || realtime.status === "polling"}
                label={
                  realtime.status === "connected"
                    ? "Live"
                    : realtime.status === "polling"
                      ? "Polling"
                      : realtime.status === "closed"
                        ? "Off"
                        : "Syncing"
                }
              />
            }
          >
            <div className="space-y-3">
              <SettingRow
                icon={Wifi}
                title="Enable live sync"
                description="Apply incoming queue events in real time. When off, the stream disconnects and the app relies on manual refresh."
                control={
                  <Switch
                    checked={settings.liveSyncEnabled}
                    onChange={(checked) =>
                      persistSettings({ ...settings, liveSyncEnabled: checked })
                    }
                  />
                }
              />
              <SettingRow
                icon={Timer}
                title="Auto-refresh interval"
                description="Poll for updates even when no events arrive."
                disabled={!settings.liveSyncEnabled}
                control={
                  <div className="flex w-44 items-center gap-3">
                    <input
                      type="range"
                      min={2}
                      max={30}
                      step={1}
                      value={settings.autoRefreshIntervalSec}
                      disabled={!settings.liveSyncEnabled}
                      onChange={(e) =>
                        persistSettings({
                          ...settings,
                          autoRefreshIntervalSec: clampInt(e.target.value, 2, 30),
                        })
                      }
                      className="w-full accent-primary"
                    />
                    <span className="w-10 text-right font-display text-sm font-bold">
                      {settings.autoRefreshIntervalSec}s
                    </span>
                  </div>
                }
              />
              <SettingRow
                icon={RefreshCw}
                title="Polling fallback"
                description="If the realtime stream drops, keep refreshing periodically until it recovers."
                disabled={!settings.liveSyncEnabled}
                control={
                  <Switch
                    checked={settings.queuePollingFallbackEnabled}
                    disabled={!settings.liveSyncEnabled}
                    onChange={(checked) =>
                      persistSettings({ ...settings, queuePollingFallbackEnabled: checked })
                    }
                  />
                }
              />
            </div>
          </Section>

          {/* Session security */}
          <Section
            icon={ShieldCheck}
            title="Session security"
            description="Automatic logout when this workstation is left unattended."
          >
            <SettingRow
              icon={Timer}
              title="Idle logout timeout"
              description="Staff are warned 60 seconds before being signed out automatically. Applies immediately."
              control={
                <div className="flex w-44 items-center gap-3">
                  <input
                    type="range"
                    min={5}
                    max={60}
                    step={5}
                    value={Math.round((idleSettings.idleTimeoutMs ?? 900000) / 60000)}
                    onChange={(e) => {
                      persistIdle({
                        ...idleSettings,
                        idleTimeoutMs: clampInt(e.target.value, 5, 60) * 60000,
                      });
                    }}
                    className="w-full accent-primary"
                  />
                  <span className="w-10 text-right font-display text-sm font-bold">
                    {Math.round((idleSettings.idleTimeoutMs ?? 900000) / 60000)}m
                  </span>
                </div>
              }
            />
          </Section>
        </div>

        {/* ------ Right column ------ */}
        <div className="space-y-5">
          {/* Notification delivery — WhatsApp */}
          <Section
            icon={MessageCircle}
            title="Notification delivery"
            description="WhatsApp integration status for patient notifications."
            actions={
              whatsapp ? (
                <StatusPill
                  ok={whatsapp.fullyConfigured}
                  warn={!whatsapp.fullyConfigured && whatsapp.configured}
                  label={
                    whatsapp.fullyConfigured
                      ? "Live"
                      : whatsapp.configured
                        ? whatsapp.readinessLevel ?? "Partial"
                        : "Not configured"
                  }
                />
              ) : null
            }
          >
            {whatsappQuery.isLoading && !whatsapp ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Checking delivery status…
              </div>
            ) : whatsappQuery.isError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {whatsappQuery.error?.message ?? "Could not load integration status."}
              </div>
            ) : whatsapp ? (
              <div className="space-y-4">
                <div>
                  <InfoRow label="Provider">
                    <span className="uppercase">{whatsapp.provider ?? "unknown"}</span>
                  </InfoRow>
                  <InfoRow label="API version">{whatsapp.apiVersion ?? "—"}</InfoRow>
                  <InfoRow label="Webhook URL">
                    <span className="break-all text-muted-foreground">{whatsapp.webhookUrl ?? "—"}</span>
                  </InfoRow>
                  {retryDelays.length ? (
                    <InfoRow label="Retry schedule">
                      {retryDelays.map((ms) => `${Math.round(ms / 1000)}s`).join(" · ")}
                    </InfoRow>
                  ) : null}
                </div>

                <div>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    Credentials
                  </div>
                  <div className="space-y-1.5">
                    {(whatsapp.credentials ?? []).map((cred) => (
                      <div
                        key={cred.key}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 px-3 py-2"
                      >
                        <span className="text-xs font-medium">{cred.label}</span>
                        {cred.configured ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-priority-green" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {(whatsapp.checklist ?? []).filter((c) => !c.done).slice(0, 4).length ? (
                  <div>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                      Setup checklist
                    </div>
                    <ul className="space-y-1.5">
                      {(whatsapp.checklist ?? [])
                        .filter((c) => !c.done)
                        .slice(0, 4)
                        .map((item, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"
                          >
                            <AlertTriangle
                              className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                                item.severity === "warning" ? "text-amber-500" : "text-muted-foreground"
                              }`}
                            />
                            {item.item}
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-priority-green/10 px-3 py-2 text-xs text-priority-green">
                    <CheckCircle2 className="h-3.5 w-3.5" /> All setup steps complete
                  </div>
                )}
              </div>
            ) : null}
          </Section>

          {/* Emergency escalation thresholds — read-only reference */}
          {vitalThresholds ? (
            <Section
              icon={Stethoscope}
              title="Emergency escalation"
              description="Vital-sign thresholds that auto-escalate patients during triage."
            >
              <div className="space-y-1.5">
                {Object.values(vitalThresholds).map((t) => (
                  <div
                    key={t.label}
                    className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-background/50 px-3 py-2"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                    <span className="text-xs text-muted-foreground">{t.label}</span>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {/* Department routing — read-only */}
          {departments.length ? (
            <Section
              icon={Building2}
              title="Department routing"
              description="Ticket prefixes and keyword rules used when routing registrations."
            >
              <div className="space-y-2.5">
                {departments.map((dept) => {
                  const rule = routingRules.find((r) => r.department === dept);
                  return (
                    <div
                      key={dept}
                      className="rounded-xl border border-border/60 bg-background/50 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">{dept}</span>
                        <span className="rounded-md bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                          {tokenPrefixes[dept] ?? "—"}
                        </span>
                      </div>
                      {rule?.keywords?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {rule.keywords.slice(0, 8).map((kw) => (
                            <span
                              key={kw}
                              className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                            >
                              {kw}
                            </span>
                          ))}
                          {rule.keywords.length > 8 ? (
                            <span className="px-1 py-0.5 text-[10px] text-muted-foreground">
                              +{rule.keywords.length - 8}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-1.5 text-[10px] text-muted-foreground">
                          Default routing — no keyword rules
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          ) : null}

          {/* Device preferences */}
          <Section
            icon={Moon}
            title="Device preferences"
            description="Stored on this workstation only — backend delivery is unaffected. Applies instantly."
          >
            <div className="space-y-3">
              <SettingRow
                icon={Bell}
                title="Desktop notifications"
                description={
                  typeof Notification === "undefined"
                    ? "Not supported in this browser."
                    : Notification.permission === "denied"
                      ? "Blocked by the browser — enable notifications for this site to use this."
                      : "Browser alerts when tickets are called, recalled, transferred, or escalated while this tab is unfocused."
                }
                disabled={typeof Notification !== "undefined" && Notification.permission === "denied"}
                control={
                  <Switch
                    checked={settings.notificationDesktop}
                    disabled={typeof Notification !== "undefined" && Notification.permission === "denied"}
                    onChange={handleDesktopNotifications}
                  />
                }
              />
              <SettingRow
                icon={Bell}
                title="Focus sound"
                description="Short tone when queue events arrive while this tab is unfocused."
                control={
                  <Switch
                    checked={settings.notificationFocusSound}
                    onChange={(checked) =>
                      persistSettings({ ...settings, notificationFocusSound: checked })
                    }
                  />
                }
              />
              <SettingRow
                icon={Monitor}
                title="Reduced motion"
                description="Minimize non-essential animations on this device. Takes effect immediately."
                control={
                  <Switch
                    checked={settings.reducedMotion}
                    onChange={(checked) =>
                      persistSettings({ ...settings, reducedMotion: checked })
                    }
                  />
                }
              />
            </div>
          </Section>

          {/* Danger zone */}
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-destructive">
                  Reset local preferences
                </div>
                <div className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  Clears sync, notification, and session preferences stored in this browser. Server
                  configuration is unaffected.
                </div>
              </div>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20"
                onClick={() => {
                  updateSettings(DEFAULT_SYSTEM_SETTINGS);
                  updateIdleSettings(DEFAULT_IDLE_SETTINGS);
                  setSaveState("saved");
                  setTimeout(() => setSaveState("idle"), 1200);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
