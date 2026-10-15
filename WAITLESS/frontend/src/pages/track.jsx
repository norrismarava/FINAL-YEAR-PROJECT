import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BellRing,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  IdCard,
  Info,
  MapPin,
  MessageCircle,
  PhoneCall,
  Printer,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  UserRound,
  Wifi,
  X,
} from "lucide-react";

import authBackground from "@/assets/BACKG.png";
import waitlessLogoIcon from "@/assets/waitless-logo-icon.png";
import { LoadingPanel } from "@/components/ui/system-loader";
import { useLiveRefresh } from "@/context/LiveRefreshContext";
import {
  DEPARTMENTS,
  PRIORITY_META,
  STATUS_META,
  priorityChipClass,
} from "@/services/queueMeta";
import { fetchQueueBoard, fetchTicketTracking, submitFeedback } from "@/services/queueApi";
import { useQueueRealtime } from "@/sockets/QueueRealtimeProvider";
import { useApiAction, useApiResource } from "@/hooks/useApiResource";

const isBrowser = typeof window !== "undefined";

const LIVE_STATUS_META = {
  connected: {
    label: "LIVE",
    className: "bg-emerald-500/12 text-emerald-300",
  },
  connecting: {
    label: "CONNECTING",
    className: "bg-white/10 text-slate-200",
  },
  reconnecting: {
    label: "RECONNECTING",
    className: "bg-white/10 text-slate-200",
  },
  polling: {
    label: "POLLING",
    className: "bg-white/10 text-slate-200",
  },
  closed: {
    label: "OFFLINE",
    className: "bg-rose-500/12 text-rose-200",
  },
};

const TRACK_STEPS = ["registered", "waiting", "called", "in-service", "completed"];

const PATIENT_SUPPORT_CONTACTS = [
  {
    icon: PhoneCall,
    label: "Reception",
    detail: "+263 67 212 2201",
    href: "tel:+263672122201",
  },
  {
    icon: MapPin,
    label: "Where to go",
    detail: "Return to the front desk or department window",
  },
  {
    icon: MessageCircle,
    label: "Alerts",
    detail: "WhatsApp and board updates stay in sync",
  },
];

const TRACKER_HINTS = [
  "Queue position updates live",
  "WhatsApp notifications mirrored here",
  "Department activity shown in real time",
];

export default function TrackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const realtime = useQueueRealtime();
  const { refreshLiveData } = useLiveRefresh();
  const ticketCode = (searchParams.get("ticket") ?? "").trim().toUpperCase();
  const [ticketInput, setTicketInput] = useState(ticketCode);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState(new Date());
  const liveMeta = LIVE_STATUS_META[realtime.status] ?? LIVE_STATUS_META.connecting;

  const loadTicketTracking = useCallback(
    () => fetchTicketTracking(ticketCode),
    [ticketCode],
  );

  const trackingQuery = useApiResource(loadTicketTracking, {
    enabled: isBrowser && Boolean(ticketCode),
  });

  const loadQueueBoard = useCallback(() => fetchQueueBoard(), []);
  const queueBoardQuery = useApiResource(loadQueueBoard, {
    enabled: isBrowser,
  });

  const departmentSummary = (() => {
    if (!selectedDepartment || !queueBoardQuery.data) return null;
    const deptWaiting = queueBoardQuery.data.waiting.filter(
      (t) => t.department === selectedDepartment,
    );
    const deptServing = queueBoardQuery.data.nowServing.filter(
      (t) => t.department === selectedDepartment,
    );
    const deptMissed = queueBoardQuery.data.missed.filter(
      (t) => t.department === selectedDepartment,
    );
    const nowServingTicket = deptServing[0]?.ticket ?? "N/A";
    const estimatedWait = deptWaiting.length > 0
      ? `${Math.max(5, deptWaiting.length * 8)}m`
      : "0m";
    return {
      department: selectedDepartment,
      waiting: deptWaiting.length,
      nowServing: nowServingTicket,
      missed: deptMissed.length,
      estimatedWait,
    };
  })();

  useEffect(() => {
    setTicketInput(ticketCode);
  }, [ticketCode]);

  useEffect(() => {
    if (trackingQuery.data || realtime.lastEventAt) {
      setLastSyncAt(
        realtime.lastEventAt ? new Date(realtime.lastEventAt) : new Date(),
      );
    }
  }, [realtime.lastEventAt, trackingQuery.data]);

  function submit(event) {
    event.preventDefault();
    const nextTicket = ticketInput.trim().toUpperCase();
    navigate(nextTicket ? `/track?ticket=${encodeURIComponent(nextTicket)}` : "/track");
  }

  const portalData =
    ticketCode && !trackingQuery.isError ? trackingQuery.data : null;
  const isRefreshing = trackingQuery.isLoading;

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

      {/* Mobile solid background */}
      <div className="absolute inset-0 -z-10 bg-[#04141f] lg:hidden" />

      {isRefreshing ? (
        <div className="track-loading-bar absolute inset-x-0 top-0 z-50 h-1 overflow-hidden">
          <div className="track-loading-bar-fill h-full w-full" />
        </div>
      ) : null}

      <div className="relative mx-auto flex w-full max-w-7xl flex-col pb-8">
        <div className="relative overflow-hidden rounded-2xl bg-[#04141f]/80 bg-[linear-gradient(135deg,rgba(4,20,31,0.82)_0%,rgba(6,42,53,0.72)_48%,rgba(10,31,46,0.78)_100%)] shadow-[0_32px_80px_-28px_rgba(2,8,20,0.50)] backdrop-blur-2xl">
          {/* Circulating gradient ribbon */}
          

          {/* Content above ribbon */}
          <div className="relative z-10">
          <div className="track-portal-hero relative overflow-hidden text-white">
            <div className="pt-6 text-center">
              <img
                src={waitlessLogoIcon}
                alt="WaitLess"
                className="mx-auto h-12 w-12 rounded-xl object-contain drop-shadow-[0_0_14px_rgba(45,212,191,0.4)]"
              />
              <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-teal-400">User portal</div>
            </div>

            <PortalLiveBar
              isRefreshing={isRefreshing}
              lastSyncAt={lastSyncAt}
              liveMeta={liveMeta}
              onRefresh={refreshLiveData}
            />

            <div className="relative px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
              <PortalHero
                data={portalData}
                isLoading={trackingQuery.isLoading}
                ticketCode={ticketCode}
                ticketInput={ticketInput}
                setTicketInput={setTicketInput}
                onSubmit={submit}
                selectedDepartment={selectedDepartment}
                setSelectedDepartment={setSelectedDepartment}
                departmentSummary={departmentSummary}
              />
            </div>
          </div>

          <div>
            {portalData ? (
              <JourneyProgressStrip ticket={portalData.ticket} queue={portalData.queue} />
            ) : ticketCode && trackingQuery.isLoading ? (
              <InlineLoaderStrip />
            ) : ticketCode && trackingQuery.isError ? (
              <InlineErrorStrip message={trackingQuery.error.message} />
            ) : (
              <InlineHintStrip />
            )}
          </div>
          </div>
        </div>

        <div className="mt-6 flex-1">
          {!ticketCode ? (
            <EmptyTrackingState />
          ) : trackingQuery.isLoading && !trackingQuery.data ? (
            <LoadingPanel
              message="Checking your queue position, department activity, and ticket alerts."
              title="Opening your user portal"
            />
          ) : trackingQuery.isError ? (
            <ErrorState message={trackingQuery.error.message} />
          ) : trackingQuery.data ? (
            <TrackingResults data={trackingQuery.data} />
          ) : (
            <EmptyTrackingState />
          )}
        </div>
      </div>

      <PortalHelpButton />
    </section>
  );
}

