import { useCallback, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BellRing,
  Brain,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  DoorOpen,
  Download,
  FileChartColumn,
  FileText,
  FlaskConical,
  HeartPulse,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Pill,
  Plus,
  RefreshCw,
  Search,
  ScanLine,
  Send,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  Timer,
  TrendingUp,
  Upload,
  Users,
  Wifi,
  XCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { LoadingPanel } from "@/components/ui/system-loader";
import { useLiveRefresh } from "@/context/LiveRefreshContext";
import { useApiAction, useApiResource } from "@/hooks/useApiResource";
import { DEPARTMENTS, PRIORITY_META, STATUS_META, priorityChipClass } from "@/services/queueMeta";
import {
  fetchDashboardSummary,
  fetchETAEstimates,
  fetchPrescriptions,
  fetchPrescriptionSummary,
  fetchPrescriptionsWithStock,
  fetchStockSummary,
  flagPrescriptionItem,
  fetchQueueBoard,
  fetchStaffQueueBoard,
  fetchTestOrders,
  fetchTestOrderSummary,
  fetchAverageWaitReport,
  fetchDepartmentPerformanceReport,
  fetchNoShowReport,
  fetchTriageReport,
  fetchLabTurnaroundReport,
  fetchStaffWorkloadReport,
  fetchOutOfStockReport,
  fetchPeakHoursReport,
  fetchCongestionReport,
  fetchResourceAllocationReport,
  fetchWhatsAppStatus,
  fetchHospitalInfo,
  fetchReassessmentAlerts,
  fetchBottleneckAnalysis,
  recallTicket,
  callNextPatient,
  updateTicketStatus,
  transferTicket,
  retryNotificationDelivery,
  updatePrescriptionState,
  updateTestOrderState,
  fetchOIClinicStreams,
  fetchOIClinicVisits,
  fetchOIClinicSummary,
  createOIClinicVisit,
  updateOIClinicVisitState,
  fetchHospitals,
  createHospital,
  updateHospital,
  fetchWaitTimePrediction,
  fetchSyncStatus,
  exportSyncData,
  importSyncData,
  createBackup,
} from "@/services/queueApi";
import { useAuth } from "@/auth/AuthProvider";
import { useQueueRealtime } from "@/sockets/QueueRealtimeProvider";
import { exportCSV, exportPDF, exportXLSX } from "@/utils/reportExport";
import deptOpdImage from "@/assets/Every service point, one queue/TRY OPD.jpeg";
import deptTriageImage from "@/assets/Every service point, one queue/TRIAGE.jpg";
import deptPharmacyImage from "@/assets/Every service point, one queue/PHAMARCY.jpeg";
import deptLabImage from "@/assets/Every service point, one queue/LABORATORY.jpeg";
import deptRadiologyImage from "@/assets/Every service point, one queue/RADIOLOGY.jpg";
import deptOiImage from "@/assets/Every service point, one queue/OI CLINIC.jpg";

const isBrowser = typeof window !== "undefined";
const EMPTY_LIST = [];

function useDashboardSummary() {
  const { refreshToken } = useLiveRefresh();
  const loader = useCallback(() => fetchDashboardSummary(), []);
  return useApiResource(loader, { enabled: isBrowser, refreshToken });
}

function ModulePage({ eyebrow, title, description, icon: Icon, children }) {
  return (
    <section className="staff-module-page mx-auto min-h-[calc(100vh-7rem)] w-full max-w-[96rem] px-1 py-6 sm:py-8">
      <header className="surface-panel flex flex-wrap items-start justify-between gap-5 p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="bg-gradient-to-r from-teal-300 to-teal-300 bg-clip-text text-[11px] font-black uppercase tracking-[0.32em] text-transparent">
              {eyebrow}
            </span>
            <span className="h-px w-9 bg-gradient-to-l from-transparent to-teal-300/60" />
          </div>
          <h1 className="mt-3 inline-flex items-center gap-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
            <span className="mt-1 h-px w-10 bg-gradient-to-l from-transparent to-teal-300/50" />
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-primary/20 bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function QueryBoundary({ query, title, children }) {
  if (query.isLoading) {
    return <LoadingPanel title={title} message="Synchronizing the latest hospital activity." />;
  }

  if (query.isError) {
    return (
      <div className="surface-panel border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
        {query.error.message}
      </div>
    );
  }

  return children;
}

function MetricTile({ label, value, detail, icon: Icon, accent = "text-teal-300 bg-teal-400/15", tint = "#14b8a6" }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.16]">
      <span
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${tint}00, ${tint}, ${tint}00)` }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
            {label}
          </div>
          <div className="mt-3 font-display text-4xl font-bold tracking-tight text-white">
            {value}
          </div>
          {detail ? (
            <p className="mt-1.5 text-xs leading-5 text-white/40">{detail}</p>
          ) : null}
        </div>
        {Icon ? (
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 ${accent}`}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function StaffQueueBoardPage() {
  const realtime = useQueueRealtime();
  const auth = useAuth();
  const { refreshLiveData } = useLiveRefresh();
  const loader = useCallback(() => fetchStaffQueueBoard(), []);
  const query = useApiResource(loader, { enabled: isBrowser });
  const serving = query.data?.nowServing ?? EMPTY_LIST;
  const waiting = query.data?.waiting ?? EMPTY_LIST;
  const missed = query.data?.missed ?? EMPTY_LIST;
  const departmentETAs = query.data?.departmentETAs ?? {};
  const bottlenecks = query.data?.bottlenecks ?? EMPTY_LIST;
  const avgServiceTime = query.data?.avgServiceTimeMinutes ?? null;
  const isLive = realtime.status === "connected";

  const staffDept = DEPARTMENTS.includes(auth.user?.department)
    ? auth.user.department
    : DEPARTMENTS[0];
  const [callDept, setCallDept] = useState(staffDept);
  const [callRoom, setCallRoom] = useState(auth.user?.roomNumber ?? "");
  const callMutation = useApiAction(
    ({ department, room }) => callNextPatient(department, room),
    {
      onSuccess: (res) => {
        refreshLiveData();
        const roomSuffix = res?.ticket?.calledRoom ? ` — Room ${res.ticket.calledRoom}` : "";
        toast.success(`${res?.ticket?.ticket ?? "Ticket"} called to ${res?.ticket?.department ?? callDept}${roomSuffix}.`);
      },
    },
  );
  const statusMutation = useApiAction(
    ({ id, status, room }) => updateTicketStatus(id, status, room),
    {
      onSuccess: (res) => {
        refreshLiveData();
        toast.success(`${res?.ticket?.ticket ?? "Ticket"} → ${res?.ticket?.status}.`);
      },
    },
  );
  const transferMutation = useApiAction(
    ({ id, department }) => transferTicket(id, department),
    {
      onSuccess: (res) => {
        refreshLiveData();
        toast.success(`${res?.ticket?.ticket ?? "Ticket"} transferred to ${res?.ticket?.department}.`);
      },
    },
  );

  const deptWaitingCount = waiting.filter((t) => t.department === callDept).length;
  const mutationError =
    callMutation.error?.message ??
    statusMutation.error?.message ??
    transferMutation.error?.message;

  function setTicketStatus(ticket, status) {
    statusMutation.mutate({
      id: ticket.id,
      status,
      room: status === "called" ? callRoom : undefined,
    });
  }

  function transferTicketTo(ticket, department) {
    transferMutation.mutate({ id: ticket.id, department });
  }

  return (
    <ModulePage
      eyebrow="Live operations"
      title="Queue Board"
      description="A staff view of every ticket currently serving, waiting, or awaiting recall."
      icon={Users}
    >
      <QueryBoundary query={query} title="Loading the queue board">
        {/* Call controls */}
        <div className="surface-panel mb-5 flex flex-wrap items-center gap-3 p-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Call next in</span>
            <select
              value={callDept}
              onChange={(e) => setCallDept(e.target.value)}
              className="input-base h-9 w-auto text-xs"
            >
              {(auth.user?.role === "admin" ? DEPARTMENTS : DEPARTMENTS.filter((dept) => dept === staffDept)).map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </label>
          <span className="text-xs text-muted-foreground">
            {deptWaitingCount} waiting
          </span>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Room</span>
            <input
              type="text"
              value={callRoom}
              onChange={(e) => setCallRoom(e.target.value)}
              placeholder="e.g. 405"
              className="input-base h-9 w-20 text-xs"
            />
          </label>
          <button
            type="button"
            disabled={callMutation.isPending || !deptWaitingCount}
            onClick={() => callMutation.mutate({ department: callDept, room: callRoom || undefined })}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold uppercase tracking-wider text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            {callMutation.isPending ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <BellRing className="h-3.5 w-3.5" />
            )}
            Call next patient
          </button>
          {mutationError ? (
            <span className="text-xs font-semibold text-destructive">{mutationError}</span>
          ) : null}
        </div>
        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminMetricTile
            label="Now serving"
            value={serving.length}
            detail="Patients at a service desk"
            icon={Wifi}
            accent="text-priority-green bg-priority-green/15"
          />
          <AdminMetricTile
            label="Waiting"
            value={waiting.length}
            detail="Ordered by clinical priority"
            icon={Clock3}
            accent="text-amber-500 bg-amber-500/15"
          />
          <AdminMetricTile
            label="Missed turns"
            value={missed.length}
            detail="Available for staff recall"
            icon={AlertTriangle}
            accent={missed.length ? "text-destructive bg-destructive/15" : "text-priority-green bg-priority-green/15"}
          />
        </div>

        {/* Bottleneck warnings */}
        {bottlenecks.length > 0 ? (
          <div className="mt-4 space-y-2">
            {bottlenecks.map((b, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                  b.severity === "critical"
                    ? "border-red-500/40 bg-red-500/10"
                    : "border-amber-500/40 bg-amber-500/10"
                }`}
              >
                <AlertTriangle
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    b.severity === "critical" ? "text-red-500" : "text-amber-500"
                  }`}
                />
                <div>
                  <div
                    className={`text-xs font-bold uppercase tracking-wider ${
                      b.severity === "critical" ? "text-red-500" : "text-amber-600 dark:text-amber-300"
                    }`}
                  >
                    {b.type.replace("-", " ")}
                  </div>
                  <div className="mt-0.5 text-sm text-muted-foreground">{b.message}</div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Serving + waiting */}
        <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="surface-panel">
            <AdminPanelHeader
              icon={Activity}
              title="Now serving"
              subtitle="Patients currently at a desk"
              count={serving.length}
            />
            {serving.length ? (
              <div className="grid gap-3 p-5 sm:grid-cols-2">
                {serving.map((ticket) => (
                  <ServingTile
                    key={ticket.id}
                    ticket={ticket}
                    pending={statusMutation.isPending || transferMutation.isPending}
                    onStatus={setTicketStatus}
                    onTransfer={transferTicketTo}
                  />
                ))}
              </div>
            ) : (
              <AdminEmptyState message="No patients are currently being served." />
            )}
          </div>

          <div className="surface-panel">
            <AdminPanelHeader
              icon={Clock3}
              title="Up next"
              subtitle={isLive ? "Live · ordered by priority" : "Syncing · ordered by priority"}
              count={waiting.length}
            />
            {waiting.length ? (
              <div className="divide-y divide-border/50">
                {waiting.map((ticket, index) => (
                  <WaitingQueueRow
                    key={ticket.id}
                    ticket={ticket}
                    position={index + 1}
                    pending={statusMutation.isPending}
                    onCall={(t) => setTicketStatus(t, "called")}
                  />
                ))}
              </div>
            ) : (
              <AdminEmptyState message="The live waiting queue is clear." />
            )}
          </div>
        </div>

        {/* Service pace */}
        {avgServiceTime ? (
          <div className="surface-panel mt-5">
            <AdminPanelHeader
              icon={Timer}
              title="Service pace"
              subtitle="Average service time and estimated wait per department"
            />
            <div className="p-5">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold tracking-tight text-foreground">
                  {avgServiceTime}
                </span>
                <span className="text-sm text-muted-foreground">min average service time</span>
              </div>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(departmentETAs)
                  .filter(([, d]) => d.waitingCount > 0)
                  .map(([dept, data]) => (
                    <div
                      key={dept}
                      className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5"
                    >
                      <div className="text-xs font-semibold text-foreground">{dept}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock3 className="h-3 w-3" />
                        ETA ~{data.etaMinutes}m
                      </div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">
                        {data.waitingCount} waiting · {data.activeCount} active
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Missed turns */}
        {missed.length > 0 ? (
          <div className="surface-panel mt-5">
            <AdminPanelHeader
              icon={AlertTriangle}
              title="Missed turns"
              subtitle="Choose a fair reinsertion position when recalling"
              count={missed.length}
            />
            <div className="divide-y divide-border/50">
              {missed.map((ticket) => (
                <MissedRecallRow key={ticket.id} ticket={ticket} />
              ))}
            </div>
          </div>
        ) : null}
      </QueryBoundary>
    </ModulePage>
  );
}

const PRIORITY_TOP_BAR = {
  red: "bg-priority-red",
  yellow: "bg-priority-yellow",
  green: "bg-priority-green",
  black: "bg-priority-black",
};

function ServingTile({ ticket, onStatus, onTransfer, pending }) {
  const isCalled = ticket.status === "called";
  const inService = ticket.status === "in-service";
  const isUrgent = ticket.priority === "red";
  return (
    <article className="relative overflow-hidden rounded-xl border border-border/70 bg-background/60 p-4">
      <div
        className={`absolute inset-x-0 top-0 h-0.5 ${PRIORITY_TOP_BAR[ticket.priority] ?? "bg-primary"}`}
      />
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-grid h-10 w-16 place-items-center rounded-lg font-display text-sm font-bold ${priorityChipClass[ticket.priority]}`}
        >
          {ticket.ticket}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-priority-green/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-priority-green">
          <span className="h-1.5 w-1.5 rounded-full bg-priority-green" />
          {STATUS_META[ticket.status]?.label ?? ticket.status}
        </span>
      </div>
      {isUrgent ? (
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-priority-red/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-priority-red">
          <AlertTriangle className="h-3 w-3 animate-pulse" />
          Urgent attention
        </span>
      ) : null}
      <div className="mt-3 text-sm font-semibold text-foreground">{ticket.department}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        {PRIORITY_META[ticket.priority]?.label ?? ticket.priority}
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t border-border/50 pt-3 text-xs text-muted-foreground">
        <Clock3 className="h-3.5 w-3.5" />
        {ticket.waitMinutes}m in service
        {ticket.calledRoom ? (
          <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-semibold text-foreground">
            <DoorOpen className="h-3 w-3" />
            Room {ticket.calledRoom}
          </span>
        ) : null}
      </div>
      {onStatus ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {isCalled ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => onStatus(ticket, "in-service")}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[11px] font-bold uppercase tracking-wider text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
              >
                <Activity className="h-3 w-3" />
                Now serving
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => onStatus(ticket, "missed")}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-destructive/40 px-3 text-[11px] font-bold uppercase tracking-wider text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
              >
                <XCircle className="h-3 w-3" />
                Mark missed
              </button>
            </>
          ) : null}
          {inService ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => onStatus(ticket, "completed")}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[11px] font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3 w-3" />
              Complete visit
            </button>
          ) : null}
          {onTransfer ? (
            <select
              disabled={pending}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) onTransfer(ticket, e.target.value);
                e.target.value = "";
              }}
              className="input-base h-8 w-auto cursor-pointer text-[11px] font-semibold text-muted-foreground"
            >
              <option value="" disabled>
                Transfer to…
              </option>
              {DEPARTMENTS.filter((dept) => dept !== ticket.department).map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function WaitingQueueRow({ ticket, position, onCall, pending }) {
  const isUrgent = ticket.priority === "red";
  const isSerious = ticket.priority === "yellow";
  return (
    <div
      className={`flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-muted/40 ${
        isUrgent ? "bg-priority-red/5" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted font-display text-[11px] font-bold text-muted-foreground">
          {position}
        </span>
        <span
          className={`inline-grid h-9 w-14 shrink-0 place-items-center rounded-lg font-display text-xs font-bold ${priorityChipClass[ticket.priority]}`}
        >
          {ticket.ticket}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">
            {ticket.department}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">
              {PRIORITY_META[ticket.priority]?.label ?? ticket.priority}
            </span>
            {isUrgent ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-priority-red/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-priority-red">
                <AlertTriangle className="h-2.5 w-2.5 animate-pulse" />
                Urgent
              </span>
            ) : null}
            {isSerious ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-priority-yellow/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-priority-yellow">
                Priority
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          <div className="font-display text-sm font-bold text-foreground">
            {ticket.waitMinutes}m
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {STATUS_META[ticket.status]?.label ?? ticket.status}
          </div>
        </div>
        {onCall ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onCall(ticket)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/40 px-3 text-[11px] font-bold uppercase tracking-wider text-primary transition hover:bg-primary/10 disabled:opacity-50"
          >
            <BellRing className="h-3 w-3" />
            Call
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MissedRecallRow({ ticket }) {
  const { refreshLiveData } = useLiveRefresh();
  const [position, setPosition] = useState("places");
  const [offsetMinutes, setOffsetMinutes] = useState("");
  const recallMutation = useApiAction(
    (opts) => recallTicket(ticket.id, opts),
    { onSuccess: refreshLiveData },
  );

  function handleRecall() {
    const opts = { reinsertionPosition: position };
    if (position === "places") {
      opts.places = 3;
    }
    if (position === "offset" && offsetMinutes) {
      opts.offsetMinutes = Number(offsetMinutes);
    }
    recallMutation.mutate(opts);
  }

  const options = [
    { value: "places", label: "3 places back" },
    { value: "back", label: "Back of queue" },
    { value: "front", label: "Front of queue" },
    { value: "original", label: "Original position" },
    { value: "offset", label: "Custom offset" },
  ];

  return (
    <div className="px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={"inline-grid h-9 w-16 shrink-0 place-items-center rounded-lg font-display text-xs font-bold " + (priorityChipClass[ticket.priority] || "")}>
            {ticket.ticket}
          </span>
          <div>
            <div className="text-sm font-semibold text-foreground">{ticket.department}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {(PRIORITY_META[ticket.priority] || {}).label || ticket.priority} · Missed {ticket.waitMinutes}m ago
              {ticket.recallCount > 0 ? " · Recalled " + ticket.recallCount + "x" : ""}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="input-base h-9 w-auto text-xs"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {position === "offset" ? (
            <input
              type="number"
              value={offsetMinutes}
              onChange={(e) => setOffsetMinutes(e.target.value)}
              placeholder="min ago"
              className="input-base h-9 w-24 text-xs"
            />
          ) : null}
          <button
            type="button"
            onClick={handleRecall}
            disabled={recallMutation.isPending}
            className="rounded-xl gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-elegant disabled:opacity-60"
          >
            {recallMutation.isPending ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                Recalling...
              </span>
            ) : (
              "Recall"
            )}
          </button>
        </div>
      </div>
      {recallMutation.isError ? (
        <div className="mt-2 text-xs text-destructive">{recallMutation.error.message}</div>
      ) : null}
      {recallMutation.data ? (
        <div className="mt-2 text-xs text-emerald-500">
          Recalled successfully.
        </div>
      ) : null}
    </div>
  );
}


const DEPT_CARD_META = {
  OPD: {
    icon: Stethoscope,
    image: deptOpdImage,
    body: "General outpatient consultations, follow-up clinics, and referrals.",
    tint: "#14b8a6",
    text: "text-teal-300",
    chip: "bg-teal-400/15 text-teal-200 ring-teal-300/25",
    stat: "border-teal-300/15 bg-teal-400/[0.06]",
    overlay: "from-teal-500/50",
  },
  "Casualty / Triage": {
    icon: Siren,
    image: deptTriageImage,
    body: "24/7 emergency assessment with four-tier priority routing.",
    tint: "#f43f5e",
    text: "text-rose-300",
    chip: "bg-rose-400/15 text-rose-200 ring-rose-300/25",
    stat: "border-rose-300/15 bg-rose-400/[0.06]",
    overlay: "from-rose-500/50",
  },
  Pharmacy: {
    icon: Pill,
    image: deptPharmacyImage,
    body: "Prescription dispensing with WhatsApp call-up alerts.",
    tint: "#38bdf8",
    text: "text-sky-300",
    chip: "bg-sky-400/15 text-sky-200 ring-sky-300/25",
    stat: "border-sky-300/15 bg-sky-400/[0.06]",
    overlay: "from-sky-500/50",
  },
  Laboratory: {
    icon: FlaskConical,
    image: deptLabImage,
    body: "Blood work and diagnostic testing, tracked from order to result.",
    tint: "#a78bfa",
    text: "text-violet-300",
    chip: "bg-violet-400/15 text-violet-200 ring-violet-300/25",
    stat: "border-violet-300/15 bg-violet-400/[0.06]",
    overlay: "from-violet-500/50",
  },
  Radiology: {
    icon: ScanLine,
    image: deptRadiologyImage,
    body: "Imaging orders linked to each visit, with live status updates.",
    tint: "#fbbf24",
    text: "text-amber-300",
    chip: "bg-amber-400/15 text-amber-200 ring-amber-300/25",
    stat: "border-amber-300/15 bg-amber-400/[0.06]",
    overlay: "from-amber-500/50",
  },
  "OI Clinic": {
    icon: HeartPulse,
    image: deptOiImage,
    body: "Opportunistic infection care with discreet follow-up queues.",
    tint: "#fb7185",
    text: "text-pink-300",
    chip: "bg-pink-400/15 text-pink-200 ring-pink-300/25",
    stat: "border-pink-300/15 bg-pink-400/[0.06]",
    overlay: "from-pink-500/50",
  },
};

export function DepartmentsPage() {
  const query = useDashboardSummary();
  const tickets = query.data?.tickets ?? EMPTY_LIST;

  return (
    <ModulePage
      eyebrow="Clinical operations"
      title="Departments"
      description="Compare live patient pressure and service movement across hospital departments."
      icon={Building2}
    >
      <QueryBoundary query={query} title="Loading departments">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DEPARTMENTS.map((department) => {
            const meta = DEPT_CARD_META[department];
            const Icon = meta?.icon ?? Building2;
            const scoped = tickets.filter((ticket) => ticket.department === department);
            const waiting = scoped.filter((ticket) => ticket.status === "waiting").length;
            const active = scoped.filter((ticket) =>
              ["called", "in-service"].includes(ticket.status),
            ).length;
            const closed = scoped.filter((ticket) => ticket.status === "completed").length;
            const pressure = scoped.length
              ? Math.round((waiting / scoped.length) * 100)
              : 0;

            return (
              <article
                key={department}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.16]"
              >
                {/* Department image banner */}
                <div className="relative h-28 overflow-hidden">
                  {meta?.image ? (
                    <img
                      src={meta.image}
                      alt={department}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : null}
                  <div className={`absolute inset-0 bg-gradient-to-b ${meta?.overlay ?? "from-teal-500/50"} via-[#111827]/40 to-[#111827]`} />
                  <span className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ring-1 ring-inset backdrop-blur ${meta?.chip ?? "bg-teal-400/15 text-teal-200 ring-teal-300/25"}`}>
                    {waiting} waiting
                  </span>
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/85 ring-1 ring-inset ring-white/15 backdrop-blur">
                    {scoped.length} today
                  </span>
                </div>

                {/* Icon tile overlapping the banner */}
                <div className="relative -mt-8 px-5">
                  <span
                    className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.7)]"
                    style={{
                      background: `linear-gradient(135deg, ${meta?.tint ?? "#14b8a6"}33, ${meta?.tint ?? "#14b8a6"}14)`,
                    }}
                  >
                    <Icon className={`h-6 w-6 ${meta?.text ?? "text-teal-300"}`} />
                  </span>
                </div>

                <div className="flex flex-1 flex-col px-5 pb-5 pt-3">
                  <h2 className="font-display text-xl font-bold text-white">
                    {department}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    {meta?.body ?? "Live department workload"}
                  </p>

                  {/* Pressure bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                      <span>Queue pressure</span>
                      <span className={meta?.text ?? "text-teal-300"}>{pressure}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pressure}%`,
                          background: `linear-gradient(90deg, ${meta?.tint ?? "#14b8a6"}99, ${meta?.tint ?? "#14b8a6"})`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <DepartmentStat label="Waiting" value={waiting} className={meta?.stat} />
                    <DepartmentStat label="Active" value={active} className={meta?.stat} />
                    <DepartmentStat label="Closed" value={closed} className={meta?.stat} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </QueryBoundary>
    </ModulePage>
  );
}

function DepartmentStat({ label, value, className }) {
  return (
    <div className={`rounded-xl border p-3 ${className ?? "border-white/[0.08] bg-white/[0.03]"}`}>
      <div className="text-[9px] uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className="mt-1.5 font-display text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function flattenAvgWait(data) {
  const rows = [];
  const overall = data?.overall ?? {};
  rows.push({ Section: "Overall", Department: "All", ...overall });
  for (const [dept, d] of Object.entries(data?.byDepartment ?? {})) {
    rows.push({ Section: "By Department", Department: dept, ...d });
  }
  return rows;
}

function flattenDeptPerformance(data) {
  const rows = [];
  for (const [dept, d] of Object.entries(data?.byDepartment ?? {})) {
    rows.push({
      Department: dept,
      Total: d.totalTickets,
      Completed: d.completed,
      Missed: d.missed,
      "Missed Rate (%)": d.missedRate,
      "Avg Service Time (m)": d.avgServiceTime,
      Active: d.active,
      Red: d.byPriority?.red ?? 0,
      Yellow: d.byPriority?.yellow ?? 0,
      Green: d.byPriority?.green ?? 0,
    });
  }
  return rows;
}

function flattenNoShow(data) {
  const rows = [];
  const overall = data?.overall ?? {};
  rows.push({
    Section: "Overall",
    "Total Tickets": overall.totalTickets ?? 0,
    "No-Show Rate (%)": overall.noShowRate ?? 0,
    "Missed w/ Delivered Notif": overall.missedWithDeliveredNotification ?? 0,
    "Missed w/o Notif": overall.missedWithoutNotification ?? 0,
  });
  for (const t of data?.missedTickets ?? []) {
    rows.push({
      Section: "Missed Ticket",
      Ticket: t.ticket,
      Patient: t.patientName,
      Department: t.department,
      "Wait (m)": t.waitMinutes,
      "Notifs Sent": t.notificationsSent,
      "Notifs Delivered": t.notificationsDelivered,
      "Had Delivered Notif": t.hadDeliveredNotification ? "Yes" : "No",
    });
  }
  return rows;
}

function flattenTriage(data) {
  const rows = [];
  const overall = data?.overall ?? {};
  rows.push({
    Section: "Overall",
    "Total Tickets": overall.totalTickets ?? 0,
    "Triage Rate (%)": overall.triageRate ?? 0,
    "Avg Triage Time (m)": overall.avgTriageTimeMinutes ?? 0,
    "Auto-Classified": overall.autoClassified ?? 0,
  });
  for (const [prio, d] of Object.entries(data?.byPriority ?? {})) {
    rows.push({
      Section: "By Priority",
      Priority: prio,
      Total: d.total,
      Assessed: d.withAssessment,
      "Auto-Classified": d.autoClassified,
      "Avg Triage Time (m)": d.avgTriageTimeMinutes,
      Completed: d.outcomes?.completed ?? 0,
      Missed: d.outcomes?.missed ?? 0,
      "In Service": d.outcomes?.inService ?? 0,
    });
  }
  return rows;
}

function flattenLabTurnaround(data) {
  const rows = [];
  const overall = data?.overall ?? {};
  rows.push({
    Section: "Overall",
    "Total Orders": overall.totalOrders ?? 0,
    Completed: overall.completed ?? 0,
    Pending: overall.pending ?? 0,
    "In Progress": overall.inProgress ?? 0,
    "Avg Turnaround (m)": overall.avgTurnaroundMinutes ?? 0,
  });
  for (const [type, t] of Object.entries(data?.byTestType ?? {})) {
    rows.push({
      Section: "By Test Type",
      "Test Type": type,
      Total: t.total,
      Completed: t.completed,
      "Avg Turnaround (m)": t.avgTurnaroundMinutes,
      "Avg Sample→Result (m)": t.avgSampleToResultMinutes,
    });
  }
  return rows;
}

function flattenStaffWorkload(data) {
  const rows = [];
  const overall = data?.overall ?? {};
  rows.push({
    Section: "Overall",
    "Total Staff": overall.totalStaff ?? 0,
    "Total Actions": overall.totalActions ?? 0,
    "Total Triage": overall.totalTriage ?? 0,
    "Total Completed": overall.totalCompleted ?? 0,
  });
  for (const s of data?.byStaff ?? []) {
    rows.push({
      Section: "By Staff",
      "Staff Name": s.staffName,
      Triaged: s.triaged,
      Called: s.called,
      Completed: s.completed,
      Transferred: s.transferred,
      "Rx Created": s.prescriptionsCreated,
      "Tests Ordered": s.testOrdersCreated,
      "Total Actions": s.totalActions,
    });
  }
  return rows;
}

function flattenOutOfStock(data) {
  const rows = [];
  const overall = data?.overall ?? {};
  rows.push({
    Section: "Overall",
    "Total Items": overall.totalItems ?? 0,
    "Out of Stock": overall.outOfStockCount ?? 0,
    "Affected Pending Rx": overall.affectedPendingPrescriptions ?? 0,
  });
  for (const item of data?.allItems ?? []) {
    rows.push({
      Section: item.outOfStock ? "Out of Stock" : "In Stock",
      "Item Name": item.name,
      "Total Prescribed": item.totalPrescribed,
      "Pending Count": item.pendingCount,
      "Out of Stock": item.outOfStock ? "Yes" : "No",
      "Affected Tickets": item.affectedTickets.join(", "),
    });
  }
  return rows;
}

function flattenPeakHours(data) {
  const rows = [];
  rows.push({
    Section: "Summary",
    "Total Tickets": data?.totalTickets ?? 0,
  });
  for (const h of data?.peakHours ?? []) {
    rows.push({
      Section: "Peak Hours",
      Hour: `${h.hour}:00`,
      Registrations: h.registrations,
      Completions: h.completions,
      Missed: h.missed,
    });
  }
  for (const h of data?.hourly ?? []) {
    if (h.registrations === 0 && h.completions === 0 && h.missed === 0) continue;
    rows.push({
      Section: "Hourly",
      Hour: `${h.hour}:00`,
      Registrations: h.registrations,
      Completions: h.completions,
      Missed: h.missed,
    });
  }
  return rows;
}

function flattenCongestion(data) {
  const rows = [];
  for (const [dept, d] of Object.entries(data?.byDept ?? {})) {
    rows.push({
      Section: "By Department",
      Department: dept,
      "Total Tickets": d.totalTickets,
      Waiting: d.waiting,
      "In Service": d.inService,
      Completed: d.completed,
      Missed: d.missed,
      "Missed Rate (%)": d.missedRate,
      "Avg Wait (m)": d.avgWaitMinutes,
      "Avg Service (m)": d.avgServiceMinutes,
      Load: d.load,
      Capacity: d.capacity,
      "Utilization (%)": d.utilization,
      "Congestion Level": d.congestionLevel,
    });
  }
  return rows;
}

function flattenResourceAllocation(data) {
  const rows = [];
  const overall = data?.overall ?? {};
  rows.push({
    Section: "Overall",
    "Total Tickets": overall.totalTickets ?? 0,
    "Total Prescriptions": overall.totalPrescriptions ?? 0,
    "Total Test Orders": overall.totalTestOrders ?? 0,
    "Est. Staff Needed": overall.totalStaffNeeded ?? 0,
  });
  for (const [dept, d] of Object.entries(data?.byDept ?? {})) {
    rows.push({
      Section: "By Department",
      Department: dept,
      "Total Tickets": d.totalTickets,
      Completed: d.completed,
      Active: d.active,
      "Avg Service (m)": d.avgServiceMinutes,
      "Total Service (m)": d.totalServiceMinutes,
      "Est. Staff Needed": d.estimatedStaffNeeded,
      Throughput: d.throughput,
    });
  }
  for (const [dept, d] of Object.entries(data?.pharmacyLoad ?? {})) {
    rows.push({
      Section: "Pharmacy Load",
      Department: dept,
      Total: d.total,
      Pending: d.pending,
      Ready: d.ready,
      Collected: d.collected,
    });
  }
  for (const [type, d] of Object.entries(data?.labLoad ?? {})) {
    rows.push({
      Section: "Lab Load",
      "Test Type": type,
      Total: d.total,
      Pending: d.pending,
      Completed: d.completed,
    });
  }
  return rows;
}

function flattenOverview(data) {
  const m = data?.metrics ?? {};
  const rows = [
    { Metric: "Total Patients", Value: m.total ?? 0 },
    { Metric: "Waiting", Value: m.byStatus?.waiting ?? 0 },
    { Metric: "Called", Value: m.byStatus?.called ?? 0 },
    { Metric: "In Service", Value: m.byStatus?.["in-service"] ?? 0 },
    { Metric: "Missed", Value: m.byStatus?.missed ?? 0 },
    { Metric: "Completed", Value: m.byStatus?.completed ?? 0 },
    { Metric: "Average Wait (m)", Value: m.avgWait ?? 0 },
    { Metric: "Notifications Today", Value: m.notificationsToday ?? 0 },
  ];
  return rows;
}

const REPORT_LABELS = {
  overview: "Overview",
  "avg-wait": "Average Wait Time",
  "dept-performance": "Department Performance",
  "no-show": "No-Show Analysis",
  triage: "Triage Report",
  "lab-turnaround": "Lab Turnaround Time",
  "staff-workload": "Staff Workload",
  "out-of-stock": "Out-of-Stock Items",
  "peak-hours": "Peak Hours",
  congestion: "Congestion Detection",
  "resource-allocation": "Resource Allocation",
  whatsapp: "WhatsApp Status",
};

function getReportRows(activeReport, queries) {
  switch (activeReport) {
    case "overview":
      return flattenOverview(queries.overviewQuery.data);
    case "avg-wait":
      return flattenAvgWait(queries.avgWaitQuery.data);
    case "dept-performance":
      return flattenDeptPerformance(queries.perfQuery.data);
    case "no-show":
      return flattenNoShow(queries.noShowQuery.data);
    case "triage":
      return flattenTriage(queries.triageQuery.data);
    case "lab-turnaround":
      return flattenLabTurnaround(queries.labTurnaroundQuery.data);
    case "staff-workload":
      return flattenStaffWorkload(queries.staffWorkloadQuery.data);
    case "out-of-stock":
      return flattenOutOfStock(queries.outOfStockQuery.data);
    case "peak-hours":
      return flattenPeakHours(queries.peakHoursQuery.data);
    case "congestion":
      return flattenCongestion(queries.congestionQuery.data);
    case "resource-allocation":
      return flattenResourceAllocation(queries.resourceAllocationQuery.data);
    default:
      return [];
  }
}

function getReportSections(activeReport, queries) {
  const label = REPORT_LABELS[activeReport] ?? "Report";
  const rows = getReportRows(activeReport, queries);
  return [{ title: label, rows }];
}

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState("overview");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filters = {};
  if (dateFrom) filters.from = dateFrom;
  if (dateTo) filters.to = dateTo;

  const overviewQuery = useDashboardSummary();
  const avgWaitQuery = useApiResource(
    useCallback(() => fetchAverageWaitReport(filters), [dateFrom, dateTo]),
    { enabled: isBrowser && activeReport === "avg-wait" },
  );
  const perfQuery = useApiResource(
    useCallback(() => fetchDepartmentPerformanceReport(filters), [dateFrom, dateTo]),
    { enabled: isBrowser && activeReport === "dept-performance" },
  );
  const noShowQuery = useApiResource(
    useCallback(() => fetchNoShowReport(filters), [dateFrom, dateTo]),
    { enabled: isBrowser && activeReport === "no-show" },
  );
  const triageQuery = useApiResource(
    useCallback(() => fetchTriageReport(filters), [dateFrom, dateTo]),
    { enabled: isBrowser && activeReport === "triage" },
  );
  const labTurnaroundQuery = useApiResource(
    useCallback(() => fetchLabTurnaroundReport(filters), [dateFrom, dateTo]),
    { enabled: isBrowser && activeReport === "lab-turnaround" },
  );
  const staffWorkloadQuery = useApiResource(
    useCallback(() => fetchStaffWorkloadReport(filters), [dateFrom, dateTo]),
    { enabled: isBrowser && activeReport === "staff-workload" },
  );
  const outOfStockQuery = useApiResource(
    useCallback(() => fetchOutOfStockReport(), []),
    { enabled: isBrowser && activeReport === "out-of-stock" },
  );
  const peakHoursQuery = useApiResource(
    useCallback(() => fetchPeakHoursReport(filters), [dateFrom, dateTo]),
    { enabled: isBrowser && activeReport === "peak-hours" },
  );
  const congestionQuery = useApiResource(
    useCallback(() => fetchCongestionReport(filters), [dateFrom, dateTo]),
    { enabled: isBrowser && activeReport === "congestion" },
  );
  const resourceAllocationQuery = useApiResource(
    useCallback(() => fetchResourceAllocationReport(filters), [dateFrom, dateTo]),
    { enabled: isBrowser && activeReport === "resource-allocation" },
  );
  const whatsAppQuery = useApiResource(
    useCallback(() => fetchWhatsAppStatus(), []),
    { enabled: isBrowser && activeReport === "whatsapp" },
  );

  const metrics = overviewQuery.data?.metrics;

  const reportTabs = [
    { value: "overview", label: "Overview" },
    { value: "avg-wait", label: "Average Wait Time" },
    { value: "dept-performance", label: "Department Performance" },
    { value: "no-show", label: "No-Show Analysis" },
    { value: "triage", label: "Triage Report" },
    { value: "lab-turnaround", label: "Lab Turnaround" },
    { value: "staff-workload", label: "Staff Workload" },
    { value: "out-of-stock", label: "Out-of-Stock" },
    { value: "peak-hours", label: "Peak Hours" },
    { value: "congestion", label: "Congestion" },
    { value: "resource-allocation", label: "Resource Allocation" },
    { value: "whatsapp", label: "WhatsApp Status" },
  ];

  return (
    <ModulePage
      eyebrow="Operational insight"
      title="Reports"
      description="Comprehensive reports covering patient flow, department performance, no-show analysis, triage outcomes, and WhatsApp configuration."
      icon={FileChartColumn}
    >
      <div className="surface-panel mb-4 flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex flex-wrap gap-2">
          {reportTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveReport(tab.value)}
              className={`rounded-full px-3 py-2 text-xs font-semibold ${activeReport === tab.value ? "gradient-primary text-primary-foreground" : "border border-border bg-background/70 text-muted-foreground"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeReport !== "overview" && activeReport !== "whatsapp" && activeReport !== "out-of-stock" && (
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-base h-9 w-auto text-xs" placeholder="From" />
            <span className="text-xs text-muted-foreground">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-base h-9 w-auto text-xs" placeholder="To" />
          </div>
        )}
        {activeReport !== "whatsapp" && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const rows = getReportRows(activeReport, { overviewQuery, avgWaitQuery, perfQuery, noShowQuery, triageQuery, labTurnaroundQuery, staffWorkloadQuery, outOfStockQuery, peakHoursQuery, congestionQuery, resourceAllocationQuery });
                if (rows.length > 0) {
                  exportCSV(`waitless-${activeReport}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-background"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
            <button
              type="button"
              onClick={() => {
                const rows = getReportRows(activeReport, { overviewQuery, avgWaitQuery, perfQuery, noShowQuery, triageQuery, labTurnaroundQuery, staffWorkloadQuery, outOfStockQuery, peakHoursQuery, congestionQuery, resourceAllocationQuery });
                if (rows.length > 0) {
                  exportXLSX(`waitless-${activeReport}-${new Date().toISOString().slice(0, 10)}.xls`, rows);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-background"
            >
              <Download className="h-3.5 w-3.5" />
              Excel
            </button>
            <button
              type="button"
              onClick={() => {
                const sections = getReportSections(activeReport, { overviewQuery, avgWaitQuery, perfQuery, noShowQuery, triageQuery, labTurnaroundQuery, staffWorkloadQuery, outOfStockQuery, peakHoursQuery, congestionQuery, resourceAllocationQuery });
                exportPDF(REPORT_LABELS[activeReport] ?? "Report", sections);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-background"
            >
              <FileText className="h-3.5 w-3.5" />
              PDF
            </button>
          </div>
        )}
      </div>

      {activeReport === "overview" && (
        <QueryBoundary query={overviewQuery} title="Preparing reports">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Patients tracked" value={metrics?.total ?? 0} detail="All tickets in the current dataset" icon={Users} />
            <MetricTile label="Average wait" value={`${metrics?.avgWait ?? 0}m`} detail="Across active patient flow" icon={Timer} />
            <MetricTile label="Completed" value={metrics?.byStatus?.completed ?? 0} detail="Visits closed successfully" icon={CheckCircle2} />
            <MetricTile label="Notifications" value={metrics?.notificationsToday ?? 0} detail="Patient messages issued today" icon={BellRing} />
          </div>
          <article className="surface-panel mt-5 overflow-hidden">
            <div className="border-b border-border/70 px-6 py-5">
              <h2 className="font-display text-2xl font-bold">Status breakdown</h2>
            </div>
            <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(metrics?.byStatus ?? {}).map(([status, value]) => (
                <DepartmentStat key={status} label={STATUS_META[status]?.label ?? status} value={value} />
              ))}
            </div>
          </article>
        </QueryBoundary>
      )}

      {activeReport === "avg-wait" && (
        <QueryBoundary query={avgWaitQuery} title="Loading average wait report">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricTile label="Total tickets" value={avgWaitQuery.data?.overall?.totalTickets ?? 0} detail="In selected period" icon={Users} />
            <MetricTile label="Avg wait" value={`${avgWaitQuery.data?.overall?.avgWait ?? 0}m`} detail="Current average" icon={Timer} />
            <MetricTile label="Avg service time" value={`${avgWaitQuery.data?.overall?.avgServiceTime ?? 0}m`} detail="Completed visits" icon={Clock3} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(avgWaitQuery.data?.byDepartment ?? {}).map(([dept, d]) => (
              <div key={dept} className="surface-panel p-5">
                <h3 className="font-display text-lg font-bold">{dept}</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <DepartmentStat label="Tickets" value={d.totalTickets} />
                  <DepartmentStat label="Waiting" value={d.waiting} />
                  <DepartmentStat label="Avg wait" value={`${d.avgCurrentWait}m`} />
                  <DepartmentStat label="Avg service" value={`${d.avgServiceTime}m`} />
                  <DepartmentStat label="Max wait" value={`${d.maxWait}m`} />
                  <DepartmentStat label="Completed" value={d.completed} />
                </div>
              </div>
            ))}
          </div>
        </QueryBoundary>
      )}

      {activeReport === "dept-performance" && (
        <QueryBoundary query={perfQuery} title="Loading department performance">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(perfQuery.data?.byDepartment ?? {}).map(([dept, d]) => (
              <div key={dept} className="surface-panel p-5">
                <h3 className="font-display text-lg font-bold">{dept}</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <DepartmentStat label="Total" value={d.totalTickets} />
                  <DepartmentStat label="Completed" value={d.completed} />
                  <DepartmentStat label="Missed" value={d.missed} />
                  <DepartmentStat label="Missed rate" value={`${d.missedRate}%`} />
                  <DepartmentStat label="Avg service" value={`${d.avgServiceTime}m`} />
                  <DepartmentStat label="Active" value={d.active} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                  <span className="rounded-full bg-priority-red/15 px-2 py-0.5 font-bold text-priority-red">Red: {d.byPriority.red}</span>
                  <span className="rounded-full bg-priority-yellow/15 px-2 py-0.5 font-bold text-priority-yellow">Yellow: {d.byPriority.yellow}</span>
                  <span className="rounded-full bg-priority-green/15 px-2 py-0.5 font-bold text-priority-green">Green: {d.byPriority.green}</span>
                </div>
              </div>
            ))}
          </div>
        </QueryBoundary>
      )}

      {activeReport === "no-show" && (
        <QueryBoundary query={noShowQuery} title="Loading no-show report">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Total tickets" value={noShowQuery.data?.overall?.totalTickets ?? 0} detail="In selected period" icon={Users} />
            <MetricTile label="No-show rate" value={`${noShowQuery.data?.overall?.noShowRate ?? 0}%`} detail="Missed / total" icon={AlertTriangle} />
            <MetricTile label="Missed w/ notif" value={noShowQuery.data?.overall?.missedWithDeliveredNotification ?? 0} detail="Had delivered notification" icon={MessageCircle} />
            <MetricTile label="Missed w/o notif" value={noShowQuery.data?.overall?.missedWithoutNotification ?? 0} detail="No notification sent" icon={AlertTriangle} />
          </div>
          {(noShowQuery.data?.missedTickets ?? []).length > 0 && (
            <article className="surface-panel mt-5 overflow-hidden">
              <div className="border-b border-border/70 px-6 py-5">
                <h2 className="font-display text-2xl font-bold">Missed ticket details</h2>
              </div>
              <div className="divide-y divide-border/70">
                {(noShowQuery.data?.missedTickets ?? []).map((t) => (
                  <div key={t.ticketId} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`inline-grid h-9 w-16 shrink-0 place-items-center rounded-lg font-display text-xs font-bold ${priorityChipClass[t.priority] ?? ""}`}>{t.ticket}</span>
                      <div>
                        <div className="text-sm font-semibold">{t.patientName}</div>
                        <div className="text-xs text-muted-foreground">{t.department} · waited {t.waitMinutes}m</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Notifs sent: {t.notificationsSent}</span>
                      <span>Delivered: {t.notificationsDelivered}</span>
                      {t.hadDeliveredNotification ? (
                        <span className="rounded-full bg-priority-green/15 px-2 py-0.5 font-bold text-priority-green">Notified</span>
                      ) : (
                        <span className="rounded-full bg-priority-yellow/15 px-2 py-0.5 font-bold text-priority-yellow">No notif</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}
        </QueryBoundary>
      )}

      {activeReport === "triage" && (
        <QueryBoundary query={triageQuery} title="Loading triage report">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Total tickets" value={triageQuery.data?.overall?.totalTickets ?? 0} detail="In selected period" icon={Users} />
            <MetricTile label="Triage rate" value={`${triageQuery.data?.overall?.triageRate ?? 0}%`} detail="Triaged / total" icon={CheckCircle2} />
            <MetricTile label="Avg triage time" value={`${triageQuery.data?.overall?.avgTriageTimeMinutes ?? 0}m`} detail="Registration to triage" icon={Timer} />
            <MetricTile label="Auto-classified" value={triageQuery.data?.overall?.autoClassified ?? 0} detail="Emergency auto-red" icon={AlertTriangle} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {Object.entries(triageQuery.data?.byPriority ?? {}).map(([prio, d]) => (
              <div key={prio} className="surface-panel p-5">
                <h3 className="font-display text-lg font-bold">{PRIORITY_META[prio]?.label ?? prio}</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <DepartmentStat label="Total" value={d.total} />
                  <DepartmentStat label="Assessed" value={d.withAssessment} />
                  <DepartmentStat label="Auto-classified" value={d.autoClassified} />
                  <DepartmentStat label="Avg triage time" value={`${d.avgTriageTimeMinutes}m`} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                  <span className="rounded-full bg-priority-green/15 px-2 py-0.5 font-bold text-priority-green">Completed: {d.outcomes.completed}</span>
                  <span className="rounded-full bg-priority-yellow/15 px-2 py-0.5 font-bold text-priority-yellow">Missed: {d.outcomes.missed}</span>
                  <span className="rounded-full bg-blue-500/15 px-2 py-0.5 font-bold text-blue-600 dark:text-blue-300">In service: {d.outcomes.inService}</span>
                </div>
                {d.emergencyTriggers.length > 0 && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Emergency triggers: {d.emergencyTriggers.map((t) => t.field ?? t).join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </QueryBoundary>
      )}

      {activeReport === "lab-turnaround" && (
        <QueryBoundary query={labTurnaroundQuery} title="Loading lab turnaround report">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Total orders" value={labTurnaroundQuery.data?.overall?.totalOrders ?? 0} detail="In selected period" icon={FlaskConical} />
            <MetricTile label="Completed" value={labTurnaroundQuery.data?.overall?.completed ?? 0} detail="Results ready" icon={CheckCircle2} />
            <MetricTile label="Avg turnaround" value={`${labTurnaroundQuery.data?.overall?.avgTurnaroundMinutes ?? 0}m`} detail="Order to result" icon={Timer} />
            <MetricTile label="Pending" value={labTurnaroundQuery.data?.overall?.pending ?? 0} detail="Awaiting results" icon={Clock3} />
          </div>
          <div className="mt-4 surface-panel p-4">
            <h3 className="font-display text-lg font-bold">By Test Type</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-4">Test Type</th>
                    <th className="pb-2 pr-4">Total</th>
                    <th className="pb-2 pr-4">Completed</th>
                    <th className="pb-2 pr-4">Avg Turnaround</th>
                    <th className="pb-2 pr-4">Avg Sample→Result</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(labTurnaroundQuery.data?.byTestType ?? {}).map(([type, t]) => (
                    <tr key={type} className="border-b border-border/40">
                      <td className="py-2 pr-4 font-medium">{type}</td>
                      <td className="py-2 pr-4">{t.total}</td>
                      <td className="py-2 pr-4">{t.completed}</td>
                      <td className="py-2 pr-4">{t.avgTurnaroundMinutes}m</td>
                      <td className="py-2 pr-4">{t.avgSampleToResultMinutes}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {labTurnaroundQuery.data?.pendingDetails?.length > 0 && (
            <div className="mt-4 surface-panel p-4">
              <h3 className="font-display text-lg font-bold">Pending Orders</h3>
              <div className="mt-3 space-y-2">
                {labTurnaroundQuery.data.pendingDetails.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 px-4 py-2.5">
                    <div>
                      <span className="font-semibold">{o.ticketCode}</span>
                      <span className="ml-2 text-muted-foreground">{o.testType}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-600 dark:text-amber-300">{o.state}</span>
                      <span className="text-muted-foreground">{o.waitingMinutes}m waiting</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </QueryBoundary>
      )}

      {activeReport === "staff-workload" && (
        <QueryBoundary query={staffWorkloadQuery} title="Loading staff workload report">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Total staff" value={staffWorkloadQuery.data?.overall?.totalStaff ?? 0} detail="Active in period" icon={Users} />
            <MetricTile label="Total actions" value={staffWorkloadQuery.data?.overall?.totalActions ?? 0} detail="All activities" icon={Activity} />
            <MetricTile label="Triage actions" value={staffWorkloadQuery.data?.overall?.totalTriage ?? 0} detail="Assessments completed" icon={Stethoscope} />
            <MetricTile label="Completed visits" value={staffWorkloadQuery.data?.overall?.totalCompleted ?? 0} detail="Patients processed" icon={CheckCircle2} />
          </div>
          <div className="mt-4 surface-panel p-4">
            <h3 className="font-display text-lg font-bold">By Staff Member</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-4">Staff Name</th>
                    <th className="pb-2 pr-4">Triaged</th>
                    <th className="pb-2 pr-4">Called</th>
                    <th className="pb-2 pr-4">Completed</th>
                    <th className="pb-2 pr-4">Transfers</th>
                    <th className="pb-2 pr-4">Rx Created</th>
                    <th className="pb-2 pr-4">Tests Ordered</th>
                    <th className="pb-2 pr-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(staffWorkloadQuery.data?.byStaff ?? []).map((s) => (
                    <tr key={s.staffName} className="border-b border-border/40">
                      <td className="py-2 pr-4 font-medium">{s.staffName}</td>
                      <td className="py-2 pr-4">{s.triaged}</td>
                      <td className="py-2 pr-4">{s.called}</td>
                      <td className="py-2 pr-4">{s.completed}</td>
                      <td className="py-2 pr-4">{s.transferred}</td>
                      <td className="py-2 pr-4">{s.prescriptionsCreated}</td>
                      <td className="py-2 pr-4">{s.testOrdersCreated}</td>
                      <td className="py-2 pr-4 font-bold">{s.totalActions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </QueryBoundary>
      )}

      {activeReport === "out-of-stock" && (
        <QueryBoundary query={outOfStockQuery} title="Loading out-of-stock report">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricTile label="Total items" value={outOfStockQuery.data?.overall?.totalItems ?? 0} detail="Unique prescribed items" icon={Pill} />
            <MetricTile label="Out of stock" value={outOfStockQuery.data?.overall?.outOfStockCount ?? 0} detail="Currently unavailable" icon={AlertTriangle} />
            <MetricTile label="Affected Rx" value={outOfStockQuery.data?.overall?.affectedPendingPrescriptions ?? 0} detail="Pending prescriptions impacted" icon={FileText} />
          </div>
          {(outOfStockQuery.data?.outOfStock ?? []).length > 0 && (
            <div className="mt-4 surface-panel p-4">
              <h3 className="font-display text-lg font-bold text-destructive">Out-of-Stock Items</h3>
              <div className="mt-3 space-y-2">
                {outOfStockQuery.data.outOfStock.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                    <div>
                      <span className="font-semibold">{item.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {item.pendingCount} pending · {item.totalPrescribed} total prescribed
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {item.affectedTickets.map((t) => (
                        <span key={t} className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-mono">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(outOfStockQuery.data?.outOfStock ?? []).length === 0 && (
            <div className="mt-4 surface-panel p-6 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-priority-green" />
              <p className="mt-2 text-sm text-muted-foreground">No out-of-stock items. All prescribed medications are available.</p>
            </div>
          )}
        </QueryBoundary>
      )}

      {activeReport === "peak-hours" && (
        <QueryBoundary query={peakHoursQuery} title="Loading peak hours report">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Total tickets" value={peakHoursQuery.data?.totalTickets ?? 0} detail="In selected period" icon={Users} />
            {(peakHoursQuery.data?.peakHours ?? []).slice(0, 3).map((h) => (
              <MetricTile key={h.hour} label={`Peak at ${h.hour}:00`} value={h.registrations} detail="Registrations" icon={TrendingUp} />
            ))}
          </div>
          <div className="mt-4 surface-panel p-4">
            <h3 className="font-display text-lg font-bold">Hourly Distribution</h3>
            <div className="mt-3 flex items-end gap-1" style={{ height: 180 }}>
              {(peakHoursQuery.data?.hourly ?? []).map((h) => {
                const maxReg = Math.max(1, ...(peakHoursQuery.data?.hourly ?? []).map((x) => x.registrations));
                const heightPct = Math.max(2, Math.round((h.registrations / maxReg) * 100));
                return (
                  <div key={h.hour} className="flex flex-1 flex-col items-center justify-end" title={`${h.hour}:00, ${h.registrations} registrations`}>
                    <div className="w-full rounded-t bg-primary/70" style={{ height: `${heightPct}%` }} />
                    <span className="mt-1 text-[9px] text-muted-foreground">{h.hour}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {(peakHoursQuery.data?.peakHours ?? []).length > 0 && (
            <div className="mt-4 surface-panel p-4">
              <h3 className="font-display text-lg font-bold">Top Peak Hours</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-4">Hour</th>
                      <th className="pb-2 pr-4">Registrations</th>
                      <th className="pb-2 pr-4">Completions</th>
                      <th className="pb-2 pr-4">Missed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {peakHoursQuery.data.peakHours.map((h) => (
                      <tr key={h.hour} className="border-b border-border/40">
                        <td className="py-2 pr-4 font-medium">{h.hour}:00</td>
                        <td className="py-2 pr-4">{h.registrations}</td>
                        <td className="py-2 pr-4">{h.completions}</td>
                        <td className="py-2 pr-4">{h.missed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </QueryBoundary>
      )}

      {activeReport === "congestion" && (
        <QueryBoundary query={congestionQuery} title="Loading congestion report">
          {(congestionQuery.data?.congestedDepartments ?? []).length > 0 && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
              <div className="flex items-center gap-2 font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {congestionQuery.data.congestedDepartments.length} congested department(s) detected
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {congestionQuery.data.congestedDepartments.map((d) => (
                  <span key={d.department} className={`rounded-full px-3 py-1 text-xs font-bold ${
                    d.congestionLevel === "critical" ? "bg-destructive/20 text-destructive" : "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                  }`}>
                    {d.department}, {d.congestionLevel} ({d.utilization}%)
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="surface-panel p-4">
            <h3 className="font-display text-lg font-bold">Department Congestion</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-4">Department</th>
                    <th className="pb-2 pr-4">Waiting</th>
                    <th className="pb-2 pr-4">In Service</th>
                    <th className="pb-2 pr-4">Avg Wait</th>
                    <th className="pb-2 pr-4">Utilization</th>
                    <th className="pb-2 pr-4">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(congestionQuery.data?.byDept ?? {}).map(([dept, d]) => (
                    <tr key={dept} className="border-b border-border/40">
                      <td className="py-2 pr-4 font-medium">{dept}</td>
                      <td className="py-2 pr-4">{d.waiting}</td>
                      <td className="py-2 pr-4">{d.inService}</td>
                      <td className="py-2 pr-4">{d.avgWaitMinutes}m</td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 rounded-full bg-border/50">
                            <div className={`h-2 rounded-full ${d.congestionLevel === "critical" ? "bg-destructive" : d.congestionLevel === "high" ? "bg-amber-500" : d.congestionLevel === "moderate" ? "bg-blue-500" : "bg-priority-green"}`} style={{ width: `${d.utilization}%` }} />
                          </div>
                          <span className="text-xs">{d.utilization}%</span>
                        </div>
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          d.congestionLevel === "critical" ? "bg-destructive/15 text-destructive" :
                          d.congestionLevel === "high" ? "bg-amber-500/15 text-amber-600 dark:text-amber-300" :
                          d.congestionLevel === "moderate" ? "bg-blue-500/15 text-blue-600 dark:text-blue-300" :
                          "bg-priority-green/15 text-priority-green"
                        }`}>
                          {d.congestionLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </QueryBoundary>
      )}

      {activeReport === "resource-allocation" && (
        <QueryBoundary query={resourceAllocationQuery} title="Loading resource allocation report">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Total tickets" value={resourceAllocationQuery.data?.overall?.totalTickets ?? 0} detail="In selected period" icon={Users} />
            <MetricTile label="Prescriptions" value={resourceAllocationQuery.data?.overall?.totalPrescriptions ?? 0} detail="Total Rx" icon={Pill} />
            <MetricTile label="Test orders" value={resourceAllocationQuery.data?.overall?.totalTestOrders ?? 0} detail="Total lab orders" icon={FlaskConical} />
            <MetricTile label="Est. staff needed" value={resourceAllocationQuery.data?.overall?.totalStaffNeeded ?? 0} detail="Across all depts" icon={Stethoscope} />
          </div>
          <div className="mt-4 surface-panel p-4">
            <h3 className="font-display text-lg font-bold">Department Resource Allocation</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-4">Department</th>
                    <th className="pb-2 pr-4">Active</th>
                    <th className="pb-2 pr-4">Completed</th>
                    <th className="pb-2 pr-4">Avg Service</th>
                    <th className="pb-2 pr-4">Est. Staff</th>
                    <th className="pb-2 pr-4">Throughput</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(resourceAllocationQuery.data?.byDept ?? {}).map(([dept, d]) => (
                    <tr key={dept} className="border-b border-border/40">
                      <td className="py-2 pr-4 font-medium">{dept}</td>
                      <td className="py-2 pr-4">{d.active}</td>
                      <td className="py-2 pr-4">{d.completed}</td>
                      <td className="py-2 pr-4">{d.avgServiceMinutes}m</td>
                      <td className="py-2 pr-4 font-bold">{d.estimatedStaffNeeded}</td>
                      <td className="py-2 pr-4">{d.throughput}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="surface-panel p-4">
              <h3 className="font-display text-lg font-bold">Pharmacy Load</h3>
              <div className="mt-3 space-y-2">
                {Object.entries(resourceAllocationQuery.data?.pharmacyLoad ?? {}).map(([dept, d]) => (
                  <div key={dept} className="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 px-4 py-2.5">
                    <span className="font-medium">{dept}</span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-amber-600 dark:text-amber-300">{d.pending} pending</span>
                      <span className="text-blue-600 dark:text-blue-300">{d.ready} ready</span>
                      <span className="text-priority-green">{d.collected} collected</span>
                    </div>
                  </div>
                ))}
                {Object.keys(resourceAllocationQuery.data?.pharmacyLoad ?? {}).length === 0 && (
                  <p className="text-sm text-muted-foreground">No prescription data available.</p>
                )}
              </div>
            </div>
            <div className="surface-panel p-4">
              <h3 className="font-display text-lg font-bold">Lab Load</h3>
              <div className="mt-3 space-y-2">
                {Object.entries(resourceAllocationQuery.data?.labLoad ?? {}).map(([type, d]) => (
                  <div key={type} className="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 px-4 py-2.5">
                    <span className="font-medium">{type}</span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-amber-600 dark:text-amber-300">{d.pending} pending</span>
                      <span className="text-priority-green">{d.completed} completed</span>
                    </div>
                  </div>
                ))}
                {Object.keys(resourceAllocationQuery.data?.labLoad ?? {}).length === 0 && (
                  <p className="text-sm text-muted-foreground">No test order data available.</p>
                )}
              </div>
            </div>
          </div>
        </QueryBoundary>
      )}

      {activeReport === "whatsapp" && (
        <QueryBoundary query={whatsAppQuery} title="Loading WhatsApp status">
          <div className="surface-panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h2 className="font-display text-2xl font-bold">WhatsApp Configuration</h2>
              {whatsAppQuery.data?.readinessLevel && (
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  whatsAppQuery.data.readinessLevel === "production-ready" ? "bg-priority-green/15 text-priority-green" :
                  whatsAppQuery.data.readinessLevel === "credentials-missing" ? "bg-destructive/15 text-destructive" :
                  whatsAppQuery.data.readinessLevel === "mock-ready" ? "bg-blue-500/15 text-blue-600 dark:text-blue-300" :
                  "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                }`}>
                  {whatsAppQuery.data.readinessLevel.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              )}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Provider</div>
                <div className="mt-2 font-display text-xl font-bold">{whatsAppQuery.data?.provider ?? "N/A"}</div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">API Version</div>
                <div className="mt-2 font-display text-xl font-bold">{whatsAppQuery.data?.apiVersion ?? "N/A"}</div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Language</div>
                <div className="mt-2 font-display text-xl font-bold">{whatsAppQuery.data?.language ?? "N/A"}</div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Configured</div>
                <div className="mt-2 font-display text-xl font-bold">
                  {whatsAppQuery.data?.configured ? (
                    <span className="text-priority-green">✓ Ready</span>
                  ) : (
                    <span className="text-destructive">✗ Missing credentials</span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <WhatsAppCheckItem label="Access token" configured={whatsAppQuery.data?.hasAccessToken} />
              <WhatsAppCheckItem label="Phone number ID" configured={whatsAppQuery.data?.hasPhoneNumberId} />
              <WhatsAppCheckItem label="App secret" configured={whatsAppQuery.data?.hasAppSecret} />
              <WhatsAppCheckItem label="Webhook verify token" configured={whatsAppQuery.data?.hasWebhookVerifyToken} />
              <WhatsAppCheckItem label="Template: Queue registered" configured={whatsAppQuery.data?.templatesConfigured?.queueRegistered} />
              <WhatsAppCheckItem label="Template: Queue ready soon" configured={whatsAppQuery.data?.templatesConfigured?.queueReadySoon} />
              <WhatsAppCheckItem label="Template: Queue called" configured={whatsAppQuery.data?.templatesConfigured?.queueCalled} />
            </div>

            {whatsAppQuery.data?.webhookUrl && (
              <div className="mt-4 rounded-xl border border-border/70 bg-background/70 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Webhook URL</div>
                <div className="mt-2 break-all font-mono text-xs text-muted-foreground">{whatsAppQuery.data.webhookUrl}</div>
              </div>
            )}

            {whatsAppQuery.data?.checklist && (
              <div className="mt-5">
                <h3 className="font-display text-lg font-bold">Setup checklist</h3>
                <div className="mt-3 space-y-2">
                  {whatsAppQuery.data.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/70 px-4 py-2.5">
                      {item.done ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-priority-green" />
                      ) : item.severity === "error" ? (
                        <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                      )}
                      <span className={`text-xs ${item.done ? "text-muted-foreground line-through" : "font-medium text-foreground"}`}>
                        {item.item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {whatsAppQuery.data?.missingRequired?.length > 0 && (
              <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <div className="font-semibold">Missing required environment variables:</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {whatsAppQuery.data.missingRequired.map((v) => (
                    <span key={v} className="rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-mono">{v}</span>
                  ))}
                </div>
              </div>
            )}

            {whatsAppQuery.data && !whatsAppQuery.data.configured && (
              <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                To enable live WhatsApp delivery, set WHATSAPP_PROVIDER=meta-cloud, WHATSAPP_ACCESS_TOKEN, and WHATSAPP_PHONE_NUMBER_ID in your .env file.
              </div>
            )}
          </div>
        </QueryBoundary>
      )}
    </ModulePage>
  );
}

function WhatsAppCheckItem({ label, configured }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 px-3 py-2">
      <span className="text-xs font-medium">{label}</span>
      {configured ? (
        <CheckCircle2 className="h-4 w-4 text-priority-green" />
      ) : (
        <XCircle className="h-4 w-4 text-destructive" />
      )}
    </div>
  );
}

export function QueueAnalyticsPage() {
  const query = useDashboardSummary();
  const tickets = query.data?.tickets ?? EMPTY_LIST;
  const metrics = query.data?.metrics;

  const deptLoads = useMemo(
    () =>
      DEPARTMENTS.map((department) => {
        const scoped = tickets.filter((ticket) => ticket.department === department);
        return {
          department,
          total: scoped.length,
          waiting: scoped.filter((ticket) => ticket.status === "waiting").length,
        };
      }),
    [tickets],
  );
  const maxLoad = Math.max(...deptLoads.map((d) => d.total), 1);
  const busiest = deptLoads.reduce(
    (top, d) => (d.total > top.total ? d : top),
    { department: "—", total: 0 },
  );
  const totalWaiting = deptLoads.reduce((sum, d) => sum + d.waiting, 0);

  return (
    <ModulePage
      eyebrow="Operational insight"
      title="Queue Analytics"
      description="See where patient demand is concentrated and which departments need additional attention."
      icon={TrendingUp}
    >
      <QueryBoundary query={query} title="Loading queue analytics">
        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="Tracked tickets"
            value={tickets.length}
            detail="Across all departments"
            icon={Users}
            accent="text-primary bg-primary/15"
          />
          <MetricTile
            label="Currently waiting"
            value={totalWaiting}
            detail="Not yet seen by staff"
            icon={Clock3}
            accent="text-amber-500 bg-amber-500/15"
          />
          <MetricTile
            label="Average wait"
            value={`${metrics?.avgWait ?? 0}m`}
            detail="Across active patient flow"
            icon={Timer}
            accent="text-sky-400 bg-sky-400/15"
          />
          <MetricTile
            label="Busiest department"
            value={busiest.department}
            detail={`${busiest.total} tickets tracked`}
            icon={Building2}
            accent="text-violet-500 bg-violet-500/15"
          />
        </div>

        {/* Department load */}
        <div className="surface-panel mt-5">
          <AdminPanelHeader
            icon={TrendingUp}
            title="Department load"
            subtitle="Tracked tickets and live waiting counts per department"
          />
          <div className="space-y-4 p-5">
            {deptLoads.map(({ department, total, waiting }) => {
              const width = total ? Math.max((total / maxLoad) * 100, 6) : 0;
              return (
                <div key={department}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold">{department}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {total} tracked · {waiting} waiting
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full gradient-primary transition-all duration-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </QueryBoundary>
    </ModulePage>
  );
}

export function NotificationsPage() {
  const { refreshLiveData } = useLiveRefresh();
  const query = useDashboardSummary();
  const [filter, setFilter] = useState("attention");
  const [search, setSearch] = useState("");
  const retryMutation = useApiAction(retryNotificationDelivery, { onSuccess: refreshLiveData });
  const notifications = query.data?.notifications ?? EMPTY_LIST;
  const deliveryStats = useMemo(() => {
    const stats = { attention: 0, inflight: 0, delivered: 0 };
    for (const n of notifications) {
      if (["failed", "retrying"].includes(n.status)) stats.attention += 1;
      else if (["queued", "sending", "sent"].includes(n.status)) stats.inflight += 1;
      else if (["delivered", "read"].includes(n.status)) stats.delivered += 1;
    }
    return stats;
  }, [notifications]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return notifications.filter((notification) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "attention" && ["failed", "retrying"].includes(notification.status)) ||
        (filter === "delivered" && ["delivered", "read"].includes(notification.status)) ||
        (filter === "inflight" && ["queued", "sending", "sent"].includes(notification.status));
      if (!matchesFilter) return false;
      if (!term) return true;
      return [
        notification.ticket,
        notification.patientName,
        notification.title,
        notification.department,
        notification.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [filter, notifications, search]);

  return (
    <ModulePage
      eyebrow="Patient communication"
      title="Notifications"
      description="Review delivery events, isolate failures, and retry patient messages from one focused workspace."
      icon={BellRing}
    >
      <QueryBoundary query={query} title="Loading notifications">
        {/* Delivery stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="Needs attention"
            value={deliveryStats.attention}
            detail="Failed or retrying deliveries"
            icon={AlertTriangle}
            accent="text-destructive bg-destructive/15"
          />
          <MetricTile
            label="In flight"
            value={deliveryStats.inflight}
            detail="Queued or sending now"
            icon={Send}
            accent="text-primary bg-primary/15"
          />
          <MetricTile
            label="Delivered"
            value={deliveryStats.delivered}
            detail="Reached the patient"
            icon={CheckCircle2}
            accent="text-priority-green bg-priority-green/15"
          />
          <MetricTile
            label="Total events"
            value={notifications.length}
            detail="In the notification log"
            icon={BellRing}
            accent="text-violet-500 bg-violet-500/15"
          />
        </div>

        {/* Toolbar */}
        <div className="surface-panel mt-4 flex flex-wrap items-center gap-3 p-3">
          <div className="flex flex-wrap gap-2">
            {[
              { value: "attention", label: "Needs attention" },
              { value: "inflight", label: "In flight" },
              { value: "delivered", label: "Delivered" },
              { value: "all", label: "All" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === option.value ? "gradient-primary text-primary-foreground" : "border border-border bg-background/70 text-muted-foreground"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <label className="relative min-w-[16rem] flex-1">
            <span className="sr-only">Search notifications</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notifications"
              className="input-base h-9 pl-10 text-sm"
            />
          </label>
        </div>

        {/* Notification list */}
        <div className="surface-panel mt-4">
          <AdminPanelHeader
            icon={BellRing}
            title="Notification log"
            subtitle="Delivery events across every channel"
            count={filtered.length}
          />
          <div className="divide-y divide-border/50">
            {filtered.length ? (
              filtered.map((notification) => (
                <article
                  key={notification.id}
                  className="flex flex-wrap items-start justify-between gap-4 px-5 py-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={`inline-grid h-9 w-16 shrink-0 place-items-center rounded-lg font-display text-xs font-bold ${priorityChipClass[notification.priority]}`}
                    >
                      {notification.ticket}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground">{notification.title}</div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {notification.patientName} · {notification.department}
                      </p>
                      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <NotificationState status={notification.status} />
                    {["failed", "retrying", "queued"].includes(notification.status) ? (
                      <button
                        type="button"
                        onClick={() => retryMutation.mutate(notification.id)}
                        disabled={retryMutation.isPending}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold hover:bg-muted disabled:opacity-60"
                      >
                        {retryMutation.isPending && retryMutation.variables === notification.id ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Retry
                      </button>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="p-6">
                <EmptyMessage>No notifications match this view.</EmptyMessage>
              </div>
            )}
          </div>
        </div>
      </QueryBoundary>
    </ModulePage>
  );
}

function NotificationState({ status }) {
  const classes =
    status === "failed"
      ? "bg-destructive/15 text-destructive"
      : status === "retrying"
        ? "bg-priority-yellow/20 text-priority-yellow"
        : ["delivered", "read"].includes(status)
          ? "bg-priority-green/15 text-priority-green"
          : "bg-primary-soft text-primary";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${classes}`}
    >
      {status}
    </span>
  );
}

function EmptyMessage({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

const PRESCRIPTION_COLUMNS = [
  { state: "prescribed", label: "Prescribed", badge: "bg-sky-400/15 text-sky-300 ring-sky-300/25", accent: "text-sky-300 bg-sky-400/15", tint: "#38bdf8" },
  { state: "dispensing", label: "Dispensing", badge: "bg-amber-400/15 text-amber-300 ring-amber-300/25", accent: "text-amber-300 bg-amber-400/15", tint: "#fbbf24" },
  { state: "ready", label: "Ready for Collection", badge: "bg-emerald-400/15 text-emerald-300 ring-emerald-300/25", accent: "text-emerald-300 bg-emerald-400/15", tint: "#34d399" },
  { state: "collected", label: "Collected", badge: "bg-zinc-400/15 text-zinc-300 ring-zinc-300/25", accent: "text-zinc-300 bg-zinc-400/15", tint: "#a1a1aa" },
];

const NEXT_STATE_MAP = {
  prescribed: "dispensing",
  dispensing: "ready",
  ready: "collected",
};

export function PharmacyPage() {
  const { refreshToken } = useLiveRefresh();
  const [search, setSearch] = useState("");
  const [advancing, setAdvancing] = useState(null);
  const [flagging, setFlagging] = useState(null);

  const summaryLoader = useCallback(() => fetchPrescriptionSummary(), []);
  const summaryQuery = useApiResource(summaryLoader, { enabled: isBrowser, refreshToken });

  const stockSummaryLoader = useCallback(() => fetchStockSummary(), []);
  const stockSummaryQuery = useApiResource(stockSummaryLoader, { enabled: isBrowser, refreshToken });

  const prescriptionsLoader = useCallback(() => fetchPrescriptionsWithStock(), []);
  const prescriptionsQuery = useApiResource(prescriptionsLoader, {
    enabled: isBrowser,
    refreshToken,
  });

  const advanceState = useApiAction(updatePrescriptionState);

  const prescriptions = prescriptionsQuery.data ?? [];
  const summary = summaryQuery.data;
  const stockSummary = stockSummaryQuery.data;

  const filtered = useMemo(() => {
    if (!search.trim()) return prescriptions;
    const q = search.toLowerCase();
    return prescriptions.filter(
      (p) =>
        p.ticketCode?.toLowerCase().includes(q) ||
        p.patientName?.toLowerCase().includes(q),
    );
  }, [prescriptions, search]);

  const byState = useMemo(() => {
    const map = {};
    for (const col of PRESCRIPTION_COLUMNS) {
      map[col.state] = filtered.filter((p) => p.state === col.state);
    }
    return map;
  }, [filtered]);

  async function handleAdvance(prescription) {
    const next = NEXT_STATE_MAP[prescription.state];
    if (!next) return;
    setAdvancing(prescription.id);
    try {
      await advanceState.mutate(prescription.id, next);
      prescriptionsQuery.refetch();
      summaryQuery.refetch();
    } finally {
      setAdvancing(null);
    }
  }

  async function handleStockFlag(prescription, item, inStock) {
    setFlagging(item.id);
    try {
      await flagPrescriptionItem(prescription.id, item.id, inStock);
      prescriptionsQuery.refetch();
      stockSummaryQuery.refetch();
    } finally {
      setFlagging(null);
    }
  }

  const isLoading = prescriptionsQuery.loading && !prescriptionsQuery.data;

  return (
    <ModulePage
      eyebrow="Clinical workflow"
      title="Pharmacy"
      description="Manage prescriptions from prescribed to collection — live queue updates flow in automatically."
      icon={Pill}
    >
      {/* Toolbar */}
      <div className="surface-panel flex flex-wrap items-center gap-3 p-3">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Search prescriptions</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search ticket or patient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base h-9 pl-9 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            prescriptionsQuery.refetch();
            summaryQuery.refetch();
            stockSummaryQuery.refetch();
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <LoadingPanel className="mt-5" title="Loading prescriptions" message="Fetching the live pharmacy queue." />
      ) : (
        <>
          {/* State summary */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PRESCRIPTION_COLUMNS.map((col) => (
              <AdminMetricTile
                key={col.state}
                label={col.label}
                value={summary?.byState?.[col.state] ?? byState[col.state]?.length ?? 0}
                icon={Pill}
                accent={col.accent}
                tint={col.tint}
              />
            ))}
          </div>

          {/* Out-of-stock alert */}
          {stockSummary && stockSummary.outOfStockCount > 0 ? (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-semibold text-destructive">
                  {stockSummary.outOfStockCount} medication(s) out of stock
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {stockSummary.outOfStockItems.map((item) => (
                  <span key={item.id} className="rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-medium text-destructive">
                    {item.drugName}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Kanban columns */}
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PRESCRIPTION_COLUMNS.map((col) => (
              <div
                key={col.state}
                className="relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
              >
                <span
                  className="absolute inset-x-0 top-0 h-0.5"
                  style={{ background: `linear-gradient(90deg, ${col.tint}00, ${col.tint}, ${col.tint}00)` }}
                />
                <div className="flex items-center justify-between px-2 pb-3 pt-1">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ring-1 ring-inset ${col.badge}`}
                  >
                    {col.label}
                  </span>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-bold tabular-nums text-white/70 ring-1 ring-inset ring-white/10">
                    {byState[col.state]?.length ?? 0}
                  </span>
                </div>
                <div className="mt-1 space-y-2">
                  {byState[col.state]?.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-white/30">
                      No prescriptions
                    </div>
                  ) : (
                    byState[col.state].map((rx) => (
                      <PrescriptionCard
                        key={rx.id}
                        prescription={rx}
                        canAdvance={!!NEXT_STATE_MAP[rx.state]}
                        onAdvance={() => handleAdvance(rx)}
                        advancing={advancing === rx.id}
                        onStockFlag={handleStockFlag}
                        flagging={flagging}
                        tint={col.tint}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </ModulePage>
  );
}

function PrescriptionCard({ prescription, canAdvance, onAdvance, advancing, onStockFlag, flagging, tint = "#38bdf8" }) {
  const hasOutOfStock = prescription.hasOutOfStockItems || (prescription.items ?? []).some((i) => i.inStock === false);
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-white/[0.03] p-3 pl-4 transition-colors hover:bg-white/[0.05] ${hasOutOfStock ? "border-destructive/40" : "border-white/[0.08]"}`}>
      <span
        className="absolute inset-y-0 left-0 w-0.5"
        style={{ background: `linear-gradient(180deg, ${hasOutOfStock ? "#f43f5e" : tint}, ${hasOutOfStock ? "#f43f5e" : tint}33)` }}
      />
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-bold text-white">{prescription.ticketCode}</span>
        <div className="flex items-center gap-1.5">
          {hasOutOfStock && (
            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300 ring-1 ring-inset ring-rose-400/25">
              STOCK ISSUE
            </span>
          )}
          <Pill className="h-4 w-4 text-white/40" />
        </div>
      </div>
      <p className="mt-1 text-sm font-medium text-white/85">{prescription.patientName}</p>
      <p className="text-xs text-sky-300/90">{prescription.department}</p>

      {prescription.items?.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {prescription.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-xs">
              <div className="min-w-0">
                <span className={`font-medium ${item.inStock === false ? "text-rose-300" : "text-white/80"}`}>
                  {item.drugName}
                </span>
                {", "}
                <span className="text-white/45">{item.dosage}</span>
                {item.quantity && (
                  <span className="text-white/45"> ({item.quantity})</span>
                )}
                {item.stockNotes && (
                  <span className="block text-[10px] italic text-rose-300">{item.stockNotes}</span>
                )}
              </div>
              {onStockFlag && (
                <button
                  onClick={() => onStockFlag(prescription, item, item.inStock !== false ? false : true)}
                  disabled={flagging === item.id}
                  className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                    item.inStock === false
                      ? "bg-priority-green/15 text-priority-green hover:bg-priority-green/25"
                      : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  }`}
                  title={item.inStock === false ? "Mark in stock" : "Flag as out of stock"}
                >
                  {flagging === item.id ? (
                    <LoaderCircle className="h-3 w-3 animate-spin" />
                  ) : item.inStock === false ? (
                    "In Stock"
                  ) : (
                    "Out of Stock"
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {prescription.notes && (
        <p className="mt-2 text-xs italic text-white/40">
          "{prescription.notes}"
        </p>
      )}

      {prescription.prescribedBy && (
        <p className="mt-2 text-[10px] text-white/35">
          Prescribed by {prescription.prescribedBy.name}
        </p>
      )}

      {canAdvance && (
        <button
          onClick={onAdvance}
          disabled={advancing}
          className="mt-2 inline-flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-[linear-gradient(135deg,#0f766e,#14b8a6)] px-3 text-xs font-medium text-white shadow-[0_6px_16px_-6px_rgba(20,184,166,0.5)] transition-transform hover:-translate-y-px disabled:opacity-50"
        >
          {advancing ? (
            <LoaderCircle className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="h-3 w-3" />
              Advance to {NEXT_STATE_MAP[prescription.state]}
            </>
          )}
        </button>
      )}
    </div>
  );
}

const TEST_ORDER_COLUMNS = [
  { state: "ordered", label: "Ordered", badge: "bg-sky-400/15 text-sky-300 ring-sky-300/25", accent: "text-sky-300 bg-sky-400/15", tint: "#38bdf8" },
  { state: "sample-collected", label: "Sample Collected", badge: "bg-cyan-400/15 text-cyan-300 ring-cyan-300/25", accent: "text-cyan-300 bg-cyan-400/15", tint: "#22d3ee" },
  { state: "in-progress", label: "In Progress", badge: "bg-amber-400/15 text-amber-300 ring-amber-300/25", accent: "text-amber-300 bg-amber-400/15", tint: "#fbbf24" },
  { state: "completed", label: "Completed", badge: "bg-violet-400/15 text-violet-300 ring-violet-300/25", accent: "text-violet-300 bg-violet-400/15", tint: "#a78bfa" },
  { state: "result-ready", label: "Result Ready", badge: "bg-emerald-400/15 text-emerald-300 ring-emerald-300/25", accent: "text-emerald-300 bg-emerald-400/15", tint: "#34d399" },
];

const TEST_NEXT_STATE = {
  ordered: "sample-collected",
  "sample-collected": "in-progress",
  "in-progress": "completed",
  completed: "result-ready",
};

const TEST_TYPE_LABELS = {
  "blood-count": "Full Blood Count",
  "urinalysis": "Urinalysis",
  "blood-glucose": "Blood Glucose",
  "malaria-smear": "Malaria Smear",
  "hiv-test": "HIV Test",
  "tb-sputum": "TB Sputum",
  "x-ray-chest": "Chest X-Ray",
  "ultrasound": "Ultrasound",
  "ct-scan": "CT Scan",
  "other": "Other",
};

export function LabPage() {
  const { refreshToken } = useLiveRefresh();
  const [search, setSearch] = useState("");
  const [advancing, setAdvancing] = useState(null);

  const summaryLoader = useCallback(() => fetchTestOrderSummary(), []);
  const summaryQuery = useApiResource(summaryLoader, { enabled: isBrowser, refreshToken });

  const ordersLoader = useCallback(() => fetchTestOrders(), []);
  const ordersQuery = useApiResource(ordersLoader, { enabled: isBrowser, refreshToken });

  const advanceState = useApiAction(updateTestOrderState);

  const orders = ordersQuery.data ?? [];
  const summary = summaryQuery.data;

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.ticketCode?.toLowerCase().includes(q) ||
        o.patientName?.toLowerCase().includes(q) ||
        TEST_TYPE_LABELS[o.testType]?.toLowerCase().includes(q),
    );
  }, [orders, search]);

  const byState = useMemo(() => {
    const map = {};
    for (const col of TEST_ORDER_COLUMNS) {
      map[col.state] = filtered.filter((o) => o.state === col.state);
    }
    return map;
  }, [filtered]);

  async function handleAdvance(order) {
    const next = TEST_NEXT_STATE[order.state];
    if (!next) return;
    setAdvancing(order.id);
    try {
      await advanceState.mutate(order.id, next);
      ordersQuery.refetch();
      summaryQuery.refetch();
    } finally {
      setAdvancing(null);
    }
  }

  const isLoading = ordersQuery.loading && !ordersQuery.data;

  return (
    <ModulePage
      eyebrow="Clinical workflow"
      title="Laboratory &amp; Radiology"
      description="Track test orders from collection to result readiness — updates arrive in real time."
      icon={FlaskConical}
    >
      {/* Toolbar */}
      <div className="surface-panel flex flex-wrap items-center gap-3 p-3">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Search test orders</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search ticket, patient, test…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base h-9 pl-9 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            ordersQuery.refetch();
            summaryQuery.refetch();
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <LoadingPanel className="mt-5" title="Loading test orders" message="Fetching the live lab queue." />
      ) : (
        <>
          {/* State summary */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {TEST_ORDER_COLUMNS.map((col) => (
              <AdminMetricTile
                key={col.state}
                label={col.label}
                value={summary?.byState?.[col.state] ?? byState[col.state]?.length ?? 0}
                icon={FlaskConical}
                accent={col.accent}
                tint={col.tint}
              />
            ))}
          </div>

          {/* Results-ready alert */}
          {(byState["result-ready"]?.length ?? 0) > 0 ? (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  {byState["result-ready"].length} result{byState["result-ready"].length !== 1 ? "s" : ""} ready for clinician review
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Patients have been notified via display board and WhatsApp to return for results.
              </p>
            </div>
          ) : null}

          {/* Kanban columns */}
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {TEST_ORDER_COLUMNS.map((col) => (
              <div
                key={col.state}
                className="relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
              >
                <span
                  className="absolute inset-x-0 top-0 h-0.5"
                  style={{ background: `linear-gradient(90deg, ${col.tint}00, ${col.tint}, ${col.tint}00)` }}
                />
                <div className="flex items-center justify-between px-2 pb-3 pt-1">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ring-1 ring-inset ${col.badge}`}
                  >
                    {col.label}
                  </span>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-bold tabular-nums text-white/70 ring-1 ring-inset ring-white/10">
                    {byState[col.state]?.length ?? 0}
                  </span>
                </div>
                <div className="mt-1 space-y-2">
                  {byState[col.state]?.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-white/30">
                      No orders
                    </div>
                  ) : (
                    byState[col.state].map((order) => (
                      <TestOrderCard
                        key={order.id}
                        order={order}
                        canAdvance={!!TEST_NEXT_STATE[order.state]}
                        onAdvance={() => handleAdvance(order)}
                        advancing={advancing === order.id}
                        tint={col.tint}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </ModulePage>
  );
}

function TestOrderCard({ order, canAdvance, onAdvance, advancing, tint = "#a78bfa" }) {
  const isResultReady = order.state === "result-ready";
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-white/[0.03] p-3 pl-4 transition-colors hover:bg-white/[0.05] ${isResultReady ? "border-emerald-400/40" : "border-white/[0.08]"}`}>
      <span
        className="absolute inset-y-0 left-0 w-0.5"
        style={{ background: `linear-gradient(180deg, ${isResultReady ? "#34d399" : tint}, ${isResultReady ? "#34d399" : tint}33)` }}
      />
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-bold text-white">{order.ticketCode}</span>
        <FlaskConical className={`h-4 w-4 ${isResultReady ? "text-emerald-300" : "text-white/40"}`} />
      </div>
      <p className="mt-1 text-sm font-medium text-white/85">{order.patientName}</p>
      <p className="text-xs font-medium text-violet-300/90">
        {TEST_TYPE_LABELS[order.testType] ?? order.testType}
      </p>
      {order.priority && order.priority !== "routine" && (
        <span className="mt-1 inline-block rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300 ring-1 ring-inset ring-amber-300/25">
          {order.priority}
        </span>
      )}
      {order.notes && (
        <p className="mt-1 text-xs italic text-white/40">"{order.notes}"</p>
      )}
      {order.orderedBy && (
        <p className="mt-2 text-[10px] text-white/35">
          Ordered by {order.orderedBy.name}
        </p>
      )}
      {isResultReady && (
        <div className="mt-2 rounded-md bg-emerald-400/10 px-2.5 py-2 text-xs ring-1 ring-inset ring-emerald-400/20">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Results ready
          </div>
          <p className="mt-0.5 text-white/45">
            Patient notified. Return to {order.orderingDepartment ?? "Casualty / Triage"} for clinician review.
          </p>
        </div>
      )}
      {canAdvance && (
        <button
          onClick={onAdvance}
          disabled={advancing}
          className="mt-2 inline-flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-[linear-gradient(135deg,#0f766e,#14b8a6)] px-3 text-xs font-medium text-white shadow-[0_6px_16px_-6px_rgba(20,184,166,0.5)] transition-transform hover:-translate-y-px disabled:opacity-50"
        >
          {advancing ? (
            <LoaderCircle className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="h-3 w-3" />
              Advance to {TEST_NEXT_STATE[order.state]}
            </>
          )}
        </button>
      )}
    </div>
  );
}

const OI_STREAM_COLORS = {
  waiting: "bg-blue-500/10 border-blue-500/30",
  "in-session": "bg-amber-500/10 border-amber-500/30",
  completed: "bg-emerald-500/10 border-emerald-500/30",
  referred: "bg-purple-500/10 border-purple-500/30",
};

const OI_STREAM_BADGE = {
  waiting: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "in-session": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  referred: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
};

const OI_NEXT_STATE = {
  waiting: "in-session",
  "in-session": "completed",
};

const OI_STATE_META = {
  waiting: { tint: "#38bdf8", badge: "bg-sky-400/15 text-sky-300 ring-sky-300/25" },
  "in-session": { tint: "#fbbf24", badge: "bg-amber-400/15 text-amber-300 ring-amber-300/25" },
  completed: { tint: "#34d399", badge: "bg-emerald-400/15 text-emerald-300 ring-emerald-300/25" },
  referred: { tint: "#a78bfa", badge: "bg-violet-400/15 text-violet-300 ring-violet-300/25" },
};

const OI_STREAM_ACCENTS = [
  { tint: "#fb7185", text: "text-pink-300" },
  { tint: "#5eead4", text: "text-teal-300" },
  { tint: "#a78bfa", text: "text-violet-300" },
  { tint: "#fbbf24", text: "text-amber-300" },
  { tint: "#38bdf8", text: "text-sky-300" },
];

export function OIClinicPage() {
  const { refreshToken } = useLiveRefresh();
  const [search, setSearch] = useState("");
  const [advancing, setAdvancing] = useState(null);
  const [selectedStream, setSelectedStream] = useState("all");
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitForm, setVisitForm] = useState({ ticketCode: "", streamId: "", notes: "" });

  const streamsLoader = useCallback(() => fetchOIClinicStreams(), []);
  const streamsQuery = useApiResource(streamsLoader, { enabled: isBrowser, refreshToken });

  const summaryLoader = useCallback(() => fetchOIClinicSummary(), []);
  const summaryQuery = useApiResource(summaryLoader, { enabled: isBrowser, refreshToken });

  const visitsLoader = useCallback(() => fetchOIClinicVisits(), []);
  const visitsQuery = useApiResource(visitsLoader, { enabled: isBrowser, refreshToken });

  const advanceState = useApiAction(updateOIClinicVisitState);
  const createVisitMut = useApiAction(createOIClinicVisit, {
    onSuccess: () => {
      visitsQuery.refetch();
      summaryQuery.refetch();
      setShowVisitForm(false);
      setVisitForm({ ticketCode: "", streamId: "", notes: "" });
    },
  });

  const streams = streamsQuery.data?.streams ?? [];
  const visits = visitsQuery.data ?? [];
  const summary = summaryQuery.data;

  function handleCreateVisit() {
    if (!visitForm.ticketCode.trim() || !visitForm.streamId) return;
    createVisitMut.mutate(visitForm.ticketCode.trim(), visitForm.streamId, visitForm.notes.trim());
  }

  const filtered = useMemo(() => {
    let result = visits;
    if (selectedStream !== "all") {
      result = result.filter((v) => v.streamId === selectedStream);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.ticketCode?.toLowerCase().includes(q) ||
          v.patientName?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [visits, search, selectedStream]);

  const byState = useMemo(() => {
    const states = ["waiting", "in-session", "completed", "referred"];
    const map = {};
    for (const state of states) {
      map[state] = filtered.filter((v) => v.state === state);
    }
    return map;
  }, [filtered]);

  async function handleAdvance(visit) {
    const next = OI_NEXT_STATE[visit.state];
    if (!next) return;
    setAdvancing(visit.id);
    try {
      await advanceState.mutate(visit.id, next);
      visitsQuery.refetch();
      summaryQuery.refetch();
    } finally {
      setAdvancing(null);
    }
  }

  async function handleRefer(visit) {
    setAdvancing(visit.id);
    try {
      await advanceState.mutate(visit.id, "referred", { referredTo: "Casualty / Triage" });
      visitsQuery.refetch();
      summaryQuery.refetch();
    } finally {
      setAdvancing(null);
    }
  }

  const isLoading = visitsQuery.loading && !visitsQuery.data;

  return (
    <ModulePage
      eyebrow="Clinical workflow"
      title="OI Clinic"
      description="Manage ART, TB, viral load, counselling, and screening service streams — live updates flow in automatically."
      icon={Stethoscope}
    >
      {/* Toolbar */}
      <div className="surface-panel flex flex-wrap items-center gap-3 p-3">
        <select
          value={selectedStream}
          onChange={(e) => setSelectedStream(e.target.value)}
          className="input-base h-9 w-auto text-sm"
          aria-label="Filter by stream"
        >
          <option value="all">All streams</option>
          {streams.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Search OI Clinic visits</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search ticket or patient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base h-9 pl-9 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            visitsQuery.refetch();
            summaryQuery.refetch();
            streamsQuery.refetch();
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
        <button
          type="button"
          onClick={() => setShowVisitForm((v) => !v)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg gradient-primary px-4 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          New visit
        </button>
      </div>

      {showVisitForm ? (
        <div className="surface-panel mt-4 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                <Stethoscope className="h-4 w-4" />
              </span>
              <h3 className="font-display text-base font-bold">Create OI Clinic visit</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowVisitForm(false)}
              className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Ticket code</label>
              <input
                type="text"
                placeholder="e.g. OPD-001"
                value={visitForm.ticketCode}
                onChange={(e) => setVisitForm((p) => ({ ...p, ticketCode: e.target.value }))}
                className="input-base h-9 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Service stream</label>
              <select
                value={visitForm.streamId}
                onChange={(e) => setVisitForm((p) => ({ ...p, streamId: e.target.value }))}
                className="input-base h-9 text-sm"
              >
                <option value="">Select stream…</option>
                {streams.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Notes</label>
              <input
                type="text"
                placeholder="Optional notes"
                value={visitForm.notes}
                onChange={(e) => setVisitForm((p) => ({ ...p, notes: e.target.value }))}
                className="input-base h-9 text-sm"
              />
            </div>
          </div>
          {createVisitMut.isError && (
            <p className="mt-3 text-xs text-destructive">{createVisitMut.error.message}</p>
          )}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateVisit}
              disabled={createVisitMut.isPending || !visitForm.ticketCode.trim() || !visitForm.streamId}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg gradient-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {createVisitMut.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Stethoscope className="h-4 w-4" />}
              Create visit
            </button>
            <button
              type="button"
              onClick={() => setShowVisitForm(false)}
              className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <LoadingPanel className="mt-5" title="Loading OI Clinic visits" message="Fetching live service streams." />
      ) : (
        <>
          {/* Per-stream summary */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {streams.map((stream, index) => {
              const accent = OI_STREAM_ACCENTS[index % OI_STREAM_ACCENTS.length];
              return (
                <div
                  key={stream.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.16]"
                >
                  <span
                    className="absolute inset-x-0 top-0 h-0.5"
                    style={{ background: `linear-gradient(90deg, ${accent.tint}00, ${accent.tint}, ${accent.tint}00)` }}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
                        {stream.label}
                      </div>
                      <div className="mt-3 font-display text-4xl font-bold tracking-tight text-white">
                        {summary?.byStream?.[stream.id]?.total ?? 0}
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-white/40">
                        <span className={accent.text}>
                          {summary?.byStream?.[stream.id]?.waiting ?? 0}
                        </span>{" "}
                        waiting
                      </p>
                    </div>
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10"
                      style={{
                        background: `linear-gradient(135deg, ${accent.tint}33, ${accent.tint}14)`,
                      }}
                    >
                      <Activity className={`h-5 w-5 ${accent.text}`} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kanban columns */}
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Object.entries(byState).map(([state, stateVisits]) => {
              const stateMeta = OI_STATE_META[state] ?? OI_STATE_META.waiting;
              return (
                <div
                  key={state}
                  className="relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
                >
                  <span
                    className="absolute inset-x-0 top-0 h-0.5"
                    style={{ background: `linear-gradient(90deg, ${stateMeta.tint}00, ${stateMeta.tint}, ${stateMeta.tint}00)` }}
                  />
                  <div className="flex items-center justify-between px-2 pb-3 pt-1">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ring-1 ring-inset ${stateMeta.badge}`}
                    >
                      {state.replace(/-/g, " ")}
                    </span>
                    <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-bold tabular-nums text-white/70 ring-1 ring-inset ring-white/10">
                      {stateVisits.length}
                    </span>
                  </div>
                  <div className="mt-1 space-y-2">
                    {stateVisits.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-white/30">
                        No visits
                      </div>
                    ) : (
                      stateVisits.map((visit) => (
                        <OIClinicVisitCard
                          key={visit.id}
                          visit={visit}
                          streamLabel={streams.find((s) => s.id === visit.streamId)?.label ?? visit.streamLabel}
                          canAdvance={!!OI_NEXT_STATE[visit.state]}
                          canRefer={visit.state === "waiting" || visit.state === "in-session"}
                          onAdvance={() => handleAdvance(visit)}
                          onRefer={() => handleRefer(visit)}
                          advancing={advancing === visit.id}
                          tint={stateMeta.tint}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </ModulePage>
  );
}

function OIClinicVisitCard({ visit, streamLabel, canAdvance, canRefer, onAdvance, onRefer, advancing, tint = "#fb7185" }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 pl-4 transition-colors hover:bg-white/[0.05]">
      <span
        className="absolute inset-y-0 left-0 w-0.5"
        style={{ background: `linear-gradient(180deg, ${tint}, ${tint}33)` }}
      />
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-bold text-white">{visit.ticketCode}</span>
      </div>
      <p className="mt-1 text-sm font-medium text-white/85">{visit.patientName}</p>
      <p className="text-xs font-semibold text-pink-300/90">{streamLabel}</p>
      {visit.notes && (
        <p className="mt-1 text-xs italic text-white/40">"{visit.notes}"</p>
      )}
      {visit.referredTo && (
        <p className="mt-1 text-xs text-violet-300">
          Referred to: {visit.referredTo}
        </p>
      )}
      {visit.createdBy && (
        <p className="mt-2 text-[10px] text-white/35">
          Created by {visit.createdBy.name}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        {canAdvance && (
          <button
            onClick={onAdvance}
            disabled={advancing}
            className="inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md bg-[linear-gradient(135deg,#0f766e,#14b8a6)] px-3 text-xs font-medium text-white shadow-[0_6px_16px_-6px_rgba(20,184,166,0.5)] transition-transform hover:-translate-y-px disabled:opacity-50"
          >
            {advancing ? (
              <LoaderCircle className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Advance to {OI_NEXT_STATE[visit.state]}
              </>
            )}
          </button>
        )}
        {canRefer && (
          <button
            onClick={onRefer}
            disabled={advancing}
            className="inline-flex h-7 items-center justify-center gap-1.5 rounded-md border border-violet-400/30 bg-violet-400/10 px-3 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-400/20 disabled:opacity-50"
          >
            Refer
          </button>
        )}
      </div>
    </div>
  );
}

const ADMIN_PRIORITY_ORDER = ["red", "yellow", "green", "black"];

const ADMIN_PRIORITY_BAR = {
  red: "bg-priority-red",
  yellow: "bg-priority-yellow",
  green: "bg-priority-green",
  black: "bg-priority-black",
};

const ADMIN_STATUS_ORDER = ["waiting", "called", "in-service", "missed", "completed"];

const CONGESTION_BADGE = {
  critical: "bg-destructive/15 text-destructive",
  high: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  moderate: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  normal: "bg-priority-green/15 text-priority-green",
};

const CONGESTION_BAR = {
  critical: "bg-destructive",
  high: "bg-amber-500",
  moderate: "bg-blue-500",
  normal: "bg-priority-green",
};

function AdminMetricTile({ label, value, detail, icon: Icon, accent = "text-teal-300 bg-teal-400/15", tint = "#14b8a6" }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.16]">
      <span
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${tint}00, ${tint}, ${tint}00)` }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
            {label}
          </div>
          <div className="mt-3 font-display text-4xl font-bold tracking-tight text-white">
            {value}
          </div>
          {detail ? (
            <p className="mt-1.5 text-xs leading-5 text-white/40">{detail}</p>
          ) : null}
        </div>
        {Icon ? (
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 ${accent}`}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function AdminPanelHeader({ icon: Icon, title, subtitle, count }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-base font-bold">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {count != null ? (
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
          {count}
        </span>
      ) : null}
    </div>
  );
}

function AdminEmptyState({ message }) {
  return (
    <div className="flex flex-col items-center px-5 py-8 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-priority-green/15 text-priority-green">
        <CheckCircle2 className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function AdminDashboardPage() {
  const { refreshLiveData } = useLiveRefresh();
  const dashboardQuery = useDashboardSummary();
  const hospitalInfoQuery = useApiResource(
    useCallback(() => fetchHospitalInfo(), []),
    { enabled: isBrowser },
  );
  const congestionQuery = useApiResource(
    useCallback(() => fetchCongestionReport(), []),
    { enabled: isBrowser },
  );
  const reassessmentQuery = useApiResource(
    useCallback(() => fetchReassessmentAlerts(), []),
    { enabled: isBrowser },
  );
  const bottleneckQuery = useApiResource(
    useCallback(() => fetchBottleneckAnalysis(), []),
    { enabled: isBrowser },
  );

  if (dashboardQuery.isLoading) {
    return (
      <ModulePage
        eyebrow="Hospital management"
        title="Admin Dashboard"
        description="High-level operational overview for hospital managers and administrators."
        icon={ShieldCheck}
      >
        <LoadingPanel title="Loading admin dashboard" message="Syncing hospital-wide metrics." />
      </ModulePage>
    );
  }

  const metrics = dashboardQuery.data?.metrics;
  const tickets = dashboardQuery.data?.tickets ?? EMPTY_LIST;
  const lastUpdatedAt = dashboardQuery.data?.lastUpdatedAt;
  const hospital = hospitalInfoQuery.data?.current;
  const congestion = congestionQuery.data;
  const reassessment = reassessmentQuery.data;
  const bottlenecks = bottleneckQuery.data;

  const totalTickets = metrics?.total ?? 0;
  const waiting = metrics?.waiting ?? 0;
  const active = metrics?.active ?? 0;
  const avgWait = metrics?.avgWait ?? 0;
  const notificationsToday = metrics?.notificationsToday ?? 0;
  const byStatus = metrics?.byStatus ?? {};
  const byPriority = metrics?.byPriority ?? {};
  const missedCount = byStatus.missed ?? 0;
  const completedCount = byStatus.completed ?? 0;
  const priorityTotal = ADMIN_PRIORITY_ORDER.reduce((sum, p) => sum + (byPriority[p] ?? 0), 0);

  const congestedDepts = congestion?.congestedDepartments ?? [];
  const criticalBottlenecks = bottlenecks?.criticalBottlenecks ?? [];
  const reassessmentAlerts = reassessment?.alerts ?? [];

  const congestionRows = Object.entries(congestion?.byDept ?? {}).sort(
    (a, b) => (b[1].utilization ?? 0) - (a[1].utilization ?? 0),
  );

  const longestWaits = tickets
    .filter((t) => t.status === "waiting")
    .slice()
    .sort((a, b) => (b.waitMinutes ?? 0) - (a.waitMinutes ?? 0))
    .slice(0, 6);

  return (
    <ModulePage
      eyebrow="Hospital management"
      title="Admin Dashboard"
      description="High-level operational overview for hospital managers and administrators."
      icon={ShieldCheck}
    >
      {/* Facility banner */}
      {hospital ? (
        <div className="surface-panel mb-5 flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display text-lg font-bold">{hospital.name}</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {hospital.location}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              Updated{" "}
              {lastUpdatedAt
                ? new Date(lastUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "recently"}
            </span>
            <button
              type="button"
              onClick={refreshLiveData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                hospital.active
                  ? "bg-priority-green/15 text-priority-green"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  hospital.active ? "bg-priority-green" : "bg-destructive"
                }`}
              />
              {hospital.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      ) : null}

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricTile
          label="Total tickets"
          value={totalTickets}
          detail="All tickets in the system"
          icon={Users}
        />
        <AdminMetricTile
          label="Waiting now"
          value={waiting}
          detail="Patients in the queue"
          icon={Clock3}
          accent="text-amber-500 bg-amber-500/15"
        />
        <AdminMetricTile
          label="In service"
          value={active}
          detail="Currently being served"
          icon={Stethoscope}
          accent="text-accent bg-accent/15"
        />
        <AdminMetricTile
          label="Avg wait"
          value={`${avgWait}m`}
          detail="Across waiting patients"
          icon={Timer}
          accent="text-blue-400 bg-blue-500/15"
        />
      </div>

      {/* Queue composition + operational pressure */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="surface-panel">
          <AdminPanelHeader
            icon={Activity}
            title="Queue composition"
            subtitle="Live status and triage priority breakdown"
          />
          <div className="p-5">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {ADMIN_STATUS_ORDER.map((status) => (
                <div
                  key={status}
                  className="rounded-xl border border-border/60 bg-background/50 px-3 py-2.5"
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {STATUS_META[status]?.label ?? status}
                  </div>
                  <div className="mt-1.5 font-display text-2xl font-bold">
                    {byStatus[status] ?? 0}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  Triage priority mix
                </span>
                <span className="text-xs text-muted-foreground">{priorityTotal} patients</span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                {ADMIN_PRIORITY_ORDER.map((p) => {
                  const count = byPriority[p] ?? 0;
                  if (!count || !priorityTotal) return null;
                  return (
                    <div
                      key={p}
                      className={`h-full ${ADMIN_PRIORITY_BAR[p]}`}
                      style={{ width: `${(count / priorityTotal) * 100}%` }}
                      title={`${PRIORITY_META[p]?.short ?? p}: ${count}`}
                    />
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                {ADMIN_PRIORITY_ORDER.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`h-2 w-2 rounded-full ${ADMIN_PRIORITY_BAR[p]}`} />
                    {PRIORITY_META[p]?.short ?? p}
                    <span className="font-bold text-foreground">{byPriority[p] ?? 0}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="surface-panel">
          <AdminPanelHeader
            icon={TrendingUp}
            title="Operational pressure"
            subtitle="Signals needing attention"
          />
          <div className="divide-y divide-border/50">
            {[
              {
                label: "Completed tickets",
                value: completedCount,
                icon: CheckCircle2,
                cls: "text-priority-green",
              },
              {
                label: "Missed turns",
                value: missedCount,
                icon: XCircle,
                cls: missedCount > 0 ? "text-destructive" : "text-priority-green",
              },
              {
                label: "Notifications sent today",
                value: notificationsToday,
                icon: BellRing,
                cls: "text-primary",
              },
              {
                label: "Congested departments",
                value: congestedDepts.length,
                icon: AlertTriangle,
                cls: congestedDepts.length > 0 ? "text-destructive" : "text-priority-green",
              },
              {
                label: "Reassessment alerts",
                value: reassessmentAlerts.length,
                icon: ShieldCheck,
                cls: reassessmentAlerts.length > 0 ? "text-amber-500" : "text-priority-green",
              },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-5 py-3">
                <span className="inline-flex items-center gap-2.5 text-sm text-muted-foreground">
                  <row.icon className={`h-4 w-4 ${row.cls}`} />
                  {row.label}
                </span>
                <span className="font-display text-lg font-bold">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts row */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="surface-panel">
          <AdminPanelHeader
            icon={AlertTriangle}
            title="Critical bottlenecks"
            subtitle="Departments under sustained load"
            count={criticalBottlenecks.length}
          />
          {criticalBottlenecks.length > 0 ? (
            <div className="space-y-2.5 p-5">
              {criticalBottlenecks.map((b) => (
                <div
                  key={b.department}
                  className="rounded-xl border border-destructive/30 bg-destructive/5 p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{b.department}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        b.severity === "critical"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                      }`}
                    >
                      {b.severity}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(b.factors ?? []).map((f, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  {b.recommendation ? (
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {b.recommendation}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState message="No critical bottlenecks detected." />
          )}
        </div>

        <div className="surface-panel">
          <AdminPanelHeader
            icon={ShieldCheck}
            title="Reassessment alerts"
            subtitle="Patients past their review threshold"
            count={reassessmentAlerts.length}
          />
          {reassessmentAlerts.length > 0 ? (
            <div className="space-y-2.5 p-5">
              {reassessmentAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/70 px-3.5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        alert.priority === "red"
                          ? "bg-red-500/15 text-red-500"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                      }`}
                    >
                      {alert.priority}
                    </span>
                    <div>
                      <div className="text-sm font-semibold">{alert.ticket}</div>
                      <div className="text-xs text-muted-foreground">{alert.department}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-sm font-bold text-amber-500">
                      {alert.waitMinutes}m
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      threshold {alert.thresholdMinutes}m
                    </div>
                  </div>
                </div>
              ))}
              {reassessmentAlerts.length > 5 ? (
                <p className="pt-1 text-center text-xs text-muted-foreground">
                  +{reassessmentAlerts.length - 5} more alerts
                </p>
              ) : null}
            </div>
          ) : (
            <AdminEmptyState message="No reassessment alerts. All patients are within thresholds." />
          )}
        </div>
      </div>

      {/* Congestion table + longest waits */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        {congestion ? (
          <div className="surface-panel">
            <AdminPanelHeader
              icon={Building2}
              title="Department congestion"
              subtitle="Utilization by department, highest first"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left">
                    {["Department", "Waiting", "In service", "Avg wait", "Utilization", "Level"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {congestionRows.map(([dept, d]) => (
                    <tr
                      key={dept}
                      className="border-b border-border/40 transition-colors hover:bg-muted/40"
                    >
                      <td className="px-5 py-3 font-medium">{dept}</td>
                      <td className="px-5 py-3">{d.waiting}</td>
                      <td className="px-5 py-3">{d.inService}</td>
                      <td className="px-5 py-3">{d.avgWaitMinutes}m</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${CONGESTION_BAR[d.congestionLevel] ?? "bg-priority-green"}`}
                              style={{ width: `${Math.min(d.utilization ?? 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{d.utilization}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            CONGESTION_BADGE[d.congestionLevel] ?? CONGESTION_BADGE.normal
                          }`}
                        >
                          {d.congestionLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <div className="surface-panel">
          <AdminPanelHeader
            icon={Clock3}
            title="Longest waits"
            subtitle="Patients waiting longest right now"
            count={longestWaits.length}
          />
          {longestWaits.length > 0 ? (
            <div className="divide-y divide-border/50">
              {longestWaits.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`inline-grid h-8 w-14 shrink-0 place-items-center rounded-lg font-display text-[11px] font-bold ${
                        priorityChipClass[t.priority] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {t.ticket}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{t.patientName}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {t.department}
                        {t.chiefComplaint ? ` · ${t.chiefComplaint}` : ""}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 font-display text-sm font-bold text-amber-500">
                    {t.waitMinutes}m
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState message="No patients are currently waiting." />
          )}
        </div>
      </div>
    </ModulePage>
  );
}
