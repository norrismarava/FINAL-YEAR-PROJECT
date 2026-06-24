import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  BellRing,
  ClipboardList,
  MessageCircle,
  MonitorSmartphone,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Timer,
  Users,
} from "lucide-react";

import { PRIORITY_META, priorityChipClass } from "@/services/queueMeta";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "WaitLess - Digital Queue Management for Zimbabwean Hospitals",
      },
      {
        name: "description",
        content:
          "From paper queues to triage-aware digital flow. WaitLess streamlines registration, triage and patient notifications for public hospitals.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <TriageStrip />
      <Features />
      <Flow />
      <CTA />
    </>
  );
}

function Hero() {
  return (
    <section className="gradient-hero relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Case study: Chinhoyi Provincial Hospital
          </span>
          <h1 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            End the paper queue.
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Triage every patient digitally.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-balance text-base leading-7 text-muted-foreground sm:text-lg">
            WaitLess replaces handwritten registers with a triage-aware queue platform
            built for Zimbabwean public hospitals - with zero-cost WhatsApp alerts so
            patients never lose their place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5"
            >
              Register a patient
              <ClipboardList className="h-4 w-4" />
            </Link>
            <Link
              to="/queue"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              View live queue board
              <MonitorSmartphone className="h-4 w-4" />
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

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-2xl" />
          <div className="surface-panel p-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Now serving
                </div>
                <div className="font-display text-3xl font-bold">R-104</div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${priorityChipClass.red}`}
              >
                RED - Resus Room
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {[
                {
                  t: "Y-118",
                  n: "Tendai S.",
                  p: "yellow",
                  d: "Casualty Obs.",
                  w: "8m",
                },
                {
                  t: "G-202",
                  n: "Chipo M.",
                  p: "green",
                  d: "OPD Rm 3",
                  w: "14m",
                },
                {
                  t: "G-203",
                  n: "Brian C.",
                  p: "green",
                  d: "Pharmacy",
                  w: "21m",
                },
                {
                  t: "G-204",
                  n: "Tariro M.",
                  p: "green",
                  d: "Laboratory",
                  w: "27m",
                },
              ].map((row) => (
                <li
                  key={row.t}
                  className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5"
                >
                  <span
                    className={`grid h-9 w-12 place-items-center rounded-lg font-display text-xs font-bold ${priorityChipClass[row.p]}`}
                  >
                    {row.t}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{row.n}</div>
                    <div className="text-xs text-muted-foreground">{row.d}</div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {row.w}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-foreground">
              <MessageCircle className="h-4 w-4 text-accent" />
              WhatsApp sent to G-203 - your turn in about 5 minutes.
            </div>
          </div>
        </div>
      </div>
    </section>
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

  return (
    <section className="border-y border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
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
    </section>
  );
}

function TriageStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-end justify-between gap-4 sm:flex-row">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">
            The four-tier triage, digitised
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Chinhoyi Provincial Hospital&apos;s colour-coded triage protocol, captured at
            registration and used to route every patient.
          </p>
        </div>
        <Link to="/triage" className="text-sm font-semibold text-primary hover:underline">
          Open triage console -&gt;
        </Link>
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

  return (
    <section className="border-y border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-bold tracking-tight">
          Built for the realities of public health
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Designed around the workflows observed at Chinhoyi Provincial Hospital - and
          the constraints of every Zimbabwean facility.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((feature) => (
            <div
              key={feature.title}
              className="surface-panel group p-6 transition-all hover:-translate-y-1 hover:shadow-elegant"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
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
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="font-display text-3xl font-bold tracking-tight">
        The OPD patient journey, tracked end-to-end
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Every step, every wait, every bottleneck - visible in real time on the staff
        dashboard.
      </p>
      <ol className="mt-10 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {steps.map((step, index) => (
          <li key={step.t} className="surface-panel relative p-5">
            <div className="font-display text-xs font-bold text-primary">
              STEP {index + 1}
            </div>
            <div className="mt-1 font-display text-lg font-bold">{step.t}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{step.d}</div>
            <p className="mt-3 text-sm text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary to-accent p-10 text-primary-foreground shadow-elegant">
        <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to retire the paper register?
        </h2>
        <p className="mt-3 max-w-xl opacity-90">
          Try the registration flow, watch the live queue board, and explore the staff
          dashboard.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to="/register"
            className="rounded-xl bg-background px-5 py-3 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5"
          >
            Start registration
          </Link>
          <Link
            to="/dashboard"
            className="rounded-xl border border-primary-foreground/30 bg-primary-foreground/10 px-5 py-3 text-sm font-semibold text-primary-foreground backdrop-blur transition-colors hover:bg-primary-foreground/20"
          >
            Open dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
