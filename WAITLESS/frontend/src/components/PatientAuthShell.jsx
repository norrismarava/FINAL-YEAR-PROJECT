import { ShieldCheck } from "lucide-react";

import authBackground from "@/assets/BACKG.png";
import waitlessLogoIcon from "@/assets/waitless-logo-icon.png";

export function PatientAuthShell({ eyebrow, title, subtitle, children, footer, maxWidth = "max-w-[22rem]" }) {
  return (
    <section className="relative isolate min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      {/* Background image, hidden on mobile for a clean look */}
      <div className="pointer-events-none absolute inset-0 -z-20 hidden lg:block">
        <img
          src={authBackground}
          alt=""
          className="h-full w-full scale-[1.04] object-cover blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#04141f]/88 via-[#062a35]/80 to-[#0a1f2e]/84" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04141f]/70 via-transparent to-[#04141f]/35" />
      </div>

      {/* Subtle grid pattern on desktop */}

      {/* Mobile solid background */}
      <div className="absolute inset-0 -z-10 bg-[#04141f] lg:hidden" />

      {/* Form card, centered */}
      <div className="relative z-10 flex min-h-[calc(100vh-6rem)] items-center justify-center py-4">
        <div className={`relative w-full ${maxWidth}`}>
          {/* Orbiting radiant ring */}
          <div className="pointer-events-none absolute -inset-[3px] overflow-hidden rounded-[1.3rem]">
            <div
              className="absolute -inset-[150%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(45,212,191,0.85)_45deg,transparent_100deg,transparent_180deg,rgba(59,130,246,0.85)_225deg,transparent_280deg)]"
              style={{ animation: "auth-ring-spin 8s linear infinite" }}
            />
            <div className="absolute inset-[3px] rounded-2xl bg-[#04141f]" />
          </div>
        <div className="relative w-full rounded-2xl">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#04141f]/60 shadow-[0_32px_80px_-28px_rgba(2,8,20,0.45)] backdrop-blur-2xl">
            <div className="relative z-10">
            {/* Header */}
            <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(4,20,31,0.82)_0%,rgba(6,42,53,0.72)_48%,rgba(10,31,46,0.78)_100%)] px-5 py-3 text-center sm:px-6">
              <img
                src={waitlessLogoIcon}
                alt="WaitLess"
                className="mx-auto h-11 w-11 object-contain drop-shadow-[0_8px_20px_rgba(20,184,166,0.2)]"
              />
              <div className="mt-1.5">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-400">{eyebrow}</div>
                <h1 className="mt-0.5 inline-flex items-center gap-3 font-display text-xl font-bold tracking-tight text-white">
                  <span className="h-px w-8 bg-gradient-to-r from-transparent to-teal-300/60" />
                  {title}
                  <span className="h-px w-8 bg-gradient-to-l from-transparent to-teal-300/60" />
                </h1>
              </div>
              {subtitle ? (
                <p className="mt-2 text-[13px] leading-5 text-slate-400">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {/* Body */}
            <div className="px-5 py-3.5 sm:px-6">
              {children}

              {footer ? (
                <div className="mt-5 flex items-center justify-center gap-3 pt-1 text-xs text-slate-500">
                  {footer}
                </div>
              ) : null}

              {/* Security message */}
              <div className="mt-4 flex items-center justify-center gap-1.5 border-t border-white/10 pt-2.5 text-[11px] font-medium text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-400/60" />
                Your health information is protected.
              </div>
            </div>
          </div>
        </div>
        </div>
        </div>
      </div>
    </section>
  );
}
