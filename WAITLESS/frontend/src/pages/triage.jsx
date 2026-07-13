import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Clock3,
  LoaderCircle,
  MessageCircle,
  Search,
  ShieldAlert,
  Stethoscope,
  Timer,
  Wifi,
} from "lucide-react";

import { LoadingPanel } from "@/components/ui/system-loader";
import { useLiveRefresh } from "@/context/LiveRefreshContext";
import { useApiAction, useApiResource } from "@/hooks/useApiResource";
import { PRIORITY_META, priorityChipClass } from "@/services/queueMeta";
import { assignTicketPriority, fetchTickets } from "@/services/queueApi";
import { useQueueRealtime } from "@/sockets/QueueRealtimeProvider";

const isBrowser = typeof window !== "undefined";
const EMPTY_TICKETS = [];
const TRIAGE_PRIORITIES = ["red", "yellow", "green", "black"];
const LIVE_STATUS_META = {
  connected: {
    label: "Live sync",
    className: "bg-priority-green/15 text-priority-green",
  },
  connecting: {
    label: "Connecting",
    className: "bg-primary-soft text-primary",
  },
  reconnecting: {
    label: "Reconnecting",
    className: "bg-muted text-muted-foreground",
  },
  polling: {
    label: "Polling fallback",
    className: "bg-muted text-muted-foreground",
  },
  closed: {
    label: "Offline",
    className: "bg-muted text-muted-foreground",
  },
};
const TRIAGE_BACKDROP_ICONS = [
  {
    Icon: ShieldAlert,
    className:
      "left-[5%] top-20 text-primary/16 [animation:medical-float_18s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-11 w-11",
  },
  {
    Icon: Stethoscope,
    className:
      "right-[7%] top-24 text-accent/16 [animation:medical-drift_22s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-11 w-11",
  },
  {
    Icon: Search,
    className:
      "left-[14%] top-[48%] text-primary/12 [animation:medical-spin_28s_linear_infinite] motion-reduce:animate-none",
    size: "h-10 w-10",
  },
  {
    Icon: Timer,
    className:
      "right-[11%] top-[52%] text-accent/12 [animation:medical-float_20s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-10 w-10",
  },
  {
    Icon: Wifi,
    className:
      "left-[46%] top-14 text-primary/10 [animation:medical-drift_20s_ease-in-out_infinite] motion-reduce:animate-none",
    size: "h-10 w-10",
  },
];

