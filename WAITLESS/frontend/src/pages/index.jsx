import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BellRing,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  FlaskConical,
  Globe,
  HeartPulse,
  LayoutDashboard,
  MessageCircle,
  MonitorSmartphone,
  Pill,
  ScanLine,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Smartphone,
  Star,
  Stethoscope,
  Timer,
  Users,
  Wifi,
  Zap,
} from "lucide-react";

import hospitalHeroImage from "@/assets/landing-hero-hospital.jpg";
import phoneMockupImage from "@/assets/landing-phone-mockup-cut.png";
import hospitalHeroBackground from "@/assets/bgfinal.png";
import { useAuth } from "@/auth/AuthProvider";
import { usePatientAuth } from "@/auth/PatientAuthProvider";
import { resolveStaffLandingPath } from "@/services/staffProfilePrefs";
import { DEPARTMENTS, PRIORITY_META } from "@/services/queueMeta";

/* ─── Constants ─── */
const HOSPITAL = {
  name: "Chinhoyi Provincial Hospital",
  tagline: "Public hospital, Chinhoyi, Zimbabwe",
  reception: "+263 77 123 4567",
  emergency: "+263 77 000 0000",
};

/* ─── Reveal-on-scroll ─── */
const REVEAL_CSS = `
  @keyframes wl-reveal-up {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes wl-reveal-scale {
    from { opacity: 0; transform: scale(0.92) translateY(16px); }
    to   { opacity: 1; transform: scale(1)   translateY(0); }
  }
  .wl-reveal { opacity: 0; }
  .wl-reveal.is-revealed {
    animation: wl-reveal-up 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .wl-reveal-scale.is-revealed {
    animation: wl-reveal-scale 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  @media (prefers-reduced-motion: reduce) {
    .wl-reveal, .wl-reveal-scale { opacity: 1; }
    .wl-reveal.is-revealed, .wl-reveal-scale.is-revealed { animation: none; }
  }

  @keyframes counter-pulse {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.08); }
  }
  @keyframes float-gentle {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    33%      { transform: translateY(-12px) rotate(1deg); }
    66%      { transform: translateY(-6px) rotate(-0.5deg); }
  }
  @keyframes ticker-scroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes glow-ring {
    0%, 100% { box-shadow: 0 0 0 0 rgba(20,184,166,0); }
    50%      { box-shadow: 0 0 30px 8px rgba(20,184,166,0.15); }
  }
  @keyframes hero-text-rise {
    from { opacity: 0; transform: translateY(40px); filter: blur(8px); }
    to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
  }
  @keyframes badge-bounce {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-4px); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes ecg-sweep {
    from { background-position-x: 0; }
    to   { background-position-x: 900px; }
  }
  @keyframes orb-drift {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25%      { transform: translate(30px, -20px) scale(1.05); }
    50%      { transform: translate(-10px, -30px) scale(0.97); }
    75%      { transform: translate(20px, 10px) scale(1.03); }
  }
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50%      { background-position: 100% 50%; }
  }
  @keyframes phone-showcase {
    0%, 100% { transform: perspective(1100px) rotateY(-13deg) rotateX(2deg) translateY(0); }
    50%      { transform: perspective(1100px) rotateY(13deg) rotateX(-2deg) translateY(-16px); }
  }
  @keyframes sheen-sweep {
    0%, 55%  { background-position: 140% 0; }
    80%      { background-position: -40% 0; }
    100%     { background-position: -40% 0; }
  }
  @keyframes shadow-sway {
    0%, 100% { transform: translateX(-50%) scaleX(1); opacity: 0.6; }
    50%      { transform: translateX(-50%) scaleX(0.78); opacity: 0.35; }
  }
  @keyframes letter-wave {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-5px); }
  }
`;

