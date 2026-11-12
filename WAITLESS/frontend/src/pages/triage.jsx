import { useCallback, useMemo, useState } from "react";
import {
  Activity,
  BellRing,
  Clock3,
  LoaderCircle,
  MessageCircle,
  Search,
  Stethoscope,
  Timer,
  Users,
  Wifi,
} from "lucide-react";

import { LoadingPanel } from "@/components/ui/system-loader";
import { useLiveRefresh } from "@/context/LiveRefreshContext";
import { useApiAction, useApiResource } from "@/hooks/useApiResource";
import { toast } from "sonner";

import { PRIORITY_META } from "@/services/queueMeta";
import {
  callNextPatient,
  fetchTickets,
  recallTicket,
  reannounceTicket,
  saveTriageAssessment,
  transferTicket,
  updateTicketStatus,
} from "@/services/queueApi";
import { useQueueRealtime } from "@/sockets/QueueRealtimeProvider";
import { MissedRecallRow, ServingTile, WaitingQueueRow } from "./staff-modules";

const isBrowser = typeof window !== "undefined";
const EMPTY_TICKETS = [];
const TRIAGE_PRIORITIES = ["red", "yellow", "green", "black"];
const PRIORITY_WEIGHT = { red: 0, yellow: 1, green: 2, black: 3 };
const PRIORITY_DOT = {
  red: "bg-priority-red",
  yellow: "bg-priority-yellow",
  green: "bg-priority-green",
  black: "bg-priority-black",
};

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

