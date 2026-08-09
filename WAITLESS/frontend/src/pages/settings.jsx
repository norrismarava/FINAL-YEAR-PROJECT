import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Eye, EyeOff, Monitor, Moon, Play, RefreshCw, Save, Shield, ShieldCheck, SlidersHorizontal, Timer, Trash2, RotateCcw } from "lucide-react";

import { useLiveRefresh } from "@/context/LiveRefreshContext";
import { useAuth } from "@/auth/AuthContext";
import { fetchRuntimeConfig, updateRuntimeConfig, resetRuntimeConfig } from "@/services/queueApi";
import { useApiResource } from "@/hooks/useApiResource";

const STORAGE_KEY = "waitless_system_settings_v1";

const DEFAULT_SETTINGS = {
  liveSyncEnabled: true,
  autoRefreshIntervalSec: 10,
  queuePollingFallbackEnabled: true,
  notificationFocusSound: false,
  notificationDesktop: true,
  reducedMotion: false,
};

function clampInt(value, min, max) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function loadSettings() {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(next) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  disabled,
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <div className="font-semibold text-foreground">{title}</div>
          </div>
          <div className="mt-2 text-sm leading-6 text-muted-foreground">{description}</div>
        </div>
        <label className={"inline-flex items-center gap-3" + (disabled ? " opacity-60" : "")}>
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            className="h-5 w-5 accent-primary"
          />
        </label>
      </div>
    </div>
  );
}

