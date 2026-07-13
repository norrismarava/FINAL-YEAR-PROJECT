import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BellRing,
  CheckCircle2,
  ClipboardList,
  Cross,
  FlaskConical,
  HeartPulse,
  MessageCircle,
  MonitorSmartphone,
  Pill,
  Radio,
  Search,
  ShieldAlert,
  Stethoscope,
  Timer,
  Users,
} from "lucide-react";

import hospitalHeroBackground from "@/assets/bgfinal.png";
import waitlessLogo from "@/assets/waitlesslogo-cropped.png";
import { PRIORITY_META, priorityChipClass } from "@/services/queueMeta";

export default function Home() {
  return (
    <>
      <Hero />
      <LandingLightCanvas>
        <Stats />
        <TriageStrip />
        <Features />
      </LandingLightCanvas>
      <LightToDarkWaveDivider />
      <Flow />
      <CTA />
    </>
  );
}

function LandingLightCanvas({ children }) {
  return (
    <div className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-30 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,250,252,0.94)_22%,rgba(240,253,250,0.94)_58%,rgba(239,246,255,0.98))]" />
      <div className="absolute inset-0 -z-20 portal-surface-stripes opacity-80" />
      <div className="absolute inset-x-[-14%] top-[-5.5rem] -z-20 h-44 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.98),rgba(204,251,241,0.74)_36%,rgba(219,234,254,0.52)_62%,rgba(255,255,255,0)_78%)] blur-3xl" />
      <div className="absolute inset-x-[-14%] bottom-[-6rem] -z-20 h-52 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.20),rgba(37,99,235,0.16)_44%,rgba(248,250,252,0)_76%)] blur-3xl" />
      <div className="absolute left-[-8%] top-32 -z-20 h-80 w-80 rounded-full bg-primary/12 blur-3xl" />
      <div className="absolute right-[-4%] top-44 -z-20 h-96 w-96 rounded-full bg-accent/12 blur-3xl" />
      <div className="absolute left-[12%] top-12 -z-20 h-[36rem] w-40 bg-[linear-gradient(180deg,rgba(20,184,166,0.16),rgba(255,255,255,0.04)_38%,rgba(37,99,235,0.10)_82%,rgba(255,255,255,0))] blur-3xl" />
      <div className="absolute right-[10%] top-20 -z-20 h-[42rem] w-48 bg-[linear-gradient(180deg,rgba(37,99,235,0.18),rgba(255,255,255,0.04)_34%,rgba(20,184,166,0.12)_80%,rgba(255,255,255,0))] blur-3xl" />
      <div className="absolute left-[44%] top-[24%] -z-20 h-[24rem] w-36 bg-[linear-gradient(180deg,rgba(255,255,255,0.0),rgba(20,184,166,0.10)_20%,rgba(255,255,255,0.0)_52%,rgba(37,99,235,0.10)_76%,rgba(255,255,255,0.0))] blur-3xl" />
      {children}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${hospitalHeroBackground})` }}
      />
      <div className="absolute inset-0 -z-20 portal-hero-texture opacity-80" />
      <div className="absolute inset-0 -z-10 hero-dots-soft opacity-45" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(248,250,252,0.96),rgba(248,250,252,0.82)_42%,rgba(15,118,110,0.18)_72%,rgba(2,6,23,0.18))]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent" />

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex w-fit items-center justify-center">
            <img
              src={waitlessLogo}
              alt="WaitLess"
              className="h-24 w-auto max-w-[340px] object-contain drop-shadow-[0_16px_36px_rgba(15,118,110,0.18)] sm:h-28"
            />
          </div>
          <p className="-mt-3 text-sm font-semibold tracking-[0.18em] text-primary sm:-mt-4 sm:text-base">
            Smarter Queues, Better Care
          </p>
          <h1 className="mt-5 text-balance font-display text-5xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Digital Patient Flow
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              for Modern Hospitals.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-balance text-base leading-7 text-muted-foreground sm:text-lg">
            A triage-aware queue platform built for Zimbabwean public hospitals,
            replacing handwritten registers with live service desks and zero-cost
            WhatsApp alerts so patients never lose their place.
          </p>
          <div className="mt-8 flex flex-wrap items-stretch gap-3">
            <Link
              to="/register"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5"
            >
              Register a patient
              <ClipboardList className="h-4 w-4" />
            </Link>
            <Link
              to="/queue"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              View live queue board
              <MonitorSmartphone className="h-4 w-4" />
            </Link>
            <Link
              to="/track"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-primary/15 bg-white/70 px-5 py-3 text-sm font-semibold text-primary shadow-[0_14px_34px_-26px_rgba(15,118,110,0.28)] backdrop-blur transition-colors hover:bg-primary-soft/70"
            >
              Track a ticket
              <Search className="h-4 w-4" />
            </Link>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Avg. OPD time
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold">42m</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Departments
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold">6</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                No-show drop
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold">-38%</dd>
            </div>
          </dl>
        </div>

        <div className="mt-12 grid max-w-4xl gap-3 md:grid-cols-3">
          {[
            { label: "Now serving", value: "R-104", detail: "Casualty Resus Room" },
            { label: "Up next", value: "Y-118", detail: "Observation priority" },
            { label: "Patient alert", value: "G-203", detail: "WhatsApp near-turn sent" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/70 bg-white/75 px-4 py-4 shadow-card backdrop-blur"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {item.label}
              </div>
              <div className="mt-1 font-display text-3xl font-bold tracking-tight">
                {item.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const MEDICAL_BACKDROP_ICONS = [
  {
    Icon: Cross,
    className:
      "left-8 top-10 text-primary/20 [animation:medical-float_18s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-12 w-12",
  },
  {
    Icon: FlaskConical,
    className:
      "right-12 top-12 text-accent/18 [animation:medical-spin_22s_linear_infinite] motion-reduce:animate-none",
    size: "h-10 w-10",
  },
  {
    Icon: HeartPulse,
    className:
      "left-[46%] top-16 text-primary/16 [animation:medical-drift_24s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-11 w-11",
  },
  {
    Icon: Pill,
    className:
      "left-[18%] bottom-10 text-accent/16 [animation:medical-float_20s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-10 w-10",
  },
  {
    Icon: Stethoscope,
    className:
      "right-[18%] bottom-12 text-primary/16 [animation:medical-drift_28s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-11 w-11",
  },
  {
    Icon: Cross,
    className:
      "left-[28%] top-[34%] text-accent/14 [animation:medical-spin_26s_linear_infinite] motion-reduce:animate-none",
    size: "h-8 w-8",
  },
  {
    Icon: FlaskConical,
    className:
      "left-[62%] top-[22%] text-primary/14 [animation:medical-drift_26s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-9 w-9",
  },
  {
    Icon: HeartPulse,
    className:
      "right-[32%] top-[58%] text-accent/14 [animation:medical-float_21s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-10 w-10",
  },
  {
    Icon: Pill,
    className:
      "left-[6%] bottom-[28%] text-primary/14 [animation:medical-drift_25s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-8 w-8",
  },
  {
    Icon: Stethoscope,
    className:
      "right-[8%] bottom-[26%] text-accent/14 [animation:medical-spin_30s_linear_infinite] motion-reduce:animate-none",
    size: "h-10 w-10",
  },
  {
    Icon: Cross,
    className:
      "left-[72%] bottom-[12%] text-primary/18 [animation:medical-float_19s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-9 w-9",
  },
  {
    Icon: HeartPulse,
    className:
      "left-[10%] top-[56%] text-accent/12 [animation:medical-drift_29s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-8 w-8",
  },
];

const MEDICAL_BACKDROP_FEATURE_ICONS = [
  {
    Icon: Cross,
    className:
      "left-3 top-6 text-primary/24 [animation:medical-float_16s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-14 w-14",
  },
  {
    Icon: HeartPulse,
    className:
      "left-8 top-[48%] text-accent/18 [animation:medical-drift_18s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-12 w-12",
  },
  {
    Icon: Pill,
    className:
      "left-[4%] bottom-4 text-primary/20 [animation:medical-spin_24s_linear_infinite] motion-reduce:animate-none",
    size: "h-12 w-12",
  },
  {
    Icon: FlaskConical,
    className:
      "left-[38%] top-[58%] text-accent/20 [animation:medical-float_17s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-11 w-11",
  },
  {
    Icon: Stethoscope,
    className:
      "left-[46%] top-[10%] text-primary/20 [animation:medical-drift_22s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-12 w-12",
  },
  {
    Icon: Cross,
    className:
      "right-[14%] top-[18%] text-accent/20 [animation:medical-spin_20s_linear_infinite] motion-reduce:animate-none",
    size: "h-12 w-12",
  },
  {
    Icon: Pill,
    className:
      "right-[8%] bottom-[20%] text-accent/18 [animation:medical-float_19s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-12 w-12",
  },
  {
    Icon: HeartPulse,
    className:
      "right-[28%] bottom-[10%] text-primary/18 [animation:medical-drift_23s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-11 w-11",
  },
];

function MedicalBackdrop({ variant }) {
  const backgroundClass =
    {
      stats:
        "bg-[radial-gradient(circle_at_10%_20%,rgba(20,184,166,0.16),transparent_30%),radial-gradient(circle_at_88%_24%,rgba(37,99,235,0.14),transparent_28%),radial-gradient(circle_at_50%_85%,rgba(20,184,166,0.10),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,250,252,0.92))]",
      triage:
        "bg-[radial-gradient(circle_at_12%_24%,rgba(20,184,166,0.14),transparent_32%),radial-gradient(circle_at_82%_36%,rgba(37,99,235,0.16),transparent_30%),radial-gradient(circle_at_58%_78%,rgba(37,99,235,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.98))]",
      features:
        "bg-[radial-gradient(circle_at_14%_22%,rgba(20,184,166,0.24),transparent_34%),radial-gradient(circle_at_74%_22%,rgba(37,99,235,0.22),transparent_32%),radial-gradient(circle_at_24%_76%,rgba(20,184,166,0.12),transparent_24%),radial-gradient(circle_at_88%_78%,rgba(37,99,235,0.12),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.98))]",
    }[variant] ?? "bg-transparent";
  const gridClass =
    variant === "features"
      ? "absolute inset-0 opacity-95 [background-image:linear-gradient(rgba(148,163,184,0.11)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px)] [background-size:80px_80px]"
      : "absolute inset-0 opacity-80 [background-image:linear-gradient(rgba(148,163,184,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:88px_88px]";
  const iconSet =
    variant === "features"
      ? [...MEDICAL_BACKDROP_ICONS, ...MEDICAL_BACKDROP_FEATURE_ICONS]
      : MEDICAL_BACKDROP_ICONS;

  return (
    <>
      <div className={`absolute inset-0 -z-20 ${backgroundClass}`} />
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className={gridClass} />
        <div className="absolute left-[8%] top-[20%] h-40 w-40 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-[10%] top-[26%] h-48 w-48 rounded-full bg-accent/8 blur-3xl" />
        <div className="absolute left-[42%] bottom-[10%] h-36 w-36 rounded-full bg-primary/6 blur-3xl" />
        {variant === "features" && (
          <>
            <div className="absolute left-[4%] top-[10%] h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute right-[6%] top-[42%] h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute left-[34%] bottom-[8%] h-44 w-44 rounded-full bg-primary/8 blur-3xl" />
          </>
        )}
        {iconSet.map(({ Icon, className, size }, index) => (
          <span key={`${variant}-${index}`} className={`absolute ${className}`}>
            <Icon className={size} strokeWidth={2} />
          </span>
        ))}
      </div>
    </>
  );
}

function Stats() {
  const items = [
    {
      icon: Users,
      label: "Patients triaged today",
      value: "247",
    },
    {
      icon: Timer,
      label: "Median wait",
      value: "23 min",
    },
    {
      icon: BellRing,
      label: "Notifications sent",
      value: "1,184",
    },
    {
      icon: ShieldAlert,
      label: "Red priority routed",
      value: "12",
    },
  ];
  const tickerItems = [
    "R-104 routed to resuscitation",
    "Y-118 moved to observation",
    "G-203 WhatsApp alert delivered",
    "Lab transfer accepted",
    "Pharmacy window ready",
    "Missed patient marked for recall",
  ];

  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-transparent">
      <MedicalBackdrop variant="stats" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <div className="eyebrow">Live impact snapshot</div>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
              Every queue decision becomes visible.
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {items.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-display text-xl font-bold leading-none">
                    {item.value}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-primary/15 bg-[linear-gradient(135deg,rgba(204,251,241,0.58),rgba(255,255,255,0.56)_36%,rgba(219,234,254,0.52))] py-3 shadow-[0_18px_44px_-34px_rgba(37,99,235,0.26)] backdrop-blur">
          <div className="flex w-max gap-3 whitespace-nowrap px-3 [animation:auth-ticker_34s_linear_infinite]">
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-xs font-semibold text-primary shadow-card"
              >
                <Radio className="h-3.5 w-3.5" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TriageStrip() {
  return (
    <section className="relative overflow-hidden border-b border-border/50 bg-transparent">
      <MedicalBackdrop variant="triage" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <div className="eyebrow">Clinical priority engine</div>
            <h2 className="font-display text-3xl font-bold tracking-tight">
              The four-tier triage, digitised
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Chinhoyi Provincial Hospital&apos;s colour-coded triage protocol, captured at
              registration and used to route every patient.
            </p>
            <Link
              to="/triage"
              className="mt-5 inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant"
            >
              Open triage console
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative rounded-[1.75rem] border border-primary/16 bg-[linear-gradient(135deg,rgba(15,118,110,0.96),rgba(14,165,233,0.92)_58%,rgba(37,99,235,0.94))] p-5 text-primary-foreground shadow-[0_24px_70px_-30px_rgba(37,99,235,0.44)]">
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.10),transparent_30%)]" />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] opacity-75">
                  Smart routing preview
                </div>
                <div className="mt-2 font-display text-3xl font-bold">R-104</div>
              </div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                Next: resuscitation
              </span>
            </div>
            <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Vitals", "Critical"],
                ["Wait", "0m"],
                ["Alert", "Staff called"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/14 bg-white/10 px-4 py-3 backdrop-blur"
                >
                  <div className="text-[10px] uppercase tracking-[0.2em] opacity-70">
                    {label}
                  </div>
                  <div className="mt-1 font-display text-lg font-bold">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.keys(PRIORITY_META).map((priority) => {
            const meta = PRIORITY_META[priority];

            return (
              <div key={priority} className="surface-panel">
                <div
                  className={`flex items-center justify-between px-4 py-3 ${priorityChipClass[priority]}`}
                >
                  <span className="font-display text-sm font-bold uppercase tracking-wider">
                    {meta.short}
                  </span>
                  <Stethoscope className="h-4 w-4 opacity-70" />
                </div>
                <div className="space-y-2 p-4">
                  <div className="font-display font-bold">{meta.label}</div>
                  <p className="text-sm text-muted-foreground">{meta.description}</p>
                  <div className="pt-2 text-xs">
                    <span className="text-muted-foreground">Route to -&gt; </span>
                    <span className="font-medium">{meta.destination}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: ClipboardList,
      title: "Patient Registration",
      body: "Capture demographics in under a minute. Generates a ticket number and links a WhatsApp contact.",
    },
    {
      icon: ShieldAlert,
      title: "Triage-Aware Routing",
      body: "Nurses assign Red / Yellow / Green / Black priorities. The queue re-sorts in real time.",
    },
    {
      icon: MessageCircle,
      title: "Zero-Cost WhatsApp",
      body: "Uses Meta's service conversation window - patients are alerted before their turn, with no per-message fees.",
    },
    {
      icon: MonitorSmartphone,
      title: "Public Queue Board",
      body: "Big-screen display for waiting areas, kept in sync over the hospital LAN.",
    },
    {
      icon: Activity,
      title: "Live Staff Dashboard",
      body: "Track bottlenecks in OPD, Pharmacy, Lab, Radiology and OI Clinic from one view.",
    },
    {
      icon: Timer,
      title: "Offline-First",
      body: "Runs on the hospital LAN. WhatsApp messages queue and send when the internet returns.",
    },
  ];
  const reasons = [
    "Patients can leave the crowded waiting area without losing their place.",
    "Staff call tickets in triage order, not whoever is closest to the counter.",
    "Managers see bottlenecks before the queue turns into a complaint.",
  ];

  return (
    <section className="relative overflow-hidden bg-transparent">
      <MedicalBackdrop variant="features" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="sticky top-28">
            <div className="eyebrow">Why hospitals choose it</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
              Built for the realities of public health
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Designed around the workflows observed at Chinhoyi Provincial Hospital -
              and the constraints of every Zimbabwean facility.
            </p>

            <div className="mt-6 space-y-3">
              {reasons.map((reason) => (
                <div key={reason} className="flex gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm leading-6 text-muted-foreground">{reason}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {items.map((feature) => (
              <div
                key={feature.title}
                className="surface-panel group p-6 transition-all hover:-translate-y-1 hover:shadow-elegant"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Flow() {
  const steps = [
    {
      t: "Register",
      d: "5 min",
      body: "Capture demographics and WhatsApp number.",
    },
    {
      t: "Triage",
      d: "2 min",
      body: "Assign Red / Yellow / Green priority.",
    },
    {
      t: "Nurse review",
      d: "10 min",
      body: "Vitals and pre-consultation history.",
    },
    {
      t: "Doctor",
      d: "10 min",
      body: "Consultation and order generation.",
    },
    {
      t: "Investigations",
      d: "20-30m",
      body: "Lab or Radiology, tracked live.",
    },
    {
      t: "Pharmacy",
      d: "10 min",
      body: "Dispensing with WhatsApp call-up.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#061b2f] px-4 pb-16 pt-8 text-white sm:px-6 sm:pt-10 lg:px-8">
      <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(125,211,252,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.18)_1px,transparent_1px)] [background-size:76px_76px]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="flex h-full flex-col">
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-100/70">
              End-to-end movement
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              The OPD patient journey, tracked from desk to discharge.
            </h2>
            <p className="mt-3 max-w-xl text-slate-200/78">
              Every step, every wait, every bottleneck - visible in real time on the
              staff dashboard before patients start asking what happened.
            </p>

            <ol className="mt-8 grid flex-1 gap-3">
              {steps.map((step, index) => (
                <li key={step.t} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-white/10 bg-white/8 px-5 py-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-200 text-sm font-bold text-slate-950">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-display font-bold">{step.t}</div>
                    <p className="mt-0.5 text-sm text-slate-300">{step.body}</p>
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-cyan-200/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">
                    {step.d}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative flex flex-col overflow-hidden rounded-[2rem] border border-cyan-200/10 bg-[linear-gradient(180deg,rgba(26,48,70,0.94),rgba(19,39,59,0.98))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)] lg:mt-[12.5rem] lg:h-[calc(100%-12.5rem)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.12),transparent_24%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(125,211,252,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />

            <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-100/70">
                  Command cockpit
                </div>
                <div className="mt-1 font-display text-2xl font-bold">Live service flow</div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/12 bg-cyan-200/10 px-3 py-1 text-xs font-semibold text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <span className="h-2 w-2 rounded-full bg-cyan-200" />
                Synced now
              </span>
            </div>

            <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Waiting", "38"],
                ["In service", "14"],
                ["Transferred", "9"],
              ].map(([label, value]) => (
                <div key={label} className="min-h-24 rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(13,27,42,0.46),rgba(17,33,50,0.66))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300/92">{label}</div>
                  <div className="mt-1 font-display text-3xl font-bold">{value}</div>
                </div>
              ))}
            </div>

            <div className="relative mt-5 flex flex-1 flex-col justify-between gap-3">
              {[
                {
                  ticket: "R-104",
                  department: "Casualty",
                  status: "Call now",
                  to: "/dashboard",
                  className: "bg-priority-red text-priority-red-foreground",
                },
                {
                  ticket: "Y-118",
                  department: "Observation",
                  status: "In service",
                  to: "/dashboard",
                  className: "bg-priority-yellow text-priority-yellow-foreground",
                },
                {
                  ticket: "G-203",
                  department: "Pharmacy",
                  status: "WhatsApp sent",
                  to: "/dashboard",
                  className: "bg-priority-green text-priority-green-foreground",
                },
              ].map(({ ticket, department, status, to, className }) => (
                <Link
                  key={ticket}
                  to={to}
                  className="group surface-hover-card-dark grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.05))] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-cyan-200/18 hover:bg-[linear-gradient(180deg,rgba(20,184,166,0.12),rgba(37,99,235,0.10))]"
                  aria-label={`Open live operations for ${ticket} in ${department}`}
                >
                  <span className={`grid h-10 w-16 place-items-center rounded-xl font-display text-xs font-bold ${className}`}>
                    {ticket}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{department}</div>
                    <div className="text-xs text-slate-300">{status}</div>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-cyan-200/10 text-cyan-100 transition-all group-hover:bg-cyan-200/18 group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LightToDarkWaveDivider() {
  return (
    <div className="relative isolate h-24 overflow-hidden bg-transparent sm:h-28">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(219,234,254,0.18)_34%,rgba(20,184,166,0.12)_64%,rgba(6,27,47,0.18)_100%)]" />
      <div className="absolute inset-0 opacity-[0.1] [background-image:radial-gradient(rgba(148,163,184,0.68)_1px,transparent_1px)] [background-size:110px_110px]" />
      <div className="absolute inset-x-[10%] top-6 h-16 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.26),rgba(37,99,235,0.18)_44%,rgba(255,255,255,0)_78%)] blur-3xl" />
      <div className="absolute left-[6%] top-0 h-full w-20 bg-[linear-gradient(180deg,rgba(20,184,166,0.16),rgba(6,27,47,0))] blur-3xl" />
      <div className="absolute right-[10%] top-0 h-full w-24 bg-[linear-gradient(180deg,rgba(37,99,235,0.16),rgba(6,27,47,0))] blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-[#061b2f]" />
      <div className="absolute left-[-14%] right-[64%] bottom-5 h-20 rounded-[100%] bg-[#061b2f]" />
      <div className="absolute left-[10%] right-[30%] bottom-7 h-20 rounded-[100%] bg-[#061b2f]" />
      <div className="absolute left-[48%] right-[-10%] bottom-4 h-20 rounded-[100%] bg-[#061b2f]" />
      <div className="absolute inset-x-[18%] bottom-6 h-10 bg-[radial-gradient(ellipse_at_center,rgba(163,230,53,0.16),rgba(20,184,166,0.12)_48%,rgba(6,27,47,0)_80%)] blur-2xl" />
    </div>
  );
}

function CTA() {
  return (
    <section className="relative overflow-hidden bg-[#081827] px-4 py-18 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-x-[-14%] top-[-4.5rem] h-40 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.22),rgba(37,99,235,0.18)_42%,rgba(8,24,39,0)_78%)] blur-3xl" />
      <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(125,211,252,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.16)_1px,transparent_1px)] [background-size:84px_84px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(20,184,166,0.16),transparent_24%),radial-gradient(circle_at_84%_24%,rgba(37,99,235,0.16),transparent_22%),linear-gradient(180deg,rgba(8,24,39,0.94),rgba(7,21,35,1))]" />
      <div className="absolute left-[8%] top-16 h-64 w-24 bg-[linear-gradient(180deg,rgba(20,184,166,0.18),rgba(255,255,255,0.0)_34%,rgba(37,99,235,0.16)_84%,rgba(255,255,255,0.0))] blur-3xl" />
      <div className="absolute right-[10%] top-20 h-72 w-28 bg-[linear-gradient(180deg,rgba(37,99,235,0.18),rgba(255,255,255,0.0)_38%,rgba(20,184,166,0.14)_82%,rgba(255,255,255,0.0))] blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-cyan-200/10 bg-[linear-gradient(135deg,rgba(20,184,166,0.08),rgba(255,255,255,0.03)_34%,rgba(37,99,235,0.08))] px-5 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.32)] backdrop-blur sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-100/70">
                Start where your hospital needs relief
              </div>
              <h2 className="mt-2 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Replace confusion with a queue patients can trust.
              </h2>
              <p className="mt-3 max-w-xl text-slate-300">
                Launch one workflow at a time: registration first, triage next, then the
                public board and staff command dashboard.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Reception", "Register the next patient and issue a clear ticket.", "/register", ClipboardList],
                ["Waiting area", "Show the live board without exposing patient names.", "/queue", MonitorSmartphone],
                ["Operations", "Monitor bottlenecks and call the next patient.", "/dashboard", Activity],
              ].map(([title, body, to, Icon]) => (
                <Link
                  key={title}
                  to={to}
                  className="group rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:-translate-y-1 hover:border-cyan-200/20 hover:bg-[linear-gradient(180deg,rgba(20,184,166,0.16),rgba(37,99,235,0.10))]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-200/16 text-cyan-100 transition-colors group-hover:bg-cyan-200/22">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100">
                    Open workflow
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
