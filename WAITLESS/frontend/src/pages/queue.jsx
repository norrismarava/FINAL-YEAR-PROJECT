import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Inbox,
  LogOut,
  MapPin,
  Maximize2,
  MessageCircle,
  Minimize2,
  MoveRight,
  ShieldCheck,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";

import { LoadingPanel } from "@/components/ui/system-loader";
import {
  DEPARTMENTS,
  PRIORITY_META,
  STATUS_META,
  priorityChipClass,
} from "@/services/queueMeta";
import { fetchDepartmentBoard, fetchQueueBoard } from "@/services/queueApi";
import { useAudioCall } from "@/hooks/useAudioCall";
import { useQueueRealtime } from "@/sockets/QueueRealtimeProvider";
import { useApiResource } from "@/hooks/useApiResource";
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

/* ── Demo data for previewing the TV board (?demo=1) ── */
const DEMO_SERVING = [
  { id: "d1", ticket: "A203", department: "Laboratory", calledRoom: "4", calledBy: "Nurse Chikafu", priority: "yellow", status: "called", calledAt: new Date(Date.now() - 30_000).toISOString(), waitMinutes: 22 },
  { id: "d2", ticket: "B147", department: "Casualty / Triage", calledRoom: "2", calledBy: "Sister Moyo", priority: "red", status: "in-service", calledAt: new Date(Date.now() - 240_000).toISOString(), waitMinutes: 9 },
  { id: "d3", ticket: "C081", department: "Pharmacy", calledRoom: "1", calledBy: "T. Mukono", priority: "green", status: "in-service", calledAt: new Date(Date.now() - 480_000).toISOString(), waitMinutes: 17 },
  { id: "d4", ticket: "D019", department: "Radiology", calledRoom: "5", calledBy: "Dr. Ndlovu", priority: "green", status: "in-service", calledAt: new Date(Date.now() - 600_000).toISOString(), waitMinutes: 14 },
];
const DEMO_WAITING = [
  { id: "w1", ticket: "A204", department: "Laboratory", priority: "yellow", status: "waiting", waitMinutes: 18 },
  { id: "w2", ticket: "A205", department: "Laboratory", priority: "green", status: "waiting", waitMinutes: 11 },
  { id: "w6", ticket: "A206", department: "Laboratory", priority: "green", status: "waiting", waitMinutes: 9 },
  { id: "w3", ticket: "B148", department: "Casualty / Triage", priority: "green", status: "waiting", waitMinutes: 8 },
  { id: "w4", ticket: "C082", department: "Pharmacy", priority: "green", status: "waiting", waitMinutes: 6 },
  { id: "w5", ticket: "D020", department: "Radiology", priority: "green", status: "waiting", waitMinutes: 4 },
];
const DEMO_MISSED = [
  { id: "m1", ticket: "A199", department: "Laboratory", priority: "green", status: "missed", waitMinutes: 41 },
  { id: "m2", ticket: "B142", department: "Casualty / Triage", priority: "yellow", status: "missed", waitMinutes: 36 },
];

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
  const [searchParams, setSearchParams] = useSearchParams();
  const department = searchParams.get("dept") ?? "";
  const boardMode = searchParams.get("display") === "tv";

  const updateParams = useCallback(
    (patch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const enterBoard = useCallback(() => updateParams({ display: "tv" }), [updateParams]);
  const exitBoard = useCallback(() => updateParams({ display: null }), [updateParams]);

  const loadQueueBoard = useCallback(
    () => (department ? fetchDepartmentBoard(department) : fetchQueueBoard()),
    [department],
  );
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

    if (realtime.lastEvent.type === "ticket.called" || realtime.lastEvent.type === "ticket.recalled") {
      const payload = realtime.lastEvent.payload ?? {};
      const ticketCode = payload.ticket ?? "";
      const department = payload.department ?? "";
      const room = payload.room ?? "";
      const attempt = Number(payload.attempt ?? 1);
      if (ticketCode) {
        // Voice mirrors the on-screen instruction exactly:
        // "PROCEED TO ROOM 4" or "PROCEED TO LABORATORY"
        const destination = room
          ? `Room ${room}`
          : department || "the service desk";
        const prefix = attempt > 1 ? `Second call. ` : "";
        audio.speak(`${prefix}Ticket ${ticketCode}, please proceed to ${destination}`);
        setJustCalledId(payload.id ?? null);
      }
    }
  }, [realtime.lastEvent, audio]);

  // TV board: auto-enable spoken announcements (Google US English) so
  // the display works without any manual setup
  useEffect(() => {
    if (!boardMode || !audio.supported) return;
    if (!audio.enabled) audio.enableAudio();
    const preferred = audio.voices.find((v) => /google us english/i.test(v.name));
    if (preferred && audio.selectedVoiceURI !== preferred.voiceURI) {
      audio.setSelectedVoiceURI(preferred.voiceURI);
    }
  }, [boardMode, audio]);

  useEffect(() => {
    if (!justCalledId) return undefined;
    const id = window.setTimeout(() => setJustCalledId(null), 9000);
    return () => window.clearTimeout(id);
  }, [justCalledId]);

  // Esc exits TV board mode
  useEffect(() => {
    if (!boardMode) return undefined;
    function onKey(e) {
      if (e.key === "Escape") exitBoard();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [boardMode, exitBoard]);

  const isDemo = searchParams.get("demo") === "1";
  const byDept = (list) =>
    department ? list.filter((t) => t.department === department) : list;
  const serving = isDemo ? byDept(DEMO_SERVING) : (queueQuery.data?.nowServing ?? []);
  const waiting = isDemo ? byDept(DEMO_WAITING) : (queueQuery.data?.waiting ?? []);
  const missed = isDemo ? byDept(DEMO_MISSED) : (queueQuery.data?.missed ?? []);

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
            <button
              type="button"
              onClick={enterBoard}
              className="absolute right-0 top-0 inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-400/10 px-4 py-2 text-xs font-semibold text-teal-200 transition hover:border-teal-300/50 hover:bg-teal-400/20"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              TV display
            </button>
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
                  {department ? `${department} waiting area` : "Waiting area display"}
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

      {boardMode ? (
        <QueueBoardDisplay
          audio={audio}
          serving={serving}
          waiting={waiting}
          missed={missed}
          justCalledId={justCalledId}
          now={now}
          totalWaiting={isDemo ? waiting.length : (queueQuery.data?.totalWaiting ?? waiting.length)}
          avgServiceTimeMinutes={isDemo ? 11 : (queueQuery.data?.avgServiceTimeMinutes ?? null)}
          department={department}
          onDepartmentChange={(dept) => updateParams({ dept: dept || null })}
          onExit={exitBoard}
        />
      ) : null}
    </section>
  );
}

