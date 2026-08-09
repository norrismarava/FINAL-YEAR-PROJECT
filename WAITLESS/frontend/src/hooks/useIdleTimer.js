import { useCallback, useEffect, useRef, useState } from "react";

const IDLE_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

const DEFAULT_IDLE_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_WARNING_MS = 60 * 1000; // 60 second warning before logout
const STORAGE_KEY = "waitless_idle_settings_v1";

function loadSettings() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function useIdleTimer({ enabled = true } = {}) {
  const settings = loadSettings();
  const idleTimeoutMs = settings.idleTimeoutMs ?? DEFAULT_IDLE_MS;
  const warningMs = settings.warningMs ?? DEFAULT_WARNING_MS;

  const [isWarning, setIsWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const lastActivityRef = useRef(Date.now());
  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownRef = useRef(null);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsWarning(false);

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    if (!enabled) return;

    const warningDelay = idleTimeoutMs - warningMs;
    warningTimerRef.current = setTimeout(() => {
      setIsWarning(true);
      setRemainingSeconds(Math.ceil(warningMs / 1000));

      countdownRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningDelay);

    idleTimerRef.current = setTimeout(() => {
      setIsWarning(false);
      window.dispatchEvent(new CustomEvent("waitless:idle-timeout"));
    }, idleTimeoutMs);
  }, [enabled, idleTimeoutMs, warningMs]);

  const dismissWarning = useCallback(() => {
    resetActivity();
  }, [resetActivity]);

  const setIdleTimeout = useCallback((ms) => {
    const next = { ...loadSettings(), idleTimeoutMs: ms };
    saveSettings(next);
    resetActivity();
  }, [resetActivity]);

  useEffect(() => {
    if (!enabled) {
      resetActivity();
      return;
    }

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current > 5000) {
        resetActivity();
      }
    };

    for (const event of IDLE_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    resetActivity();

    return () => {
      for (const event of IDLE_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [enabled, resetActivity]);

  return {
    isWarning,
    remainingSeconds,
    dismissWarning,
    idleTimeoutMs,
    setIdleTimeout,
  };
}