function Reveal({ children, delay = 0, className = "", scale = false }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`wl-reveal ${scale ? "wl-reveal-scale" : ""} ${visible ? "is-revealed" : ""} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Animated counter ─── */
function AnimatedCounter({ target, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const numTarget = parseInt(target.toString().replace(/[^0-9]/g, ""), 10);
          const startTime = performance.now();
          const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * numTarget));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Section eyebrow — spaced gradient text between tapering hairlines ─── */
const EYEBROW_TONES = {
  teal: { text: "from-teal-300 via-cyan-200 to-teal-300", line: "to-teal-300/60" },
  cyan: { text: "from-cyan-200 via-teal-100 to-cyan-300", line: "to-cyan-300/60" },
  red: { text: "from-red-300 via-amber-300 to-red-300", line: "to-red-300/60" },
  blue: { text: "from-blue-300 via-cyan-200 to-blue-300", line: "to-blue-300/60" },
};

function SectionEyebrow({ children, tone = "teal", center = true }) {
  const t = EYEBROW_TONES[tone];
  return (
    <div className={`flex items-center gap-3 ${center ? "justify-center" : ""}`}>
      <span className={`h-px w-9 bg-gradient-to-r from-transparent ${t.line}`} />
      <span
        className={`bg-gradient-to-r ${t.text} bg-clip-text text-[11px] font-black uppercase tracking-[0.32em] text-transparent`}
        style={{ fontFamily: "Manrope, system-ui, sans-serif" }}
      >
        {children}
      </span>
      <span className={`h-px w-9 bg-gradient-to-l from-transparent ${t.line}`} />
    </div>
  );
}

/* ─── Typewriter greeting ─── */
function TypewriterGreeting({ text = "Welcome to WaitLess", speed = 85 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((current) => {
        if (current >= text.length) {
          clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span
      className="text-xl italic tracking-wide drop-shadow-[0_0_18px_rgba(45,212,191,0.35)]"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      {text.split("").map((ch, i) => (
        <span
          key={i}
          className="inline-block bg-gradient-to-br from-teal-300 via-cyan-200 to-teal-400 bg-clip-text text-transparent"
          style={{
            opacity: i < count ? 1 : 0,
            animation: `letter-wave 1.9s ease-in-out ${i * 0.07}s infinite`,
          }}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

/* ═══════════════════════════════════════════════
   ROOT COMPONENT
   ═══════════════════════════════════════════════ */
export default function Home() {
  const [splash, setSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setSplashFading(true), 4900);
    const t2 = setTimeout(() => setSplash(false), 5700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="dark bg-[#020814] text-white" style={{ fontFamily: "Inter, Manrope, system-ui, sans-serif" }}>
      <style>{REVEAL_CSS}</style>
      {splash ? <SplashScreen fading={splashFading} /> : null}
      <Hero />
      <LiveTicker />
      <TrustBanner />
      <DepartmentsSection />
      <PatientJourney />
      <TriageSection />
      <FeaturesSection />
      <MobileAppSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SPLASH SCREEN
   ═══════════════════════════════════════════════ */
function SplashScreen({ fading }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      setProgress(Math.min(100, ((Date.now() - start) / 4400) * 100));
    }, 40);
    return () => clearInterval(id);
  }, []);

  const pct = Math.round(progress);

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#020814] transition-all duration-700 ${
        fading ? "pointer-events-none opacity-0 scale-105" : "opacity-100 scale-100"
      }`}
      aria-hidden="true"
    >
      <div className="relative h-24 w-24" style={{ animation: "glow-ring 2s ease-in-out infinite" }}>
        <div className="absolute inset-0 rounded-full border-[2.5px] border-cyan-200/10 border-r-cyan-400 border-t-teal-400 animate-[spin_1.2s_linear_infinite]" />
        <div className="absolute inset-0 grid place-items-center">
          <img src="/waitless-logo-icon.png" alt="WaitLess" className="h-12 w-12 object-contain drop-shadow-[0_0_20px_rgba(20,184,166,0.5)]" />
        </div>
      </div>
      <div className="mt-6 flex flex-col items-center gap-2">
        <p className="text-lg font-bold tracking-wide text-white" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
          Wait<span className="text-teal-400">Less</span>
        </p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/60">
          Hospital Queue OS
        </p>
      </div>
      <div className="mt-8 w-44">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.24em]">
          <span className="text-white/35">Loading</span>
          <span className="text-teal-300">{pct}%</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-400 transition-[width] duration-100 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════ */