export default function TriagePage() {
  const { refreshLiveData } = useLiveRefresh();
  const realtime = useQueueRealtime();
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadWaitingTickets = useCallback(() => fetchTickets({ status: "waiting" }), []);
  const ticketsQuery = useApiResource(loadWaitingTickets, { enabled: isBrowser });

  const assignMutation = useApiAction(
    ({ id, priority }) => assignTicketPriority(id, priority),
    {
      onSuccess: refreshLiveData,
    },
  );

  const tickets = ticketsQuery.data ?? EMPTY_TICKETS;
  const filteredTickets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return tickets;
    }

    return tickets.filter((ticket) => {
      const haystack = [
        ticket.ticket,
        ticket.patientName,
        ticket.department,
        ticket.chiefComplaint,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [tickets, searchTerm]);
  const selected = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) ?? null,
    [tickets, selectedId],
  );
  const liveMeta = LIVE_STATUS_META[realtime.status] ?? LIVE_STATUS_META.connecting;
  const awaitingCount = tickets.length;
  const avgWait = awaitingCount
    ? Math.round(
        tickets.reduce((sum, ticket) => sum + (ticket.waitMinutes ?? 0), 0) /
          awaitingCount,
      )
    : 0;
  const longestWait = tickets.length
    ? Math.max(...tickets.map((ticket) => ticket.waitMinutes ?? 0))
    : 0;
  const whatsAppCount = tickets.filter((ticket) => ticket.whatsApp).length;
  const departmentCounts = tickets.reduce((accumulator, ticket) => {
    accumulator[ticket.department] = (accumulator[ticket.department] ?? 0) + 1;
    return accumulator;
  }, {});
  const busiestDepartmentEntry = Object.entries(departmentCounts).sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  )[0];
  const busiestDepartment = busiestDepartmentEntry?.[0] ?? "No queue yet";
  const priorityCounts = TRIAGE_PRIORITIES.reduce((accumulator, priority) => {
    accumulator[priority] = tickets.filter((ticket) => ticket.priority === priority).length;
    return accumulator;
  }, {});
  const activeAssignTarget = assignMutation.variables ?? null;

  useEffect(() => {
    if (!tickets.length) {
      setSelectedId(null);
      return;
    }

    const nextList = filteredTickets.length ? filteredTickets : tickets;
    if (!selectedId || !nextList.some((ticket) => ticket.id === selectedId)) {
      setSelectedId(nextList[0].id);
    }
  }, [tickets, filteredTickets, selectedId]);

  function assign(priority) {
    if (!selected) return;
    assignMutation.mutate({ id: selected.id, priority });
  }

  return (
    <section className="relative isolate overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <TriageBackdrop />

      <div className="relative mx-auto max-w-7xl">
        <header className="surface-panel page-section-rise p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(240,253,250,0.62)_42%,rgba(219,234,254,0.56))]" />
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(240,253,250,0.26))]" />
        <div className="relative grid gap-6 xl:grid-cols-[1.2fr_0.85fr]">
          <div>
            <div className="eyebrow">Clinical intake</div>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Triage console
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Review incoming patients, assign the correct severity colour, and let
                  the queue auto-route them into the right clinical lane.
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${liveMeta.className}`}
              >
                <Wifi className="h-3.5 w-3.5" />
                {liveMeta.label}
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <OverviewTile
                label="Awaiting triage"
                value={awaitingCount}
                detail={`${filteredTickets.length} shown in the active list`}
              />
              <OverviewTile
                label="Average wait"
                value={`${avgWait}m`}
                detail={`${longestWait}m is the longest current wait`}
              />
              <OverviewTile
                label="WhatsApp ready"
                value={whatsAppCount}
                detail="Patients can receive near-turn and call-up alerts"
              />
              <OverviewTile
                label="Most pressure"
                value={busiestDepartment}
                detail="Department with the largest waiting intake"
              />
            </div>
          </div>

          <div className="surface-panel-dark p-5 sm:p-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-foreground/70">
              Queue mix
            </div>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-primary-foreground">
                  Triage protocol reminder
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-primary-foreground/80">
                  Red and yellow cases should be escalated immediately. Green stays in
                  the ambulant flow, while black routes to holding procedures.
                </p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-primary-foreground/85">
                {awaitingCount} in flow
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {TRIAGE_PRIORITIES.map((priority) => (
                <ProtocolCountCard
                  key={priority}
                  priority={priority}
                  count={priorityCounts[priority]}
                />
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/12 bg-white/10 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary-foreground/80" />
                <div>
                  <div className="font-semibold text-primary-foreground">
                    Auto-routing stays active
                  </div>
                  <p className="mt-1 text-sm leading-6 text-primary-foreground/80">
                    Once a priority is assigned, the ticket keeps its place in the live
                    system and updates the board, tracker, and staff dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr] page-section-rise page-section-rise-delay-1">
          <div className="space-y-6">
          <article className="surface-panel overflow-hidden">
            <div className="border-b border-border/70 px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="eyebrow">Waiting intake</div>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
                    Awaiting triage list
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Search by ticket, patient, department, or complaint to jump to the
                    right case quickly.
                  </p>
                </div>
                <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  {filteredTickets.length} visible
                </span>
              </div>

              <label className="mt-5 block">
                <span className="sr-only">Search waiting patients</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by patient, ticket, complaint, or department"
                    className="input-base pl-10"
                  />
                </div>
              </label>
            </div>

            {ticketsQuery.isLoading ? (
              <LoadingPanel
                compact
                className="px-5 py-6 sm:px-6"
                message="Fetching patients waiting for triage."
                surface={false}
                title="Loading queue"
              />
            ) : ticketsQuery.isError ? (
              <div className="px-5 py-6 text-sm text-destructive sm:px-6">
                {ticketsQuery.error.message}
              </div>
            ) : filteredTickets.length ? (
              <div className="space-y-3 px-4 py-4 sm:px-6">
                {filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedId(ticket.id)}
                    className={`surface-hover-card group w-full rounded-2xl border px-4 py-4 text-left ${
                      selectedId === ticket.id
                        ? "border-primary/20 bg-primary-soft/55 shadow-card"
                        : "border-border/70 bg-background/80 hover:border-primary/15 hover:bg-primary-soft/25"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={`inline-grid h-10 w-16 place-items-center rounded-xl font-display text-sm font-bold ${priorityChipClass[ticket.priority]}`}
                        >
                          {ticket.ticket}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{ticket.patientName}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {ticket.department}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1" />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <QueueChip icon={Timer} label={`${ticket.waitMinutes}m waiting`} />
                      <QueueChip
                        icon={MessageCircle}
                        label={ticket.whatsApp ? "WhatsApp on" : "Walk-in"}
                      />
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {ticket.chiefComplaint || "No chief complaint recorded yet."}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-5 py-6 text-sm text-muted-foreground sm:px-6">
                {tickets.length
                  ? "No patients match the current search."
                  : "No patients are currently waiting for triage."}
              </div>
            )}
          </article>

            <article className="surface-panel page-section-rise page-section-rise-delay-2 p-6">
            <div className="eyebrow">Protocol guide</div>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
              Colour lanes at a glance
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {TRIAGE_PRIORITIES.map((priority) => (
                <ProtocolGuideCard key={priority} priority={priority} />
              ))}
            </div>
            </article>
          </div>

          <article className="surface-panel page-section-rise page-section-rise-delay-2 p-6 sm:p-8">
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="eyebrow">Selected patient</div>
                  <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
                    {selected.patientName}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Ticket {selected.ticket} in {selected.department}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${priorityChipClass[selected.priority]}`}
                >
                  Current: {PRIORITY_META[selected.priority].short}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <DetailCard label="Wait time" value={`${selected.waitMinutes}m`} />
                <DetailCard
                  label="Registered"
                  value={formatTime(selected.registeredAt)}
                />
                <DetailCard label="Department" value={selected.department} />
                <DetailCard
                  label="Contact channel"
                  value={selected.whatsApp ? "WhatsApp" : "Web / walk-in"}
                />
              </div>

              <div className="surface-panel-muted mt-6 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Chief complaint
                </div>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  {selected.chiefComplaint || "No chief complaint recorded yet."}
                </p>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="eyebrow">Assign severity</div>
                    <h3 className="mt-2 font-display text-2xl font-bold tracking-tight">
                      Triage decision panel
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Choose the lane that best matches the patient&apos;s condition.
                      The queue will reroute immediately after assignment.
                    </p>
                  </div>
                  <Stethoscope className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {TRIAGE_PRIORITIES.map((priority) => {
                    const meta = PRIORITY_META[priority];
                    const isCurrent = selected.priority === priority;
                    const isPending =
                      assignMutation.isPending &&
                      activeAssignTarget?.id === selected.id &&
                      activeAssignTarget?.priority === priority;

                    return (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => assign(priority)}
                        disabled={assignMutation.isPending}
                        className={`surface-hover-card group rounded-3xl border-2 p-5 text-left disabled:translate-y-0 disabled:opacity-70 ${
                          isCurrent ? "border-foreground/40" : "border-transparent"
                        } ${priorityChipClass[priority]}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-display text-base font-bold uppercase tracking-[0.22em]">
                              {meta.short}
                            </div>
                            <div className="mt-1 text-sm font-semibold opacity-95">
                              {meta.label}
                            </div>
                          </div>
                          {isPending ? (
                            <LoaderCircle className="h-4 w-4 animate-spin opacity-85" />
                          ) : (
                            <Stethoscope className="h-5 w-5 opacity-80" />
                          )}
                        </div>

                        <p className="mt-4 text-sm leading-6 opacity-90">
                          {meta.description}
                        </p>
                        <div className="mt-4 rounded-2xl border border-current/15 bg-black/5 px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em]">
                          Route to {meta.destination}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="surface-panel-muted px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Auto-routing
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    If you keep this patient in{" "}
                    <span className="font-semibold text-foreground">
                      {PRIORITY_META[selected.priority].short}
                    </span>
                    , WaitLess will continue routing them to{" "}
                    <span className="font-semibold text-foreground">
                      {PRIORITY_META[selected.priority].destination}
                    </span>
                    .
                  </p>
                </div>

                <div className="surface-panel-muted px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Handoff reminder
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Confirm the complaint, observe distress level, and escalate red or
                    yellow cases immediately rather than allowing them to remain in the
                    routine waiting flow.
                  </p>
                </div>
              </div>

              {assignMutation.isError && (
                <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {assignMutation.error.message}
                </div>
              )}
            </>
          ) : (
            <div className="grid min-h-[22rem] place-items-center text-center">
              <div className="max-w-md">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">
                  No patient selected
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Choose a patient from the waiting intake list to open the triage
                  decision panel.
                </p>
              </div>
            </div>
          )}
          </article>
        </div>
      </div>
    </section>
  );
}