/* ================================================================
   TV BOARD DISPLAY — fullscreen waiting-area signage (Qmatic-style).
   Giant "now calling" panel + serving/next lists + missed ticker.
   ================================================================ */
function QueueBoardDisplay({ audio, serving, waiting, missed, justCalledId, now, totalWaiting, avgServiceTimeMinutes, department, onDepartmentChange, onExit }) {
  const [tipIndex, setTipIndex] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setTipIndex((i) => (i + 1) % HEALTH_TIPS.length), 9000);
    return () => clearInterval(id);
  }, []);

  // QR to the public tracking page — patients scan and follow on their phone
  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/track`, {
      width: 160,
      margin: 1,
      color: { dark: "#5eead4", light: "#00000000" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, []);

  // Most recently called ticket wins the hero panel
  const nowCalling =
    serving.find((t) => t.id === justCalledId) ??
    [...serving].sort((a, b) => new Date(b.calledAt ?? 0) - new Date(a.calledAt ?? 0))[0] ??
    null;
  const otherServing = serving.filter((t) => t.id !== nowCalling?.id);
  const upNext = waiting.slice(0, 6);
  const tip = HEALTH_TIPS[tipIndex];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#030f18] text-white">
      <style>{`
        @keyframes boardFlash { 0%,100% { box-shadow: 0 0 0 rgba(45,212,191,0); } 50% { box-shadow: 0 0 90px rgba(45,212,191,0.45); } }
        @keyframes boardDot { 0%,100% { opacity: 1; } 50% { opacity: .25; } }
        @keyframes boardTipIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes boardCursor { 0%,45% { opacity: 1; } 50%,95% { opacity: 0; } }
        @keyframes waveBar { 0%,100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
      `}</style>

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between gap-6 border-b border-white/10 bg-[#051a28] px-8 py-3">
        <div className="flex items-center gap-4">
          <img src={waitlessLogoIcon} alt="WaitLess" className="h-11 w-11 rounded-xl object-contain" />
          <div>
            <div className="text-xl font-bold tracking-tight">Chinhoyi Provincial Hospital</div>
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-teal-400">
              {department ? `${department} · waiting area` : "Live queue board · all departments"}
            </div>
          </div>
        </div>
        {department ? (
          <div className="ml-6 flex items-center gap-2.5 border-b border-teal-300/25 pb-1">
            <MapPin className="h-5 w-5 shrink-0 text-teal-300" strokeWidth={2.2} />
            <div className="leading-tight">
              <div className="font-display text-xl font-bold text-white">
                {department} <span className="font-semibold text-teal-300/90">· Waiting area</span>
              </div>
            </div>
          </div>
        ) : null}
        <div className="ml-auto flex items-center gap-5">
          {/* dept switcher — underlined label field, whole area opens the list */}
          <div className="relative flex items-center gap-2.5 border-b border-teal-300/25 pb-1 transition hover:border-teal-300/60">
            <MapPin className="h-4 w-4 shrink-0 text-teal-300" />
            <div className="leading-tight">
              <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400">
                Department
              </div>
              <div className="font-display text-base font-bold text-teal-100">
                {department || "All departments"}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-teal-300/80" />
            <select
              value={department}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 [&>option]:bg-[#051a28] [&>option]:text-white"
              title="Department this screen shows"
            >
              <option value="">All departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-bold tabular-nums leading-none">
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
              {now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="group inline-flex items-center gap-2 rounded-full border border-rose-300/25 bg-rose-500/[0.08] px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-rose-300/60 hover:bg-rose-500/[0.16] hover:text-white hover:shadow-[0_0_20px_-5px_rgba(251,113,133,0.5)]"
            title="Exit display mode (Esc)"
          >
            <LogOut className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" /> Exit
          </button>
        </div>
      </header>

      {/* ── Main grid ── */}
      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1.6fr_1fr]">
        {/* NOW CALLING hero + health tip */}
        <div className="flex min-h-0 flex-col border-b border-white/10 lg:border-b-0 lg:border-r">
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-8 pb-3">
            <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.35em] text-teal-300">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-400" style={{ animation: "boardDot 1.6s ease-in-out infinite" }} />
              Now calling · Ticket number
            </div>
          {nowCalling ? (
            <>
              <div
                className={`mt-6 rounded-[2rem] border-2 px-14 py-7 text-center ${
                  justCalledId === nowCalling.id
                    ? "border-teal-300/70 bg-teal-400/10 shadow-[0_0_60px_-10px_rgba(45,212,191,0.5),inset_0_0_40px_-20px_rgba(45,212,191,0.4)]"
                    : "border-white/10 bg-white/[0.04]"
                }`}
                style={justCalledId === nowCalling.id ? { animation: "boardFlash 1.8s ease-in-out infinite" } : undefined}
              >
                <div className="font-display font-bold leading-none tracking-tight text-teal-100" style={{ fontSize: "clamp(5rem, 12vw, 11rem)" }}>
                  {nowCalling.ticket}
                </div>
                <div className="mt-4 flex items-center justify-center gap-3 text-2xl font-bold text-white sm:text-3xl">
                  <MoveRight
                    className="h-9 w-9 shrink-0 text-lime-400 drop-shadow-[0_0_12px_rgba(163,230,53,0.9)]"
                    strokeWidth={3}
                  />
                  <span className="uppercase tracking-wide">
                    Proceed to{" "}
                    {nowCalling.calledRoom ? (
                      <span className="text-amber-300">Room {nowCalling.calledRoom}</span>
                    ) : (
                      <span className="text-teal-300">{nowCalling.department}</span>
                    )}
                  </span>
                </div>
                {nowCalling.calledRoom ? (
                  <div className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Please go to the room shown above
                  </div>
                ) : null}
                {nowCalling.calledAt && now - new Date(nowCalling.calledAt) < 90_000 ? (
                  <div className="mt-4 flex items-center justify-center gap-3 text-teal-300">
                    <AudioWaveformBars />
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em]">
                      <Volume2 className="h-4 w-4" /> Audio announced
                    </span>
                    <AudioWaveformBars mirrored />
                  </div>
                ) : null}
              </div>
              <div className="mt-6 max-w-xl text-center text-lg text-slate-400">
                Please proceed to the service point now
              </div>
            </>
          ) : (
            <div className="mt-10 max-w-lg text-center">
              <div className="font-display text-5xl font-bold tracking-tight text-slate-300 sm:text-6xl">
                Please take a seat
              </div>
              <p className="mt-6 text-xl leading-8 text-slate-400">
                Your ticket number will appear here when it is called.
                {department ? ` This screen shows the ${department} queue.` : ""}
              </p>
            </div>
          )}
          </div>

          {/* Health tip — pinned bottom-left, always visible */}
          <div className="px-7 pb-6">
            <div
              key={tipIndex}
              className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] px-6 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              style={{ animation: "boardTipIn 0.7s ease-out" }}
            >
              {/* soft accent bar on the left edge */}
              <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-teal-300/70 via-teal-400/40 to-transparent" />
              <div className="flex items-center gap-2.5 pl-2 text-[10px] font-bold uppercase tracking-[0.34em] text-teal-300/90">
                <span className="text-xl leading-none">{tip.icon}</span>
                Health tip · <TypewriterText text={tip.title} speed={70} />
              </div>
              <p className="mt-2 pl-2 font-mono text-[13.5px] leading-6 text-slate-200/90">
                <TypewriterText text={tip.content} speed={55} cursor />
              </p>
            </div>
          </div>
        </div>

        {/* Right column — now serving + up next */}
        <div className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden border-b border-white/10 p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-teal-300">Live room status</div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {serving.length} service point{serving.length === 1 ? "" : "s"} active
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 overflow-y-auto" style={{ maxHeight: "42vh" }}>
              {otherServing.length ? (
                otherServing.map((t) => (
                  <div key={t.id} className="rounded-2xl border border-teal-300/15 bg-[#061e2c] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      {t.calledRoom ? `Room ${t.calledRoom}` : "Service point"} · {t.department}
                    </div>
                    <div className="mt-1.5 font-display text-3xl font-bold tracking-tight text-white">
                      {t.ticket}
                    </div>
                    <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.15em] text-teal-300">
                      {t.status === "called" ? "Called — on the way" : "In service"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 rounded-2xl border border-dashed border-white/10 px-5 py-6 text-center text-sm text-slate-500">
                  No other patients in service
                </div>
              )}
            </div>
          </div>
          <div className="p-5">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
              Upcoming queue{avgServiceTimeMinutes ? " & wait estimates" : ""}
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {upNext.length ? (
                upNext.map((t, index) => (
                  <span key={t.id} className={`flex flex-col items-center rounded-xl px-4 py-2 ${priorityChipClass[t.priority]}`}>
                    <span className="font-display text-2xl font-bold leading-none">{t.ticket}</span>
                    {avgServiceTimeMinutes ? (
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-80">
                        est ~{Math.max(1, Math.round((index + 1) * avgServiceTimeMinutes))}m
                      </span>
                    ) : null}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">Queue is clear</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom strip: missed + health tip ── */}
      <footer className="border-t border-white/10 bg-[#051a28] px-8 py-3.5">
        <div className="flex items-center gap-8 overflow-hidden">
          {missed.length ? (
            <div className="flex shrink-0 items-center gap-3 text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Missed — report to reception:</span>
              <span className="text-sm font-bold tracking-wide">
                {missed.slice(0, 5).map((t) => t.ticket).join("  ·  ")}
                {missed.length > 5 ? `   +${missed.length - 5} more` : ""}
              </span>
            </div>
          ) : null}
          {audio?.supported ? (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={audio.enabled ? audio.disableAudio : audio.enableAudio}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                  audio.enabled
                    ? "border-teal-300/30 bg-teal-500/[0.12] text-teal-200 hover:border-teal-300/60"
                    : "border-white/15 bg-white/[0.06] text-slate-400 hover:border-white/40 hover:text-white"
                }`}
                title={audio.enabled ? "Mute spoken announcements" : "Enable spoken announcements"}
              >
                {audio.enabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                {audio.enabled ? "Audio on" : "Audio off"}
              </button>
              {audio.enabled ? (
                <select
                  value={audio.selectedVoiceURI ?? ""}
                  onChange={(e) => audio.setSelectedVoiceURI(e.target.value)}
                  className="max-w-[13rem] cursor-pointer rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 outline-none transition hover:border-white/40 [&>option]:bg-[#051a28] [&>option]:text-white"
                  title="Announcement voice"
                >
                  {audio.voices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          ) : null}
          <div className="ml-auto flex items-center gap-6">
            <div className="text-sm text-slate-400">
              Total waiting: <span className="font-bold text-white">{totalWaiting}</span>
              {avgServiceTimeMinutes ? (
                <> · Avg wait: <span className="font-bold text-teal-300">~{Math.round(avgServiceTimeMinutes)} min</span></>
              ) : null}
            </div>
            {qrDataUrl ? (
              <div className="flex items-center gap-2.5">
                <div className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Scan for live queue<br />on your smartphone
                </div>
                <img src={qrDataUrl} alt="Scan to track your queue on your phone" className="h-12 w-12 rounded-md ring-1 ring-white/15" />
              </div>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
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

/* -- Animated audio waveform � flanks the "AUDIO ANNOUNCED" label -- */
function AudioWaveformBars({ mirrored = false }) {
  const bars = [0.5, 0.9, 1.35, 0.7, 1.1, 0.6, 1.25, 0.8];
  return (
    <span
      className="flex items-center gap-[3px]"
      style={mirrored ? { transform: "scaleX(-1)" } : undefined}
    >
      {bars.map((dur, i) => (
        <span
          key={i}
          className="inline-block w-[3px] rounded-full bg-teal-300/90"
          style={{
            height: `${8 + (i % 3) * 6}px`,
            animation: `waveBar ${dur}s ease-in-out ${i * 0.12}s infinite`,
          }}
        />
      ))}
    </span>
  );
}


/* ================================================================
   TYPEWRITER � types text out character by character with a
   blinking block cursor (used by the board health tip).
   ================================================================ */
function TypewriterText({ text, speed = 20, cursor = false }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    const id = setInterval(() => {
      setCount((current) => {
        if (current >= text.length) {
          clearInterval(id);
          return current;
        }
        return current + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return (
    <>
      {text.slice(0, count)}
      <span
        className="inline-block w-[0.5em] text-teal-300"
        style={{ animation: count < text.length ? "none" : "boardCursor 1.1s step-end infinite" }}
      >
        {cursor || count < text.length ? "?" : ""}
      </span>
    </>
  );
}


