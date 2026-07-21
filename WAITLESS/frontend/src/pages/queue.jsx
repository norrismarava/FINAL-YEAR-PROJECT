import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock3,
  Inbox,
  MessageCircle,
  MonitorSmartphone,
  ShieldCheck,
  UserCheck,
  Users,
  Wifi,
} from "lucide-react";

import { LoadingPanel } from "@/components/ui/system-loader";
import {
  PRIORITY_META,
  STATUS_META,
  priorityChipClass,
} from "@/services/queueMeta";
import { fetchQueueBoard } from "@/services/queueApi";
import { useQueueRealtime } from "@/sockets/QueueRealtimeProvider";
import { useApiResource } from "@/hooks/useApiResource";
import authBackground from "@/assets/BACKG.png";
import waitlessLogoIcon from "@/assets/waitless-logo-icon.png";

const isBrowser = typeof window !== "undefined";

/* ── Live-connection status badge config ────────────────────── */
const LIVE_STATUS_META = {
  connected: {
    label: "Live sync",
    className: "bg-priority-green/20 text-priority-green",
    dot: true,
  },
  connecting: {
    label: "Connecting",
    className: "bg-primary-soft text-primary",
    dot: false,
  },
  reconnecting: {
    label: "Reconnecting",
    className: "bg-muted text-muted-foreground",
    dot: false,
  },
  polling: {
    label: "Polling fallback",
    className: "bg-muted text-muted-foreground",
    dot: false,
  },
  closed: {
    label: "Offline",
    className: "bg-muted text-muted-foreground",
    dot: false,
  },
};

/* ── Priority → CSS pulse class mapping ─────────────────────── */
const PRIORITY_GLOW_CLASS = {
  red: "queue-card-pulse-red",
  yellow: "queue-card-pulse-yellow",
  green: "queue-card-pulse-green",
  black: "queue-card-pulse-black",
};

/* ── Priority → ribbon modifier mapping ─────────────────────── */
const PRIORITY_RIBBON_CLASS = {
  red: "queue-priority-ribbon--red",
  yellow: "queue-priority-ribbon--yellow",
  green: "queue-priority-ribbon--green",
  black: "queue-priority-ribbon--black",
};

/* ── Priority → row accent mapping ──────────────────────────── */
const PRIORITY_ROW_ACCENT = {
  red: "queue-row-accent--red",
  yellow: "queue-row-accent--yellow",
  green: "queue-row-accent--green",
  black: "queue-row-accent--black",
};

/* ── Ordinal helper (1st, 2nd, 3rd …) ──────────────────────── */
function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* ================================================================
   MAIN PAGE COMPONENT
   ================================================================ */
