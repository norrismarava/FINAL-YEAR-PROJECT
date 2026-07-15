import { Link } from "react-router-dom";
import Lottie from "lottie-react";
import {
  Activity,
  BellRing,
  ChevronDown,
  HeartPulse,
  ShieldCheck,
} from "lucide-react";

import tryBg from "@/assets/try.png";
import waitlessAuthAnimation from "@/assets/waitless-hospital-auth-animation.json";
import { WaitLessLogo } from "@/components/WaitLessLogo";

const AUTH_FEATURE_ITEMS = [
  {
    icon: Activity,
    title: "Real-time queues",
    body: "Live patient flow monitoring",
  },
  {
    icon: HeartPulse,
    title: "Triage aware",
    body: "Smart priority routing",
  },
  {
    icon: BellRing,
    title: "Connected",
    body: "One platform, every department",
  },
  {
    icon: ShieldCheck,
    title: "Secure & reliable",
    body: "Built for hospital teams",
  },
];

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  wide = false,
}) {
  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#020814] px-4 py-4 text-white sm:px-5 sm:py-5 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-30 bg-[radial-gradient(circle_at_18%_16%,rgba(8,145,178,0.18),transparent_22%),radial-gradient(circle_at_84%_8%,rgba(59,130,246,0.12),transparent_24%),linear-gradient(180deg,#020814_0%,#04101d_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-20 opacity-[0.05] [background-image:linear-gradient(rgba(148,163,184,0.62)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.52)_1px,transparent_1px)] [background-size:82px_82px]" />

      <div className="mx-auto max-w-[84rem]">
        <div className="relative overflow-hidden rounded-[1.85rem] shadow-[0_34px_96px_rgba(0,0,0,0.42)]">
          <div
            className="absolute inset-0 -z-30 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${tryBg})` }}
          />
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(1,9,18,0.8)_0%,rgba(2,11,22,0.72)_28%,rgba(3,16,30,0.22)_56%,rgba(2,10,20,0.62)_100%)]" />
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(2,12,22,0.18),rgba(1,8,16,0.68))]" />
          <div className="absolute inset-y-0 left-0 -z-10 w-[64%] bg-[radial-gradient(circle_at_18%_28%,rgba(8,99,188,0.18),transparent_34%),radial-gradient(circle_at_24%_78%,rgba(20,184,166,0.12),transparent_24%)]" />
          <div className="absolute inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(rgba(191,219,254,0.64)_1px,transparent_1px),linear-gradient(90deg,rgba(191,219,254,0.56)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/60 to-transparent" />
          <div className="pointer-events-none absolute left-[10%] top-10 h-3 w-3 rounded-full bg-cyan-300/30 blur-sm" />
          <div className="pointer-events-none absolute left-[42%] top-[34%] h-2.5 w-2.5 rounded-full bg-blue-300/35 blur-sm" />
          <div className="pointer-events-none absolute right-[36%] top-[52%] h-2.5 w-2.5 rounded-full bg-emerald-300/35 blur-sm" />
          <AuthRibbonCirculation />

          <div
            className={`relative z-10 grid min-h-[41rem] items-stretch gap-0 lg:min-h-[43rem] ${
              wide ? "lg:grid-cols-[1.04fr_0.82fr]" : "lg:grid-cols-[1.08fr_0.76fr]"
            }`}
          >
            <aside className="hidden lg:flex flex-col justify-between px-7 py-7 xl:px-8 xl:py-8">
              <div className="max-w-xl page-section-rise">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/18 bg-cyan-300/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-100 backdrop-blur-xl">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.85)]" />
                  Hospital operations platform
                </div>

                <h1 className="mt-6 max-w-[34rem] font-display text-[2.85rem] font-bold leading-[0.98] tracking-tight text-white xl:text-[3.35rem]">
                  Smarter patient flow.
                  <span className="mt-2 block bg-[linear-gradient(135deg,#d5fbff_0%,#22e4cf_34%,#22d3ee_72%,#38bdf8_100%)] bg-clip-text text-transparent">
                    Better hospital care.
                  </span>
                </h1>

                <p className="mt-5 max-w-[29rem] text-[14px] leading-7 text-slate-200/82 xl:text-[15px]">
                  Securely manage patient registration, triage, queues and clinical
                  operations from one connected hospital platform.
                </p>
              </div>

              <AuthClinicalMotion wide={wide} />

              <div className="mt-6 w-full self-start page-section-rise page-section-rise-delay-2">
                <div className="grid w-full grid-cols-2 gap-3.5 xl:grid-cols-4 xl:gap-4">
                  {AUTH_FEATURE_ITEMS.map((item) => (
                    <AuthFeatureCard key={item.title} {...item} />
                  ))}
                </div>
              </div>
            </aside>

            <div className="flex items-center justify-center px-4 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
              <div className={`mx-auto w-full ${wide ? "max-w-[29.5rem]" : "max-w-[24.5rem]"}`}>
                <div className="relative overflow-hidden rounded-[1.7rem] bg-[linear-gradient(180deg,rgba(3,16,30,0.22),rgba(2,12,24,0.3)_45%,rgba(2,10,20,0.38)_100%)] shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur-[30px] page-section-rise page-section-rise-delay-1">
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_28%,rgba(8,145,178,0.08)_56%,rgba(2,12,24,0.04)_100%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(34,211,238,0.2),transparent_24%),radial-gradient(circle_at_bottom_center,rgba(59,130,246,0.14),transparent_36%)]" />
                  <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/36 to-transparent" />

                  <div className="relative px-5 pb-6 pt-5 sm:px-6 sm:pb-7 sm:pt-6">
                    <Link
                      to="/"
                      className="mx-auto flex max-w-[16rem] items-center justify-center gap-3.5"
                      aria-label="Go to WaitLess home"
                    >
                      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-100/30" />
                      <WaitLessLogo
                        className="items-center text-white"
                        subtitle="Hospital Flow"
                        subtitleClassName="pl-0 text-[9px] tracking-[0.22em] text-cyan-100/68"
                      />
                      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-100/30" />
                    </Link>

                    <div className="mt-6 text-center">
                      <div className="flex justify-center">
                        <div className="inline-flex min-w-[10.25rem] items-center justify-center rounded-full border border-cyan-200/14 bg-[linear-gradient(180deg,rgba(34,211,238,0.18),rgba(8,145,178,0.09))] px-[1.125rem] py-2 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_30px_rgba(6,78,118,0.16)] backdrop-blur-xl">
                          {eyebrow}
                        </div>
                      </div>
                      <h2 className="mt-4 font-display text-[2rem] font-bold tracking-tight text-white sm:text-[2.15rem]">
                        {title}
                      </h2>
                      <p className="mx-auto mt-3 max-w-sm text-sm leading-[1.65rem] text-slate-200/76 sm:text-[14px]">
                        {subtitle}
                      </p>
                    </div>

                    <div className="mt-6 page-section-rise page-section-rise-delay-2">
                      {children}
                    </div>

                    {footer ? (
                      <div className="mt-6 page-section-rise page-section-rise-delay-3">
                        <div className="flex items-center gap-4">
                          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-100/24" />
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/6 text-cyan-100/72 backdrop-blur">
                            <ShieldCheck className="h-4 w-4" />
                          </span>
                          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-100/24" />
                        </div>
                        <div className="mt-5 text-center text-sm text-slate-200/72">
                          {footer}
                        </div>
                      </div>
                    ) : null}
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

