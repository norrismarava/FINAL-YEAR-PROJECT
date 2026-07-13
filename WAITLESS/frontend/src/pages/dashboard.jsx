import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  Clock3,
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
  callNextPatient,
  fetchDashboardSummary,
  recallTicket,
  retryNotificationDelivery,
  retryNotificationDeliveries,
  transferTicket,
  updateTicketStatus,
} from "@/services/queueApi";
import { useQueueRealtime } from "@/sockets/QueueRealtimeProvider";

const isBrowser = typeof window !== "undefined";
const EMPTY_LIST = [];
const PRIORITY_ORDER = ["red", "yellow", "green", "black"];
const STATUS_ORDER = ["waiting", "called", "in-service", "missed", "completed"];
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
const EMPTY_METRICS = {
  total: 0,
  waiting: 0,
  active: 0,
  avgWait: 0,
  notificationsToday: 0,
  byPriority: {
    red: 0,
    yellow: 0,
    green: 0,
    black: 0,
  },
  byStatus: {
    waiting: 0,
    called: 0,
    "in-service": 0,
    missed: 0,
    completed: 0,
  },
  notificationChannels: {
    "display-board": 0,
    whatsapp: 0,
  },
  notificationStatuses: {
    queued: 0,
    sending: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    retrying: 0,
    failed: 0,
  },
  byDepartment: [],
};
const EMPTY_NOTIFICATION_ANALYTICS = {
  trend: [],
  statusMix: [],
  departmentIssues: [],
  audit: {
    retryableCount: 0,
    readRate: 0,
    whatsAppShare: 0,
    averageAttemptsPerWhatsApp: 0,
    oldestOutstandingMinutes: 0,
    topFailureReasons: [],
    deliveredCount: 0,
  },
};
const NotificationAnalyticsPanels = lazy(
  () => import("@/components/dashboard/NotificationAnalyticsPanels"),
);

