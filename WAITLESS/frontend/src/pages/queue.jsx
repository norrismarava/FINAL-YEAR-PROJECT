import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock3,
  Inbox,
  MessageCircle,
  ShieldCheck,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
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
import { useAudioCall } from "@/hooks/useAudioCall";
import authBackground from "@/assets/BACKG.png";
import waitlessLogoIcon from "@/assets/waitless-logo-icon.png";

const isBrowser = typeof window !== "undefined";

/* ── Health education carousel content ───────────────────────── */
const HEALTH_TIPS = [
  {
    title: "Hand Hygiene",
    content: "Wash your hands with soap and water for at least 20 seconds, especially before eating and after using the restroom.",
    icon: "🧼",
  },
  {
    title: "Stay Hydrated",
    content: "Drink plenty of water throughout the day. Proper hydration helps your body function optimally.",
    icon: "💧",
  },
  {
    title: "Mental Health",
    content: "Take breaks when needed. Your mental well-being is just as important as your physical health.",
    icon: "🧠",
  },
  {
    title: "Vaccination",
    content: "Keep your vaccinations up to date. Vaccines protect you and those around you from preventable diseases.",
    icon: "💉",
  },
  {
    title: "Healthy Eating",
    content: "Include fruits and vegetables in your daily diet. A balanced diet supports overall health.",
    icon: "🥗",
  },
  {
    title: "Physical Activity",
    content: "Aim for at least 30 minutes of moderate exercise daily. Walking, stretching, and light activities count.",
    icon: "🏃",
  },
];

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
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const realtime = useQueueRealtime();
  const audio = useAudioCall();
  const lastProcessedEventRef = useRef(null);
  const [justCalledId, setJustCalledId] = useState(null);

  const loadQueueBoard = useCallback(() => fetchQueueBoard(), []);
  const queueQuery = useApiResource(loadQueueBoard, { enabled: isBrowser });

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % HEALTH_TIPS.length);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!realtime.lastEvent) return;
    if (lastProcessedEventRef.current === realtime.lastEvent.timestamp) return;
    lastProcessedEventRef.current = realtime.lastEvent.timestamp;

    if (realtime.lastEvent.type === "ticket.called") {
      const payload = realtime.lastEvent.payload ?? {};
      const ticketCode = payload.ticket ?? "";
      const department = payload.department ?? "";
      const room = payload.room ?? "";
      const attempt = Number(payload.attempt ?? 1);
      if (ticketCode) {
        const destination = room
          ? `Room ${room}${department ? `, ${department}` : ""}`
          : department || "the service desk";
        const prefix = attempt > 1 ? `Second call. ` : "";
        audio.speak(`${prefix}Ticket ${ticketCode}, please proceed to ${destination}`);
        setJustCalledId(payload.id ?? null);
      }
    }
  }, [realtime.lastEvent, audio]);

  useEffect(() => {
    if (!justCalledId) return undefined;
    const id = window.setTimeout(() => setJustCalledId(null), 9000);
    return () => window.clearTimeout(id);
  }, [justCalledId]);

  const serving = queueQuery.data?.nowServing ?? [];
  const waiting = queueQuery.data?.waiting ?? [];
  const missed = queueQuery.data?.missed ?? [];

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

      {/* Mobile solid background */}
      <div className="absolute inset-0 -z-10 bg-[#04141f] lg:hidden" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col pb-8">
        {/* Dark glass card wrapper */}
        <div className="relative overflow-hidden rounded-2xl bg-[#04141f]/60 shadow-[0_32px_80px_-28px_rgba(2,8,20,0.45)] backdrop-blur-2xl">
          {/* Circulating gradient ribbon */}
          

          {/* Content above ribbon */}
          <div className="relative z-10">
        {/* ─── HERO HEADER ──────────────────────────────── */}
        <header className="track-portal-hero relative overflow-hidden bg-[linear-gradient(135deg,rgba(4,20,31,0.82)_0%,rgba(6,42,53,0.72)_48%,rgba(10,31,46,0.78)_100%)] p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_32%)]" />
          <div className="relative mb-6 text-center">
            <img
              src={waitlessLogoIcon}
              alt="WaitLess"
              className="mx-auto h-12 w-12 rounded-xl object-contain drop-shadow-[0_0_14px_rgba(45,212,191,0.4)]"
            />
            <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-teal-400">Queue board</div>
          </div>
          <div className="relative grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            {/* Left column — title & badges */}
            <div>
              <div className="inline-flex items-center gap-3 text-[0.7rem] font-bold uppercase tracking-[0.24em] text-teal-300">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-teal-300/60" />
                Public display
                <span className="h-px w-8 bg-gradient-to-l from-transparent to-teal-300/60" />
              </div>
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

            {/* Right column — queue status */}
            <div className="relative">
              {/* ECG heartbeat decoration */}
              <div className="queue-ecg-line" />

              <div className="relative flex items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.28em] text-teal-300/90">
                    <span className="h-px w-8 bg-gradient-to-r from-transparent to-teal-300/60" />
                    Queue status
                    <span className="h-px w-8 bg-gradient-to-l from-transparent to-teal-300/60" />
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

              <AudioCallPanel audio={audio} />
            </div>
          </div>
        </header>

        {/* ─── HEALTH EDUCATION CAROUSEL ─────────────────────── */}
        <div className="mt-6 page-section-rise page-section-rise-delay-1 mx-5 rounded-2xl border border-teal-500/20 bg-[linear-gradient(135deg,rgba(20,184,166,0.08),rgba(13,148,136,0.05)_50%,rgba(6,78,59,0.04))] px-6 py-5 sm:mx-8 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.24em] text-teal-300">
                <span className="text-xl">{HEALTH_TIPS[currentTipIndex].icon}</span>
                Health tip
              </div>
              <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
                {HEALTH_TIPS[currentTipIndex].title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                {HEALTH_TIPS[currentTipIndex].content}
              </p>
            </div>
            <div className="flex gap-1">
              {HEALTH_TIPS.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentTipIndex(index)}
                  className={`h-1.5 w-1.5 rounded-full transition-all ${
                    index === currentTipIndex
                      ? "bg-teal-400 w-6"
                      : "bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Show health tip ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ─── NOW SERVING SECTION ──────────────────────── */}
        <div className="mt-6 page-section-rise page-section-rise-delay-2 px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-teal-300">Now serving</div>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Current service windows
              </h2>
            </div>
          </div>

          {queueQuery.isLoading ? (
            <LoadingPanel
              className="mt-4"
              message="Refreshing current service windows from the live queue."
              title="Loading the live queue"
            />
          ) : queueQuery.isError ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-6 text-sm text-red-300">
              {queueQuery.error.message}
            </div>
          ) : serving.length ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {serving.map((ticket) => (
                <ServingCard
                          key={ticket.id}
                          ticket={ticket}
                          justCalled={ticket.id === justCalledId}
                        />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="queue-empty-state">
                <div className="queue-empty-state-icon">
                  <UserCheck className="h-7 w-7" />
                </div>
                <div className="font-display text-lg font-bold tracking-tight text-white">
                  No active service
                </div>
                <p className="max-w-sm text-sm leading-6 text-slate-400">
                  No patient is currently being served. The next ticket will
                  appear here when a staff member calls it.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─── WAITING QUEUE SECTION ────────────────────── */}
        <article className="page-section-rise page-section-rise-delay-2 mt-6 mx-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] sm:mx-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
            <div>
              <div className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-teal-300">Up next</div>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Waiting queue
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Patients closer to the front of the line appear first. Red and
                yellow priorities always outrank routine tickets.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300">
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
            <div className="px-5 py-6 text-sm text-red-300 sm:px-6">
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
                  <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.22em] text-slate-400">
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
                  <tbody className="divide-y divide-white/10">
                    {waiting.map((ticket, index) => (
                      <tr
                        key={ticket.id}
                        className={`queue-row-accent ${PRIORITY_ROW_ACCENT[ticket.priority] ?? ""} ${
                          index % 2 === 0
                            ? "bg-white/[0.02]"
                            : "bg-white/[0.04]"
                        } transition-[background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-teal-500/10`}
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
                          <div className="font-medium text-white">
                            Token {ticket.ticket}
                          </div>
                          {ticket.whatsApp && (
                            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-teal-300">
                              <MessageCircle className="h-3 w-3" />
                              WhatsApp on
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {ticket.department}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center gap-1.5 text-slate-300">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                {
                                  red: "bg-priority-red",
                                  yellow: "bg-priority-yellow",
                                  green: "bg-priority-green",
                                  black: "bg-priority-black",
                                }[ticket.priority] ?? "bg-slate-500"
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
                          <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-white">
                            <Clock3 className="h-3 w-3 text-slate-400" />
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
            <div className="queue-empty-state px-5 py-8">
              <div className="queue-empty-state-icon">
                <Inbox className="h-7 w-7" />
              </div>
              <div className="font-display text-lg font-bold tracking-tight text-white">
                Queue is clear
              </div>
              <p className="max-w-sm text-sm leading-6 text-slate-400">
                Nobody is waiting in the queue right now. New patients will
                appear here as they register.
              </p>
            </div>
          )}
        </article>

        {/* ─── MISSED TURNS SECTION ─────────────────────── */}
        {missed.length > 0 && (
          <article className="queue-missed-pulse page-section-rise page-section-rise-delay-3 mt-6 mx-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-5 sm:mx-8 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.24em] text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Missed turns
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white">
                  Return to the department desk
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  These token numbers were called but not present. Staff can
                  recall them fairly from the department console.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-200">
                <span className="queue-live-dot queue-live-dot--amber" />
                {missed.length} missed
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {missed.map((ticket) => (
                <div
                  key={ticket.id}
                  className="surface-hover-card group rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400 opacity-60 transition-opacity group-hover:opacity-100" />
                    <div>
                      <div className="font-display text-2xl font-bold tracking-tight text-white">
                        {ticket.ticket}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {ticket.department}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        )}

        {/* Security footer */}
        <div className="mt-6 flex items-center justify-center gap-2 px-5 text-xs text-slate-500 sm:px-8">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-400/60" />
          <span>Secure queue display · Data is real-time and encrypted in transit</span>
        </div>

          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   NOW-SERVING CARD — premium glowing ticket card
   ================================================================ */
function ServingCard({ ticket, justCalled }) {
  const glowClass = PRIORITY_GLOW_CLASS[ticket.priority] ?? "";
  const ribbonClass = PRIORITY_RIBBON_CLASS[ticket.priority] ?? "";

  return (
    <article
      className={`queue-serving-shine surface-hover-card relative rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 ${glowClass} ${priorityChipClass[ticket.priority]} ${justCalled ? "queue-called-flash" : ""}`}
    >
      {/* Priority color ribbon */}
      <div className={`queue-priority-ribbon ${ribbonClass}`} />

      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-300">
          {PRIORITY_META[ticket.priority].short} priority
        </div>
        <Activity className="h-4 w-4 text-slate-400" />
      </div>

      <div className="mt-2 font-display text-6xl font-bold tracking-tight text-white sm:text-7xl">
        {ticket.ticket}
      </div>

      <div className="mt-4 text-sm text-slate-300">Token {ticket.ticket}</div>
      <div className="mt-1 text-xs text-slate-400">{ticket.department}</div>
      {ticket.calledRoom ? (
        <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-teal-400/15 px-3.5 py-2 font-display text-xl font-bold tracking-wide text-teal-200">
          Room {ticket.calledRoom}
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3 text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 uppercase tracking-[0.18em] text-slate-200">
          <span className="queue-status-pulse" />
          {STATUS_META[ticket.status]?.label ?? ticket.status}
        </span>
        <span className="inline-flex items-center gap-1 text-slate-300">
          <Clock3 className="h-3 w-3 text-slate-400" />
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
      className={`surface-hover-card queue-row-accent ${PRIORITY_ROW_ACCENT[ticket.priority] ?? ""} rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4`}
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
            <div className="font-semibold text-white">Token {ticket.ticket}</div>
            <div className="text-xs text-slate-400">
              {ticket.department}
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums text-white">
          <Clock3 className="h-3 w-3 text-slate-400" />
          {ticket.waitMinutes}m
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              {
                red: "bg-priority-red",
                yellow: "bg-priority-yellow",
                green: "bg-priority-green",
                black: "bg-priority-black",
              }[ticket.priority] ?? "bg-slate-500"
            }`}
          />
          {PRIORITY_META[ticket.priority].label}
        </span>
        {ticket.whatsApp && (
          <span className="inline-flex items-center gap-1 text-teal-300">
            <MessageCircle className="h-3 w-3" />
            WhatsApp on
          </span>
        )}
      </div>
    </article>
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
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        {icon && <span className="opacity-60">{icon}</span>}
        {label}
        {liveDot && <span className="queue-live-dot ml-auto" />}
      </div>
      <div className="mt-1 font-display text-3xl font-bold tracking-tight text-white">
        {value}
      </div>
    </div>
  );
}