function Hero() {
  const auth = useAuth();
  const patientAuth = usePatientAuth();
  const isStaff = auth.isAuthenticated;
  const isPatient = patientAuth.isPatientAuthenticated;
  const canRegisterPatient = auth.hasRole(["reception", "receptionist"]);

  return (
    <section className="relative isolate overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 -z-30 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${hospitalHeroBackground})` }} />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(135deg,rgba(2,8,20,0.97)_0%,rgba(3,14,28,0.92)_30%,rgba(6,40,54,0.78)_60%,rgba(2,8,20,0.88)_100%)]" />

      {/* Animated orbs */}
      <div className="absolute -z-10 left-[-6%] top-[15%] h-[28rem] w-[28rem] rounded-full bg-teal-500/[0.08] blur-[80px]" style={{ animation: "orb-drift 18s ease-in-out infinite" }} />
      <div className="absolute -z-10 right-[-8%] top-[25%] h-[32rem] w-[32rem] rounded-full bg-blue-500/[0.06] blur-[100px]" style={{ animation: "orb-drift 22s ease-in-out infinite reverse" }} />
      <div className="absolute -z-10 left-[40%] bottom-[-5%] h-[24rem] w-[24rem] rounded-full bg-cyan-400/[0.05] blur-[70px]" style={{ animation: "orb-drift 16s ease-in-out infinite 2s" }} />

      {/* Grid overlay */}

      {/* ECG line */}
      <div className="absolute bottom-0 left-0 right-0 -z-10 h-11 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='900' height='44' viewBox='0 0 900 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 24H145L160 24L171 8L185 36L198 24H340L352 24L363 14L377 31L391 24H900' fill='none' stroke='%232dd4bf' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundSize: "900px 44px",
          backgroundRepeat: "repeat-x",
          animation: "ecg-sweep 16s linear infinite",
        }}
      />

      <div className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-7xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:pt-12">
        {/* Left: Text content */}
        <div className="max-w-2xl lg:max-w-none">
          {/* Welcome greeting */}
          <div
            className="flex items-center gap-4"
            style={{ animation: "hero-text-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}
          >
            <span className="h-px w-10 bg-gradient-to-r from-transparent via-teal-300/50 to-teal-300/70" />
            <TypewriterGreeting />
            <span className="h-px w-10 bg-gradient-to-l from-transparent via-teal-300/50 to-teal-300/70" />
          </div>

          {/* Headline */}
          <h1
            className="mt-4 max-w-xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:mt-6 sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "'Open Sans', system-ui, sans-serif", animation: "hero-text-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}
          >
            Skip the queue.
            <br />
            <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent" style={{ backgroundSize: "200% 100%", animation: "gradient-shift 6s ease-in-out infinite" }}>
              Not the care.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="mt-6 max-w-xl text-lg leading-8 text-slate-300/90"
            style={{ animation: "hero-text-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.35s both" }}
          >
            Check in from your phone, track your queue position in real time,
            and get <span className="font-semibold text-green-400">WhatsApp</span> alerts when it's your turn —
            so you spend less time waiting and more time healing.
          </p>

          {/* CTAs */}
          <div
            className="mt-9 flex flex-wrap items-stretch gap-3"
            style={{ animation: "hero-text-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.5s both" }}
          >
            {isStaff ? (
              <>
                <Link
                  to={resolveStaffLandingPath(auth.user)}
                  className="group inline-flex min-h-[3.25rem] items-center gap-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_36px_-12px_rgba(20,184,166,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_44px_-14px_rgba(20,184,166,0.6)]"
                >
                  My workspace
                  <LayoutDashboard className="h-4 w-4 transition-transform group-hover:rotate-6" />
                </Link>
                {canRegisterPatient ? (
                  <Link to="/admin/register" className="inline-flex min-h-[3.25rem] items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/[0.1]">
                    New patient <ClipboardList className="h-4 w-4" />
                  </Link>
                ) : null}
              </>
            ) : isPatient ? (
              <>
                <Link to="/patient/dashboard" className="group inline-flex min-h-[3.25rem] items-center gap-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_36px_-12px_rgba(20,184,166,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_44px_-14px_rgba(20,184,166,0.6)]">
                  My dashboard <LayoutDashboard className="h-4 w-4 transition-transform group-hover:rotate-6" />
                </Link>
                <Link to="/self-register" className="inline-flex min-h-[3.25rem] items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/[0.1]">
                  Book queue spot <ClipboardList className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/self-register"
                  className="group inline-flex min-h-[3.25rem] items-center gap-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_36px_-12px_rgba(20,184,166,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_44px_-14px_rgba(20,184,166,0.6)]"
                >
                  Check in now — no account needed
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/queue" className="inline-flex min-h-[3.25rem] items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/[0.1]">
                  <MonitorSmartphone className="h-4 w-4" />
                  View live queue
                </Link>
              </>
            )}
          </div>

          {/* Sub links */}
          {!isStaff && !isPatient && (
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm" style={{ animation: "hero-text-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.65s both" }}>
              <Link to="/patient/register" className="text-teal-300 underline-offset-4 transition-colors hover:text-teal-200 hover:underline">
                Create a free patient account →
              </Link>
              <span className="text-white/20">|</span>
              <Link to="/admin/login" className="text-white/50 underline-offset-4 transition-colors hover:text-white/70 hover:underline">
                Staff login
              </Link>
            </div>
          )}

          {/* Mini stats row */}
          <div className="mt-10 flex flex-wrap items-center gap-6" style={{ animation: "hero-text-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.8s both" }}>
            {[
              { value: "247", label: "Patients today" },
              { value: "23m", label: "Median wait" },
              { value: "99.8%", label: "Uptime" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div>
                  <div className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
                    {item.value}
                  </div>
                  <div className="text-[11px] font-medium text-white/40">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Visual showcase */}
        <div className="relative hidden lg:block" style={{ animation: "hero-text-rise 1s cubic-bezier(0.16,1,0.3,1) 0.4s both" }}>
          <div className="relative">
            <div className="absolute inset-x-8 -bottom-10 h-28 rounded-full bg-teal-500/[0.12] blur-3xl" />
            <img
              src={hospitalHeroImage}
              alt="Hospital waiting area running the WaitLess digital queue system"
              className="relative aspect-[16/10] w-full rounded-[2rem] object-cover saturate-[0.9] contrast-[1.05] brightness-[0.97]"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent, black 13%, black 87%, transparent), linear-gradient(to bottom, transparent, black 13%, black 87%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 13%, black 87%, transparent), linear-gradient(to bottom, transparent, black 13%, black 87%, transparent)",
                maskComposite: "intersect",
                WebkitMaskComposite: "source-in",
              }}
            />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Scroll to explore</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   LIVE TICKER
   ═══════════════════════════════════════════════ */
