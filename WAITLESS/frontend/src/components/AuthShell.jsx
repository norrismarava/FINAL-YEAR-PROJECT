import { ChevronDown, ShieldCheck } from "lucide-react";

import authBackground from "@/assets/BACKG.png";
import waitlessLogoIcon from "@/assets/waitless-logo-icon.png";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  wide = false,
}) {
  return (
    <section className="relative isolate flex min-h-screen justify-center overflow-x-hidden overflow-y-auto bg-[#04141f] px-4 py-6 text-white">
      {/* Softened shared auth background */}
      <div className="pointer-events-none absolute inset-0">
        <img
          src={authBackground}
          alt=""
          className="h-full w-full scale-[1.04] object-cover blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#04141f]/88 via-[#062a35]/80 to-[#0a1f2e]/84" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04141f]/70 via-transparent to-[#04141f]/35" />
      </div>

      {/* Card + orbiting ring */}
      <div className={`relative my-auto w-full ${wide ? "max-w-[27rem]" : "max-w-[24rem]"}`}>
        <div className="pointer-events-none absolute -inset-[3px] overflow-hidden rounded-[1.3rem]">
          <div
            className="absolute -inset-[150%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(45,212,191,0.85)_45deg,transparent_100deg,transparent_180deg,rgba(59,130,246,0.85)_225deg,transparent_280deg)]"
            style={{ animation: "auth-ring-spin 8s linear infinite" }}
          />
          <div className="absolute inset-[3px] rounded-2xl bg-[#04141f]" />
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#04141f]/60 shadow-[0_32px_80px_-28px_rgba(2,8,20,0.45)] backdrop-blur-2xl">
          <div className="relative z-10">
            {/* Header */}
            <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(4,20,31,0.82)_0%,rgba(6,42,53,0.72)_48%,rgba(10,31,46,0.78)_100%)] px-5 py-2.5 text-center sm:px-5">
              <img
                src={waitlessLogoIcon}
                alt="WaitLess"
                className="mx-auto h-9 w-9 object-contain drop-shadow-[0_8px_20px_rgba(20,184,166,0.2)]"
              />
              <div className="mt-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-400">
                  {eyebrow}
                </div>
                <h1 className="mt-0.5 inline-flex items-center gap-3 font-display text-lg font-bold tracking-tight text-white">
                  <span className="h-px w-7 bg-gradient-to-r from-transparent to-teal-300/60" />
                  {title}
                  <span className="h-px w-7 bg-gradient-to-l from-transparent to-teal-300/60" />
                </h1>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-slate-400">
                {subtitle}
              </p>
            </div>

            {/* Body */}
            <div className="px-5 py-3 sm:px-5">
              {children}

              {footer ? (
                <div className="mt-4 flex items-center justify-center gap-3 pt-1 text-xs text-slate-500">
                  {footer}
                </div>
              ) : null}

              {/* Security message */}
              <div className="mt-3.5 flex items-center justify-center gap-1.5 border-t border-white/10 pt-2 text-[11px] font-medium text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-400/60" />
                Your health information is protected.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AuthError({ icon: Icon, message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-red-300/24 bg-red-400/10 px-4 py-3 text-sm text-red-50 backdrop-blur">
      <div className="flex gap-3">
        {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0" /> : null}
        <span>{message}</span>
      </div>
    </div>
  );
}

export function AuthInput({ icon: Icon, label, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-slate-100/88">{label}</span>
      <span className="relative mt-1.5 block">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        ) : null}
        <input
          {...props}
          className={`h-10 w-full rounded-full border border-white/8 bg-[#04101f]/80 px-4 text-[13px] font-medium text-slate-50 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5),inset_0_-1px_0_rgba(255,255,255,0.04)] outline-none transition placeholder:text-slate-500 focus:border-teal-400/50 focus:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5),0_0_0_3px_rgba(45,212,191,0.15)] ${Icon ? "pl-10" : ""} ${props.className ?? ""}`}
        />
      </span>
    </label>
  );
}

export function AuthSelect({ icon: Icon, label, children, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-slate-100/88">{label}</span>
      <span className="relative mt-1.5 block">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        ) : null}
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <select
          {...props}
          className={`auth-glass-select h-10 w-full appearance-none rounded-full border border-white/8 bg-[#04101f]/80 px-4 pr-10 text-[13px] font-medium text-slate-50 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5),inset_0_-1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-teal-400/50 focus:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5),0_0_0_3px_rgba(45,212,191,0.15)] ${Icon ? "pl-10" : ""} ${props.className ?? ""}`}
        >
          {children}
        </select>
      </span>
    </label>
  );
}

export function AuthButton({ children, loading, ...props }) {
  return (
    <button
      {...props}
      className={`relative inline-flex h-10 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#0d9488,#14b8a6_55%,#22d3ee)] px-6 text-sm font-semibold text-white shadow-[0_14px_30px_-10px_rgba(20,184,166,0.55),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(4,60,54,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-10px_rgba(20,184,166,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ""}`}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
