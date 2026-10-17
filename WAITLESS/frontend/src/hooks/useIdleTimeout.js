import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes of inactivity
const DEFAULT_WARNING_MS = 60 * 1000; // 1 minute warning
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll", "mousemove"];

/**
 * Tracks user activity and triggers a warning before automatic logout.
 *
 * @param {object} opts
 * @param {function} opts.onTimeout       , called when the idle timeout fires
 * @param {number}   [opts.timeoutMs]     , total inactivity duration before logout
 * @param {number}   [opts.warningMs]     , how long before timeout to show the warning
 * @param {boolean}  [opts.enabled]       , whether the hook is active
 * @returns {{ warning: boolean, secondsLeft: number, dismiss: () => void }}
 */
export function useIdleTimeout({
  onTimeout,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  warningMs = DEFAULT_WARNING_MS,
  enabled = true,
}) {
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const onTimeoutRef = useRef(onTimeout);

  // Keep latest callback without re-triggering effect
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(
    (msLeft) => {
      setWarning(true);
      setSecondsLeft(Math.ceil(msLeft / 1000));

      countdownRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearTimers();
            setWarning(false);
            onTimeoutRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimers],
  );

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    clearTimers();
    setWarning(false);

    timerRef.current = setTimeout(() => {
      startCountdown(warningMs);
    }, timeoutMs - warningMs);
  }, [enabled, clearTimers, startCountdown, timeoutMs, warningMs]);

  const dismiss = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      setWarning(false);
      return;
    }

    resetTimer();

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, resetTimer, { passive: true });
    }

    return () => {
      clearTimers();
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, resetTimer);
      }
    };
  }, [enabled, resetTimer, clearTimers]);

  return { warning, secondsLeft, dismiss };
}
