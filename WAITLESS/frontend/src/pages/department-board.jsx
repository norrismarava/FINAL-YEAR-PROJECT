import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Calendar,
  Clock3,
  Inbox,
  ShieldCheck,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
  Wifi,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { LoadingPanel } from "@/components/ui/system-loader";
import {
  PRIORITY_META,
  STATUS_META,
  priorityChipClass,
} from "@/services/queueMeta";
import { fetchDepartmentBoard } from "@/services/queueApi";
import { useQueueRealtime } from "@/sockets/QueueRealtimeProvider";
import { useApiResource } from "@/hooks/useApiResource";
import { useAudioCall } from "@/hooks/useAudioCall";
import authBackground from "@/assets/BACKG.png";
import waitlessLogoIcon from "@/assets/waitless-logo-icon.png";

const isBrowser = typeof window !== "undefined";

const LIVE_STATUS_META = {
  connected: { label: "Live sync", className: "bg-priority-green/20 text-priority-green", dot: true },
  connecting: { label: "Connecting", className: "bg-primary-soft text-primary", dot: false },
  reconnecting: { label: "Reconnecting", className: "bg-muted text-muted-foreground", dot: false },
  polling: { label: "Polling fallback", className: "bg-muted text-muted-foreground", dot: false },
  closed: { label: "Offline", className: "bg-muted text-muted-foreground", dot: false },
};

const PRIORITY_GLOW_CLASS = {
  red: "queue-card-pulse-red",
  yellow: "queue-card-pulse-yellow",
  green: "queue-card-pulse-green",
  black: "queue-card-pulse-black",
};