function LiveTicker() {
  const items = [
    ["bg-red-400", "R-104 routed to resuscitation"],
    ["bg-amber-400", "Y-118 moved to observation"],
    ["bg-emerald-400", "G-203 WhatsApp alert delivered"],
    ["bg-blue-400", "Pharmacy window ready"],
    ["bg-violet-400", "Lab transfer accepted"],
    ["bg-teal-400", "New walk-in registered"],
    ["bg-cyan-400", "Triage complete in 90 seconds"],
    ["bg-sky-400", "Patient checked in via phone"],
  ];

  return (
    <div className="relative overflow-hidden border-y border-white/[0.05] bg-white/[0.015]">
      <div className="absolute inset-0 bg-gradient-to-r from-[#030d1a] via-transparent to-[#030d1a] z-10 pointer-events-none" />
      <div className="py-3">
        <div
          className="flex w-max gap-10 whitespace-nowrap px-4"
          style={{ animation: "ticker-scroll 40s linear infinite" }}
        >
          {[...items, ...items].map(([dot, label], i) => (
            <span key={`${label}-${i}`} className="inline-flex items-center gap-2.5 text-sm text-white/50">
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TRUST BANNER
   ═══════════════════════════════════════════════ */
function TrustBanner() {
  const badges = [
    { icon: ShieldCheck, label: "Privacy-first design" },
    { icon: Wifi, label: "Works offline on LAN" },
    { icon: Zap, label: "Under 5 sec registration" },
    { icon: Globe, label: "WhatsApp integrated" },
    { icon: Shield, label: "Ticket codes only, no names" },
  ];

  return (
    <div className="relative border-b border-white/[0.05]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {badges.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-white/35">
              <Icon className="h-4 w-4 text-teal-400/50" />
              <span className="text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DEPARTMENTS
   ═══════════════════════════════════════════════ */
const DEPT_DETAILS = {
  OPD: { icon: Stethoscope, body: "General outpatient consultations, follow-up clinics, and referrals.", color: "from-teal-500/20 to-teal-600/5" },
  "Casualty / Triage": { icon: Siren, body: "24/7 emergency assessment with four-tier priority routing.", color: "from-red-500/20 to-red-600/5" },
  Pharmacy: { icon: Pill, body: "Prescription dispensing with WhatsApp call-up alerts.", color: "from-blue-500/20 to-blue-600/5" },
  Laboratory: { icon: FlaskConical, body: "Blood work and diagnostic testing, tracked live from order to result.", color: "from-purple-500/20 to-purple-600/5" },
  Radiology: { icon: ScanLine, body: "Imaging orders linked to your visit, with live status updates.", color: "from-amber-500/20 to-amber-600/5" },
  "OI Clinic": { icon: HeartPulse, body: "Opportunistic infection care with discreet follow-up queues.", color: "from-rose-500/20 to-rose-600/5" },
};

function DepartmentsSection() {
  return (
    <section id="departments" className="relative overflow-hidden py-8 sm:py-12">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.06),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.04),transparent_35%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>Our departments</SectionEyebrow>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
              Every service point,{" "}
              <span className="bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">one queue</span>
            </h2>
            <p className="mt-4 text-lg text-white/50">
              {HOSPITAL.name} runs six service points on WaitLess.
              Your ticket follows you — no re-joining, no lost place.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS.map((dept, index) => {
            const detail = DEPT_DETAILS[dept];
            return (
              <Reveal key={dept} delay={(index % 3) * 100} scale className="h-full">
                <Link
                  to={`/department-board?dept=${encodeURIComponent(dept)}`}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-white/[0.06] bg-gradient-to-br ${detail.color} p-6 backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:border-teal-400/20 hover:shadow-[0_30px_80px_-30px_rgba(20,184,166,0.2)]`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/8 bg-white/[0.04] text-teal-300 transition-all duration-300 group-hover:scale-110 group-hover:bg-teal-500/10 group-hover:text-teal-200">
                      <detail.icon className="h-6 w-6" />
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-400/60 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2">
                      Live board <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-white" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
                    {dept}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">{detail.body}</p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   PATIENT JOURNEY
   ═══════════════════════════════════════════════ */
function PatientJourney() {
  const steps = [
    { num: "01", title: "Register", time: "5 min", body: "Walk in or self-register on your phone. Capture demographics and WhatsApp number.", icon: ClipboardList, color: "from-teal-500 to-teal-600" },
    { num: "02", title: "Triage", time: "2 min", body: "Nurses assign Red/Yellow/Green/Black priority. The queue re-sorts in real time.", icon: ShieldAlert, color: "from-amber-500 to-orange-500" },
    { num: "03", title: "Consultation", time: "10 min", body: "See your doctor. Orders for lab, pharmacy, or imaging generated instantly.", icon: Stethoscope, color: "from-blue-500 to-indigo-500" },
    { num: "04", title: "Investigations", time: "20-30m", body: "Lab or Radiology, tracked live. Get WhatsApp updates on results.", icon: FlaskConical, color: "from-purple-500 to-violet-500" },
    { num: "05", title: "Pharmacy", time: "10 min", body: "Prescription ready? You'll get a WhatsApp call-up when it's your window.", icon: Pill, color: "from-emerald-500 to-green-600" },
    { num: "06", title: "Done", time: "—", body: "Rate your experience and head home. Visit history saved to your account.", icon: CheckCircle2, color: "from-cyan-500 to-teal-500" },
  ];

  return (
    <section id="journey" className="relative overflow-hidden py-8 sm:py-12">

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow tone="cyan">How it works</SectionEyebrow>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
              From check-in to pharmacy,{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">one clear path</span>
            </h2>
            <p className="mt-4 text-lg text-slate-300/70">
              Every step is tracked live. Staff call patients in fair triage order
              and you always know where you stand.
            </p>
          </div>
        </Reveal>

        <div className="relative mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal key={step.num} delay={(index % 3) * 80} scale className="h-full">
              <div className="group relative flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-white/[0.06] bg-white/[0.03] p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-white/12 hover:bg-white/[0.05]">
                <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${step.color} opacity-[0.08] blur-2xl transition-opacity duration-500 group-hover:opacity-[0.15]`} />
                <div className="flex items-center justify-between">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-lg`}>
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-3xl font-extrabold text-white/[0.06]" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
                    {step.num}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-white" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
                  {step.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/45">{step.body}</p>
                <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-cyan-200/70">
                  <Clock3 className="h-3 w-3" /> {step.time}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   TRIAGE SECTION
   ═══════════════════════════════════════════════ */
function TriageSection() {
  const auth = useAuth();
  const canTriage = auth.hasRole(["triage", "clinician", "admin"]);

  const cards = [
    { key: "red",    color: "bg-red-500",    border: "border-red-500/30",  glow: "shadow-[0_20px_50px_-20px_rgba(239,68,68,0.3)]",  textColor: "text-red-300" },
    { key: "yellow", color: "bg-amber-400",  border: "border-amber-400/30", glow: "shadow-[0_20px_50px_-20px_rgba(251,191,36,0.3)]", textColor: "text-amber-300" },
    { key: "green",  color: "bg-emerald-500", border: "border-emerald-500/30", glow: "shadow-[0_20px_50px_-20px_rgba(16,185,129,0.3)]", textColor: "text-emerald-300" },
    { key: "black",  color: "bg-black",      border: "border-slate-500/30", glow: "shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]",    textColor: "text-slate-300" },
  ];

  return (
    <section className="relative overflow-hidden py-8 sm:py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.04),transparent_30%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.04),transparent_30%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow tone="red">Triage protocol</SectionEyebrow>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
              Every patient assessed.{" "}
              <span className="bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
                The sickest seen first.
              </span>
            </h2>
            <p className="mt-4 text-lg text-white/50">
              A four-tier colour-coded triage protocol, captured at registration and
              used to route every patient fairly through the system.
            </p>
          </div>
        </Reveal>

        <div className="mt-10">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, i) => {
              const meta = PRIORITY_META[card.key];
              return (
                <Reveal key={card.key} delay={i * 100} scale className="h-full">
                  <div className={`group flex h-full flex-col overflow-hidden rounded-[1.6rem] border ${card.border} bg-white/[0.02] backdrop-blur transition-all duration-500 hover:-translate-y-1 ${card.glow}`}>
                    <div className={`flex items-center justify-between px-5 py-3.5 ${card.color}`}>
                      <span className="text-sm font-bold uppercase tracking-wider text-white">{meta.short}</span>
                      <Stethoscope className="h-4 w-4 text-white/60" />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <div className="font-bold text-white">{meta.label}</div>
                      <p className="flex-1 text-sm leading-relaxed text-white/40">{meta.description}</p>
                      <div className="h-px bg-gradient-to-r from-white/10 via-white/20 to-transparent" />
                      <div className={`inline-flex w-fit rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold ${card.textColor}`}>
                        <span className="text-white/40">Route → </span>
                        <span className="ml-1">{meta.destination}</span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <div className="mt-10 flex justify-center">
            <Link
              to={canTriage ? "/admin/triage" : "/track"}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-[0_12px_30px_-10px_rgba(20,184,166,0.4)] transition-all hover:-translate-y-0.5 hover:bg-teal-500"
            >
              {canTriage ? "Open triage console" : "Track a ticket"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   FEATURES
   ═══════════════════════════════════════════════ */
function FeaturesSection() {
  const features = [
    { icon: ClipboardList, title: "Instant Registration", body: "Capture demographics in under a minute. Generates a ticket and links a WhatsApp contact automatically.", color: "from-teal-500 to-teal-600" },
    { icon: ShieldAlert, title: "Triage-Aware Routing", body: "Nurses assign priorities. The queue re-sorts in real time so the sickest are always seen first.", color: "from-red-500 to-rose-500" },
    { icon: MessageCircle, title: "Zero-Cost WhatsApp", body: "Uses Meta's service conversation window — patients are alerted before their turn with no per-message fees.", color: "from-green-500 to-emerald-500" },
    { icon: MonitorSmartphone, title: "Public Queue Board", body: "Big-screen display for waiting areas, kept in sync over the hospital LAN. Shows ticket codes only.", color: "from-blue-500 to-indigo-500" },
    { icon: Activity, title: "Real-Time Dashboard", body: "Track bottlenecks in OPD, Pharmacy, Lab, Radiology and OI Clinic from one powerful command view.", color: "from-purple-500 to-violet-500" },
    { icon: Wifi, title: "Offline-First Architecture", body: "Runs on the hospital LAN. WhatsApp messages queue locally and send when internet connectivity returns.", color: "from-amber-500 to-orange-500" },
  ];

  return (
    <section id="features" className="relative overflow-hidden py-8 sm:py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_25%,rgba(20,184,166,0.06),transparent_35%),radial-gradient(circle_at_85%_75%,rgba(59,130,246,0.04),transparent_30%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>Digital patient services</SectionEyebrow>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
              Everything you need.{" "}
              <span className="bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">Nothing you don't.</span>
            </h2>
            <p className="mt-4 text-lg text-white/50">
              Designed around the workflows observed at Chinhoyi Provincial Hospital — and the constraints of every Zimbabwean facility.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={(index % 3) * 100} scale className="h-full">
              <div className="group relative h-full overflow-hidden rounded-[1.8rem] border border-white/[0.06] bg-white/[0.02] p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-white/10 hover:bg-white/[0.04]">
                <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${feature.color} opacity-[0.06] blur-xl transition-all duration-500 group-hover:opacity-[0.12] group-hover:h-28 group-hover:w-28`} />
                <span className={`relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-lg transition-transform duration-300 group-hover:scale-105`}>
                  <feature.icon className="h-6 w-6" />
                </span>
                <h3 className="relative mt-5 text-lg font-bold text-white" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
                  {feature.title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-white/40">{feature.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   MOBILE APP SECTION
   ═══════════════════════════════════════════════ */
function MobileAppSection() {
  const perks = [
    { icon: Smartphone, title: "Check in from anywhere", body: "Get a ticket without visiting reception." },
    { icon: BellRing, title: "WhatsApp notifications", body: "Know when it's your turn, in real time." },
    { icon: Clock3, title: "Live wait times", body: "See exactly how long until you're called." },
    { icon: Star, title: "Rate your visit", body: "Help the hospital improve its services." },
  ];

  return (
    <section className="relative overflow-hidden py-8 sm:py-12">
      <div className="absolute inset-0 opacity-[0.04] [background-image:radial-gradient(rgba(125,211,252,0.5)_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 rounded-[2.2rem] border-2 border-transparent border-t-teal-400/60 border-b-cyan-400/60 bg-white/[0.02] p-8 sm:p-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <Reveal>
            <div>
              <SectionEyebrow tone="blue" center={false}>Your pocket queue</SectionEyebrow>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
                Your hospital visit,{" "}
                <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">in your pocket</span>
              </h2>
              <p className="mt-4 text-white/50">
                No app download required. Self-register on any browser, get your ticket, and track everything in real time.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {perks.map((perk) => (
                  <div key={perk.title} className="flex gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-colors hover:border-white/10">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-300">
                      <perk.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-sm font-bold text-white">{perk.title}</div>
                      <div className="mt-0.5 text-xs text-white/40">{perk.body}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/self-register"
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_36px_-12px_rgba(59,130,246,0.4)] transition-all hover:-translate-y-0.5"
              >
                Try self check-in <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="relative mx-auto max-w-[21rem]">
              <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/[0.1] blur-[80px]" />
              {/* hologram ring under the phone */}
              <div className="absolute inset-x-4 bottom-2 h-24 rounded-[50%] border border-teal-400/[0.15]" />
              {/* floor shadow — shrinks as the phone rises */}
              <div
                className="absolute inset-x-10 bottom-0 left-1/2 h-8 w-4/5 rounded-[50%] bg-black/60 blur-xl"
                style={{ animation: "shadow-sway 7s ease-in-out infinite" }}
              />
              {/* rotating phone + glass sheen */}
              <div className="relative" style={{ animation: "phone-showcase 7s ease-in-out infinite" }}>
                <img
                  src={phoneMockupImage}
                  alt="WaitLess mobile app showing live queue position, progress tracking, and WhatsApp notifications"
                  className="relative w-full h-auto drop-shadow-[0_35px_45px_rgba(2,8,20,0.55)]"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 mix-blend-screen"
                  style={{
                    WebkitMaskImage: `url(${phoneMockupImage})`,
                    maskImage: `url(${phoneMockupImage})`,
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    background:
                      "linear-gradient(115deg, transparent 38%, rgba(255,255,255,0.38) 50%, transparent 62%)",
                    backgroundSize: "260% 100%",
                    animation: "sheen-sweep 4.5s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   STATS
   ═══════════════════════════════════════════════ */
function StatsSection() {
  const stats = [
    { value: "12,480", suffix: "+", label: "Patients served", icon: Users },
    { value: "23", suffix: " min", label: "Avg. wait time", icon: Timer },
    { value: "45,600", suffix: "+", label: "WhatsApp alerts", icon: MessageCircle },
    { value: "99.8", suffix: "%", label: "System uptime", icon: Activity },
  ];

  return (
    <section className="relative overflow-hidden py-8 sm:py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.06),transparent_40%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
              The numbers speak for{" "}
              <span className="bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">themselves</span>
            </h2>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 100} scale className="h-full">
              <div className="group relative h-full overflow-hidden rounded-[1.8rem] border border-white/[0.06] bg-white/[0.02] p-7 text-center transition-all duration-500 hover:-translate-y-1.5 hover:border-teal-400/15 hover:shadow-[0_30px_80px_-30px_rgba(20,184,166,0.15)]">
                <div className="absolute inset-0 bg-gradient-to-b from-teal-500/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/8 bg-teal-500/[0.08] text-teal-300">
                  <stat.icon className="h-6 w-6" />
                </span>
                <div className="relative mt-5 text-4xl font-extrabold tracking-tight text-white" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="relative mt-2 text-sm font-medium text-white/40">{stat.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   TESTIMONIALS
   ═══════════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    {
      quote: "I used to spend the entire day at the hospital. Now I check in on my phone, go home, and come back when WhatsApp tells me it's my turn.",
      name: "Tatenda M.",
      role: "Patient, OPD",
    },
    {
      quote: "We reduced our average patient wait time by 40% in the first month. The triage routing alone has saved lives in Casualty.",
      name: "Sr. Moyo",
      role: "Chief Nursing Officer",
    },
    {
      quote: "The queue board shows ticket numbers only — never patient names. Families trust the system because their privacy is protected.",
      name: "Dr. Chikwava",
      role: "Medical Superintendent",
    },
  ];

  return (
    <section className="relative overflow-hidden py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>Testimonials</SectionEyebrow>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
              Trusted by patients{" "}
              <span className="bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">and staff</span>
            </h2>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 120} scale className="h-full">
              <div className="group relative flex h-full flex-col rounded-[1.8rem] border border-white/[0.06] bg-white/[0.03] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-teal-400/15 hover:shadow-[0_30px_80px_-30px_rgba(20,184,166,0.12)]">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-5 flex-1 text-sm leading-7 text-white/60 italic">
                  "{t.quote}"
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-5">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-sm font-bold text-white">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{t.name}</div>
                    <div className="text-xs text-white/40">{t.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   CTA
   ═══════════════════════════════════════════════ */
function CTASection() {
  const auth = useAuth();
  const patientAuth = usePatientAuth();
  const isStaff = auth.isAuthenticated;
  const isPatient = patientAuth.isPatientAuthenticated;

  const ctaCards = isStaff
    ? [
        ["Reception", "Register the next patient and issue a clear ticket.", "/admin/register", ClipboardList],
        ["Waiting area", "Show the live board without exposing patient names.", "/queue", MonitorSmartphone],
        ["Operations", "Monitor bottlenecks and call the next patient.", "/admin/dashboard", Activity],
      ]
    : isPatient
      ? [
          ["My dashboard", "View your active tickets and visit history.", "/patient/dashboard", LayoutDashboard],
          ["Book a spot", "Get a ticket instantly and track your position.", "/self-register", ClipboardList],
          ["Track ticket", "Enter your ticket code to see your live position.", "/track", Search],
        ]
      : [
          ["Create account", "Sign up for free — book queue spots, track tickets, and get WhatsApp updates.", "/patient/register", ClipboardList],
          ["Track a ticket", "Enter your code and see your live queue position.", "/track", Search],
          ["Queue board", "Show the live board in the waiting area.", "/queue", MonitorSmartphone],
        ];

  return (
    <section className="relative overflow-hidden py-8 sm:py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_30%,rgba(20,184,166,0.08),transparent_35%),radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.06),transparent_30%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="overflow-hidden rounded-[2.5rem] border border-white/[0.08] bg-gradient-to-br from-teal-500/[0.08] via-transparent to-blue-500/[0.06] p-8 sm:p-12 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.4)] backdrop-blur">
            <div className="flex flex-col gap-10">
              <div className="mx-auto max-w-2xl text-center">
                <SectionEyebrow>Get started</SectionEyebrow>
                <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
                  A queue system patients and staff{" "}
                  <span className="bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">can trust.</span>
                </h2>
                <p className="mt-4 text-white/50">
                  Self check-in, live boards, triage-aware routing and WhatsApp updates — on any device, in any hospital.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {ctaCards.map(([title, body, to, Icon], index) => (
                  <Reveal key={title} delay={index * 100} scale className="h-full">
                    <Link
                      to={to}
                      className="group flex h-full flex-col rounded-[1.6rem] border border-white/[0.08] bg-white/[0.03] p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-teal-400/20 hover:bg-white/[0.06]"
                    >
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-teal-500/10 text-teal-300 transition-transform duration-300 group-hover:scale-110">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-4 text-lg font-bold text-white" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>{title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-white/40">{body}</p>
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-300 transition-all group-hover:gap-3">
                        {title} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