function SliderRow({
  icon: Icon,
  title,
  description,
  value,
  min,
  max,
  step,
  onChange,
  disabled,
  valueSuffix,
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <div className="font-semibold text-foreground">{title}</div>
          </div>
          <div className="mt-2 text-sm leading-6 text-muted-foreground">{description}</div>
          <div className="mt-2 text-xs font-semibold text-muted-foreground">
            {value}
            {valueSuffix ?? ""}
          </div>
        </div>
        <div className={"w-full max-w-[320px]" + (disabled ? " opacity-60" : "")}> 
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { refreshLiveData } = useLiveRefresh();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [idleSettings, setIdleSettings] = useState(() => {
    if (typeof window === "undefined") return { idleTimeoutMs: 900000, warningMs: 60000 };
    try {
      const raw = window.localStorage.getItem("waitless_idle_settings_v1");
      return raw ? JSON.parse(raw) : { idleTimeoutMs: 900000, warningMs: 60000 };
    } catch {
      return { idleTimeoutMs: 900000, warningMs: 60000 };
    }
  });
  const [saveState, setSaveState] = useState("idle"); // idle|saving|saved
  const [configSaveState, setConfigSaveState] = useState("idle");
  const [configDraft, setConfigDraft] = useState(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const configQuery = useApiResource(
    useCallback(() => fetchRuntimeConfig(), []),
    { enabled: isAdmin },
  );

  useEffect(() => {
    if (configQuery.data) {
      setConfigDraft(configQuery.data);
    }
  }, [configQuery.data]);

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

  const preview = useMemo(() => {
    // Provide a best-effort preview of how settings will impact live behavior.
    // NOTE: LiveRefreshProvider always exists in AppLayout. QueueRealtimeProvider
    // should respect liveSyncEnabled/polling fallback settings.
    return settings;
  }, [settings]);

  function persistAndRefresh(next, { triggerRefresh } = { triggerRefresh: true }) {
    setSettings(next);
    saveSettings(next);

    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 1200);

    // Trigger live reload if we are enabling/disabling.
    if (triggerRefresh) {
      refreshLiveData();
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="surface-panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="eyebrow">System</div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">System settings</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Tune live queue syncing and notification behavior for smoother operations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saveState === "saved" ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/55 px-3 py-1 text-xs font-semibold text-primary">
                <Save className="h-3.5 w-3.5" />
                Saved
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                Local preferences
              </span>
            )}
          </div>
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-1">
          <div className="space-y-5">
            <div className="rounded-2xl border border-border/70 bg-background/60 p-5">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-semibold text-foreground">Live syncing</div>
              </div>
              <div className="mt-2 text-sm leading-6 text-muted-foreground">
                Controls how the dashboard refreshes when queue events arrive.
              </div>

              <div className="mt-5 space-y-4">
                <ToggleRow
                  icon={RefreshCw}
                  title="Enable live sync"
                  description="When off, the app stops applying incoming queue events and relies on manual refresh."
                  checked={settings.liveSyncEnabled}
                  onChange={(checked) =>
                    persistAndRefresh({ ...settings, liveSyncEnabled: checked }, { triggerRefresh: true })
                  }
                />

                <SliderRow
                  icon={Timer}
                  title="Auto refresh interval"
                  description="How often the dashboard refreshes data even when no events are received."
                  value={settings.autoRefreshIntervalSec}
                  min={2}
                  max={30}
                  step={1}
                  valueSuffix="s"
                  onChange={(v) =>
                    persistAndRefresh({ ...settings, autoRefreshIntervalSec: clampInt(v, 2, 30) }, { triggerRefresh: true })
                  }
                  disabled={!settings.liveSyncEnabled}
                />

                <ToggleRow
                  icon={Bell}
                  title="Polling fallback"
                  description="If realtime stream is unavailable, fall back to periodic refresh while offline."
                  checked={settings.queuePollingFallbackEnabled}
                  onChange={(checked) =>
                    persistAndRefresh({ ...settings, queuePollingFallbackEnabled: checked }, { triggerRefresh: true })
                  }
                  disabled={!settings.liveSyncEnabled}
                />
              </div>

              <div className="mt-5 text-xs text-muted-foreground">
                Tip: if you change live-sync options while on the dashboard, the current view will refresh immediately.
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/60 p-5">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-semibold text-foreground">Notification behavior</div>
              </div>
              <div className="mt-2 text-sm leading-6 text-muted-foreground">
                Stored locally. Backend notification delivery is unaffected.
              </div>

              <div className="mt-5 space-y-4">
                <ToggleRow
                  icon={Bell}
                  title="Desktop notifications"
                  description="Show browser notifications for delivery attention events (when supported)."
                  checked={settings.notificationDesktop}
                  onChange={(checked) =>
                    persistAndRefresh({ ...settings, notificationDesktop: checked }, { triggerRefresh: false })
                  }
                />

                <ToggleRow
                  icon={Bell}
                  title="Sound on focus"
                  description="Play a subtle sound when selecting a notification focus panel (local only)."
                  checked={settings.notificationFocusSound}
                  onChange={(checked) =>
                    persistAndRefresh({ ...settings, notificationFocusSound: checked }, { triggerRefresh: false })
                  }
                />

                <ToggleRow
                  icon={Play}
                  title="Reduced motion"
                  description="Minimize animations where possible (local only)."
                  checked={settings.reducedMotion}
                  onChange={(checked) =>
                    persistAndRefresh({ ...settings, reducedMotion: checked }, { triggerRefresh: false })
                  }
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/60 p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-semibold text-foreground">Session security</div>
              </div>
              <div className="mt-2 text-sm leading-6 text-muted-foreground">
                Configure automatic logout when the workstation is left unattended.
              </div>

              <div className="mt-5 space-y-4">
                <SliderRow
                  icon={Timer}
                  title="Idle logout timeout"
                  description="Staff will be warned before automatic logout after this period of inactivity."
                  value={Math.round((idleSettings.idleTimeoutMs ?? 900000) / 60000)}
                  min={5}
                  max={60}
                  step={5}
                  valueSuffix="min"
                  onChange={(v) => {
                    const ms = v * 60 * 1000;
                    const next = { ...idleSettings, idleTimeoutMs: ms };
                    setIdleSettings(next);
                    window.localStorage.setItem("waitless_idle_settings_v1", JSON.stringify(next));
                  }}
                />
              </div>

              <div className="mt-4 text-xs text-muted-foreground">
                A 60-second warning dialog appears before logout, giving staff time to stay signed in.
              </div>
            </div>
          </div>

          {isAdmin && configDraft && (
            <div className="rounded-2xl border border-border/70 bg-background/60 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-semibold text-foreground">Workflow configuration</div>
                </div>
                <div className="flex items-center gap-2">
                  {configSaveState === "saved" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft/55 px-2.5 py-1 text-xs font-semibold text-primary">
                      <Save className="h-3 w-3" /> Saved
                    </span>
                  )}
                  {configSaveState === "saving" && (
                    <span className="text-xs text-muted-foreground">Saving...</span>
                  )}
                  {configSaveState === "error" && (
                    <span className="text-xs text-destructive">Failed</span>
                  )}
                  <button
                    type="button"
                    onClick={saveConfig}
                    disabled={configSaveState === "saving"}
                    className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-xs font-semibold hover:bg-accent"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save config
                  </button>
                  <button
                    type="button"
                    onClick={handleResetConfig}
                    disabled={configSaveState === "saving"}
                    className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-xs font-semibold hover:bg-accent"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm leading-6 text-muted-foreground">
                Runtime-configurable thresholds for triage reassessment, ETA estimation, and recall grace period. Changes take effect immediately.
              </div>

              <div className="mt-5 space-y-4">
                <ToggleRow
                  icon={configDraft.oiPrivacyMode !== false ? EyeOff : Eye}
                  title="OI Clinic privacy mode"
                  description="Masks patient names and details for OI Clinic tickets on public queue boards and tracking pages. Protects HIV/TB patient confidentiality."
                  checked={configDraft.oiPrivacyMode !== false}
                  onChange={(v) => updateConfigField("oiPrivacyMode", v)}
                />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                  <div className="text-xs font-semibold text-muted-foreground">Red reassessment threshold (min)</div>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={configDraft.triageReassessmentThresholdsMinutes?.red ?? 10}
                    onChange={(e) => updateConfigField("triageReassessmentThresholdsMinutes.red", Number(e.target.value))}
                    className="input-base mt-2 h-9 w-full text-sm"
                  />
                  <div className="mt-1 text-[10px] text-muted-foreground">Alert when Red patients wait beyond this</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                  <div className="text-xs font-semibold text-muted-foreground">Yellow reassessment threshold (min)</div>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={configDraft.triageReassessmentThresholdsMinutes?.yellow ?? 30}
                    onChange={(e) => updateConfigField("triageReassessmentThresholdsMinutes.yellow", Number(e.target.value))}
                    className="input-base mt-2 h-9 w-full text-sm"
                  />
                  <div className="mt-1 text-[10px] text-muted-foreground">Alert when Yellow patients wait beyond this</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                  <div className="text-xs font-semibold text-muted-foreground">ETA minutes per patient ahead</div>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    step={0.5}
                    value={configDraft.etaMinutesPerPatientAhead ?? 7}
                    onChange={(e) => updateConfigField("etaMinutesPerPatientAhead", Number(e.target.value))}
                    className="input-base mt-2 h-9 w-full text-sm"
                  />
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                  <div className="text-xs font-semibold text-muted-foreground">ETA baseline minutes</div>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={configDraft.etaBaselineMinutes ?? 3}
                    onChange={(e) => updateConfigField("etaBaselineMinutes", Number(e.target.value))}
                    className="input-base mt-2 h-9 w-full text-sm"
                  />
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                  <div className="text-xs font-semibold text-muted-foreground">ETA active dept bonus (min)</div>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={configDraft.etaActiveDepartmentBonusMinutes ?? 4}
                    onChange={(e) => updateConfigField("etaActiveDepartmentBonusMinutes", Number(e.target.value))}
                    className="input-base mt-2 h-9 w-full text-sm"
                  />
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                  <div className="text-xs font-semibold text-muted-foreground">Missed recall grace period (min)</div>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={configDraft.missedRecallGracePeriodMinutes ?? 5}
                    onChange={(e) => updateConfigField("missedRecallGracePeriodMinutes", Number(e.target.value))}
                    className="input-base mt-2 h-9 w-full text-sm"
                  />
                </div>
              </div>

              {configDraft.updatedAt && (
                <div className="mt-4 text-xs text-muted-foreground">
                  Last updated: {new Date(configDraft.updatedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-destructive">Reset to defaults</div>
                <div className="mt-2 text-sm leading-6 text-destructive">
                  Clears system settings preferences stored in this browser.
                </div>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/15"
                onClick={() => {
                  const next = DEFAULT_SETTINGS;
                  saveSettings(next);
                  setSettings(next);
                  refreshLiveData();
                  setSaveState("saved");
                  setTimeout(() => setSaveState("idle"), 1200);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



