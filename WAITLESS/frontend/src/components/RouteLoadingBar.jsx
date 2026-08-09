import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * A top-of-viewport loading bar that activates on:
 * - Initial app mount (first load)
 * - Every route/path change
 *
 * The bar animates from 0 → ~80% quickly, then completes
 * and fades out once the new route has settled.
 */
export function RouteLoadingBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const completeRef = useRef(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    // On first mount, show the bar immediately for the initial load
    if (isFirstMount.current) {
      isFirstMount.current = false;
      startBar();
      return;
    }

    // On subsequent route changes, trigger the bar
    startBar();

    return () => {
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  function clearTimers() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (completeRef.current) {
      clearTimeout(completeRef.current);
      completeRef.current = null;
    }
  }

  function startBar() {
    clearTimers();
    setProgress(0);
    setVisible(true);

    // Quick jump to ~30%
    setProgress(30);

    // Incrementally advance to ~80%
    let current = 30;
    timerRef.current = setInterval(() => {
      current += Math.random() * 12;
      if (current >= 80) {
        current = 80;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
      setProgress(current);
    }, 180);

    // Complete after a short delay — the route has rendered
    completeRef.current = setTimeout(() => {
      setProgress(100);
      // Hide after the fill animation finishes
      setTimeout(() => {
        setVisible(false);
      }, 350);
    }, 500);
  }

  if (!visible) return null;

  return (
    <div
      className="route-loading-bar"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading page"
    >
      <div
        className="route-loading-bar__fill"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
