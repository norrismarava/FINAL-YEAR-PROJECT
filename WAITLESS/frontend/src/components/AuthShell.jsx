import { Link } from "react-router-dom";
import { Activity, Clock3, ShieldCheck } from "lucide-react";

import waitlessLogo from "@/assets/waitlesslogo-cropped.png";

const AUTH_TICKER_ITEMS = [
  "OPD window 2 calling A-104",
  "Triage red cases stay at the front",
  "Pharmacy queue synced",
  "WhatsApp alert sent to next patient",
  "Missed turn ready for recall",
  "Radiology transfer logged",
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
    <section className="relative isolate min-h-[calc(100vh-7rem)] overflow-hidden bg-[#061b2f] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-30 bg-[linear-gradient(135deg,#031226_0%,#06233a_42%,#0f5f72_100%)]" />
      <div className="absolute inset-0 -z-20 opacity-[0.18] [background-image:linear-gradient(rgba(125,211,252,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute inset-y-0 right-0 -z-10 hidden w-1/2 border-l border-cyan-200/10 bg-[linear-gradient(180deg,rgba(14,116,144,0.20),rgba(2,6,23,0.04))] lg:block" />
      <div className="pointer-events-none absolute left-8 top-24 -z-10 hidden rounded-2xl border border-cyan-200/10 px-5 py-4 font-display text-[11px] font-bold uppercase tracking-[0.26em] text-cyan-100/20 lg:block">
        Queue board / live calls / triage priority
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-13rem)] max-w-7xl items-center justify-center py-6 lg:py-8">
        <div className={`grid w-full items-center gap-8 ${wide ? "lg:grid-cols-[0.72fr_1.12fr]" : "lg:grid-cols-[1fr_0.82fr]"}`}>
          <aside className="hidden lg:block">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure staff access
              </div>
              <h1 className="mt-5 font-display text-5xl font-bold leading-[1.03] tracking-tight">
                Manage today's queue from the staff console.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-200/82">
                Pick up where reception and triage left off: call the next ticket,
                move patients between departments, and keep the waiting room informed.
              </p>
            </div>

            <AuthTicker />

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              <AuthMetric icon={Clock3} label="Median wait today" value="23m" />
              <AuthMetric icon={Activity} label="Departments active" value="6" />
              <AuthMetric icon={ShieldCheck} label="Role-based access" value="RBAC" />
            </div>
          </aside>

          <div className={`mx-auto w-full ${wide ? "max-w-2xl" : "max-w-md"}`}>
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/18 bg-cyan-300/12 p-[1px] shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent" />
              <div className="rounded-[1.7rem] bg-[linear-gradient(145deg,rgba(15,91,111,0.96),rgba(10,73,92,0.98)_48%,rgba(8,52,73,0.96))] px-6 pb-7 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
                <Link
                  to="/"
                  className="mx-auto mb-5 flex h-14 w-full max-w-72 items-center justify-center"
                  aria-label="Go to WaitLess home"
                >
                  <span className="h-px w-12 bg-cyan-200/60" />
                  <AuthLogoImage className="mx-4 h-10 max-w-[180px]" />
                  <span className="h-px w-12 bg-cyan-200/60" />
                </Link>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-100/75">
                    {eyebrow}
                  </div>
                  <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-cyan-50/75">{subtitle}</p>
                </div>

                <div className="mt-7">{children}</div>

                {footer && (
                  <div className="mt-6 border-t border-white/12 pt-5 text-center text-sm text-cyan-50/78">
                    {footer}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthLogoImage({ className = "" }) {
  return (
    <img
      src={waitlessLogo}
      alt="WaitLess"
      className={`w-auto object-contain drop-shadow-[0_12px_28px_rgba(8,145,178,0.35)] ${className}`}
    />
  );
}

function AuthTicker() {
  const tickerItems = [...AUTH_TICKER_ITEMS, ...AUTH_TICKER_ITEMS];

  return (
    <div className="mt-8 max-w-xl overflow-hidden rounded-2xl border border-white/12 bg-white/8 py-3 backdrop-blur">
      <div className="flex w-max gap-3 whitespace-nowrap px-3 [animation:auth-ticker_30s_linear_infinite]">
        {tickerItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-100/12 bg-slate-950/18 px-3 py-1.5 text-xs font-semibold text-cyan-50/82"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-200" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function AuthMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-4 backdrop-blur">
      <Icon className="h-4 w-4 text-cyan-200" />
      <div className="mt-3 font-display text-2xl font-bold">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
        {label}
      </div>
    </div>
  );
}

export function AuthError({ icon: Icon, message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-red-300/30 bg-red-500/14 px-4 py-3 text-sm text-red-50">
      <div className="flex gap-3">
        {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0" />}
        <span>{message}</span>
      </div>
    </div>
  );
}

export function AuthInput({ icon: Icon, label, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-cyan-50/82">{label}</span>
      <span className="relative mt-2 block">
        {Icon && (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/65" />
        )}
        <input
          {...props}
          className={`h-12 w-full rounded-xl border border-white/10 bg-[#05325f]/75 px-4 text-sm font-medium text-white outline-none transition placeholder:text-cyan-100/45 focus:border-cyan-200/70 focus:bg-[#05325f] focus:ring-4 focus:ring-cyan-300/15 ${Icon ? "pl-11" : ""} ${props.className ?? ""}`}
        />
      </span>
    </label>
  );
}

export function AuthSelect({ icon: Icon, label, children, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-cyan-50/82">{label}</span>
      <span className="relative mt-2 block">
        {Icon && (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/65" />
        )}
        <select
          {...props}
          className={`h-12 w-full rounded-xl border border-white/10 bg-[#05325f]/75 px-4 text-sm font-medium text-white outline-none transition focus:border-cyan-200/70 focus:bg-[#05325f] focus:ring-4 focus:ring-cyan-300/15 ${Icon ? "pl-11" : ""} ${props.className ?? ""}`}
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
      className={`inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#062653] px-4 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[0_16px_32px_rgba(2,6,23,0.28)] transition hover:bg-[#083a73] focus:outline-none focus:ring-4 focus:ring-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ""}`}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