export default function DashboardPage() {
  const { refreshLiveData } = useLiveRefresh();
  const realtime = useQueueRealtime();
  const [selectedDepartment, setSelectedDepartment] = useState(DEPARTMENTS[0]);
  const [notificationFilter, setNotificationFilter] = useState("attention");
  const [notificationSearch, setNotificationSearch] = useState("");
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const loadDashboardSummary = useCallback(() => fetchDashboardSummary(), []);
  const dashboardQuery = useApiResource(loadDashboardSummary, { enabled: isBrowser });
  const callNextMutation = useApiAction(callNextPatient, {
    onSuccess: refreshLiveData,
  });
  const updateStatusMutation = useApiAction(
    ({ id, status }) => updateTicketStatus(id, status),
    { onSuccess: refreshLiveData },
  );
  const recallTicketMutation = useApiAction(recallTicket, {
    onSuccess: refreshLiveData,
  });
  const transferTicketMutation = useApiAction(
    ({ id, department }) => transferTicket(id, department),
    { onSuccess: refreshLiveData },
  );
  const retryNotificationMutation = useApiAction(retryNotificationDelivery, {
    onSuccess: refreshLiveData,
  });
  const bulkRetryNotificationMutation = useApiAction(retryNotificationDeliveries, {
    onSuccess: refreshLiveData,
  });

  const tickets = dashboardQuery.data?.tickets ?? EMPTY_LIST;
  const notifications = dashboardQuery.data?.notifications ?? EMPTY_LIST;
  const metrics = dashboardQuery.data?.metrics ?? EMPTY_METRICS;
  const notificationAnalytics =
    dashboardQuery.data?.notificationAnalytics ?? EMPTY_NOTIFICATION_ANALYTICS;
  const reassessmentAlerts = dashboardQuery.data?.safetyAlerts?.reassessment ?? EMPTY_LIST;

  const departmentSummaries = DEPARTMENTS.map((department) => {
    const scopedTickets = tickets.filter((ticket) => ticket.department === department);
    const waiting = scopedTickets.filter((ticket) => ticket.status === "waiting").length;
    const active = scopedTickets.filter(
      (ticket) => ticket.status === "called" || ticket.status === "in-service",
    ).length;
    const missed = scopedTickets.filter((ticket) => ticket.status === "missed").length;
    const completed = scopedTickets.filter((ticket) => ticket.status === "completed").length;

    return {
      dept: department,
      count: scopedTickets.length,
      waiting,
      active,
      missed,
      completed,
    };
  }).sort(
    (left, right) =>
      right.count - left.count ||
      right.waiting - left.waiting ||
      left.dept.localeCompare(right.dept),
  );

  const selectedSummary = departmentSummaries.find(
    (department) => department.dept === selectedDepartment,
  ) ?? {
    dept: selectedDepartment,
    count: 0,
    waiting: 0,
    active: 0,
    missed: 0,
    completed: 0,
  };
  const busiestDepartment = departmentSummaries[0] ?? selectedSummary;
  const maxDepartmentCount = Math.max(
    ...departmentSummaries.map((department) => department.count),
    1,
  );
  const liveMeta = LIVE_STATUS_META[realtime.status] ?? LIVE_STATUS_META.connecting;
  const departmentWaiting = tickets.filter(
    (ticket) => ticket.status === "waiting" && ticket.department === selectedDepartment,
  );
  const departmentActive = tickets.filter(
    (ticket) =>
      (ticket.status === "called" || ticket.status === "in-service") &&
      ticket.department === selectedDepartment,
  );
  const departmentMissed = tickets.filter(
    (ticket) => ticket.status === "missed" && ticket.department === selectedDepartment,
  );
  const nextPatient = departmentWaiting[0] ?? null;
  const deliveredNotifications =
    metrics.notificationStatuses.delivered + metrics.notificationStatuses.read;
  const notificationsNeedingAttention =
    metrics.notificationStatuses.failed + metrics.notificationStatuses.retrying;
  const deliveryRate = metrics.notificationsToday
    ? Math.round((deliveredNotifications / metrics.notificationsToday) * 100)
    : 0;
  const completionRate = metrics.total
    ? Math.round((metrics.byStatus.completed / metrics.total) * 100)
    : 0;
  const queuePressure = metrics.total ? Math.round((metrics.waiting / metrics.total) * 100) : 0;
  const activeMutationTicketId = updateStatusMutation.variables?.id ?? null;
  const activeRecallTicketId = recallTicketMutation.variables ?? null;
  const activeTransferTicketId = transferTicketMutation.variables?.id ?? null;
  const activeRetryNotificationId = retryNotificationMutation.variables ?? null;
  const notificationIssues = useMemo(
    () =>
      notifications.filter(
        (notification) => notification.status === "failed" || notification.status === "retrying",
      ),
    [notifications],
  );
  const inFlightNotifications = useMemo(
    () =>
      notifications.filter((notification) =>
        ["queued", "sending", "sent"].includes(notification.status),
      ),
    [notifications],
  );
  const filteredNotifications = useMemo(() => {
    const normalizedSearch = notificationSearch.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesFilter = {
        attention: notification.status === "failed" || notification.status === "retrying",
        inflight: ["queued", "sending", "sent"].includes(notification.status),
        delivered: ["delivered", "read"].includes(notification.status),
        whatsapp: notification.channel === "whatsapp",
        board: notification.channel === "display-board",
        all: true,
      }[notificationFilter];

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        notification.ticket,
        notification.patientName,
        notification.department,
        notification.recipient,
        notification.title,
        notification.message,
        notification.type,
        notification.status,
        notification.channel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [notificationFilter, notificationSearch, notifications]);
  const selectedNotification =
    filteredNotifications.find((notification) => notification.id === selectedNotificationId) ??
    filteredNotifications[0] ??
    null;
  const topNotificationIssue = notificationIssues[0] ?? null;
  const retryableIssueNotifications = useMemo(
    () => notificationIssues.filter((notification) => canRetryNotification(notification.status)),
    [notificationIssues],
  );
  const retryableFilteredNotifications = useMemo(
    () => filteredNotifications.filter((notification) => canRetryNotification(notification.status)),
    [filteredNotifications],
  );
  const notificationAudit = notificationAnalytics.audit;
  const departmentIssueChartData = notificationAnalytics.departmentIssues.slice(0, 5);

  useEffect(() => {
    if (!filteredNotifications.length) {
      setSelectedNotificationId(null);
      return;
    }

    if (
      !selectedNotificationId ||
      !filteredNotifications.some((notification) => notification.id === selectedNotificationId)
    ) {
      setSelectedNotificationId(filteredNotifications[0].id);
    }
  }, [filteredNotifications, selectedNotificationId]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="surface-panel p-6 sm:p-8">
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.2fr_0.85fr]">
          <div>
            <div className="eyebrow">Hospital operations</div>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Staff command dashboard
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Monitor queue movement, clinical priority pressure, and patient notifications from
                  one live operations room.
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${liveMeta.className}`}
              >
                <Wifi className="h-3.5 w-3.5" />
                {liveMeta.label}
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <SnapshotTile
                label="Patients still waiting"
                value={metrics.waiting}
                detail={`${metrics.byStatus.called} already called across the hospital`}
              />
              <SnapshotTile
                label="Average queue time"
                value={`${metrics.avgWait}m`}
                detail={`${queuePressure}% of tracked tickets are still in the waiting state`}
              />
              <SnapshotTile
                label="Delivery confidence"
                value={`${deliveryRate}%`}
                detail={
                  metrics.notificationsToday
                    ? `${deliveredNotifications} notifications reached or were read`
                    : "Notification activity will appear here as patients are registered"
                }
              />
            </div>
          </div>

          <div className="surface-panel-dark p-5 sm:p-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-foreground/70">
              Operational focus
            </div>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  {busiestDepartment.count ? busiestDepartment.dept : "No active pressure"}
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-primary-foreground/80">
                  {busiestDepartment.count
                    ? "This department carries the heaviest live load right now. Use the command desk to step through tickets without losing triage order."
                    : "As new patients arrive, this panel will spotlight where the queue needs the most staff attention."}
                </p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-primary-foreground/85">
                {busiestDepartment.count} tracked
              </span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <DarkStat label="Waiting" value={busiestDepartment.waiting} />
              <DarkStat label="Active" value={busiestDepartment.active} />
              <DarkStat label="Closed" value={busiestDepartment.completed} />
            </div>

            <div className="mt-5 rounded-2xl border border-white/12 bg-white/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary-foreground/80" />
                <div>
                  <div className="font-semibold text-primary-foreground">Notification watch</div>
                  <p className="mt-1 text-sm leading-6 text-primary-foreground/80">
                    {notificationsNeedingAttention
                      ? `${notificationsNeedingAttention} patient alerts still need attention or another send attempt.`
                      : "Delivery health is stable. No patient notifications are currently waiting for intervention."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {dashboardQuery.isLoading ? (
        <LoadingPanel
          className="mt-6"
          message="Syncing queue, triage and notification activity."
          title="Loading the live dashboard"
        />
      ) : dashboardQuery.isError ? (
        <div className="surface-panel mt-6 border-destructive/30 bg-destructive/10 px-5 py-6 text-sm text-destructive">
          {dashboardQuery.error.message}
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={Users}
              label="Patients in flow"
              value={metrics.total}
              hint={`${metrics.waiting} waiting and ${metrics.active} active right now`}
            />
            <KpiCard
              icon={Timer}
              label="Average wait"
              value={`${metrics.avgWait}m`}
              hint={`${completionRate}% of today's tracked tickets are already completed`}
              tone="accent"
            />
            <KpiCard
              icon={AlertTriangle}
              label="Critical cases"
              value={metrics.byPriority.red}
              hint="Priority I patients should move directly into emergency response"
              tone="critical"
            />
            <KpiCard
              icon={BellRing}
              label="Alerts issued"
              value={metrics.notificationsToday}
              hint={`${deliveredNotifications} delivered or read, ${notificationsNeedingAttention} need attention`}
              tone="primary"
            />
          </div>

          <ReassessmentAlertsPanel alerts={reassessmentAlerts} />

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.85fr_1fr]">
            <article className="surface-panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="eyebrow">Operations overview</div>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
                    Department load board
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Click any department to sync the command desk and move staff attention without
                    losing context.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-soft/70 px-3 py-1.5 text-xs font-semibold text-primary">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {busiestDepartment.dept} is carrying the heaviest live load
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {departmentSummaries.map((department) => {
                  const width = department.count
                    ? Math.max((department.count / maxDepartmentCount) * 100, 12)
                    : 0;
                  const isSelected = department.dept === selectedDepartment;

                  return (
                    <button
                      key={department.dept}
                      type="button"
                      onClick={() => setSelectedDepartment(department.dept)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                        isSelected
                          ? "border-primary/25 bg-primary-soft/55 shadow-card"
                          : "border-border/70 bg-background/80 hover:border-primary/15 hover:bg-primary-soft/25"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold">{department.dept}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {department.waiting} waiting, {department.active} active,{" "}
                            {department.completed} completed
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-3xl font-bold tracking-tight">
                            {department.count}
                          </div>
                          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                            tracked
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/80">
                        <div
                          className={`h-full rounded-full ${
                            isSelected
                              ? "gradient-primary"
                              : "bg-gradient-to-r from-primary/70 to-accent/70"
                          }`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>

            <div className="space-y-6">
              <article className="surface-panel p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="eyebrow">Clinical picture</div>
                    <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
                      Priority and flow health
                    </h2>
                  </div>
                  <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {completionRate}% clearance
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {PRIORITY_ORDER.map((priority) => (
                    <div
                      key={priority}
                      className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-grid h-10 w-16 place-items-center rounded-xl font-display text-xs font-bold uppercase ${priorityChipClass[priority]}`}
                        >
                          {PRIORITY_META[priority].short}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold">{PRIORITY_META[priority].label}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {PRIORITY_META[priority].destination}
                          </div>
                        </div>
                        <div className="font-display text-3xl font-bold tracking-tight">
                          {metrics.byPriority[priority]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {STATUS_ORDER.map((status) => (
                    <StatusMiniCard
                      key={status}
                      label={STATUS_META[status]?.label ?? status}
                      value={metrics.byStatus[status]}
                    />
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Delivery confidence
                      </div>
                      <div className="mt-1 font-display text-3xl font-bold tracking-tight">
                        {deliveryRate}%
                      </div>
                    </div>
                    <BellRing className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full gradient-primary"
                      style={{ width: `${Math.min(deliveryRate, 100)}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{deliveredNotifications} delivered or read</span>
                    <span>{notificationsNeedingAttention} need attention</span>
                  </div>
                </div>
              </article>

              <article className="surface-panel p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="eyebrow">Command desk</div>
                    <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
                      {selectedDepartment}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Advance patients while preserving the live triage order for this department.
                    </p>
                  </div>
                  <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Staff action
                  </span>
                </div>

                <label className="mt-5 block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Focus department
                  </span>
                  <select
                    value={selectedDepartment}
                    onChange={(event) => setSelectedDepartment(event.target.value)}
                    className="input-base mt-2"
                  >
                    {DEPARTMENTS.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MiniStat label="Waiting here" value={selectedSummary.waiting} />
                  <MiniStat label="Active here" value={selectedSummary.active} />
                  <MiniStat label="Missed here" value={selectedSummary.missed} />
                </div>

                <button
                  onClick={() => callNextMutation.mutate(selectedDepartment)}
                  disabled={callNextMutation.isPending || !nextPatient}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
                >
                  {callNextMutation.isPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Calling next patient...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Call next patient
                    </>
                  )}
                </button>

                {callNextMutation.isError && (
                  <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {callNextMutation.error.message}
                  </div>
                )}

                <div className="surface-panel-muted mt-5 px-4 py-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                    Next candidate
                  </div>
                  {nextPatient ? (
                    <div className="mt-3">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`inline-grid h-10 w-18 place-items-center rounded-xl px-3 font-display text-sm font-bold ${priorityChipClass[nextPatient.priority]}`}
                        >
                          {nextPatient.ticket}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground">
                          waiting {nextPatient.waitMinutes}m
                        </span>
                      </div>
                      <div className="mt-3 font-semibold">{nextPatient.patientName}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {PRIORITY_META[nextPatient.priority].label} for {nextPatient.department}
                      </div>
                      {nextPatient.whatsApp && (
                        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent/12 px-2.5 py-1 text-[11px] font-semibold text-accent">
                          <MessageCircle className="h-3 w-3" />
                          WhatsApp notifications active
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      No waiting patients are currently queued for this department.
                    </p>
                  )}
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-bold tracking-tight">
                      Currently active
                    </h3>
                    <Clock3 className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {departmentActive.length ? (
                    <ul className="mt-3 space-y-2">
                      {departmentActive.map((ticket) => (
                        <li
                          key={ticket.id}
                          className="rounded-2xl border border-border/70 bg-background/75 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span
                              className={`inline-grid h-9 w-16 place-items-center rounded-xl font-display text-xs font-bold ${priorityChipClass[ticket.priority]}`}
                            >
                              {ticket.ticket}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_META[ticket.status]?.className ?? STATUS_META.waiting.className}`}
                            >
                              {STATUS_META[ticket.status]?.label ?? ticket.status}
                            </span>
                          </div>
                          <div className="mt-2 font-medium">{ticket.patientName}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-dashed border-border bg-background/70 px-4 py-4 text-sm text-muted-foreground">
                      No patient is currently being served in this department.
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-bold tracking-tight">
                      Missed turns
                    </h3>
                    <span className="rounded-full bg-priority-yellow/15 px-2.5 py-1 text-[10px] font-semibold text-foreground">
                      Recall lane
                    </span>
                  </div>

                  {departmentMissed.length ? (
                    <ul className="mt-3 space-y-2">
                      {departmentMissed.map((ticket) => (
                        <li
                          key={ticket.id}
                          className="rounded-2xl border border-priority-yellow/30 bg-priority-yellow/10 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span
                              className={`inline-grid h-9 w-16 place-items-center rounded-xl font-display text-xs font-bold ${priorityChipClass[ticket.priority]}`}
                            >
                              {ticket.ticket}
                            </span>
                            <button
                              type="button"
                              onClick={() => recallTicketMutation.mutate(ticket.id)}
                              disabled={recallTicketMutation.isPending}
                              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                            >
                              {recallTicketMutation.isPending &&
                              activeRecallTicketId === ticket.id ? (
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                              )}
                              Recall
                            </button>
                          </div>
                          <div className="mt-2 font-medium">{ticket.patientName}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Missed after {ticket.waitMinutes}m in flow
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-dashed border-border bg-background/70 px-4 py-4 text-sm text-muted-foreground">
                      No missed patients are waiting for recall in this department.
                    </div>
                  )}
                </div>
              </article>
            </div>

            <article className="surface-panel p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="eyebrow">Patient alerts</div>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
                    Notification management
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Separate delivery issues from routine traffic, search quickly, and retry a
                    message with full attempt context in view.
                  </p>
                </div>
                <BellRing className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <MiniStat label="Needs attention" value={notificationIssues.length} />
                <MiniStat label="In flight" value={inFlightNotifications.length} />
                <MiniStat label="Delivered / read" value={deliveredNotifications} />
                <MiniStat
                  label="Display alerts"
                  value={metrics.notificationChannels["display-board"]}
                />
              </div>

              <div className="surface-panel-muted mt-5 px-4 py-4">
                {topNotificationIssue ? (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Top issue
                      </div>
                      <div className="mt-2 font-semibold text-foreground">
                        {topNotificationIssue.ticket} for {topNotificationIssue.patientName}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {topNotificationIssue.errorMessage ||
                          "This notification is still waiting for a successful delivery state."}
                      </p>
                    </div>
                    <NotificationStatusBadge status={topNotificationIssue.status} />
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-priority-green" />
                    <div>
                      <div className="font-semibold text-foreground">Delivery lane is stable</div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        No failed or retrying patient alerts need staff intervention right now.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      value: "attention",
                      label: "Needs attention",
                      count: notificationIssues.length,
                    },
                    {
                      value: "inflight",
                      label: "In flight",
                      count: inFlightNotifications.length,
                    },
                    {
                      value: "delivered",
                      label: "Delivered",
                      count: deliveredNotifications,
                    },
                    {
                      value: "whatsapp",
                      label: "WhatsApp",
                      count: metrics.notificationChannels.whatsapp,
                    },
                    {
                      value: "board",
                      label: "Display board",
                      count: metrics.notificationChannels["display-board"],
                    },
                    {
                      value: "all",
                      label: "All",
                      count: notifications.length,
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNotificationFilter(option.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        notificationFilter === option.value
                          ? "gradient-primary text-primary-foreground shadow-elegant"
                          : "border border-border/70 bg-background/80 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {option.label} ({option.count})
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={notificationSearch}
                    onChange={(event) => setNotificationSearch(event.target.value)}
                    placeholder="Search by patient, ticket, department, or status"
                    className="input-base pl-10"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      bulkRetryNotificationMutation.mutate(
                        retryableFilteredNotifications.map((notification) => notification.id),
                      )
                    }
                    disabled={
                      bulkRetryNotificationMutation.isPending ||
                      !retryableFilteredNotifications.length
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                  >
                    {bulkRetryNotificationMutation.isPending ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Retry filtered eligible ({retryableFilteredNotifications.length})
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      bulkRetryNotificationMutation.mutate(
                        retryableIssueNotifications.map((notification) => notification.id),
                      )
                    }
                    disabled={
                      bulkRetryNotificationMutation.isPending || !retryableIssueNotifications.length
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Retry all issues ({retryableIssueNotifications.length})
                  </button>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Filtered delivery events</span>
                <span>
                  {filteredNotifications.length} shown of {notifications.length}
                </span>
              </div>

              {bulkRetryNotificationMutation.data && (
                <div className="mt-4 rounded-2xl border border-primary/20 bg-primary-soft/55 px-4 py-3 text-sm text-foreground">
                  Queued {bulkRetryNotificationMutation.data.retried} notification
                  {bulkRetryNotificationMutation.data.retried === 1 ? "" : "s"} for retry.
                  {bulkRetryNotificationMutation.data.skipped.length
                    ? ` ${bulkRetryNotificationMutation.data.skipped.length} skipped.`
                    : ""}
                </div>
              )}

              {filteredNotifications.length ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                  <div className="max-h-[44rem] space-y-3 overflow-y-auto pr-1">
                    {filteredNotifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => setSelectedNotificationId(notification.id)}
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                          selectedNotification?.id === notification.id
                            ? "border-primary/20 bg-primary-soft/35 shadow-card"
                            : `${notificationFrameClass(notification.status)} hover:border-primary/15`
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-grid h-8 w-14 place-items-center rounded-xl font-display text-xs font-bold ${priorityChipClass[notification.priority]}`}
                              >
                                {notification.ticket}
                              </span>
                              <span className="text-xs font-semibold text-muted-foreground">
                                {notification.patientName}
                              </span>
                            </div>
                            <div className="mt-2 text-sm font-semibold text-foreground">
                              {notification.title}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <NotificationChannelBadge channel={notification.channel} />
                            <NotificationStatusBadge status={notification.status} />
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{notification.department}</span>
                          <span>&bull;</span>
                          <span>{notification.recipient}</span>
                          <span>&bull;</span>
                          <span>{formatNotificationTime(notification.createdAt)}</span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                          {notification.channel === "whatsapp" && (
                            <span className="rounded-full bg-background/80 px-2.5 py-1 font-semibold text-muted-foreground">
                              {notification.attempts?.length ?? 0}/{notification.maxAttempts ?? 1}{" "}
                              attempts
                            </span>
                          )}
                          {notification.nextRetryAt && (
                            <span className="rounded-full bg-priority-yellow/15 px-2.5 py-1 font-semibold text-foreground">
                              Retry at {formatNotificationSchedule(notification.nextRetryAt)}
                            </span>
                          )}
                          {canRetryNotification(notification.status) && (
                            <span className="rounded-full bg-primary-soft px-2.5 py-1 font-semibold text-primary">
                              Retry available
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <NotificationFocusPanel
                    notification={selectedNotification}
                    retryNotificationMutation={retryNotificationMutation}
                    activeRetryNotificationId={activeRetryNotificationId}
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-border bg-background/70 px-4 py-4 text-sm text-muted-foreground">
                  No notifications match the current filter and search.
                </div>
              )}

              {retryNotificationMutation.isError && (
                <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {retryNotificationMutation.error.message}
                </div>
              )}

              {bulkRetryNotificationMutation.isError && (
                <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {bulkRetryNotificationMutation.error.message}
                </div>
              )}
            </article>
          </div>

          <Suspense fallback={<NotificationAnalyticsFallback />}>
            <NotificationAnalyticsPanels
              analytics={notificationAnalytics}
              audit={notificationAudit}
              departmentIssues={departmentIssueChartData}
            />
          </Suspense>

          <article className="surface-panel mt-6 overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 px-5 py-5 sm:px-6">
              <div>
                <div className="eyebrow">Live queue</div>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
                  Active patient table
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Every tracked ticket, its live status, the communication channel, and the next
                  action for staff.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUS_ORDER.map((status) => (
                  <QueueStatusChip
                    key={status}
                    label={STATUS_META[status]?.label ?? status}
                    value={metrics.byStatus[status]}
                    className={STATUS_META[status]?.className ?? STATUS_META.waiting.className}
                  />
                ))}
              </div>
            </div>

            {tickets.length ? (
              <>
                <div className="space-y-3 px-4 py-4 lg:hidden sm:px-6">
                  {tickets.map((ticket) => (
                    <article
                      key={ticket.id}
                      className="rounded-2xl border border-border/70 bg-background/80 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-grid h-10 w-16 place-items-center rounded-xl font-display text-sm font-bold ${priorityChipClass[ticket.priority]}`}
                          >
                            {ticket.ticket}
                          </span>
                          <div>
                            <div className="font-semibold">{ticket.patientName}</div>
                            <div className="text-xs text-muted-foreground">{ticket.department}</div>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_META[ticket.status]?.className ?? STATUS_META.waiting.className}`}
                        >
                          {STATUS_META[ticket.status]?.label ?? ticket.status}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          {ticket.whatsApp ? (
                            <>
                              <MessageCircle className="h-3.5 w-3.5 text-accent" />
                              WhatsApp
                            </>
                          ) : (
                            "Web / walk-in"
                          )}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {ticket.waitMinutes}m wait
                        </span>
                      </div>

                      <div className="mt-4">
                        <TicketActionButton
                          ticket={ticket}
                          disabled={
                            updateStatusMutation.isPending || recallTicketMutation.isPending
                          }
                          loading={
                            updateStatusMutation.isPending && activeMutationTicketId === ticket.id
                          }
                          recallLoading={
                            recallTicketMutation.isPending && activeRecallTicketId === ticket.id
                          }
                          onAction={(status) =>
                            updateStatusMutation.mutate({ id: ticket.id, status })
                          }
                          onRecall={() => recallTicketMutation.mutate(ticket.id)}
                        />
                        <TransferTicketControl
                          ticket={ticket}
                          departments={DEPARTMENTS}
                          disabled={transferTicketMutation.isPending}
                          loading={
                            transferTicketMutation.isPending &&
                            activeTransferTicketId === ticket.id
                          }
                          onTransfer={(department) =>
                            transferTicketMutation.mutate({ id: ticket.id, department })
                          }
                        />
                      </div>
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="bg-muted/50 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3">Ticket</th>
                        <th className="px-6 py-3">Patient</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Channel</th>
                        <th className="px-6 py-3 text-right">Wait</th>
                        <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {tickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className="bg-background/70 transition-colors hover:bg-primary-soft/25"
                        >
                          <td className="px-6 py-4">
                            <span
                              className={`inline-grid h-9 w-16 place-items-center rounded-xl font-display text-xs font-bold ${priorityChipClass[ticket.priority]}`}
                            >
                              {ticket.ticket}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium">{ticket.patientName}</td>
                          <td className="px-6 py-4 text-muted-foreground">{ticket.department}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_META[ticket.status]?.className ?? STATUS_META.waiting.className}`}
                            >
                              {STATUS_META[ticket.status]?.label ?? ticket.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {ticket.whatsApp ? (
                              <span className="inline-flex items-center gap-1 text-accent">
                                <MessageCircle className="h-3.5 w-3.5" />
                                WhatsApp
                              </span>
                            ) : (
                              <span className="text-xs">Web / walk-in</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold tabular-nums">
                            {ticket.waitMinutes}m
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end gap-2">
                              <TicketActionButton
                                ticket={ticket}
                                disabled={
                                  updateStatusMutation.isPending ||
                                  recallTicketMutation.isPending
                                }
                                loading={
                                  updateStatusMutation.isPending &&
                                  activeMutationTicketId === ticket.id
                                }
                                recallLoading={
                                  recallTicketMutation.isPending &&
                                  activeRecallTicketId === ticket.id
                                }
                                onAction={(status) =>
                                  updateStatusMutation.mutate({ id: ticket.id, status })
                                }
                                onRecall={() => recallTicketMutation.mutate(ticket.id)}
                              />
                              <TransferTicketControl
                                ticket={ticket}
                                departments={DEPARTMENTS}
                                disabled={transferTicketMutation.isPending}
                                loading={
                                  transferTicketMutation.isPending &&
                                  activeTransferTicketId === ticket.id
                                }
                                onTransfer={(department) =>
                                  transferTicketMutation.mutate({ id: ticket.id, department })
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="px-5 py-6 text-sm text-muted-foreground sm:px-6">
                No patients are currently in the live queue.
              </div>
            )}

            {updateStatusMutation.isError && (
              <div className="border-t border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive sm:px-6">
                {updateStatusMutation.error.message}
              </div>
            )}

            {recallTicketMutation.isError && (
              <div className="border-t border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive sm:px-6">
                {recallTicketMutation.error.message}
              </div>
            )}

            {transferTicketMutation.isError && (
              <div className="border-t border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive sm:px-6">
                {transferTicketMutation.error.message}
              </div>
            )}
          </article>
        </>
      )}
    </section>
  );
}

function SnapshotTile({ label, value, detail }) {
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

function DarkStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/65">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-bold tracking-tight text-primary-foreground">
        {value}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, hint, tone = "primary" }) {
  const iconTone =
    {
      primary: "bg-primary-soft text-primary",
      accent: "bg-accent/15 text-accent",
      critical: "bg-priority-red/12 text-priority-red",
    }[tone] ?? "bg-primary-soft text-primary";

  return (
    <div className="surface-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ${iconTone}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="text-right">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {label}
          </div>
        </div>
      </div>
      <div className="mt-5 font-display text-4xl font-bold tracking-tight">{value}</div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{hint}</p>
    </div>
  );
}

function StatusMiniCard({ label, value }) {
  return (
    <div className="surface-panel-muted px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="surface-panel-muted px-4 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function QueueStatusChip({ label, value, className }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${className}`}
    >
      <span>{label}</span>
      <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-bold text-foreground/80">
        {value}
      </span>
    </span>
  );
}

function NotificationAnalyticsFallback() {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <LoadingPanel
        className="min-h-80"
        message="Preparing notification volume and channel delivery charts."
        title="Loading notification analytics"
      />
      <LoadingPanel
        className="min-h-80"
        message="Checking failed, queued and retryable patient alerts."
        title="Loading delivery health"
      />
    </div>
  );
}

function ReassessmentAlertsPanel({ alerts }) {
  if (!alerts.length) {
    return (
      <div className="surface-panel-muted mt-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Safety watch
          </div>
          <div className="mt-1 font-semibold text-foreground">
            No triage reassessments are overdue
          </div>
        </div>
        <CheckCircle2 className="h-5 w-5 text-priority-green" />
      </div>
    );
  }

  return (
    <article className="surface-panel mt-6 border-priority-yellow/30 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Safety watch</div>
          <h2 className="mt-2 font-display text-xl font-bold tracking-tight">
            Triage reassessment needed
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Red and yellow patients who wait beyond the safe threshold should be checked
            again before their condition changes unnoticed.
          </p>
        </div>
        <span className="rounded-full bg-priority-yellow/20 px-3 py-1.5 text-xs font-semibold text-foreground">
          {alerts.length} alert{alerts.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {alerts.slice(0, 6).map((alert) => (
          <div
            key={alert.id}
            className="rounded-2xl border border-priority-yellow/30 bg-priority-yellow/10 px-4 py-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={`inline-grid h-9 w-16 place-items-center rounded-xl font-display text-xs font-bold ${priorityChipClass[alert.priority]}`}
              >
                {alert.ticket}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                {alert.waitMinutes}m wait
              </span>
            </div>
            <div className="mt-2 font-semibold">{alert.patientName}</div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {alert.department} threshold is {alert.thresholdMinutes} minutes.
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function TicketActionButton({
  ticket,
  disabled,
  loading,
  recallLoading,
  onAction,
  onRecall,
}) {
  const primaryActionMeta = {
    waiting: {
      label: "Call now",
      nextStatus: "called",
      className: "border border-border bg-background hover:bg-muted",
    },
    called: {
      label: "Start service",
      nextStatus: "in-service",
      className: "border border-primary/20 bg-primary-soft text-primary hover:bg-primary-soft/80",
    },
    "in-service": {
      label: "Complete visit",
      nextStatus: "completed",
      className:
        "border border-priority-green/30 bg-priority-green/10 text-priority-green hover:bg-priority-green/15",
    },
  }[ticket.status];

  if (ticket.status === "missed") {
    return (
      <button
        onClick={onRecall}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-xl border border-priority-yellow/30 bg-priority-yellow/10 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-priority-yellow/15 disabled:opacity-60"
      >
        {recallLoading ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        Recall
      </button>
    );
  }

  if (!primaryActionMeta) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Closed
      </span>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button
        onClick={() => onAction(primaryActionMeta.nextStatus)}
        disabled={disabled}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${primaryActionMeta.className}`}
      >
        {loading ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ArrowRight className="h-3.5 w-3.5" />
        )}
        {primaryActionMeta.label}
      </button>
      {ticket.status === "called" && (
        <button
          onClick={() => onAction("missed")}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-xl border border-priority-yellow/30 bg-priority-yellow/10 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-priority-yellow/15 disabled:opacity-60"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Missed
        </button>
      )}
    </div>
  );
}

function TransferTicketControl({ ticket, departments, disabled, loading, onTransfer }) {
  const [department, setDepartment] = useState(ticket.department);
  const canTransfer = ticket.status !== "completed";
  const isChanged = department !== ticket.department;

  useEffect(() => {
    setDepartment(ticket.department);
  }, [ticket.department]);

  if (!canTransfer) {
    return null;
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <select
        value={department}
        onChange={(event) => setDepartment(event.target.value)}
        className="rounded-xl border border-border bg-background px-2.5 py-2 text-xs font-semibold text-foreground outline-none transition-colors focus:border-primary"
      >
        {departments.map((entry) => (
          <option key={entry} value={entry}>
            {entry}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onTransfer(department)}
        disabled={disabled || !isChanged}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
      >
        {loading ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ArrowRight className="h-3.5 w-3.5" />
        )}
        Transfer
      </button>
    </div>
  );
}

function NotificationChannelBadge({ channel }) {
  const badgeMeta = {
    whatsapp: {
      label: "WhatsApp",
      className: "bg-accent/15 text-accent",
    },
    "display-board": {
      label: "Display board",
      className: "bg-primary-soft text-primary",
    },
  }[channel] ?? {
    label: channel,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${badgeMeta.className}`}
    >
      {badgeMeta.label}
    </span>
  );
}

function NotificationStatusBadge({ status }) {
  const badgeMeta = {
    queued: {
      label: "Queued",
      className: "bg-muted text-muted-foreground",
    },
    sending: {
      label: "Sending",
      className: "bg-primary-soft text-primary",
    },
    sent: {
      label: "Sent",
      className: "bg-accent/15 text-accent",
    },
    delivered: {
      label: "Delivered",
      className: "bg-priority-green/15 text-priority-green",
    },
    read: {
      label: "Read",
      className: "bg-priority-green text-priority-green-foreground",
    },
    retrying: {
      label: "Retrying",
      className: "bg-priority-yellow/20 text-foreground",
    },
    failed: {
      label: "Failed",
      className: "bg-destructive/15 text-destructive",
    },
  }[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${badgeMeta.className}`}
    >
      {badgeMeta.label}
    </span>
  );
}

function NotificationFocusPanel({
  notification,
  retryNotificationMutation,
  activeRetryNotificationId,
}) {
  if (!notification) {
    return (
      <div className="surface-panel-muted flex h-full items-center justify-center px-4 py-10 text-center">
        <div className="max-w-xs">
          <BellRing className="mx-auto h-6 w-6 text-muted-foreground" />
          <div className="mt-3 font-semibold text-foreground">Select a notification</div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Choose a delivery event from the list to inspect its full status and attempt history.
          </p>
        </div>
      </div>
    );
  }

  const attempts = notification.attempts ?? [];
  const isRetryingThisNotification =
    retryNotificationMutation.isPending && activeRetryNotificationId === notification.id;

  return (
    <div className="surface-panel-muted h-full px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Delivery focus
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-grid h-8 w-14 place-items-center rounded-xl font-display text-xs font-bold ${priorityChipClass[notification.priority]}`}
            >
              {notification.ticket}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {notification.patientName}
            </span>
          </div>
          <h3 className="mt-3 font-display text-xl font-bold tracking-tight text-foreground">
            {notification.title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.message}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <NotificationChannelBadge channel={notification.channel} />
          <NotificationStatusBadge status={notification.status} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <NotificationMetaItem label="Recipient" value={notification.recipient} />
        <NotificationMetaItem label="Department" value={notification.department} />
        <NotificationMetaItem
          label="Created"
          value={formatNotificationTimestamp(notification.createdAt)}
        />
        <NotificationMetaItem
          label="Attempts"
          value={`${attempts.length}/${notification.maxAttempts ?? 1}`}
        />
        <NotificationMetaItem
          label="Next retry"
          value={
            notification.nextRetryAt
              ? formatNotificationTimestamp(notification.nextRetryAt)
              : "None scheduled"
          }
        />
        <NotificationMetaItem
          label="Last attempt"
          value={
            notification.lastAttemptAt
              ? formatNotificationTimestamp(notification.lastAttemptAt)
              : "Not attempted"
          }
        />
      </div>

      {notification.errorMessage && (
        <div className="mt-4 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-destructive">
            Delivery error
          </div>
          <p className="mt-2 text-sm leading-6 text-destructive">{notification.errorMessage}</p>
        </div>
      )}

      {canRetryNotification(notification.status) && (
        <button
          onClick={() => retryNotificationMutation.mutate(notification.id)}
          disabled={retryNotificationMutation.isPending}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          {isRetryingThisNotification ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Retry notification
        </button>
      )}

      <div className="mt-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Attempt history
        </div>
        {attempts.length ? (
          <ul className="mt-3 space-y-2">
            {attempts.map((attempt) => (
              <li
                key={`${notification.id}-${attempt.sequence}`}
                className="rounded-2xl border border-border/70 bg-background/80 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      Attempt {attempt.sequence}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Started {formatNotificationTimestamp(attempt.attemptedAt)}
                    </div>
                    {attempt.completedAt && (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        Completed {formatNotificationTimestamp(attempt.completedAt)}
                      </div>
                    )}
                  </div>
                  <NotificationStatusBadge status={attempt.status} />
                </div>

                {(attempt.providerMessageId || attempt.errorCode || attempt.errorMessage) && (
                  <div className="mt-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-3 text-[11px] text-muted-foreground">
                    {attempt.providerMessageId && (
                      <div>Provider ID: {attempt.providerMessageId}</div>
                    )}
                    {attempt.errorCode && <div>Error code: {attempt.errorCode}</div>}
                    {attempt.errorMessage && (
                      <div className="mt-1 text-destructive">{attempt.errorMessage}</div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-border bg-background/70 px-4 py-4 text-sm text-muted-foreground">
            No attempt records have been captured for this notification yet.
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationMetaItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function canRetryNotification(status) {
  return status === "queued" || status === "retrying" || status === "failed";
}

function notificationFrameClass(status) {
  return (
    {
      failed: "border-destructive/25 bg-destructive/5",
      retrying: "border-priority-yellow/30 bg-priority-yellow/10",
      delivered: "border-priority-green/20 bg-priority-green/5",
      read: "border-priority-green/25 bg-priority-green/10",
      sent: "border-accent/20 bg-accent/5",
    }[status] ?? "border-border/70 bg-background/75"
  );
}

function formatNotificationTimestamp(value) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNotificationTime(value) {
  const createdAt = new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.round((Date.now() - createdAt) / 60_000));

  if (diffMinutes < 1) {
    return "just now";
  }

  if (diffMinutes === 1) {
    return "1 min ago";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} mins ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours === 1) {
    return "1 hour ago";
  }

  return `${diffHours} hours ago`;
}

function formatNotificationSchedule(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
