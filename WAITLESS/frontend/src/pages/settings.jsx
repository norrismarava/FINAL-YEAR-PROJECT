import { useEffect, useMemo, useState } from "react";
import { Bell, Monitor, Moon, Play, RefreshCw, Save, Shield, Timer, Trash2 } from "lucide-react";

import { useLiveRefresh } from "@/context/LiveRefreshContext";

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

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saveState, setSaveState] = useState("idle"); // idle|saving|saved

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

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
          </div>

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



