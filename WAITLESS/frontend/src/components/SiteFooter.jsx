import { Link } from "react-router-dom";
import {
  Building2,
  Clock3,
  Cross,
  Facebook,
  FlaskConical,
  HeartPulse,
  Instagram,
  Mail,
  MapPin,
  MonitorSmartphone,
  Pill,
  Search,
  Siren,
  Stethoscope,
  ShieldCheck,
  Phone,
  Twitter,
  UserRound,
} from "lucide-react";

const HOSPITAL = {
  name: "Chinhoyi Provincial Hospital",
  address: "Chinhoyi, Mashonaland West, Zimbabwe",
  reception: "+263 77 123 4567",
  emergency: "+263 77 000 0000",
};

const DEPT_LINKS = [
  { label: "OPD — Outpatients", dept: "OPD" },
  { label: "Casualty / Triage", dept: "Casualty / Triage" },
  { label: "Pharmacy", dept: "Pharmacy" },
  { label: "Laboratory", dept: "Laboratory" },
  { label: "OI Clinic", dept: "OI Clinic" },
];

const SOCIALS = [
  { icon: Facebook, label: "Facebook", href: "https://facebook.com/WaitLessZW" },
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/waitless.zw" },
  { icon: Twitter, label: "Twitter / X", href: "https://x.com/waitless_zw" },
];

function ColumnTitle({ children }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/30">
      {children}
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#020814] px-4 pb-8 pt-14 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/25 to-transparent" />
      {/* ambient glows */}
      <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-teal-500/[0.05] blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-blue-500/[0.05] blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {/* ── Main grid ── */}
        <div className="grid gap-10 border-b border-white/[0.06] pb-10 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.9fr_0.9fr_1.1fr]">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-[0_10px_28px_-10px_rgba(20,184,166,0.5)]">
                <Cross className="h-4 w-4" />
              </span>
              <div>
                <div className="text-base font-bold" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
                  Wait<span className="text-teal-400">Less</span>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                  Smarter Queues, Better Care
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/40">
              The digital patient front door for hospitals — self check-in, live
              queue boards, and WhatsApp updates from registration to pharmacy.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  title={label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/50 transition-all hover:-translate-y-0.5 hover:border-teal-400/40 hover:bg-teal-400/10 hover:text-teal-300"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Chinhoyi+Provincial+Hospital%2C+Chinhoyi%2C+Zimbabwe"
              target="_blank"
              rel="noreferrer"
              title="Open Chinhoyi Provincial Hospital on Google Maps"
              className="group mt-5 inline-flex items-center gap-2 rounded-full border border-teal-400/15 bg-teal-400/[0.05] px-3.5 py-1.5 text-[11px] font-semibold text-teal-300/80 transition-all hover:-translate-y-0.5 hover:border-teal-400/40 hover:bg-teal-400/10 hover:text-teal-300"
            >
              <MapPin className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
              {HOSPITAL.name}
              <span className="text-teal-300/40 transition-colors group-hover:text-teal-300">↗</span>
            </a>
          </div>

          {/* Patient services */}
          <div>
            <ColumnTitle>Patient services</ColumnTitle>
            <ul className="mt-5 space-y-2.5 text-sm">
              {[
                [UserRound, "Self check-in", "/self-register"],
                [Search, "Track your ticket", "/track"],
                [MonitorSmartphone, "Live queue board", "/queue"],
                [Clock3, "Kiosk check-in", "/kiosk"],
                [HeartPulse, "Patient sign in", "/patient/login"],
                [ShieldCheck, "Create an account", "/patient/register"],
                [Pill, "Share feedback", "/patient/feedback"],
              ].map(([Icon, label, to]) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group inline-flex items-center gap-2.5 text-white/45 transition-colors hover:text-teal-300"
                  >
                    <Icon className="h-3.5 w-3.5 text-teal-400/40 transition-colors group-hover:text-teal-300" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Departments */}
          <div>
            <ColumnTitle>Departments</ColumnTitle>
            <ul className="mt-5 space-y-2.5 text-sm">
              {DEPT_LINKS.map(({ label, dept }) => (
                <li key={dept}>
                  <Link
                    to={`/department-board?dept=${encodeURIComponent(dept)}`}
                    className="group inline-flex items-center gap-2.5 text-white/45 transition-colors hover:text-teal-300"
                  >
                    <Stethoscope className="h-3.5 w-3.5 text-teal-400/40 transition-colors group-hover:text-teal-300" />
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/department-board"
                  className="group inline-flex items-center gap-2.5 text-white/45 transition-colors hover:text-teal-300"
                >
                  <FlaskConical className="h-3.5 w-3.5 text-teal-400/40 transition-colors group-hover:text-teal-300" />
                  All department boards
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <ColumnTitle>Contact &amp; emergency</ColumnTitle>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-teal-300">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Email</span>
                  <a href="mailto:support@waitless.co.zw" className="block text-white/55 transition-colors hover:text-teal-300">support@waitless.co.zw</a>
                  <a href="mailto:info@waitless.co.zw" className="block text-white/55 transition-colors hover:text-teal-300">info@waitless.co.zw</a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-teal-300">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Support line</span>
                  <a href={`tel:${HOSPITAL.reception.replaceAll(" ", "")}`} className="block text-white/55 transition-colors hover:text-teal-300">
                    {HOSPITAL.reception}
                  </a>
                  <span className="block text-xs text-white/30">Mon–Fri, 8am–5pm CAT</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-red-400/25 bg-red-400/[0.08] text-red-300">
                  <Siren className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Emergency — 24/7</span>
                  <a href={`tel:${HOSPITAL.emergency.replaceAll(" ", "")}`} className="block text-white/55 transition-colors hover:text-red-300">
                    {HOSPITAL.emergency}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-teal-300">
                  <Building2 className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Location</span>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Chinhoyi+Provincial+Hospital%2C+Chinhoyi%2C+Zimbabwe"
                    target="_blank"
                    rel="noreferrer"
                    className="block text-white/55 transition-colors hover:text-teal-300"
                  >
                    {HOSPITAL.address} ↗
                  </a>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 text-xs text-white/25">
          <span>© {new Date().getFullYear()} WaitLess · Built for {HOSPITAL.name}</span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400/40" />
            Queue boards show ticket codes only — never patient names.
          </span>
          <Link to="/admin/login" className="text-white/25 transition-colors hover:text-teal-300">
            Staff access →
          </Link>
        </div>
      </div>
    </footer>
  );
}