/* ================================================================
   AUDIO CALL PANEL — text-to-speech announcement controls
   ================================================================ */
function AudioCallPanel({ audio }) {
  if (!audio.supported) {
    return (
      <div className="relative mt-5 rounded-2xl border border-white/12 bg-white/10 p-4">
        <div className="flex items-start gap-3">
          <VolumeX className="mt-0.5 h-5 w-5 shrink-0 text-white/60" />
          <div>
            <div className="font-semibold text-white/80">Audio calls unavailable</div>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              This browser does not support text-to-speech announcements.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-5 rounded-2xl border border-white/12 bg-white/10 p-4">
      <div className="flex items-start gap-3">
        <Volume2 className={`mt-0.5 h-5 w-5 shrink-0 ${audio.enabled ? "text-teal-400" : "text-white/60"} ${audio.isSpeaking ? "animate-pulse" : ""}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-white">Audio announcements</div>
            <button
              type="button"
              onClick={audio.enabled ? audio.disableAudio : audio.enableAudio}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                audio.enabled
                  ? "bg-teal-500/20 text-teal-200 border border-teal-400/30"
                  : "bg-white/10 text-slate-300 border border-white/15"
              }`}
            >
              {audio.enabled ? "Enabled" : "Enable audio"}
            </button>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            {audio.enabled
              ? "Spoken announcements will play when a ticket is called."
              : "Click \"Enable audio\" to hear spoken ticket calls in the waiting area."}
          </p>
          <button
            type="button"
            onClick={() =>
              audio.preview("Ticket Q-047, please proceed to OPD Room 2.")
            }
            disabled={audio.isSpeaking}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/15 px-3.5 py-1.5 text-xs font-semibold text-teal-200 transition-colors hover:bg-teal-500/25 disabled:opacity-50"
          >
            <Volume2 className="h-3.5 w-3.5" />
            {audio.isSpeaking ? "Playing…" : "Hear sample call"}
          </button>
          {audio.enabled && (
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <span className="shrink-0 w-14">Voice</span>
                <select
                  value={audio.selectedVoiceURI ?? ""}
                  onChange={(e) => audio.setSelectedVoiceURI(e.target.value)}
                  className="flex-1 rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-xs text-white outline-none focus:border-teal-400/40"
                >
                  {audio.voices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI} className="bg-slate-800">
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <span className="shrink-0 w-14">Speed</span>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={audio.rate}
                  onChange={(e) => audio.setRate(Number(e.target.value))}
                  className="flex-1 accent-teal-400"
                />
                <span className="shrink-0 w-8 text-right tabular-nums text-slate-300">{audio.rate.toFixed(1)}</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