const PRIORITY_RIBBON_CLASS = {
  red: "queue-priority-ribbon--red",
  yellow: "queue-priority-ribbon--yellow",
  green: "queue-priority-ribbon--green",
  black: "queue-priority-ribbon--black",
};

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function DepartmentBoardPage() {
  const [searchParams] = useSearchParams();
  const department = searchParams.get("dept") || "Casualty / Triage";
  const [now, setNow] = useState(new Date());
  const realtime = useQueueRealtime();
  const audio = useAudioCall();
  const lastProcessedEventRef = useRef(null);
  const [justCalledId, setJustCalledId] = useState(null);

  const loadBoard = useCallback(() => fetchDepartmentBoard(department), [department]);
  const queueQuery = useApiResource(loadBoard, { enabled: isBrowser });

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!realtime.lastEvent) return;
    if (lastProcessedEventRef.current === realtime.lastEvent.timestamp) return;
    lastProcessedEventRef.current = realtime.lastEvent.timestamp;

    if (realtime.lastEvent.type === "ticket.called" || realtime.lastEvent.type === "ticket.recalled") {
      const payload = realtime.lastEvent.payload ?? {};
      const ticketCode = payload.ticket ?? "";
      const eventDepartment = payload.department ?? "";
      const room = payload.room ?? "";
      const attempt = Number(payload.attempt ?? 1);
      if (ticketCode && eventDepartment.toLowerCase() === department.toLowerCase()) {
        const destination = room ? `Room ${room}, ${department}` : department;
        const prefix = attempt > 1 ? `Second call. ` : "";
        audio.speak(`${prefix}Ticket ${ticketCode}, please proceed to ${destination}`);
        setJustCalledId(payload.id ?? null);
      }
    }
  }, [realtime.lastEvent, audio, department]);

  useEffect(() => {
    if (!justCalledId) return undefined;
    const id = window.setTimeout(() => setJustCalledId(null), 9000);
    return () => window.clearTimeout(id);
  }, [justCalledId]);

  const serving = queueQuery.data?.nowServing ?? [];
  const waiting = queueQuery.data?.waiting ?? [];
  const missed = queueQuery.data?.missed ?? [];
  const liveMeta = LIVE_STATUS_META[realtime.status] ?? LIVE_STATUS_META.connecting;

  return (
    <section className="relative isolate min-h-screen overflow-hidden px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-20 hidden lg:block">
        <img src={authBackground} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#04141f]/82 via-[#062a35]/72 to-[#0a1f2e]/78" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04141f]/60 via-transparent to-[#04141f]/30" />
      </div>
      <div className="absolute inset-0 -z-10 bg-[#04141f] lg:hidden" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col pb-8">
        <div className="mb-6 flex items-center justify-center gap-3">
          <img src={waitlessLogoIcon} alt="WaitLess" className="h-11 w-11 rounded-lg object-contain" />
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-400">Department display</div>
            <div className="text-sm font-medium text-white/70">{department} · Chinhoyi Provincial Hospital</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-[#04141f]/60 shadow-[0_32px_80px_-28px_rgba(2,8,20,0.45)] backdrop-blur-2xl">
          <div className="relative z-10">
            <header className="track-portal-hero relative overflow-hidden bg-[linear-gradient(135deg,rgba(4,20,31,0.82)_0%,rgba(6,42,53,0.72)_48%,rgba(10,31,46,0.78)_100%)] p-6 text-white sm:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_32%)]" />
              <div className="relative grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <div className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-teal-300">{department}</div>
                  <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                    Department queue board
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                    Real-time queue display for {department}. Shows patients currently being served, waiting, and missed turns.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="rounded-full border border-teal-200/12 bg-teal-100/[0.07] px-3 py-1.5 text-xs font-semibold text-teal-50">
                      {department}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300">
                      Department display mode
                    </span>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-white/10 bg-[linear-gradient(135deg,rgba(4,20,31,0.88),rgba(6,42,53,0.78)_54%,rgba(10,31,46,0.84))] p-5 sm:p-6">
                  <div className="queue-ecg-line" />
                  <div className="relative flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-teal-300/80">Queue status</div>
                      <div className="mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {now.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${liveMeta.className}`}>
                      {liveMeta.dot ? <span className="queue-live-dot" /> : <Wifi className="h-3.5 w-3.5" />}
                      {liveMeta.label}
                    </span>
                  </div>
                  <div className="relative mt-6 grid grid-cols-3 gap-3">
                    <DeptStat icon={<Activity className="h-3.5 w-3.5" />} label="Now serving" value={serving.length} />
                    <DeptStat icon={<Users className="h-3.5 w-3.5" />} label="Waiting" value={waiting.length} />
                    <DeptStat icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Missed" value={missed.length} />
                  </div>

                  <DeptAudioCallPanel audio={audio} department={department} />
                </div>
              </div>
            </header>

            {/* Now Serving */}
            <div className="mt-6 page-section-rise page-section-rise-delay-1 px-5 sm:px-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-teal-300">Now serving</div>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{department} service windows</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300">
                  <Clock3 className="h-3.5 w-3.5" />
                  Live service feed
                </div>
              </div>

              {queueQuery.isLoading ? (
                <LoadingPanel className="mt-4" message="Loading the live queue." title="Loading" />
              ) : queueQuery.isError ? (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-6 text-sm text-red-300">
                  {queueQuery.error.message}
                </div>
              ) : serving.length ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {serving.map((ticket) => (
                    <DeptServingCard
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
                    <div className="font-display text-lg font-bold tracking-tight text-white">No active service</div>
                    <p className="max-w-sm text-sm leading-6 text-slate-400">No patient is currently being served in {department}.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Waiting Queue */}
            <article className="page-section-rise page-section-rise-delay-2 mt-6 mx-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] sm:mx-8">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
                <div>
                  <div className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-teal-300">Up next</div>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Waiting queue</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Patients waiting in {department}, ordered by priority and wait time.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300">
                  <Users className="h-3.5 w-3.5" />
                  {waiting.length} waiting
                </div>
              </div>

              {queueQuery.isLoading ? (
                <LoadingPanel compact className="px-5 py-8 sm:px-6" message="Ordering tickets." surface={false} title="Loading" />
              ) : queueQuery.isError ? (
                <div className="px-5 py-6 text-sm text-red-300 sm:px-6">{queueQuery.error.message}</div>
              ) : waiting.length ? (
                <div className="space-y-3 px-4 py-4 sm:px-6">
                  {waiting.map((ticket, index) => (
                    <DeptWaitingCard key={ticket.id} ticket={ticket} position={index + 1} />
                  ))}
                </div>
              ) : (
                <div className="queue-empty-state px-5 py-8">
                  <div className="queue-empty-state-icon">
                    <Inbox className="h-7 w-7" />
                  </div>
                  <div className="font-display text-lg font-bold tracking-tight text-white">Queue is clear</div>
                  <p className="max-w-sm text-sm leading-6 text-slate-400">Nobody is waiting in {department} right now.</p>
                </div>
              )}
            </article>

            {/* Missed Turns */}
            {missed.length > 0 && (
              <article className="queue-missed-pulse page-section-rise page-section-rise-delay-3 mt-6 mx-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-5 sm:mx-8 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.24em] text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Missed turns
                    </div>
                    <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white">Return to {department} desk</h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-200">
                    <span className="queue-live-dot queue-live-dot--amber" />
                    {missed.length} missed
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {missed.map((ticket) => (
                    <div key={ticket.id} className="surface-hover-card group rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400 opacity-60 transition-opacity group-hover:opacity-100" />
                        <div>
                          <div className="font-display text-2xl font-bold tracking-tight text-white">{ticket.ticket}</div>
                          <div className="mt-1 text-xs text-slate-400">{ticket.department}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            )}

            <div className="mt-6 flex items-center justify-center gap-2 px-5 text-xs text-slate-500 sm:px-8">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-400/60" />
              <span>Secure department display · {department} · Real-time data</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DeptStat({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/12 bg-white/10 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function DeptServingCard({ ticket, justCalled }) {
  const glowClass = PRIORITY_GLOW_CLASS[ticket.priority] ?? "";
  const ribbonClass = PRIORITY_RIBBON_CLASS[ticket.priority] ?? "";
  return (
    <article className={`queue-serving-shine surface-hover-card relative rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 ${glowClass} ${priorityChipClass[ticket.priority]} ${justCalled ? "queue-called-flash" : ""}`}>
      <div className={`queue-priority-ribbon ${ribbonClass}`} />
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-300">
          {PRIORITY_META[ticket.priority].short} priority
        </div>
        <Activity className="h-4 w-4 text-slate-400" />
      </div>
      <div className="mt-2 font-display text-6xl font-bold tracking-tight text-white sm:text-7xl">{ticket.ticket}</div>
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

function DeptWaitingCard({ ticket, position }) {
  return (
    <article className={`surface-hover-card queue-row-accent rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="queue-position-badge text-[10px]">{ordinal(position)}</span>
          <span className={`inline-grid h-10 w-16 place-items-center rounded-xl font-display text-sm font-bold ${priorityChipClass[ticket.priority]}`}>
            {ticket.ticket}
          </span>
          <div>
            <div className="font-semibold text-white">Token {ticket.ticket}</div>
            <div className="text-xs text-slate-400">{ticket.department}</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums text-white">
          <Clock3 className="h-3 w-3 text-slate-400" />
          {ticket.waitMinutes}m
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className={`inline-block h-2 w-2 rounded-full ${{
            red: "bg-priority-red",
            yellow: "bg-priority-yellow",
            green: "bg-priority-green",
            black: "bg-priority-black",
          }[ticket.priority] ?? "bg-slate-500"}`} />
          {PRIORITY_META[ticket.priority].label}
        </span>
      </div>
    </article>
  );
}

function DeptAudioCallPanel({ audio, department }) {
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
              ? `Spoken announcements for ${department} will play when a ticket is called.`
              : `Click "Enable audio" to hear spoken ticket calls for ${department}.`}
          </p>
          <button
            type="button"
            onClick={() =>
              audio.preview(`Ticket Q-047, please proceed to ${department}.`)
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