function PortalLiveBar({ isRefreshing, lastSyncAt, liveMeta, onRefresh }) {
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  return (
    <div className="relative border-b border-white/10 px-5 py-4 sm:px-8 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-teal-200/15 bg-teal-300/10 text-teal-200">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.26em] text-teal-100/75">
              User queue portal
              <span className="track-live-dot" />
            </div>
            <div className="mt-1 text-xs text-slate-300">
              Synced {formatTime(lastSyncAt)} · {clock.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.68rem] font-bold tracking-[0.2em] ${liveMeta.className}`}
            aria-live="polite"
          >
            <Wifi className="h-3.5 w-3.5" />
            {liveMeta.label}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 text-xs font-semibold text-white transition hover:bg-white/[0.12] disabled:opacity-60"
            title="Refresh ticket status"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PortalHero({
  data,
  isLoading,
  ticketCode,
  ticketInput,
  setTicketInput,
  onSubmit,
  selectedDepartment,
  setSelectedDepartment,
  departmentSummary,
}) {
  if (!data) {
    return (
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_23rem] xl:items-start">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-[0.8rem] font-semibold uppercase tracking-[0.34em] text-teal-100/70">
            <Sparkles className="h-4 w-4 text-teal-300" />
            WaitLess ticket tracking
          </div>
          <h1 className="mt-5 text-balance font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.55rem]">
            Follow a live hospital ticket from registration to completion.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Search with the exact queue code to open the patient view, watch
            department movement, and keep WhatsApp alerts aligned with what staff see.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {TRACKER_HINTS.map((item) => (
              <span
                key={item}
                className="rounded-full border border-teal-200/12 bg-teal-100/[0.07] px-3 py-1.5 text-xs font-semibold text-teal-50"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <HeroInfoCard label="Example ticket" value={ticketCode || "G-105"} />
            <HeroInfoCard label="Estimated wait" value={isLoading ? "..." : "18m"} />
            <HeroInfoCard label="Queue position" value={isLoading ? "..." : "#4"} />
          </div>
        </div>

        <LookupCard
          ticketInput={ticketInput}
          setTicketInput={setTicketInput}
          onSubmit={onSubmit}
          snapshot={[
            ["Dept. waiting", departmentSummary ? String(departmentSummary.waiting) : "--"],
            ["Hospital-wide", "--"],
            ["Active in dept.", "--"],
            ["Registered at", "--"],
          ]}
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
          departmentSummary={departmentSummary}
        />
      </div>
    );
  }

  const { ticket, queue } = data;
  const statusLabel = STATUS_META[ticket.status]?.label ?? ticket.status;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.12fr)_auto_24rem] xl:items-start">
      <div className="min-w-0">
        <div className="text-[0.8rem] font-semibold uppercase tracking-[0.38em] text-teal-100/70">
          Ticket · {ticket.department.toUpperCase()}
        </div>

        <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="inline-flex h-[5rem] min-w-[7.2rem] items-center justify-center rounded-[1.25rem] border border-white/10 bg-white/[0.06] px-4 font-display text-[2rem] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            {ticket.ticket}
          </div>

          <div className="min-w-0">
            <h1 className="text-balance font-serif text-[2.85rem] italic leading-none text-white sm:text-[3.45rem]">
              {ticket.patientName}
            </h1>

            <div className="mt-5 flex flex-wrap gap-2">
              <HeroPill accent>{statusLabel.toUpperCase()}</HeroPill>
              <HeroPill>{getPortalPriorityLabel(ticket.priority)}</HeroPill>
              <HeroPill>{ticket.whatsApp ? "WhatsApp linked" : "Board linked"}</HeroPill>
            </div>
          </div>
        </div>
      </div>

      <HeroMetrics ticket={ticket} queue={queue} />

      <LookupCard
        ticketInput={ticketInput}
        setTicketInput={setTicketInput}
        onSubmit={onSubmit}
        snapshot={[
          ["Dept. waiting", `${queue.totalWaitingInDepartment}`],
          ["Hospital-wide", `${queue.totalWaitingOverall}`],
          ["Active in dept.", `${queue.activeInDepartment.length}`],
          ["Registered at", formatTime(ticket.registeredAt)],
        ]}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        departmentSummary={departmentSummary}
      />
    </div>
  );
}

function LookupCard({ ticketInput, setTicketInput, onSubmit, snapshot, selectedDepartment, setSelectedDepartment, departmentSummary }) {
  return (
    <div className="border-t border-white/10 pt-6 xl:border-0 xl:pt-0">
      <div className="text-[0.8rem] font-semibold uppercase tracking-[0.34em] text-slate-400">
        Ticket lookup
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Department
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full rounded-[1.05rem] border border-white/10 bg-white/[0.08] px-4 py-3 text-sm font-semibold text-white outline-none transition-colors focus:border-teal-300/35 [&>option]:bg-[#062a35] [&>option]:text-white"
          >
            <option value="">Select a department</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={ticketInput}
              onChange={(event) => setTicketInput(event.target.value.toUpperCase())}
              placeholder="G-105"
              className="w-full rounded-[1.05rem] border border-white/10 bg-white/[0.08] px-11 py-3.5 text-base font-semibold text-white outline-none transition-colors placeholder:text-slate-400 focus:border-teal-300/35"
            />
            {ticketInput ? (
              <button
                type="button"
                onClick={() => setTicketInput("")}
                className="absolute right-3 top-1/2 inline-grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Clear ticket code"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-[1.05rem] bg-[linear-gradient(135deg,#0d9488,#14b8a6_50%,#0f766e)] px-4 py-3.5 text-base font-semibold text-white shadow-[0_24px_48px_-28px_rgba(13,148,136,0.74)] transition-[transform,filter] hover:-translate-y-0.5 hover:brightness-110"
          >
            Search
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>

      {departmentSummary ? (
        <div className="mt-5 rounded-[1.05rem] border border-teal-200/12 bg-teal-100/[0.06] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-100/80">
            <MapPin className="h-3.5 w-3.5" />
            {departmentSummary.department}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Waiting</div>
              <div className="mt-0.5 font-display text-xl font-bold text-white">{departmentSummary.waiting}</div>
            </div>
            <div>
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Now serving</div>
              <div className="mt-0.5 font-display text-xl font-bold text-white">{departmentSummary.nowServing}</div>
            </div>
            <div>
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Est. wait</div>
              <div className="mt-0.5 font-display text-xl font-bold text-white">{departmentSummary.estimatedWait}</div>
            </div>
            <div>
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Missed</div>
              <div className="mt-0.5 font-display text-xl font-bold text-white">{departmentSummary.missed}</div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <div className="text-[0.8rem] font-semibold uppercase tracking-[0.34em] text-slate-400">
          Queue snapshot
        </div>

        <div className="mt-4 space-y-4 text-sm">
          {snapshot.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <span className="text-slate-300">{label}</span>
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroInfoCard({ label, value }) {
  return (
    <div className="rounded-[1.2rem] border border-teal-200/12 bg-teal-100/[0.07] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur">
      <div className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 font-display text-[2.1rem] font-bold tracking-tight text-white">
        {value}
      </div>
    </div>
  );
}

function HeroPill({ accent = false, children }) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-bold tracking-[0.12em] ${
        accent
          ? "bg-teal-50 text-[#0f766e] shadow-[0_8px_24px_-16px_rgba(45,212,191,0.9)]"
          : "border border-teal-200/10 bg-white/[0.08] text-slate-200"
      }`}
    >
      {children}
    </span>
  );
}

