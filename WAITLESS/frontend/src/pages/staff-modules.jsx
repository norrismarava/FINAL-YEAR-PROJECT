import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileChartColumn,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Search,
  Timer,
  TrendingUp,
  Users,
  Wifi,
} from "lucide-react";

import { LoadingPanel } from "@/components/ui/system-loader";
import { useLiveRefresh } from "@/context/LiveRefreshContext";
import { useApiAction, useApiResource } from "@/hooks/useApiResource";
import { DEPARTMENTS, PRIORITY_META, STATUS_META, priorityChipClass } from "@/services/queueMeta";
import {
  fetchDashboardSummary,
  fetchQueueBoard,
  retryNotificationDelivery,
} from "@/services/queueApi";
import { useQueueRealtime } from "@/sockets/QueueRealtimeProvider";

const isBrowser = typeof window !== "undefined";
const EMPTY_LIST = [];

function useDashboardSummary() {
  const loader = useCallback(() => fetchDashboardSummary(), []);
  return useApiResource(loader, { enabled: isBrowser });
}

function ModulePage({ eyebrow, title, description, icon: Icon, children }) {
  return (
    <section className="staff-module-page mx-auto min-h-[calc(100vh-7rem)] w-full max-w-[96rem] px-1 py-6 sm:py-8">
      <header className="surface-panel flex flex-wrap items-start justify-between gap-5 p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
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

function MetricTile({ label, value, detail, icon: Icon }) {
  return (
    <div className="surface-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </div>
        {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
      </div>
      <div className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground">
        {value}
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

export function StaffQueueBoardPage() {
  const realtime = useQueueRealtime();
  const loader = useCallback(() => fetchQueueBoard(), []);
  const query = useApiResource(loader, { enabled: isBrowser });
  const serving = query.data?.nowServing ?? EMPTY_LIST;
  const waiting = query.data?.waiting ?? EMPTY_LIST;
  const missed = query.data?.missed ?? EMPTY_LIST;

  return (
    <ModulePage
      eyebrow="Live operations"
      title="Queue Board"
      description="A staff view of every ticket currently serving, waiting, or awaiting recall."
      icon={Users}
    >
      <QueryBoundary query={query} title="Loading the queue board">
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricTile
            label="Now serving"
            value={serving.length}
            detail="Patients at a service desk"
            icon={Wifi}
          />
          <MetricTile
            label="Waiting"
            value={waiting.length}
            detail="Ordered by clinical priority"
            icon={Clock3}
          />
          <MetricTile
            label="Missed"
            value={missed.length}
            detail="Available for staff recall"
            icon={AlertTriangle}
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="surface-panel p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="eyebrow">Current calls</div>
                <h2 className="mt-2 font-display text-2xl font-bold">Now serving</h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-priority-green/15 px-3 py-1.5 text-xs font-semibold text-priority-green">
                <span className="h-2 w-2 rounded-full bg-priority-green" />
                {realtime.status === "connected" ? "Live" : "Syncing"}
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {serving.length ? (
                serving.map((ticket) => <QueueTicketRow key={ticket.id} ticket={ticket} />)
              ) : (
                <EmptyMessage>No patients are currently being served.</EmptyMessage>
              )}
            </div>
          </article>

          <article className="surface-panel overflow-hidden">
            <div className="border-b border-border/70 px-6 py-5">
              <div className="eyebrow">Waiting room</div>
              <h2 className="mt-2 font-display text-2xl font-bold">Up next</h2>
            </div>
            {waiting.length ? (
              <div className="divide-y divide-border/70">
                {waiting.map((ticket) => (
                  <QueueTicketRow key={ticket.id} ticket={ticket} compact />
                ))}
              </div>
            ) : (
              <div className="p-6">
                <EmptyMessage>The live waiting queue is clear.</EmptyMessage>
              </div>
            )}
          </article>
        </div>
      </QueryBoundary>
    </ModulePage>
  );
}

function QueueTicketRow({ ticket, compact = false }) {
  return (
    <div
      className={`${compact ? "px-6 py-4" : "rounded-xl border border-border/70 bg-background/70 p-4"} flex items-center justify-between gap-4`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`inline-grid h-9 w-16 shrink-0 place-items-center rounded-lg font-display text-xs font-bold ${priorityChipClass[ticket.priority]}`}
        >
          {ticket.ticket}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{ticket.department}</div>
          <div className="mt-1 truncate text-xs text-muted-foreground">
            {PRIORITY_META[ticket.priority]?.label ?? ticket.priority}
          </div>
        </div>
      </div>
      <div className="shrink-0 text-right text-xs text-muted-foreground">
        <div className="font-semibold text-foreground">{ticket.waitMinutes}m</div>
        <div className="mt-1">{STATUS_META[ticket.status]?.label ?? ticket.status}</div>
      </div>
    </div>
  );
}

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
            const scoped = tickets.filter((ticket) => ticket.department === department);
            const waiting = scoped.filter((ticket) => ticket.status === "waiting").length;
            const active = scoped.filter((ticket) =>
              ["called", "in-service"].includes(ticket.status),
            ).length;
            return (
              <article key={department} className="surface-panel p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">{department}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Live department workload</p>
                  </div>
                  <span className="font-display text-3xl font-bold text-primary">
                    {scoped.length}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <DepartmentStat label="Waiting" value={waiting} />
                  <DepartmentStat label="Active" value={active} />
                  <DepartmentStat
                    label="Closed"
                    value={scoped.filter((ticket) => ticket.status === "completed").length}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </QueryBoundary>
    </ModulePage>
  );
}

function DepartmentStat({ label, value }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 p-3">
      <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

export function AppointmentsPage() {
  const query = useDashboardSummary();
  const tickets = query.data?.tickets ?? EMPTY_LIST;
  const active = tickets.filter((ticket) => ["called", "in-service"].includes(ticket.status));
  const upcoming = tickets.filter((ticket) => ticket.status === "waiting");

  return (
    <ModulePage
      eyebrow="Clinical schedule"
      title="Appointments"
      description="Monitor patients currently called for care and those next in the live service sequence."
      icon={CalendarDays}
    >
      <QueryBoundary query={query} title="Loading appointments">
        <div className="grid gap-5 xl:grid-cols-2">
          <AppointmentList
            title="Active now"
            tickets={active}
            empty="No patients are currently in service."
          />
          <AppointmentList
            title="Upcoming queue"
            tickets={upcoming}
            empty="No patients are currently waiting."
          />
        </div>
      </QueryBoundary>
    </ModulePage>
  );
}

function AppointmentList({ title, tickets, empty }) {
  return (
    <article className="surface-panel p-6">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <div className="mt-5 space-y-3">
        {tickets.length ? (
          tickets.map((ticket) => <QueueTicketRow key={ticket.id} ticket={ticket} />)
        ) : (
          <EmptyMessage>{empty}</EmptyMessage>
        )}
      </div>
    </article>
  );
}

export function ReportsPage() {
  const query = useDashboardSummary();
  const metrics = query.data?.metrics;

  return (
    <ModulePage
      eyebrow="Operational insight"
      title="Reports"
      description="A concise shift report covering patient flow, completion, priorities, and communication activity."
      icon={FileChartColumn}
    >
      <QueryBoundary query={query} title="Preparing reports">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="Patients tracked"
            value={metrics?.total ?? 0}
            detail="All tickets in the current dataset"
            icon={Users}
          />
          <MetricTile
            label="Average wait"
            value={`${metrics?.avgWait ?? 0}m`}
            detail="Across active patient flow"
            icon={Timer}
          />
          <MetricTile
            label="Completed"
            value={metrics?.byStatus?.completed ?? 0}
            detail="Visits closed successfully"
            icon={CheckCircle2}
          />
          <MetricTile
            label="Notifications"
            value={metrics?.notificationsToday ?? 0}
            detail="Patient messages issued today"
            icon={BellRing}
          />
        </div>
        <article className="surface-panel mt-5 overflow-hidden">
          <div className="border-b border-border/70 px-6 py-5">
            <h2 className="font-display text-2xl font-bold">Status breakdown</h2>
          </div>
          <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(metrics?.byStatus ?? {}).map(([status, value]) => (
              <DepartmentStat
                key={status}
                label={STATUS_META[status]?.label ?? status}
                value={value}
              />
            ))}
          </div>
        </article>
      </QueryBoundary>
    </ModulePage>
  );
}

export function QueueAnalyticsPage() {
  const query = useDashboardSummary();
  const tickets = query.data?.tickets ?? EMPTY_LIST;
  const maxLoad = Math.max(
    ...DEPARTMENTS.map(
      (department) => tickets.filter((ticket) => ticket.department === department).length,
    ),
    1,
  );

  return (
    <ModulePage
      eyebrow="Operational insight"
      title="Queue Analytics"
      description="See where patient demand is concentrated and which departments need additional attention."
      icon={TrendingUp}
    >
      <QueryBoundary query={query} title="Loading queue analytics">
        <article className="surface-panel p-6">
          <h2 className="font-display text-2xl font-bold">Department load</h2>
          <div className="mt-6 space-y-5">
            {DEPARTMENTS.map((department) => {
              const scoped = tickets.filter((ticket) => ticket.department === department);
              const waiting = scoped.filter((ticket) => ticket.status === "waiting").length;
              const width = scoped.length ? Math.max((scoped.length / maxLoad) * 100, 8) : 0;
              return (
                <div key={department}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold">{department}</span>
                    <span className="text-muted-foreground">
                      {scoped.length} tracked - {waiting} waiting
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full gradient-primary"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
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
        <div className="surface-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
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
                  className={`rounded-full px-3 py-2 text-xs font-semibold ${filter === option.value ? "gradient-primary text-primary-foreground" : "border border-border bg-background/70 text-muted-foreground"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className="relative min-w-[16rem] flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notifications"
                className="input-base pl-10"
              />
            </label>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {filtered.length ? (
            filtered.map((notification) => (
              <article
                key={notification.id}
                className="surface-panel flex flex-wrap items-start justify-between gap-4 p-5"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={`inline-grid h-9 w-16 shrink-0 place-items-center rounded-lg font-display text-xs font-bold ${priorityChipClass[notification.priority]}`}
                  >
                    {notification.ticket}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground">{notification.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.patientName} - {notification.department}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
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
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-semibold hover:bg-muted disabled:opacity-60"
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
            <div className="surface-panel p-6">
              <EmptyMessage>No notifications match this view.</EmptyMessage>
            </div>
          )}
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
