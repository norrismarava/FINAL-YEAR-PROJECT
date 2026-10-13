import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { LogoLoader } from "@/components/LogoLoader";

export function RouteLoadingBar() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => {
    // Clear previous timers and show spinner for this transition
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
    setVisible(true);
    setFading(false);

    const settle = setTimeout(() => {
      setFading(true);
      const hide = setTimeout(() => {
        setVisible(false);
      }, 450);
      timersRef.current.push(hide);
    }, 1100);

    timersRef.current.push(settle);

    return () => {
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
    };
  }, [location.pathname, location.search]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020814]/45 backdrop-blur-[2px] transition-opacity duration-300 ${
        fading ? "pointer-events-none opacity-0" : "opacity-100 pointer-events-none"
      }`}
      aria-busy="true"
      aria-label="Loading page"
    >
      {/* WaitLess logo loader — rotating cross + fading checkmark */}
      <LogoLoader size={84} decorative />
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100">
        Loading
      </p>
    </div>
  );
}
