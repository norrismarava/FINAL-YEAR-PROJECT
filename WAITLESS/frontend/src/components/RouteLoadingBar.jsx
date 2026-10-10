import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

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
      {/* Spinning ring with logo inside */}
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 rounded-full border-[2.5px] border-cyan-200/15 border-r-cyan-400 border-t-teal-400 animate-[spin_1.5s_linear_infinite]" />
        <div className="absolute inset-0 grid place-items-center">
          <img
            src="/waitless-logo-icon.png"
            alt=""
            className="h-10 w-10 object-contain"
          />
        </div>
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100">
        Loading
      </p>
    </div>
  );
}