function TriageBackdrop() {
  return (
    <>
      <div className="absolute inset-0 -z-30 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.94)_18%,rgba(240,253,250,0.94)_58%,rgba(239,246,255,0.98))]" />
      <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 portal-surface-stripes opacity-72" />
        <div className="absolute inset-0 portal-hero-texture opacity-34" />
        <div className="absolute inset-0 hero-dots-soft opacity-32" />
        <div className="absolute inset-x-[-14%] top-[-6rem] h-48 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.98),rgba(204,251,241,0.72)_36%,rgba(219,234,254,0.5)_62%,rgba(255,255,255,0)_78%)] blur-3xl" />
        <div className="absolute inset-x-[-12%] bottom-[-7rem] h-64 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.18),rgba(37,99,235,0.16)_44%,rgba(248,250,252,0)_76%)] blur-3xl" />
        <div className="absolute left-[-6%] top-28 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[-5%] top-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        {TRIAGE_BACKDROP_ICONS.map(({ Icon, className, size }, index) => (
          <span key={`triage-backdrop-${index}`} className={`absolute ${className}`}>
            <Icon className={size} strokeWidth={2} />
          </span>
        ))}
      </div>
    </>
  );
}

function OverviewTile({ label, value, detail }) {
  return (
    <div className="surface-panel-muted px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-bold tracking-tight">{value}</div>
      <div className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</div>
    </div>
  );
}

function ProtocolCountCard({ priority, count }) {
  const meta = PRIORITY_META[priority];

  return (
    <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-4">
      <div
        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${priorityChipClass[priority]}`}
      >
        {meta.short}
      </div>
      <div className="mt-3 font-display text-3xl font-bold tracking-tight text-primary-foreground">
        {count}
      </div>
      <div className="mt-1 text-xs text-primary-foreground/72">{meta.destination}</div>
    </div>
  );
}

function QueueChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function ProtocolGuideCard({ priority }) {
  const meta = PRIORITY_META[priority];

  return (
    <div className="surface-panel-muted surface-hover-card px-4 py-4">
      <div
        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${priorityChipClass[priority]}`}
      >
        {meta.short}
      </div>
      <div className="mt-3 font-display text-lg font-bold tracking-tight">
        {meta.label}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{meta.description}</p>
      <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Route to {meta.destination}
      </div>
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <div className="surface-panel-muted px-4 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function formatTime(value) {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