function HeroMetrics({ ticket, queue }) {
  return (
    <div className="flex items-end gap-7 xl:self-center">
      <MetricBlock
        value={getHeroPositionValue(ticket, queue)}
        label="Queue position"
        bright
      />
      <MetricDivider />
      <MetricBlock
        value={getHeroWaitValue(ticket, queue)}
        label="Est. wait"
        accent
      />
    </div>
  );
}

function MetricBlock({ value, label, accent = false, bright = false }) {
  return (
    <div className="text-center xl:text-left">
      <div
        className={`font-display text-[4.6rem] font-bold leading-none tracking-tight sm:text-[5.25rem] ${
          accent
            ? "bg-gradient-to-br from-teal-200 to-teal-400 bg-clip-text text-transparent"
            : bright
              ? "text-white"
              : "text-slate-200"
        }`}
      >
        {value}
      </div>
      <div className="mt-3 text-[0.8rem] font-semibold uppercase tracking-[0.38em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

function MetricDivider() {
  return <div className="hidden h-24 w-px bg-white/12 xl:block" />;
}

function JourneyProgressStrip({ ticket, queue }) {
  const progressStep = getCurrentProgressStep(ticket.status);
  const progressSteps = buildProgressSteps(ticket, queue);
  const currentIndex = TRACK_STEPS.indexOf(progressStep);

  return (
    <div className="border-t border-white/10 px-5 py-6 sm:px-8 lg:px-10">
      <div className="flex items-center justify-between gap-4">
        <div className="text-[0.8rem] font-semibold uppercase tracking-[0.34em] text-slate-400">
          Journey progress
        </div>
        <div className="text-sm text-slate-400">
          Step {currentIndex + 1} / {progressSteps.length}
        </div>
      </div>

      <div className="mt-7 overflow-x-auto pb-2">
        <div className="relative min-w-[760px]">
          <div className="absolute left-[10%] right-[10%] top-4 h-px bg-slate-200" />
          <div
            className="absolute left-[10%] top-4 h-1 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#0d9488,#14b8a6,#0f766e)] shadow-[0_0_18px_rgba(13,148,136,0.3)] transition-[width] duration-700 ease-out"
            style={{ width: `${currentIndex * 20}%` }}
          />

          <div className="grid grid-cols-5 gap-3">
            {progressSteps.map((step, index) => (
              <JourneyNode
                key={step.key}
                step={step}
                index={index}
                isCurrent={progressStep === step.key}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function JourneyNode({ step, index, isCurrent }) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div
        className={`relative z-10 inline-grid h-9 w-9 place-items-center rounded-full border text-sm ${
          step.state === "complete"
            ? "border-teal-500 bg-teal-600 text-white shadow-[0_8px_20px_-12px_rgba(13,148,136,0.7)]"
            : step.state === "current"
              ? "border-teal-500 bg-[linear-gradient(135deg,#0f766e,#0d9488)] text-white shadow-[0_0_0_6px_rgba(13,148,136,0.1),0_12px_28px_-14px_rgba(13,148,136,0.8)]"
              : "border-white/20 bg-white/[0.06] text-slate-400"
        }`}
      >
        <ProgressStepIcon stepKey={step.key} state={step.state} index={index} />
      </div>

      <div className="mt-4 text-base font-semibold text-white">{step.label}</div>
      {isCurrent ? (
        <span className="mt-2 rounded-full bg-[linear-gradient(135deg,#0f766e,#0d9488)] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-white shadow-[0_10px_20px_-14px_rgba(13,148,136,0.8)]">
          Now
        </span>
      ) : null}
    </div>
  );
}

function ProgressStepIcon({ stepKey, state, index }) {
  if (state === "complete") {
    return <Check className="h-4 w-4" />;
  }

  if (stepKey === "waiting") {
    return <Clock3 className="h-4 w-4" />;
  }

  if (stepKey === "called") {
    return <BellRing className="h-4 w-4" />;
  }

  if (stepKey === "in-service") {
    return <Activity className="h-4 w-4" />;
  }

  if (stepKey === "completed") {
    return <CheckCircle2 className="h-4 w-4" />;
  }

  return <span className="text-xs font-bold">{index + 1}</span>;
}

function InlineHintStrip() {
  return (
    <div className="flex items-start gap-3 px-5 py-6 text-sm font-medium text-teal-200 sm:px-8 lg:px-10">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
      <span>
        Enter a ticket code above to open the user portal with live queue position,
        notifications, and department activity.
      </span>
    </div>
  );
}

function InlineLoaderStrip() {
  return (
    <div className="px-5 py-6 text-sm text-slate-300 sm:px-8 lg:px-10">
      Looking up the live queue lane for this ticket...
    </div>
  );
}

function InlineErrorStrip({ message }) {
  return (
    <div className="px-5 py-6 text-sm text-rose-400 sm:px-8 lg:px-10">
      {message}
    </div>
  );
}

function EmptyTrackingState() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
      <PortalCard
        icon={Ticket}
        title="Search any ticket"
        eyebrow="Ready to track"
      >
        <p className="max-w-2xl text-base leading-8 text-slate-300">
          Patients can use this portal to follow queue movement, view linked
          notifications, and keep their ticket handy across the waiting area.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <SummaryMiniCard label="Queue position" value="#4" />
          <SummaryMiniCard label="Estimate" value="18m" />
          <SummaryMiniCard label="Updates" value="Live" />
        </div>
      </PortalCard>

      <PortalCard
        icon={MessageCircle}
        title="What appears after lookup"
        eyebrow="Patient view"
      >
        <div className="space-y-4">
          {[
            "Status summary with current place in line",
            "Notification history for WhatsApp and board alerts",
            "Patient pass actions for sharing, printing, and staff follow-up",
          ].map((item, index) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-4 py-4"
            >
              <span className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-200">
                {index + 1}
              </span>
              <div className="text-sm leading-6 text-slate-300">{item}</div>
            </div>
          ))}
        </div>
      </PortalCard>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="rounded-[1.75rem] border border-rose-500/20 bg-rose-500/10 px-5 py-5 text-sm text-rose-300 shadow-[0_20px_50px_-40px_rgba(190,24,93,0.28)]">
      {message}
    </div>
  );
}

function TrackingResults({ data }) {
  const { ticket, queue, notifications } = data;
  const statusLabel = STATUS_META[ticket.status]?.label ?? ticket.status;
  const statusSummary = describeStatus(ticket, queue);
  const latestStatusTimestamp =
    ticket.completedAt ||
    ticket.serviceStartedAt ||
    ticket.calledAt ||
    ticket.registeredAt;
  const deliveredNotifications = notifications.filter((notification) =>
    ["delivered", "read"].includes(notification.status),
  ).length;
  const retryingNotifications = notifications.filter((notification) =>
    ["failed", "retrying"].includes(notification.status),
  ).length;
  const activeEntries = queue.activeInDepartment.filter(
    (entry) => entry.ticket !== ticket.ticket,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <StatusSummaryCard
          queue={queue}
          summary={statusSummary}
          latestStatusTimestamp={latestStatusTimestamp}
          ticket={ticket}
        />

        <NotificationsCard
          notifications={notifications}
          deliveredNotifications={deliveredNotifications}
          retryingNotifications={retryingNotifications}
          whatsApp={ticket.whatsApp}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <PatientPassCard
          latestStatusTimestamp={latestStatusTimestamp}
          queue={queue}
          statusLabel={statusLabel}
          ticket={ticket}
        />

        <ActiveNowCard activeEntries={activeEntries} queue={queue} ticket={ticket} />
      </div>

      <FeedbackForm ticket={ticket} />

      <PortalFooter />
    </div>
  );
}

function PortalCard({ icon: Icon, eyebrow, title, count, children }) {
  return (
    <article className="track-portal-card rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(4,20,31,0.72),rgba(6,42,53,0.62)_54%,rgba(10,31,46,0.68))] px-6 py-6 text-white shadow-[0_26px_60px_-44px_rgba(3,41,68,0.32)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.28em] text-teal-300">
            {Icon ? (
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[linear-gradient(135deg,rgba(20,184,166,0.18),rgba(13,148,136,0.14))] text-teal-300">
                <Icon className="h-4 w-4" />
              </span>
            ) : null}
            {eyebrow}
          </div>
          <h2 className="mt-4 font-display text-[1.9rem] font-bold tracking-tight text-white">
            {title}
          </h2>
        </div>
        {count !== undefined ? (
          <span className="inline-grid h-8 min-w-8 place-items-center rounded-full bg-teal-500/20 px-2 text-sm font-semibold text-teal-200">
            {count}
          </span>
        ) : null}
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">{children}</div>
    </article>
  );
}

function StatusSummaryCard({ queue, summary, latestStatusTimestamp, ticket }) {
  const positionValue =
    ticket.status === "waiting"
      ? `#${queue.departmentPosition}`
      : ticket.status === "called" || ticket.status === "in-service"
        ? "Now"
        : "Done";
  const waitValue =
    ticket.status === "waiting" ? `${queue.estimatedWaitMinutes}m` : "Now";
  const isCalled = ticket.status === "called" || ticket.status === "in-service";

  return (
    <PortalCard icon={Clock3} eyebrow="Status summary" title="Current ticket lane">
      <div className="font-serif text-[2.65rem] italic leading-none text-white">
        {summary.title}
      </div>
      <p className="mt-4 max-w-2xl text-[1.05rem] leading-8 text-slate-300">
        {summary.body}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMiniCard label="Ahead" value={`${queue.patientsAhead}`} />
        <SummaryMiniCard
          label="Position"
          value={positionValue}
          isCalled={isCalled}
        />
        <SummaryMiniCard label="Est. wait" value={waitValue} />
        <SummaryMiniCard
          label="Updated"
          value={formatTime(latestStatusTimestamp)}
        />
      </div>
    </PortalCard>
  );
}

function NotificationsCard({
  notifications,
  deliveredNotifications,
  retryingNotifications,
  whatsApp,
}) {
  return (
    <PortalCard
      icon={BellRing}
      eyebrow="Notifications"
      title="Notification timeline"
      count={notifications.length}
    >
      <div className="space-y-5">
        {notifications.length ? (
          notifications.map((notification, index) => (
            <PortalNotificationRow
              key={notification.id}
              notification={notification}
              isLast={index === notifications.length - 1}
            />
          ))
        ) : (
          <div className="rounded-[1.3rem] border border-dashed border-white/15 bg-white/[0.04] px-4 py-4 text-sm text-slate-400">
            No notification activity has been recorded for this ticket yet.
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <SummaryMiniCard label="Sent" value={`${notifications.length}`} centered />
        <SummaryMiniCard
          label="Delivered"
          value={`${deliveredNotifications}`}
          centered
        />
        <SummaryMiniCard label="Issues" value={`${retryingNotifications}`} centered />
      </div>

      <div className="mt-5 rounded-[1.3rem] bg-teal-500/10 px-4 py-4 text-[1.02rem] leading-8 text-teal-200">
        <div className="flex items-start gap-3">
          <MessageCircle className="mt-1 h-5 w-5 shrink-0" />
          <p>
            {whatsApp
              ? "WhatsApp is linked to your ticket. Alerts here mirror what was sent to your phone."
              : "This ticket is not linked to WhatsApp, so updates are reflected here and on the live board only."}
          </p>
        </div>
      </div>
    </PortalCard>
  );
}

function PatientPassCard({ latestStatusTimestamp, queue, statusLabel, ticket }) {
  const [actionState, setActionState] = useState("");
  const trackingUrl = buildTrackingUrl(ticket.ticket);
  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function handleCopy(value, successLabel) {
    try {
      await copyTextToClipboard(value);
      setActionState(successLabel);
      window.setTimeout(() => setActionState(""), 2200);
    } catch (error) {
      setActionState("Copy is not available on this device yet.");
      window.setTimeout(() => setActionState(""), 2600);
    }
  }

  async function handleShare() {
    if (!canShare) {
      handleCopy(trackingUrl, "Tracking link copied.");
      return;
    }

    try {
      await navigator.share({
        title: `WaitLess ticket ${ticket.ticket}`,
        text: `Track queue progress for ticket ${ticket.ticket} in ${ticket.department}.`,
        url: trackingUrl,
      });
      setActionState("Tracking link shared.");
      window.setTimeout(() => setActionState(""), 2200);
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      setActionState("Share could not be completed.");
      window.setTimeout(() => setActionState(""), 2600);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <PortalCard icon={IdCard} eyebrow="Patient pass" title="Portable patient view">
      <div className="track-patient-pass overflow-hidden rounded-[1.45rem] bg-[linear-gradient(135deg,rgba(4,20,31,0.88),rgba(6,42,53,0.78)_54%,rgba(10,31,46,0.84))] p-6 text-white shadow-[0_30px_70px_-44px_rgba(3,41,68,0.72)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[0.8rem] font-semibold uppercase tracking-[0.34em] text-slate-400">
              Ticket code
            </div>
            <div className="mt-4 font-display text-[3rem] font-bold leading-none tracking-tight">
              {ticket.ticket}
            </div>
          </div>

          <div className="text-right">
            <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold tracking-[0.14em] text-[#0f766e]">
              {statusLabel.toUpperCase()}
            </span>
            <div className="mt-3 text-sm text-slate-400">
              Since {formatTime(latestStatusTimestamp)}
            </div>
          </div>
        </div>

        <div className="mt-5 font-serif text-[2rem] italic leading-none text-white">
          {ticket.patientName}
        </div>
        <div className="mt-3 text-[1.1rem] text-slate-400">{ticket.department}</div>

        <div className="mt-6 border-t border-white/8 pt-5 text-sm text-slate-400">
          Position #{queue.departmentPosition}
          <span className="mx-3 text-slate-600">·</span>~{queue.estimatedWaitMinutes}m
          wait
          <span className="mx-3 text-slate-600">·</span>
          {ticket.whatsApp ? "WhatsApp on" : "Board only"}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PortalActionButton
          icon={Copy}
          label="Copy code"
          onClick={() => handleCopy(ticket.ticket, "Ticket code copied.")}
        />
        <PortalActionButton
          icon={Copy}
          label="Copy link"
          onClick={() => handleCopy(trackingUrl, "Tracking link copied.")}
        />
        <PortalActionButton icon={Printer} label="Print" onClick={handlePrint} />
        <PortalActionButton icon={Share2} label="Share" onClick={handleShare} />
      </div>

      <div className="mt-3 min-h-6 text-sm font-medium text-teal-300">
        {actionState}
      </div>

      <div className="mt-3 rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-5 py-4">
        <div className="text-[0.8rem] font-semibold uppercase tracking-[0.34em] text-slate-400">
          Next step
        </div>
        <p className="mt-3 text-[1.05rem] leading-8 text-slate-300">
          {getNextStepCopy(ticket, queue)}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {PATIENT_SUPPORT_CONTACTS.map((item) => (
          <SupportContactCard key={item.label} {...item} />
        ))}
      </div>
    </PortalCard>
  );
}

function PortalActionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-[1.05rem] border border-white/15 bg-white/[0.06] px-4 py-3 text-base font-semibold text-white shadow-[0_16px_34px_-30px_rgba(3,41,68,0.28)] transition-[transform,box-shadow,border-color,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-teal-300/50 hover:bg-teal-500/10 hover:shadow-[0_22px_38px_-30px_rgba(14,116,144,0.36)]"
    >
      <Icon className="h-4 w-4 text-teal-300" />
      {label}
    </button>
  );
}

function SupportContactCard({ icon: Icon, label, detail, href }) {
  const content = (
    <div className="flex items-center gap-4 rounded-[1.15rem] border border-white/10 bg-white/[0.04] px-4 py-4 shadow-[0_16px_34px_-34px_rgba(3,41,68,0.24)]">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-500/15 text-teal-300">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[0.8rem] font-semibold uppercase tracking-[0.34em] text-slate-400">
          {label}
        </div>
        <div className="mt-1 text-[1.02rem] font-medium text-white">{detail}</div>
      </div>
      {href ? <ChevronRight className="h-5 w-5 text-slate-500" /> : null}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <a
      href={href}
      className="block transition-transform hover:-translate-y-0.5"
    >
      {content}
    </a>
  );
}

function ActiveNowCard({ activeEntries, queue, ticket }) {
  return (
    <PortalCard
      icon={UserRound}
      eyebrow={`Active now · ${ticket.department}`}
      title="Department movement"
    >
      {activeEntries.length ? (
        <div className="space-y-3">
          {activeEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[1.15rem] border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:border-teal-300/40 hover:shadow-[0_16px_34px_-30px_rgba(14,116,144,0.28)]"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span
                  className={`inline-grid h-11 w-[4.15rem] place-items-center rounded-xl font-display text-sm font-bold ${priorityChipClass[entry.priority]}`}
                >
                  {entry.ticket}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[1.05rem] font-medium text-white">
                    {entry.patientName}
                  </div>
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.24em] ${getDepartmentStatusClass(entry.status)}`}
              >
                {STATUS_META[entry.status]?.label ?? entry.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.3rem] border border-dashed border-white/15 bg-white/[0.04] px-4 py-4 text-sm text-slate-400">
          No patient is currently active in this department.
        </div>
      )}

      <div className="mt-5 rounded-[1.15rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-[1.05rem] text-slate-300">
        <span className="font-semibold text-white">
          {queue.totalWaitingInDepartment}
        </span>{" "}
        waiting in {ticket.department}
        <span className="mx-2 text-slate-500">·</span>
        <span className="font-semibold text-white">{queue.totalWaitingOverall}</span>{" "}
        hospital-wide
      </div>
    </PortalCard>
  );
}

function SummaryMiniCard({ label, value, centered = false, isCalled = false }) {
  return (
    <div
      className={`rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-4 ${
        centered ? "text-center" : ""
      } ${isCalled ? "relative overflow-hidden" : ""}`}
    >
      {isCalled && (
        <div className="absolute inset-0 animate-pulse bg-emerald-500/20" />
      )}
      <div className="relative">
        <div className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-slate-400">
          {label}
        </div>
        <div className={`mt-2 font-display text-[2.15rem] font-bold leading-none tracking-tight ${
          isCalled ? "text-emerald-300" : "text-white"
        }`}>
          {value}
        </div>
      </div>
    </div>
  );
}

function PortalNotificationRow({ notification, isLast }) {
  return (
    <article className="relative pl-11">
      {!isLast ? (
        <span className="absolute left-[0.88rem] top-10 h-[calc(100%-1.1rem)] w-px bg-white/15" />
      ) : null}

      <span
        className={`absolute left-0 top-1 inline-grid h-8 w-8 place-items-center rounded-full ${getNotificationIconClass(
          notification.status,
        )}`}
      >
        <BellRing className="h-4 w-4" />
      </span>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[1.05rem] font-semibold text-white">
            {notification.title}
          </div>
          <p className="mt-1 max-w-2xl text-[1.02rem] leading-8 text-slate-300">
            {notification.message}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
            {notification.recipient ? <span>{notification.recipient}</span> : null}
            <span>{formatNotificationTimestamp(notification.createdAt)}</span>
            {notification.channel ? (
              <span className="font-semibold text-teal-300">
                {formatNotificationChannel(notification.channel)}
              </span>
            ) : null}
          </div>
        </div>

        <NotificationStatusBadge status={notification.status} />
      </div>

      {notification.nextRetryAt || notification.errorMessage ? (
        <div className="mt-3 rounded-xl bg-white/[0.04] px-3 py-3 text-sm text-slate-400">
          {notification.nextRetryAt ? (
            <div>Next retry: {formatNotificationTimestamp(notification.nextRetryAt)}</div>
          ) : null}
          {notification.errorMessage ? (
            <div className="mt-1 text-rose-600">{notification.errorMessage}</div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function NotificationStatusBadge({ status }) {
  const badgeMeta = {
    queued: {
      label: "Queued",
      className: "bg-white/10 text-slate-300",
    },
    sending: {
      label: "Sending",
      className: "bg-teal-500/15 text-teal-300",
    },
    sent: {
      label: "Sent",
      className: "bg-teal-500/15 text-teal-200",
    },
    delivered: {
      label: "Delivered",
      className: "bg-emerald-500/15 text-emerald-300",
    },
    read: {
      label: "Read",
      className: "bg-emerald-500/20 text-emerald-200",
    },
    retrying: {
      label: "Retrying",
      className: "bg-amber-500/15 text-amber-300",
    },
    failed: {
      label: "Failed",
      className: "bg-rose-500/15 text-rose-300",
    },
  }[status] ?? {
    label: status,
    className: "bg-white/10 text-slate-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.24em] ${badgeMeta.className}`}
    >
      {badgeMeta.label}
    </span>
  );
}

function PortalFooter() {
  return (
    <footer className="flex flex-col gap-3 border-t border-white/10 px-2 pt-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-teal-500/15 text-teal-300">
          <Activity className="h-4 w-4" />
        </span>
        <span>WaitLess User Portal · Chinhoyi Provincial Hospital</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-400/70" />
          Your health information is protected.
        </div>
        <span>Updates automatically while the queue is running</span>
      </div>
    </footer>
  );
}

function PortalHelpButton() {
  return (
    <a
      href="tel:+263672122201"
      className="fixed bottom-4 right-4 z-30 inline-grid h-12 w-12 place-items-center rounded-full bg-[linear-gradient(135deg,#0f766e,#0d9488)] text-white shadow-[0_18px_36px_-16px_rgba(13,148,136,0.52)] transition-transform hover:-translate-y-0.5"
      aria-label="Call reception for help"
    >
      <CircleHelp className="h-6 w-6" />
    </a>
  );
}

function getHeroPositionValue(ticket, queue) {
  if (ticket.status === "waiting") {
    return `#${queue.departmentPosition}`;
  }

  if (ticket.status === "called" || ticket.status === "in-service") {
    return "NOW";
  }

  if (ticket.status === "completed") {
    return "DONE";
  }

  return "--";
}

function getHeroWaitValue(ticket, queue) {
  if (ticket.status === "waiting") {
    return `${queue.estimatedWaitMinutes}m`;
  }

  if (ticket.status === "called" || ticket.status === "in-service") {
    return "Now";
  }

  if (ticket.status === "completed") {
    return "--";
  }

  return "--";
}

function getPortalPriorityLabel(priority) {
  return (
    {
      red: "Critical",
      yellow: "Priority",
      green: "Standard",
      black: "Closed",
    }[priority] ?? PRIORITY_META[priority]?.short ?? priority
  );
}

function getDepartmentStatusClass(status) {
  return (
    {
      waiting: "bg-white/10 text-slate-300",
      called: "bg-amber-500/15 text-amber-300",
      "in-service": "bg-emerald-500/15 text-emerald-300",
      completed: "bg-teal-500/15 text-teal-300",
      missed: "bg-rose-500/15 text-rose-300",
    }[status] ?? "bg-white/10 text-slate-300"
  );
}

function getNotificationIconClass(status) {
  return (
    {
      delivered: "bg-emerald-500/15 text-emerald-300",
      read: "bg-emerald-500/15 text-emerald-300",
      sent: "bg-teal-500/15 text-teal-300",
      retrying: "bg-amber-500/15 text-amber-300",
      failed: "bg-rose-500/15 text-rose-300",
    }[status] ?? "bg-teal-500/15 text-teal-300"
  );
}

function formatNotificationChannel(channel) {
  return {
    whatsapp: "WhatsApp",
    "display-board": "Display board",
  }[channel] ?? channel;
}

function buildProgressSteps(ticket, queue) {
  return [
    {
      key: "registered",
      label: "Registered",
      body: `Ticket created at ${formatTime(ticket.registeredAt)}.`,
      state: getStepState(ticket.status, "registered"),
    },
    {
      key: "waiting",
      label: "Waiting",
      body:
        ticket.status === "waiting"
          ? `${queue.patientsAhead} patient${queue.patientsAhead === 1 ? "" : "s"} ahead.`
          : "Waiting stage completed.",
      state: getStepState(ticket.status, "waiting"),
    },
    {
      key: "called",
      label: "Called",
      body: ticket.calledAt
        ? `Called at ${formatTime(ticket.calledAt)}.`
        : "Staff will call your ticket here.",
      state: getStepState(ticket.status, "called"),
    },
    {
      key: "in-service",
      label: "In service",
      body: ticket.serviceStartedAt
        ? `Service started at ${formatTime(ticket.serviceStartedAt)}.`
        : "Your visit will move into care here.",
      state: getStepState(ticket.status, "in-service"),
    },
    {
      key: "completed",
      label: "Completed",
      body: ticket.completedAt
        ? `Completed at ${formatTime(ticket.completedAt)}.`
        : "Final status appears here once done.",
      state: getStepState(ticket.status, "completed"),
    },
  ];
}

function getCurrentProgressStep(status) {
  if (status === "completed") return "completed";
  if (status === "in-service") return "in-service";
  if (status === "called") return "called";
  if (status === "waiting") return "waiting";
  return "registered";
}

function getStepState(currentStatus, stepKey) {
  const currentIndex = TRACK_STEPS.indexOf(getCurrentProgressStep(currentStatus));
  const stepIndex = TRACK_STEPS.indexOf(stepKey);

  if (stepIndex < currentIndex) {
    return "complete";
  }

  if (stepIndex === currentIndex) {
    return "current";
  }

  return "upcoming";
}

function getNextStepCopy(ticket, queue) {
  if (ticket.status === "completed") {
    return "Your visit is marked complete. If you still need help, speak to the front desk or the clinical team.";
  }

  if (ticket.status === "in-service") {
    return "Stay with the care team while your visit is underway.";
  }

  if (ticket.status === "called") {
    return `Proceed to ${ticket.department} immediately with this ticket ready.`;
  }

  if (queue.patientsAhead === 0) {
    return `Stay close to ${ticket.department}. Your ticket is next and may be called at any moment.`;
  }

  return `Wait comfortably. ${queue.patientsAhead} patient${queue.patientsAhead === 1 ? "" : "s"} ahead of you will be seen first.`;
}

function describeStatus(ticket, queue) {
  if (ticket.status === "called") {
    return {
      title: "Your ticket has been called",
      body: `Proceed to ${ticket.department} now so staff can continue your visit without delay.`,
    };
  }

  if (ticket.status === "in-service") {
    return {
      title: "You are currently in service",
      body: `A clinician is actively attending to ${ticket.ticket} in ${ticket.department}.`,
    };
  }

  if (ticket.status === "completed") {
    return {
      title: "Your visit is complete",
      body: `This ticket has already been completed in ${ticket.department}.`,
    };
  }

  if (queue.patientsAhead === 0) {
    return {
      title: "You are next in line",
      body: `Stay nearby for ${ticket.department}. Staff are nearly ready to call ${ticket.ticket}.`,
    };
  }

  return {
    title: `${queue.patientsAhead} patient${queue.patientsAhead === 1 ? "" : "s"} ahead of you`,
    body: `Your place in ${ticket.department} is currently #${queue.departmentPosition}. Rough wait is about ${queue.estimatedWaitMinutes} minutes at the current pace.`,
  };
}

function formatTime(value) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNotificationTimestamp(value) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildTrackingUrl(ticketCode) {
  const targetPath = `/track?ticket=${encodeURIComponent(ticketCode)}`;

  if (typeof window === "undefined") {
    return targetPath;
  }

  return `${window.location.origin}${targetPath}`;
}

async function copyTextToClipboard(value) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard is not available.");
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

const FEEDBACK_CATEGORIES = [
  "Wait time",
  "Staff friendliness",
  "Cleanliness",
  "Communication",
  "Overall experience",
];

function FeedbackForm({ ticket }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const feedbackMut = useApiAction(
    ({ id, payload }) => submitFeedback(id, payload),
    {
      onSuccess: () => {
        setSubmitted(true);
        setRating(0);
        setSelectedCategories([]);
        setComment("");
      },
    },
  );

  function toggleCategory(cat) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  function handleSubmit() {
    if (rating === 0) return;
    feedbackMut.mutate({
      id: ticket.id,
      payload: { rating, categories: selectedCategories, comment },
    });
  }

  return (
    <article className="track-portal-card rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(4,20,31,0.72),rgba(6,42,53,0.62)_54%,rgba(10,31,46,0.68))] px-6 py-6 text-white shadow-[0_26px_60px_-44px_rgba(3,41,68,0.32)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.28em] text-teal-300">
            <Star className="h-4 w-4" />
            Feedback
          </div>
          <h3 className="mt-2 font-display text-xl font-bold tracking-tight">
            How was your visit?
          </h3>
          <p className="mt-1 text-sm text-white/60">
            Help us improve our service by sharing your experience.
          </p>
        </div>
      </div>

      {submitted ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <p className="text-sm text-emerald-200">
            Thank you for your feedback! Your response has been recorded.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
              Rate your experience
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-7 w-7 ${
                      (hoverRating || rating) >= star
                        ? "fill-amber-400 text-amber-400"
                        : "text-white/25"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
              What could we improve?
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {FEEDBACK_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedCategories.includes(cat)
                      ? "bg-teal-400/20 text-teal-200 border border-teal-400/40"
                      : "border border-white/15 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
              Additional comments
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Tell us more about your experience…"
              className="mt-2 w-full resize-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-teal-400/40 focus:ring-1 focus:ring-teal-400/30"
            />
          </div>

          {feedbackMut.isError && (
            <p className="text-sm text-red-300">{feedbackMut.error.message}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={rating === 0 || feedbackMut.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-400/90 px-5 text-sm font-semibold text-[#04141f] hover:bg-teal-400 disabled:opacity-40"
          >
            {feedbackMut.isPending ? "Submitting…" : "Submit feedback"}
          </button>
        </div>
      )}
    </article>
  );
}