function AuthRibbonCirculation() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <span className="auth-ribbon-strand auth-ribbon-strand--one" />
      <span className="auth-ribbon-strand auth-ribbon-strand--two" />
      <span className="auth-ribbon-strand auth-ribbon-strand--three" />
    </div>
  );
}

function AuthClinicalMotion({ wide }) {
  return (
    <div
      className={`relative -ml-2 mt-6 hidden w-[calc(100%+3.5rem)] max-w-none overflow-hidden page-section-rise page-section-rise-delay-1 lg:block xl:-ml-3 xl:w-[calc(100%+5rem)] ${
        wide ? "h-[15.5rem] xl:h-[16.25rem]" : "h-[14.75rem] xl:h-[15.5rem]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(2,12,24,0.28)_0%,rgba(2,12,24,0.14)_34%,rgba(2,12,24,0)_72%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[54%] bg-[radial-gradient(circle_at_28%_54%,rgba(8,145,178,0.18),transparent_42%),radial-gradient(circle_at_22%_26%,rgba(59,130,246,0.12),transparent_28%)]" />
      <div className="pointer-events-none absolute bottom-1 left-[8%] h-28 w-64 rounded-full bg-cyan-400/[0.12] blur-3xl" />
      <div className="pointer-events-none absolute bottom-6 right-[18%] h-20 w-52 rounded-full bg-blue-400/[0.08] blur-3xl" />

      <div className="relative h-full px-5 py-2 xl:px-6 xl:py-3">
        <div className="relative h-full">
          <div className="absolute bottom-[-8%] left-[-1%] z-20 h-[120%] w-[39%] min-w-[12rem] xl:w-[37%]">
            <Lottie
              animationData={waitlessAuthAnimation}
              autoplay
              loop
              rendererSettings={{
                preserveAspectRatio: "xMidYMid meet",
              }}
              className="h-full w-full opacity-[0.98]"
            />
          </div>

          <div className="absolute inset-y-[6%] left-[34%] right-[-1%] z-10 overflow-hidden xl:left-[32%]">
            <div className="absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#031827]/34 via-[#031827]/10 to-transparent" />
            <svg
              viewBox="0 0 700 130"
              preserveAspectRatio="none"
              className="h-full w-full"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="authShellEcgGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0" />
                  <stop offset="12%" stopColor="#14b8a6" stopOpacity="0.52" />
                  <stop offset="46%" stopColor="#22d3ee" stopOpacity="1" />
                  <stop offset="80%" stopColor="#60a5fa" stopOpacity="0.74" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                </linearGradient>

                <filter
                  id="authShellEcgGlow"
                  x="-40%"
                  y="-80%"
                  width="180%"
                  height="260%"
                >
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <path
                d="
                  M 0 65
                  H 65
                  L 88 63
                  L 108 65
                  H 145
                  L 165 48
                  L 184 91
                  L 205 18
                  L 228 108
                  L 251 55
                  L 272 65
                  H 335
                  L 354 61
                  L 375 69
                  L 397 65
                  H 452
                  L 472 48
                  L 491 91
                  L 512 22
                  L 535 105
                  L 557 56
                  L 580 65
                  H 700
                "
                fill="none"
                stroke="#22d3ee"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.14"
              />

              <path
                d="
                  M 0 65
                  H 65
                  L 88 63
                  L 108 65
                  H 145
                  L 165 48
                  L 184 91
                  L 205 18
                  L 228 108
                  L 251 55
                  L 272 65
                  H 335
                  L 354 61
                  L 375 69
                  L 397 65
                  H 452
                  L 472 48
                  L 491 91
                  L 512 22
                  L 535 105
                  L 557 56
                  L 580 65
                  H 700
                "
                fill="none"
                stroke="url(#authShellEcgGradient)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#authShellEcgGlow)"
                pathLength="1"
                strokeDasharray="0.28 0.72"
                className="auth-ecg-line"
              />
            </svg>
            <div className="absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#031827]/72 via-[#031827]/34 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthFeatureCard({ icon: Icon, title, body }) {
  return (
    <div className="group flex min-h-[7.35rem] flex-col items-center rounded-[1.3rem] border border-cyan-200/12 bg-[linear-gradient(180deg,rgba(7,24,40,0.48),rgba(3,14,27,0.44))] px-3.5 py-3.5 text-center shadow-[0_22px_46px_-34px_rgba(2,6,23,0.92),inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-xl transition-[transform,border-color,background,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-cyan-200/18 hover:bg-[linear-gradient(180deg,rgba(8,29,47,0.56),rgba(4,16,30,0.52))] hover:shadow-[0_26px_54px_-34px_rgba(2,6,23,0.98),0_0_0_1px_rgba(103,232,249,0.06)]">
      <span className="mx-auto grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cyan-200/18 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.16),rgba(7,24,40,0.94))] text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_24px_rgba(34,211,238,0.08)]">
        <Icon className="h-[1.125rem] w-[1.125rem]" />
      </span>
      <div className="mt-3 font-display text-[0.92rem] font-bold leading-[1.24] text-white">
        {title}
      </div>
      <p className="mt-1.5 max-w-[10rem] text-[0.8rem] leading-5 text-slate-300/76">
        {body}
      </p>
    </div>
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
      <span className="relative mt-2 block">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/60" />
        ) : null}
        <input
          {...props}
          className={`auth-glass-input h-12 w-full rounded-[0.95rem] border border-cyan-200/12 bg-[linear-gradient(180deg,rgba(13,39,60,0.54),rgba(4,20,36,0.42))] px-4 text-sm font-medium text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_34px_rgba(2,6,23,0.2)] outline-none backdrop-blur-2xl transition placeholder:text-slate-300/52 focus:border-cyan-200/28 focus:bg-[linear-gradient(180deg,rgba(14,44,68,0.64),rgba(5,24,43,0.5))] focus:ring-4 focus:ring-cyan-300/8 ${Icon ? "pl-11" : ""} ${props.className ?? ""}`}
        />
      </span>
    </label>
  );
}

export function AuthSelect({ icon: Icon, label, children, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-slate-100/88">{label}</span>
      <span className="relative mt-2 block">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/60" />
        ) : null}
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/72" />
        <select
          {...props}
          className={`auth-glass-input auth-glass-select h-12 w-full appearance-none rounded-[0.95rem] border border-cyan-200/12 bg-[linear-gradient(180deg,rgba(13,39,60,0.54),rgba(4,20,36,0.42))] px-4 pr-11 text-sm font-medium text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_34px_rgba(2,6,23,0.2)] outline-none backdrop-blur-2xl transition focus:border-cyan-200/28 focus:bg-[linear-gradient(180deg,rgba(14,44,68,0.64),rgba(5,24,43,0.5))] focus:ring-4 focus:ring-cyan-300/8 ${Icon ? "pl-11" : ""} ${props.className ?? ""}`}
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
      className={`inline-flex h-12 w-full items-center justify-center rounded-[0.95rem] border border-cyan-200/12 bg-[linear-gradient(135deg,#11779f_0%,#1488ac_42%,#1a9c97_100%)] px-4 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(2,6,23,0.34),inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:brightness-105 hover:saturate-110 focus:outline-none focus:ring-4 focus:ring-cyan-300/14 disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ""}`}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
