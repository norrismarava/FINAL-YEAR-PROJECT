import { useEffect } from "react";
import { AlertTriangle, LogOut, RefreshCw } from "lucide-react";

/**
 * Modal that warns the user about an impending automatic logout due to inactivity.
 *
 * @param {object} props
 * @param {boolean} props.show
 * @param {number}  props.secondsLeft
 * @param {function} props.onDismiss
 * @param {function} props.onLogout
 * @param {boolean} [props.isLight]
 */
export function IdleTimeoutModal({ show, secondsLeft, onDismiss, onLogout, isLight = false }) {
  useEffect(() => {
    if (!show) return;
    const handler = (e) => {
      e.preventDefault();
      onDismiss();
    };
    window.addEventListener("mousemove", handler, { once: true, passive: true });
    window.addEventListener("keydown", handler, { once: true, passive: true });
    window.addEventListener("touchstart", handler, { once: true, passive: true });
    return () => {
      window.removeEventListener("mousemove", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, [show, onDismiss]);

  if (!show) return null;

  const overlay = isLight
    ? "bg-slate-900/40 backdrop-blur-sm"
    : "bg-black/60 backdrop-blur-sm";
  const card = isLight
    ? "bg-white border border-slate-200 text-slate-900"
    : "bg-[#04141f] border border-white/15 text-white";
  const subtext = isLight ? "text-slate-500" : "text-slate-300";
  const dangerText = isLight ? "text-red-600" : "text-red-400";
  const btnPrimary = isLight
    ? "bg-teal-600 text-white hover:bg-teal-700"
    : "bg-teal-500 text-white hover:bg-teal-400";
  const btnSecondary = isLight
    ? "border border-slate-200 text-slate-600 hover:bg-slate-100"
    : "border border-white/15 text-slate-300 hover:bg-white/10";

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center ${overlay}`}>
      <div className={`mx-4 w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${card}`}>
        <div className="flex flex-col items-center text-center">
          <span className={`grid h-12 w-12 place-items-center rounded-full ${isLight ? "bg-amber-100" : "bg-amber-500/15"}`}>
            <AlertTriangle className={`h-6 w-6 ${dangerText}`} />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold">
            Are you still there?
          </h2>
          <p className={`mt-2 text-sm ${subtext}`}>
            You will be automatically logged out in
          </p>
          <div className={`mt-1 font-display text-3xl font-bold ${dangerText}`}>
            {secondsLeft}s
          </div>
          <p className={`mt-2 text-xs ${subtext}`}>
            Move your mouse or tap a key to stay signed in.
          </p>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onDismiss}
            className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${btnPrimary}`}
          >
            <RefreshCw className="h-4 w-4" />
            Stay signed in
          </button>
          <button
            onClick={onLogout}
            className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${btnSecondary}`}
          >
            <LogOut className="h-4 w-4" />
            Log out now
          </button>
        </div>
      </div>
    </div>
  );
}