export default function TriagePage() {
  const { refreshLiveData } = useLiveRefresh();
  const realtime = useQueueRealtime();
  const [searchTerm, setSearchTerm] = useState("");

  const loadTickets = useCallback(() => fetchTickets({}), []);
  const ticketsQuery = useApiResource(loadTickets, { enabled: isBrowser });

  const assessmentMutation = useApiAction(
    ({ id, payload }) => saveTriageAssessment(id, payload),
    {
      onSuccess: refreshLiveData,
    },
  );

  const [callRoom, setCallRoom] = useState(
    () => window.localStorage.getItem("waitless_call_room") ?? "",
  );
  const callMutation = useApiAction(
    () => callNextPatient("Casualty / Triage", callRoom || undefined),
    {
      onSuccess: (res) => {
        refreshLiveData();
        const roomSuffix = res?.calledRoom ? ` — Room ${res.calledRoom}` : "";
        toast.success(`${res?.ticket ?? "Ticket"} called to Casualty / Triage${roomSuffix}.`);
      },
    },
  );
  const statusMutation = useApiAction(
    ({ id, status }) => updateTicketStatus(id, status),
    { onSuccess: () => refreshLiveData() },
  );
  const transferMutation = useApiAction(
    ({ id, department }) => transferTicket(id, department),
    { onSuccess: () => refreshLiveData() },
  );
  const sendBackMutation = useApiAction(
    async ({ id, places }) => {
      await updateTicketStatus(id, "missed");
      return recallTicket(id, { reinsertionPosition: "places", places });
    },
    { onSuccess: () => refreshLiveData() },
  );
  const reannounceMutation = useApiAction(
    ({ id }) => reannounceTicket(id),
    { onSuccess: () => refreshLiveData() },
  );
  const boardPending =
    callMutation.isPending ||
    statusMutation.isPending ||
    transferMutation.isPending ||
    sendBackMutation.isPending ||
    reannounceMutation.isPending ||
    assessmentMutation.isPending;

  const deptTickets = useMemo(
    () =>
      (ticketsQuery.data ?? EMPTY_TICKETS).filter(
        (ticket) => ticket.department === "Casualty / Triage",
      ),
    [ticketsQuery.data],
  );
  const tickets = useMemo(
    () =>
      deptTickets
        .filter((ticket) => ticket.status === "waiting")
        .sort(
          (a, b) =>
            (PRIORITY_WEIGHT[a.priority] ?? 9) - (PRIORITY_WEIGHT[b.priority] ?? 9) ||
            (b.waitMinutes ?? 0) - (a.waitMinutes ?? 0),
        ),
    [deptTickets],
  );
  const calledTickets = useMemo(
    () => deptTickets.filter((ticket) => ticket.status === "called"),
    [deptTickets],
  );
  const inServiceTickets = useMemo(
    () => deptTickets.filter((ticket) => ticket.status === "in-service"),
    [deptTickets],
  );
  const missedTickets = useMemo(
    () => deptTickets.filter((ticket) => ticket.status === "missed"),
    [deptTickets],
  );
  const servingTickets = useMemo(
    () => [...calledTickets, ...inServiceTickets],
    [calledTickets, inServiceTickets],
  );
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
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [tickets, searchTerm]);

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
  const priorityCounts = TRIAGE_PRIORITIES.reduce((accumulator, priority) => {
    accumulator[priority] = tickets.filter((ticket) => ticket.priority === priority).length;
    return accumulator;
  }, {});

  function assignPriority(ticket, priority) {
    assessmentMutation.mutate({ id: ticket.id, payload: { priority } });
  }

  function setTicketStatus(ticket, status) {
    statusMutation.mutate({ id: ticket.id, status });
  }

  function sendBackInQueue(ticket, places) {
    sendBackMutation.mutate({ id: ticket.id, places });
  }

  function transferTicketTo(ticket, department) {
    transferMutation.mutate({ id: ticket.id, department });
  }

  function reannounce(ticket) {
    reannounceMutation.mutate({ id: ticket.id });
  }

  return (
    <section className="staff-module-page mx-auto min-h-[calc(100vh-7rem)] w-full max-w-[96rem] px-1 py-6 sm:py-8">
      <header className="surface-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
              <Stethoscope className="h-5 w-5" />
            </span>
            <div>
              <div className="eyebrow">Priority assignment</div>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Triage console
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Review waiting patients and assign a priority lane.
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${liveMeta.className}`}
          >
            <Wifi className="h-3.5 w-3.5" />
            {liveMeta.label}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            icon={Users}
            accent="text-primary bg-primary/15"
            label="Awaiting triage"
            value={awaitingCount}
            detail={`${filteredTickets.length} shown in list`}
          />
          <KpiTile
            icon={Timer}
            accent="text-amber-500 bg-amber-500/15"
            label="Average wait"
            value={`${avgWait}m`}
            detail={`${longestWait}m longest wait`}
          />
          <KpiTile
            icon={MessageCircle}
            accent="text-emerald-500 bg-emerald-500/15"
            label="WhatsApp ready"
            value={whatsAppCount}
            detail="Can receive alerts"
          />
          <KpiTile
            icon={Activity}
            accent="text-sky-400 bg-sky-400/15"
            label="Red / Yellow"
            value={`${priorityCounts.red + priorityCounts.yellow}`}
            detail="High-priority cases waiting"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border/60 bg-background/50 px-4 py-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Queue mix
          </span>
          {TRIAGE_PRIORITIES.map((priority) => (
            <span key={priority} className="inline-flex items-center gap-1.5 text-xs font-semibold">
              <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[priority]}`} />
              {PRIORITY_META[priority].short}
              <span className="tabular-nums text-muted-foreground">{priorityCounts[priority]}</span>
            </span>
          ))}
        </div>
      </header>

      <div className="surface-panel mb-5 flex flex-wrap items-center gap-3 p-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Call next in
          </span>
          Casualty / Triage
        </span>
        <span className="text-xs text-muted-foreground">{tickets.length} waiting</span>
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Room
          </span>
          <input
            value={callRoom}
            onChange={(event) => {
              setCallRoom(event.target.value);
              window.localStorage.setItem("waitless_call_room", event.target.value);
            }}
            placeholder="e.g. 502"
            className="input-base h-9 w-20 text-xs"
          />
        </label>
        <button
          type="button"
          onClick={() => callMutation.mutate()}
          disabled={boardPending || !tickets.length}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold uppercase tracking-wider text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
        >
          {callMutation.isPending ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <BellRing className="h-3.5 w-3.5" />
          )}
          Call next patient
        </button>
        <label className="relative ml-auto block w-full sm:w-72">
          <span className="sr-only">Search waiting patients</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by patient, ticket, or department"
            className="input-base h-9 pl-10 text-sm"
          />
        </label>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="surface-panel">
          <PanelHeader
            icon={Activity}
            title="Now serving"
            subtitle="Patients currently at a desk"
            count={servingTickets.length}
          />
          {ticketsQuery.isLoading ? (
            <LoadingPanel
              compact
              className="px-5 py-6"
              message="Fetching the triage board."
              surface={false}
              title="Loading queue"
            />
          ) : ticketsQuery.isError ? (
            <div className="px-5 py-6 text-sm text-destructive">
              {ticketsQuery.error.message}
            </div>
          ) : servingTickets.length ? (
            <div className="grid gap-3 p-5">
              {servingTickets.map((ticket) => (
                <ServingTile
                  key={ticket.id}
                  ticket={ticket}
                  onStatus={setTicketStatus}
                  onTransfer={transferTicketTo}
                  onSendBack={sendBackInQueue}
                  onReannounce={reannounce}
                  onPriority={assignPriority}
                  pending={boardPending}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center px-5 py-8 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-priority-green/15 text-priority-green">
                <Activity className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm text-muted-foreground">
                No patients are currently being served.
              </p>
            </div>
          )}
        </div>

        <div className="surface-panel">
          <PanelHeader
            icon={Clock3}
            title="Up next"
            subtitle="Live · ordered by priority"
            count={filteredTickets.length}
          />
          {ticketsQuery.isLoading ? (
            <LoadingPanel
              compact
              className="px-5 py-6"
              message="Fetching patients waiting for triage."
              surface={false}
              title="Loading queue"
            />
          ) : ticketsQuery.isError ? (
            <div className="px-5 py-6 text-sm text-destructive">
              {ticketsQuery.error.message}
            </div>
          ) : filteredTickets.length ? (
            <div className="divide-y divide-border/50">
              {filteredTickets.map((ticket, index) => (
                <WaitingQueueRow
                  key={ticket.id}
                  ticket={ticket}
                  position={index + 1}
                  onCall={(rowTicket) => setTicketStatus(rowTicket, "called")}
                  pending={boardPending}
                />
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              {tickets.length
                ? "No patients match the current search."
                : "No patients are currently waiting for triage."}
            </div>
          )}
        </div>
      </div>

      <div className="surface-panel mt-5 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-bold">Missed turns</h2>
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums">
            {missedTickets.length}
          </span>
        </div>
        {missedTickets.length ? (
          <div className="grid gap-3">
            {missedTickets.map((ticket) => (
              <MissedRecallRow key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center px-5 py-8 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-priority-green/15 text-priority-green">
              <Clock3 className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm text-muted-foreground">
              No missed turns — recall list is clear.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function PanelHeader({ icon: Icon, title, subtitle, count }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-base font-bold">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {typeof count === "number" ? (
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold tabular-nums">
          {count}
        </span>
      ) : null}
    </div>
  );
}

function KpiTile({ icon: Icon, accent, label, value, detail }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/50 px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${accent}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-display text-2xl font-bold tabular-nums tracking-tight">
          {value}
        </span>
      </div>
      <div className="mt-2.5 text-xs font-semibold">{label}</div>
      {detail ? (
        <div className="mt-0.5 text-[11px] text-muted-foreground">{detail}</div>
      ) : null}
    </div>
  );
}