export default function QueuePage() {
  const [now, setNow] = useState(new Date());
  const realtime = useQueueRealtime();

  const loadQueueBoard = useCallback(() => fetchQueueBoard(), []);
  const queueQuery = useApiResource(loadQueueBoard, { enabled: isBrowser });

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const serving = queueQuery.data?.nowServing ?? [];
  const waiting = queueQuery.data?.waiting ?? [];
  const missed = queueQuery.data?.missed ?? [];
  const liveMeta =
    LIVE_STATUS_META[realtime.status] ?? LIVE_STATUS_META.connecting;

  return (
    <section className="relative isolate min-h-screen overflow-hidden px-4 py-6 text-white sm:px-6 lg:px-8">
      {/* Background image */}
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
      <div className="absolute inset-0 -z-10 bg-[#04141f] lg:hidden" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col pb-8">
        {/* Logo header */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <img
            src={waitlessLogoIcon}
            alt="WaitLess"
            className="h-11 w-11 rounded-lg object-contain"
          />
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-400">Queue board</div>
            <div className="text-sm font-medium text-white/70">Smarter Queues, Better Care</div>
          </div>
        </div>

        {/* Dark glass card wrapper */}
        <div className="relative overflow-hidden rounded-2xl bg-[#04141f]/80 shadow-[0_32px_80px_-28px_rgba(2,8,20,0.50)] backdrop-blur-2xl">
          {/* Circulating gradient ribbon */}
          <QueueRibbonCirculation />

          {/* Content above ribbon */}
          <div className="relative z-10">
        {/* ─── HERO HEADER ──────────────────────────────── */}
        <header className="track-portal-hero relative overflow-hidden bg-[linear-gradient(135deg,rgba(4,20,31,0.82)_0%,rgba(6,42,53,0.72)_48%,rgba(10,31,46,0.78)_100%)] p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_32%)]" />
          <div className="relative grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            {/* Left column — title & badges */}
            <div>
              <div className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-teal-300">Public display</div>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Live queue board
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Patient-facing queue updates for the waiting area. Tickets are
                ordered by triage priority first, then by time in queue.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-teal-200/12 bg-teal-100/[0.07] px-3 py-1.5 text-xs font-semibold text-teal-50">
                  Chinhoyi Provincial Hospital
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300">
                  Waiting area display
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300">
                  Sorted by priority and wait time
                </span>
              </div>
            </div>

            {/* Right column — dark status panel */}
            <div className="rounded-[1.25rem] border border-white/10 bg-[linear-gradient(135deg,rgba(4,20,31,0.88),rgba(6,42,53,0.78)_54%,rgba(10,31,46,0.84))] p-5 sm:p-6">
              {/* ECG heartbeat decoration */}
              <div className="queue-ecg-line" />

              <div className="relative flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-teal-300/80">
                    Queue status
                  </div>
                  <div className="mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                    {now.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                  {/* Date row */}
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="h-3 w-3" />
                    {now.toLocaleDateString([], {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>

                {/* Connection badge with live dot */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${liveMeta.className}`}
                >
                  {liveMeta.dot ? (
                    <span className="queue-live-dot" />
                  ) : (
                    <Wifi className="h-3.5 w-3.5" />
                  )}
                  {liveMeta.label}
                </span>
              </div>

              {/* Animated stat cards */}
              <div className="relative mt-6 grid grid-cols-3 gap-3">
                <QueueStat
                  icon={<Activity className="h-3.5 w-3.5" />}
                  label="Now serving"
                  liveDot
                  value={serving.length}
                  enterClass="queue-stat-enter queue-stat-enter-1"
                />
                <QueueStat
                  icon={<Users className="h-3.5 w-3.5" />}
                  label="Waiting"
                  value={waiting.length}
                  enterClass="queue-stat-enter queue-stat-enter-2"
                />
                <QueueStat
                  icon={<AlertTriangle className="h-3.5 w-3.5" />}
                  label="Missed"
                  value={missed.length}
                  enterClass="queue-stat-enter queue-stat-enter-3"
                />
              </div>

              <div className="relative mt-5 rounded-2xl border border-white/12 bg-white/10 p-4">
                <div className="flex items-start gap-3">
                  <MonitorSmartphone className="mt-0.5 h-5 w-5 shrink-0 text-white/80" />
                  <div>
                    <div className="font-semibold text-white">
                      Display guidance
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Patients receiving WhatsApp alerts can wait more
                      comfortably while staff still call the next ticket in
                      order.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ─── NOW SERVING SECTION ──────────────────────── */}
        <div className="mt-6 page-section-rise page-section-rise-delay-1">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="eyebrow">Now serving</div>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Current service windows
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              Live service feed
            </div>
          </div>

          {queueQuery.isLoading ? (
            <LoadingPanel
              className="mt-4"
              message="Refreshing current service windows from the live queue."
              title="Loading the live queue"
            />
          ) : queueQuery.isError ? (
            <div className="surface-panel mt-4 border-destructive/30 bg-destructive/10 px-5 py-6 text-sm text-destructive">
              {queueQuery.error.message}
            </div>
          ) : serving.length ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {serving.map((ticket) => (
                <ServingCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <div className="surface-panel mt-4">
              <div className="queue-empty-state">
                <div className="queue-empty-state-icon">
                  <UserCheck className="h-7 w-7" />
                </div>
                <div className="font-display text-lg font-bold tracking-tight">
                  No active service
                </div>
                <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                  No patient is currently being served. The next ticket will
                  appear here when a staff member calls it.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─── WAITING QUEUE SECTION ────────────────────── */}
        <article className="surface-panel page-section-rise page-section-rise-delay-2 mt-6 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 px-5 py-5 sm:px-6">
            <div>
              <div className="eyebrow">Up next</div>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Waiting queue
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Patients closer to the front of the line appear first. Red and
                yellow priorities always outrank routine tickets.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {waiting.length} patients waiting
            </div>
          </div>

          {queueQuery.isLoading ? (
            <LoadingPanel
              compact
              className="px-5 py-8 sm:px-6"
              message="Ordering tickets by priority and arrival time."
              surface={false}
              title="Loading the waiting list"
            />
          ) : queueQuery.isError ? (
            <div className="px-5 py-6 text-sm text-destructive sm:px-6">
              {queueQuery.error.message}
            </div>
          ) : waiting.length ? (
            <>
              {/* Mobile cards (< lg) */}
              <div className="space-y-3 px-4 py-4 lg:hidden sm:px-6">
                {waiting.map((ticket, index) => (
                  <WaitingMobileCard
                    key={ticket.id}
                    ticket={ticket}
                    position={index + 1}
                  />
                ))}
              </div>

              {/* Desktop table (≥ lg) */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-center w-16">#</th>
                      <th className="px-6 py-3">Ticket</th>
                      <th className="px-6 py-3">Patient</th>
                      <th className="px-6 py-3">Department</th>
                      <th className="px-6 py-3">Priority</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Wait</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {waiting.map((ticket, index) => (
                      <tr
                        key={ticket.id}
                        className={`queue-row-accent ${PRIORITY_ROW_ACCENT[ticket.priority] ?? ""} ${
                          index % 2 === 0
                            ? "bg-background/70"
                            : "bg-muted/20"
                        } transition-[background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary-soft/25`}
                      >
                        <td className="px-4 py-4 text-center">
                          <span className="queue-position-badge">
                            {ordinal(index + 1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-grid h-10 w-16 place-items-center rounded-xl font-display text-sm font-bold ${priorityChipClass[ticket.priority]}`}
                          >
                            {ticket.ticket}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">
                            Token {ticket.ticket}
                          </div>
                          {ticket.whatsApp && (
                            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-accent">
                              <MessageCircle className="h-3 w-3" />
                              WhatsApp on
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {ticket.department}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                {
                                  red: "bg-priority-red",
                                  yellow: "bg-priority-yellow",
                                  green: "bg-priority-green",
                                  black: "bg-priority-black",
                                }[ticket.priority] ?? "bg-muted"
                              }`}
                            />
                            {PRIORITY_META[ticket.priority].short}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_META[ticket.status]?.className ?? STATUS_META.waiting.className}`}
                          >
                            {STATUS_META[ticket.status]?.label ?? ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center gap-1 font-semibold tabular-nums">
                            <Clock3 className="h-3 w-3 text-muted-foreground" />
                            {ticket.waitMinutes}m
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="queue-empty-state">
              <div className="queue-empty-state-icon">
                <Inbox className="h-7 w-7" />
              </div>
              <div className="font-display text-lg font-bold tracking-tight">
                Queue is clear
              </div>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                Nobody is waiting in the queue right now. New patients will
                appear here as they register.
              </p>
            </div>
          )}
        </article>

        {/* ─── MISSED TURNS SECTION ─────────────────────── */}
        {missed.length > 0 && (
          <article className="surface-panel queue-missed-pulse page-section-rise page-section-rise-delay-3 mt-6 border-priority-yellow/30 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="eyebrow flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-priority-yellow" />
                  Missed turns
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
                  Return to the department desk
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  These token numbers were called but not present. Staff can
                  recall them fairly from the department console.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-priority-yellow/20 px-3 py-1.5 text-xs font-semibold text-foreground">
                <span className="queue-live-dot queue-live-dot--amber" />
                {missed.length} missed
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {missed.map((ticket) => (
                <div
                  key={ticket.id}
                  className="surface-hover-card group rounded-2xl border border-priority-yellow/30 bg-priority-yellow/10 px-4 py-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-priority-yellow opacity-60 transition-opacity group-hover:opacity-100" />
                    <div>
                      <div className="font-display text-2xl font-bold tracking-tight">
                        {ticket.ticket}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {ticket.department}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   NOW-SERVING CARD — premium glowing ticket card
   ================================================================ */
function ServingCard({ ticket }) {
  const glowClass = PRIORITY_GLOW_CLASS[ticket.priority] ?? "";
  const ribbonClass = PRIORITY_RIBBON_CLASS[ticket.priority] ?? "";

  return (
    <article
      className={`queue-serving-shine surface-hover-card relative rounded-[1.75rem] border border-current/12 p-6 ${glowClass} ${priorityChipClass[ticket.priority]}`}
    >
      {/* Priority color ribbon */}
      <div className={`queue-priority-ribbon ${ribbonClass}`} />

      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] opacity-80">
          {PRIORITY_META[ticket.priority].short} priority
        </div>
        <Activity className="h-4 w-4 opacity-40" />
      </div>

      <div className="mt-2 font-display text-6xl font-bold tracking-tight sm:text-7xl">
        {ticket.ticket}
      </div>

      <div className="mt-4 text-sm opacity-90">Token {ticket.ticket}</div>
      <div className="mt-1 text-xs opacity-80">{ticket.department}</div>

      <div className="mt-5 flex items-center justify-between gap-3 text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-current/15 px-2.5 py-1 uppercase tracking-[0.18em]">
          <span className="queue-status-pulse" />
          {STATUS_META[ticket.status]?.label ?? ticket.status}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock3 className="h-3 w-3 opacity-60" />
          {ticket.waitMinutes}m in flow
        </span>
      </div>
    </article>
  );
}

/* ================================================================
   WAITING QUEUE — mobile card variant
   ================================================================ */
function WaitingMobileCard({ ticket, position }) {
  return (
    <article
      className={`surface-hover-card queue-row-accent ${PRIORITY_ROW_ACCENT[ticket.priority] ?? ""} rounded-2xl border border-border/70 bg-background/80 px-4 py-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="queue-position-badge text-[10px]">
            {ordinal(position)}
          </span>
          <span
            className={`inline-grid h-10 w-16 place-items-center rounded-xl font-display text-sm font-bold ${priorityChipClass[ticket.priority]}`}
          >
            {ticket.ticket}
          </span>
          <div>
            <div className="font-semibold">Token {ticket.ticket}</div>
            <div className="text-xs text-muted-foreground">
              {ticket.department}
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums">
          <Clock3 className="h-3 w-3 text-muted-foreground" />
          {ticket.waitMinutes}m
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              {
                red: "bg-priority-red",
                yellow: "bg-priority-yellow",
                green: "bg-priority-green",
                black: "bg-priority-black",
              }[ticket.priority] ?? "bg-muted"
            }`}
          />
          {PRIORITY_META[ticket.priority].label}
        </span>
        {ticket.whatsApp && (
          <span className="inline-flex items-center gap-1 text-accent">
            <MessageCircle className="h-3 w-3" />
            WhatsApp on
          </span>
        )}
      </div>
    </article>
  );
}


/* ================================================================
   PARTICLES — canvas-based floating particle animation
   ================================================================ */
const PARTICLE_COLORS = [
  { r: 20, g: 184, b: 166 },   // teal-500
  { r: 45, g: 212, b: 191 },   // teal-400
  { r: 37, g: 99, b: 235 },    // blue-600
  { r: 96, g: 165, b: 250 },   // blue-400
  { r: 14, g: 165, b: 233 },   // sky-500
  { r: 15, g: 118, b: 110 },   // teal-700 (primary)
];

const PARTICLE_COUNT = 68;
const CONNECTION_DISTANCE = 155;
const ORB_COUNT = 8;

function createParticle(w, h) {
  const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
  const isLarge = Math.random() < 0.2;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    radius: isLarge ? 2.8 + Math.random() * 2.8 : 1.0 + Math.random() * 2.0,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.35,
    alpha: isLarge ? 0.18 + Math.random() * 0.18 : 0.08 + Math.random() * 0.16,
    color,
    pulseSpeed: 0.008 + Math.random() * 0.014,
    pulseOffset: Math.random() * Math.PI * 2,
  };
}

function createOrb(w, h) {
  const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    radius: 36 + Math.random() * 64,
    vx: (Math.random() - 0.5) * 0.16,
    vy: (Math.random() - 0.5) * 0.14,
    alpha: 0.04 + Math.random() * 0.05,
    color,
    pulseSpeed: 0.003 + Math.random() * 0.006,
    pulseOffset: Math.random() * Math.PI * 2,
  };
}

function QueueParticles() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);
  const orbsRef = useRef([]);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect reduced motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement?.getBoundingClientRect() ?? {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: rect.width, h: rect.height };
    }

    let { w, h } = resize();

    // Seed particles
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(w, h)
    );
    orbsRef.current = Array.from({ length: ORB_COUNT }, () =>
      createOrb(w, h)
    );

    function draw() {
      timeRef.current += 1;
      const t = timeRef.current;
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;
      const orbs = orbsRef.current;

      // ── Draw glowing orbs (large soft circles) ──
      for (const orb of orbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;

        // Wrap around edges
        if (orb.x < -orb.radius) orb.x = w + orb.radius;
        if (orb.x > w + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = h + orb.radius;
        if (orb.y > h + orb.radius) orb.y = -orb.radius;

        const pulse = Math.sin(t * orb.pulseSpeed + orb.pulseOffset) * 0.4 + 0.6;
        const alpha = orb.alpha * pulse;
        const { r, g, b } = orb.color;

        const grad = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, orb.radius
        );
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 0.4})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // ── Draw connection lines between nearby particles ──
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.08;
            const ci = particles[i].color;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${ci.r},${ci.g},${ci.b},${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // ── Draw particles ──
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        const pulse =
          Math.sin(t * p.pulseSpeed + p.pulseOffset) * 0.35 + 0.65;
        const alpha = p.alpha * pulse;
        const { r, g, b } = p.color;

        // Glow halo for larger particles
        if (p.radius > 2.5) {
          const glow = ctx.createRadialGradient(
            p.x, p.y, 0,
            p.x, p.y, p.radius * 4
          );
          glow.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.5})`);
          glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    function handleResize() {
      const dims = resize();
      w = dims.w;
      h = dims.h;
    }

    window.addEventListener("resize", handleResize);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}

/* ================================================================
   QUEUE STAT — animated stat card for the dark header panel
   ================================================================ */
function QueueStat({ label, value, icon, liveDot, enterClass = "" }) {
  return (
    <div
      className={`rounded-2xl border border-white/12 bg-white/10 px-4 py-3 ${enterClass}`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/65">
        {icon && <span className="opacity-60">{icon}</span>}
        {label}
        {liveDot && <span className="queue-live-dot ml-auto" />}
      </div>
      <div className="mt-1 font-display text-3xl font-bold tracking-tight text-primary-foreground">
        {value}
      </div>
    </div>
  );
}
