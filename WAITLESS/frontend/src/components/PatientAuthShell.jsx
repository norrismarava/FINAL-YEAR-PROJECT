import { ShieldCheck } from "lucide-react";

import authBackground from "@/assets/BACKG.png";
import waitlessLogoIcon from "@/assets/waitless-logo-icon.png";

export function PatientAuthShell({ eyebrow, title, subtitle, children, footer, maxWidth = "max-w-[24rem]" }) {
  return (
    <section className="relative isolate min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      {/* Background image — hidden on mobile for a clean look */}
      <div className="pointer-events-none absolute inset-0 -z-20 hidden lg:block">
        <img
          src={authBackground}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#04141f]/82 via-[#062a35]/72 to-[#0a1f2e]/78" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04141f]/60 via-transparent to-[#04141f]/30" />
      </div>

      {/* Subtle grid pattern on desktop */}
      <div className="pointer-events-none absolute inset-0 -z-10 hidden opacity-[0.05] lg:block [background-image:linear-gradient(rgba(148,163,184,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.4)_1px,transparent_1px)] [background-size:82px_82px]" />

      {/* Mobile solid background */}
      <div className="absolute inset-0 -z-10 bg-[#f0f7f8] lg:hidden" />

      {/* Form card — centered */}
      <div className="relative z-10 flex min-h-[calc(100vh-6rem)] items-center justify-center py-6">
        <div className={`relative w-full ${maxWidth} rounded-2xl panel-border-glow`}>
          <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-[0_32px_80px_-28px_rgba(2,8,20,0.50)] backdrop-blur-2xl">
            {/* Circulating gradient ribbon */}
            <PatientRibbonCirculation />

            {/* Content above ribbon */}
            <div className="relative z-10">
            {/* Header */}
            <div className="border-b border-slate-200/80 bg-gradient-to-br from-teal-50/60 to-transparent px-5 py-5 text-center sm:px-6">
              <img
                src={waitlessLogoIcon}
                alt="WaitLess"
                className="mx-auto h-11 w-11 rounded-lg object-contain"
              />
              <div className="mt-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-600">{eyebrow}</div>
                <h1 className="mt-0.5 font-display text-xl font-bold tracking-tight text-slate-900">
                  {title}
                </h1>
              </div>
              {subtitle ? (
                <p className="mt-3 text-[13px] leading-5 text-slate-500">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {/* Body */}
            <div className="px-5 py-5 sm:px-6">
              {children}

              {footer ? (
                <div className="mt-5 flex items-center justify-center gap-3 pt-1 text-xs text-slate-500">
                  {footer}
                </div>
              ) : null}

              {/* Security message */}
              <div className="mt-5 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600/70" />
                Your health information is protected.
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

function PatientRibbonCirculation() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <span className="patient-ribbon-strand patient-ribbon-strand--one" />
      <span className="patient-ribbon-strand patient-ribbon-strand--two" />
      <span className="patient-ribbon-strand patient-ribbon-strand--three" />
    </div>
  );
}
