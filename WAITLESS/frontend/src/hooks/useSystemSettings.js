import { useCallback, useEffect, useState } from "react";

export const SYSTEM_SETTINGS_KEY = "waitless_system_settings_v1";
export const IDLE_SETTINGS_KEY = "waitless_idle_settings_v1";
const CHANGE_EVENT = "waitless:settings-changed";

export const DEFAULT_SYSTEM_SETTINGS = {
  liveSyncEnabled: true,
  autoRefreshIntervalSec: 10,
  queuePollingFallbackEnabled: true,
  notificationFocusSound: false,
  notificationDesktop: true,
  reducedMotion: false,
};

export const DEFAULT_IDLE_SETTINGS = { idleTimeoutMs: 900000, warningMs: 60000 };

const isBrowser = typeof window !== "undefined";

export function loadJsonSetting(key, fallback) {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function saveJsonSetting(key, value) {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
}

/**
 * localStorage-backed reactive setting. Re-renders consumers immediately on
 * same-tab writes (custom event) and cross-tab changes (storage event), so
 * toggles take effect without a reload.
 */
export function useJsonSetting(key, fallback) {
  const [value, setValue] = useState(() => loadJsonSetting(key, fallback));

  useEffect(() => {
    function refresh() {
      setValue(loadJsonSetting(key, fallback));
    }
    function onCustom(event) {
      if (event.detail?.key === key) refresh();
    }
    function onStorage(event) {
      if (!event.key || event.key === key) refresh();
    }
    window.addEventListener(CHANGE_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [key, fallback]);

  const update = useCallback(
    (next) => {
      const current = loadJsonSetting(key, fallback);
      saveJsonSetting(key, typeof next === "function" ? next(current) : next);
    },
    [key, fallback],
  );

  return [value, update];
}

export function useSystemSettings() {
  return useJsonSetting(SYSTEM_SETTINGS_KEY, DEFAULT_SYSTEM_SETTINGS);
}

export function useIdleSettings() {
  return useJsonSetting(IDLE_SETTINGS_KEY, DEFAULT_IDLE_SETTINGS);
}
