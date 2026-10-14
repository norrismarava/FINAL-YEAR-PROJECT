import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  FileText,
  Hash,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Shield,
  Sparkles,
  Timer,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAuth } from "@/auth/AuthProvider";
import { LoadingPanel } from "@/components/ui/system-loader";
import { useLiveRefresh } from "@/context/LiveRefreshContext";
import { useApiAction, useApiResource } from "@/hooks/useApiResource";
import { DEPARTMENTS } from "@/services/queueMeta";
import {
  callNextPatient,
  fetchDashboardSummary,
  retryNotificationDeliveries,
} from "@/services/queueApi";
import { useQueueRealtime } from "@/sockets/QueueRealtimeProvider";
import { toast } from "sonner";

const isBrowser = typeof window !== "undefined";
const EMPTY_LIST = [];

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
};

const EMPTY_ANALYTICS = {
  trend: [],
  departmentIssues: [],
  audit: {
    retryableCount: 0,
    deliveredCount: 0,
  },
};

const STATUS_ORDER = {
  "in-service": 0,
  called: 1,
  waiting: 2,
  missed: 3,
  completed: 4,
};

const PRIORITY_ORDER = {
  red: 0,
  yellow: 1,
  green: 2,
  black: 3,
};

const STATUS_META = {
  waiting: {
    label: "Waiting",
    className: "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-400/20",
    dotClassName: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]",
  },
  called: {
    label: "Called",
    className: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/20",
    dotClassName: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
  },
  "in-service": {
    label: "Serving",
    className: "bg-teal-500/15 text-teal-300 ring-1 ring-inset ring-teal-400/20",
    dotClassName: "bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]",
  },
  missed: {
    label: "Missed",
    className: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/20",
    dotClassName: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/20",
    dotClassName: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
  },
};

const PRIORITY_META = {
  red: "bg-rose-500/20 text-rose-200 ring-1 ring-inset ring-rose-400/30",
  yellow: "bg-amber-500/20 text-amber-200 ring-1 ring-inset ring-amber-400/30",
  green: "bg-emerald-500/20 text-emerald-200 ring-1 ring-inset ring-emerald-400/30",
  black: "bg-slate-500/20 text-slate-200 ring-1 ring-inset ring-slate-400/30",
};

const DEPARTMENT_COLORS = [
  "#14b8a6",
  "#6366f1",
  "#f59e0b",
  "#22c55e",
  "#a78bfa",
  "#fb923c",
  "#38bdf8",
  "#f43f5e",
];

const PRIORITY_BAR_META = [
  { key: "red", label: "Critical", className: "bg-red-500", textClassName: "text-red-300" },
  { key: "yellow", label: "Serious", className: "bg-amber-500", textClassName: "text-amber-300" },
  { key: "green", label: "Ambulant", className: "bg-emerald-500", textClassName: "text-emerald-300" },
  { key: "black", label: "Deceased", className: "bg-slate-500", textClassName: "text-slate-300" },
];

export default function DashboardPage() {
  const { refreshLiveData } = useLiveRefresh();
  const realtime = useQueueRealtime();
  const auth = useAuth();
  const staffName = auth.user?.workspaceProfile?.preferredName?.trim() || auth.user?.name || "Staff";

  const loadDashboardSummary = useCallback(() => fetchDashboardSummary(), []);
  const dashboardQuery = useApiResource(loadDashboardSummary, {
    enabled: isBrowser,
  });

  const callNextMutation = useApiAction(callNextPatient, {
    onSuccess: refreshLiveData,
  });

  const retryFailedMutation = useApiAction(retryNotificationDeliveries, {
    onSuccess: refreshLiveData,
  });

  const tickets = dashboardQuery.data?.tickets ?? EMPTY_LIST;
  const notifications = dashboardQuery.data?.notifications ?? EMPTY_LIST;
  const metrics = dashboardQuery.data?.metrics ?? EMPTY_METRICS;
  const analytics =
    dashboardQuery.data?.notificationAnalytics ?? EMPTY_ANALYTICS;
  const safetyAlerts =
    dashboardQuery.data?.safetyAlerts?.reassessment ?? EMPTY_LIST;
  const bottleneckAlerts =
    dashboardQuery.data?.safetyAlerts?.bottlenecks ?? EMPTY_LIST;

  const lastProcessedEventRef = useRef(null);
  useEffect(() => {
    if (!realtime.lastEvent) return;
    if (lastProcessedEventRef.current === realtime.lastEvent.timestamp) return;
    lastProcessedEventRef.current = realtime.lastEvent.timestamp;

    if (realtime.lastEvent.type === "test-result.ready") {
      const payload = realtime.lastEvent.payload ?? {};
      toast.success(`Lab results ready for ${payload.ticketCode ?? "ticket"}`, {
        description: `Please return to ${payload.department ?? "OPD"} for clinician review.`,
      });
    }
  }, [realtime.lastEvent]);

  const statusMetrics = metrics.byStatus ?? EMPTY_METRICS.byStatus;
  const notificationStatuses =
    metrics.notificationStatuses ?? EMPTY_METRICS.notificationStatuses;

  const servingCount =
    Number(statusMetrics.called ?? 0) +
    Number(statusMetrics["in-service"] ?? 0);

  const missedCount = Number(statusMetrics.missed ?? 0);
  const completedCount = Number(statusMetrics.completed ?? 0);

  const queuePressure = metrics.total
    ? Math.round((Number(metrics.waiting ?? 0) / Number(metrics.total)) * 100)
    : 0;

  const clearanceRate = metrics.total
    ? Math.round((completedCount / Number(metrics.total)) * 100)
    : 0;

  const failedNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.status === "failed" ||
          notification.status === "retrying",
      ),
    [notifications],
  );

  const departmentSummaries = useMemo(() => {
    return DEPARTMENTS.map((department, index) => {
      const scopedTickets = tickets.filter(
        (ticket) => ticket.department === department,
      );

      return {
        name: department,
        color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
        total: scopedTickets.length,
        waiting: scopedTickets.filter(
          (ticket) => ticket.status === "waiting",
        ).length,
        active: scopedTickets.filter((ticket) =>
          ["called", "in-service"].includes(ticket.status),
        ).length,
        missed: scopedTickets.filter(
          (ticket) => ticket.status === "missed",
        ).length,
      };
    })
      .sort(
        (left, right) =>
          right.total - left.total ||
          right.waiting - left.waiting ||
          left.name.localeCompare(right.name),
      )
      .slice(0, 6);
  }, [tickets]);

  const busiestDepartment =
    departmentSummaries.find((department) => department.waiting > 0) ??
    departmentSummaries[0] ?? {
      name: DEPARTMENTS[0] ?? "General Outpatient",
      waiting: 0,
      active: 0,
      missed: 0,
      total: 0,
      color: DEPARTMENT_COLORS[0],
    };

  const queueRows = useMemo(() => {
    return [...tickets]
      .sort((left, right) => {
        const statusDifference =
          (STATUS_ORDER[left.status] ?? 99) -
          (STATUS_ORDER[right.status] ?? 99);

        if (statusDifference !== 0) {
          return statusDifference;
        }

        const priorityDifference =
          (PRIORITY_ORDER[left.priority] ?? 99) -
          (PRIORITY_ORDER[right.priority] ?? 99);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return Number(right.waitMinutes ?? 0) - Number(left.waitMinutes ?? 0);
      })
      .slice(0, 6);
  }, [tickets]);

  const chartData = useMemo(() => {
    const source =
      dashboardQuery.data?.queueTrend ??
      dashboardQuery.data?.trend ??
      analytics.trend ??
      EMPTY_LIST;

    if (!source.length) {
      return [
        {
          day: "Mon",
          registered: 0,
          served: 0,
          missed: 0,
        },
        {
          day: "Tue",
          registered: 0,
          served: 0,
          missed: 0,
        },
        {
          day: "Wed",
          registered: 0,
          served: 0,
          missed: 0,
        },
        {
          day: "Thu",
          registered: 0,
          served: 0,
          missed: 0,
        },
        {
          day: "Fri",
          registered: Number(metrics.total ?? 0),
          served: completedCount,
          missed: missedCount,
        },
        {
          day: "Sat",
          registered: 0,
          served: 0,
          missed: 0,
        },
        {
          day: "Sun",
          registered: 0,
          served: 0,
          missed: 0,
        },
      ];
    }

    return source.slice(-7).map((entry, index) => {
      const registered = Number(
        entry.registered ??
          entry.total ??
          entry.count ??
          entry.value ??
          0,
      );

      const missed = Number(
        entry.missed ??
          entry.failed ??
          entry.attention ??
          0,
      );

      const served = Number(
        entry.served ??
          entry.completed ??
          Math.max(registered - missed, 0),
      );

      return {
        day: entry.day ?? entry.label ?? `Day ${index + 1}`,
        registered,
        served,
        missed,
      };
    });
  }, [
    analytics.trend,
    completedCount,
    dashboardQuery.data,
    metrics.total,
    missedCount,
  ]);

  const recentActivity = useMemo(() => {
    return [...tickets]
      .sort((left, right) => {
        const leftTime = new Date(
          left.updatedAt ?? left.createdAt ?? 0,
        ).getTime();
        const rightTime = new Date(
          right.updatedAt ?? right.createdAt ?? 0,
        ).getTime();

        return rightTime - leftTime;
      })
      .slice(0, 7)
      .map((ticket) => ({
        id: ticket.id,
        ticket: ticket.ticket,
        patientName: ticket.patientName,
        department: ticket.department,
        status: ticket.status,
        createdAt: ticket.updatedAt ?? ticket.createdAt,
      }));
  }, [tickets]);

  const systemAlerts = useMemo(() => {
    const alerts = [];

    bottleneckAlerts.slice(0, 3).forEach((alert) => {
      alerts.push({
        id: `bottleneck-${alert.department}-${alert.type}`,
        severity: alert.severity === "critical" ? "critical" : "warning",
        message: alert.message,
        detail: `${alert.department} · ${alert.type}`,
        time: "Now",
      });
    });

    safetyAlerts.slice(0, 2).forEach((alert) => {
      alerts.push({
        id: `safety-${alert.id}`,
        severity: alert.priority === "red" ? "critical" : "warning",
        message: `${alert.ticket}${
          alert.patientName ? ` (${alert.patientName})` : ""
        } has waited ${alert.waitMinutes}m, reassessment needed`,
        detail: `${alert.department} safety threshold: ${alert.thresholdMinutes}m`,
        time: formatRelativeTime(alert.createdAt),
      });
    });

    if (failedNotifications.length) {
      const firstFailure = failedNotifications[0];

      alerts.push({
        id: "notification-failure",
        severity: "warning",
        message: `${failedNotifications.length} notification${
          failedNotifications.length === 1 ? "" : "s"
        } need another delivery attempt`,
        detail:
          firstFailure?.errorMessage ??
          "Review WhatsApp and patient alert delivery.",
        time: formatRelativeTime(
          firstFailure?.updatedAt ?? firstFailure?.createdAt,
        ),
      });
    }

    const pressureDepartment = departmentSummaries.find(
      (department) => department.waiting >= 5,
    );

    if (pressureDepartment) {
      alerts.push({
        id: "queue-pressure",
        severity: "info",
        message: `${pressureDepartment.name} queue pressure is high`,
        detail: `${pressureDepartment.waiting} waiting, ${pressureDepartment.active} active`,
        time: "Live",
      });
    }

    return alerts.slice(0, 3);
  }, [
    departmentSummaries,
    failedNotifications,
    safetyAlerts,
    bottleneckAlerts,
  ]);

  function exportTodayReport() {
    const header = [
      "Ticket",
      "Patient",
      "Department",
      "Status",
      "Priority",
      "Wait Minutes",
    ];

    const rows = tickets.map((ticket) => [
      ticket.ticket,
      ticket.patientName,
      ticket.department,
      ticket.status,
      ticket.priority,
      ticket.waitMinutes,
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `waitless-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  function scrollToAlerts() {
    document
      .getElementById("dashboard-system-alerts")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }

  if (dashboardQuery.isLoading) {
    return (
      <section className="min-h-screen bg-[#0a0f1c] px-4 py-5 sm:px-6">
        <LoadingPanel
          title="Loading the live dashboard"
          message="Syncing queue, department, safety and notification activity."
        />
      </section>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <section className="min-h-screen bg-[#0a0f1c] px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-6 text-sm text-rose-300">
          {dashboardQuery.error.message}
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#0a0f1c] px-4 py-5 text-slate-200 sm:px-5 lg:px-6">
      <style>{`
        @keyframes waitlessPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .42; transform: scale(.82); }
        }

        @keyframes waitlessFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .waitless-fade-up {
          animation: waitlessFadeUp 0.5s ease-out both;
        }

        .waitless-dashboard-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .waitless-dashboard-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .waitless-dashboard-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, .22);
          border-radius: 999px;
        }

        .waitless-dashboard-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, .4);
        }
      `}</style>

      <div className="mx-auto max-w-[1500px]">
        <HeroGreeting
          staffName={staffName}
          departmentCount={departmentSummaries.filter(
            (department) => department.total > 0,
          ).length}
          queuePressure={queuePressure}
          clearanceRate={clearanceRate}
          realtimeStatus={realtime.status}
        />

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={Users}
            label="Total Patients Today"
            value={metrics.total}
            description={`${completedCount} completed · ${missedCount} missed`}
            tone="navy"
            index={0}
          />

          <KpiCard
            icon={Clock3}
            label="Currently Waiting"
            value={metrics.waiting}
            description="Across all departments"
            tone="teal"
            index={1}
          />

          <KpiCard
            icon={Timer}
            label="Avg. Wait Time"
            value={`${metrics.avgWait}m`}
            description={metrics.waiting ? `${metrics.waiting} patient${metrics.waiting === 1 ? "" : "s"} in queue` : "No patients waiting"}
            tone="purple"
            index={2}
          />

          <KpiCard
            icon={Activity}
            label="Now Being Served"
            value={servingCount}
            description={`${missedCount} missed turn${missedCount === 1 ? "" : "s"}`}
            tone="brown"
            index={3}
          />
        </div>

        <PriorityBreakdown
          byPriority={metrics.byPriority ?? EMPTY_METRICS.byPriority}
          total={metrics.total}
        />

        <div className="waitless-fade-up mt-5 grid items-start gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <QueueOverview tickets={queueRows} />
          </div>

          <QuickActions
            busiestDepartment={busiestDepartment}
            ticketCount={tickets.length}
            failedCount={failedNotifications.length}
            safetyCount={safetyAlerts.length}
            callNextMutation={callNextMutation}
            retryFailedMutation={retryFailedMutation}
            failedNotificationIds={failedNotifications.map(
              (notification) => notification.id,
            )}
            onReviewSafety={scrollToAlerts}
            onExport={exportTodayReport}
          />
        </div>

        <div className="waitless-fade-up mt-5 grid items-start gap-5 xl:grid-cols-2">
          <QueueTrend data={chartData} />

          <DepartmentLoad departments={departmentSummaries} />
        </div>

        <div className="waitless-fade-up mt-5 grid items-start gap-5 xl:grid-cols-2">
          <RecentActivity
            activity={recentActivity}
            onRefresh={refreshLiveData}
          />

          <SystemAlerts
            id="dashboard-system-alerts"
            alerts={systemAlerts}
          />
        </div>

        <footer className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:flex-row">
          <div className="flex items-center gap-2 text-[11px] text-white/35">
            <span
              className={`h-2 w-2 rounded-full ${
                realtime.status === "connected"
                  ? "bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.6)]"
                  : "bg-amber-400"
              }`}
              style={
                realtime.status === "connected"
                  ? { animation: "waitlessPulse 1.8s ease-in-out infinite" }
                  : undefined
              }
            />
            {realtime.status === "connected"
              ? "Live sync active"
              : "Reconnecting…"}
            <span className="mx-2 text-white/10">·</span>
            WaitLess Hospital Queue OS
            <span className="mx-2 text-white/10">·</span>
            © {new Date().getFullYear()} WaitLess Zimbabwe
          </div>

          <div className="text-[10px] uppercase tracking-[0.2em] text-white/20">
            Chinhoyi Provincial Hospital
          </div>
        </footer>
      </div>
    </section>
  );
}

function HeroGreeting({
  staffName,
  departmentCount,
  queuePressure,
  clearanceRate,
  realtimeStatus,
}) {
  const greeting = getGreeting();

  return (
    <header className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#0f766e_0%,#0e7490_47%,#1e3a5f_100%)] shadow-[0_20px_60px_-15px_rgba(15,118,110,0.5)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(20,184,166,0.6)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.4)_0%,transparent_50%)] opacity-25" />

      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />

      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 px-6 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
              <Sparkles className="h-3 w-3 text-teal-100" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-50/90">
                Hospital operations
              </span>
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${
                realtimeStatus === "connected"
                  ? "bg-teal-400/20 text-teal-200"
                  : "bg-amber-400/20 text-amber-200"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  realtimeStatus === "connected"
                    ? "bg-teal-300"
                    : "bg-amber-300"
                }`}
              />
              {realtimeStatus === "connected" ? "Live" : "Syncing"}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {greeting}, {staffName}
          </h1>

          <p className="mt-2 text-sm text-teal-50/80">
            Live queue across {departmentCount} department
            {departmentCount === 1 ? "" : "s"} ·{" "}
            {new Date().toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <HeroMetric
            label="Queue pressure"
            value={`${queuePressure}%`}
          />

          <HeroMetric
            label="Clearance rate"
            value={`${clearanceRate}%`}
          />
        </div>
      </div>
    </header>
  );
}

function HeroMetric({ label, value }) {
  return (
    <div className="min-w-[150px] rounded-2xl border border-white/15 bg-white/10 px-5 py-3.5 text-center backdrop-blur transition hover:bg-white/15">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-50/70">
        {label}
      </div>

      <div className="mt-1.5 font-mono text-2xl font-semibold text-white">
        {value}
      </div>
    </div>
  );
}

function PriorityBreakdown({ byPriority, total }) {
  const counts = PRIORITY_BAR_META.map((meta) => ({
    ...meta,
    count: Number(byPriority[meta.key] ?? 0),
  }));

  return (
    <div className="waitless-fade-up mt-4 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
        Priority Mix
      </span>

      <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
        {counts.map((item) =>
          item.count > 0 ? (
            <div
              key={item.key}
              className={`${item.className} transition-all duration-700`}
              style={{
                width: `${total ? (item.count / total) * 100 : 0}%`,
              }}
            />
          ) : null,
        )}
      </div>

      <div className="flex shrink-0 items-center gap-4">
        {counts.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${item.className}`} />
            <span className={`text-[11px] font-semibold ${item.textClassName}`}>
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  description,
  tone,
  index = 0,
}) {
  const tones = {
    navy: {
      card:
        "border-sky-400/15 bg-[linear-gradient(135deg,#0b3154_0%,#0b3a67_100%)]",
      glow: "bg-sky-300/15",
      iconWrap: "border-sky-200/15 bg-sky-300/10 text-sky-100",
    },
    teal: {
      card:
        "border-cyan-300/15 bg-[linear-gradient(135deg,#0a424b_0%,#075764_100%)]",
      glow: "bg-cyan-200/15",
      iconWrap: "border-cyan-100/15 bg-cyan-200/10 text-cyan-100",
    },
    purple: {
      card:
        "border-violet-300/15 bg-[linear-gradient(135deg,#2c2067_0%,#392a82_100%)]",
      glow: "bg-violet-200/15",
      iconWrap: "border-violet-100/15 bg-violet-200/10 text-violet-100",
    },
    brown: {
      card:
        "border-orange-300/15 bg-[linear-gradient(135deg,#4b2a18_0%,#66381f_100%)]",
      glow: "bg-orange-200/15",
      iconWrap: "border-orange-100/15 bg-orange-100/10 text-orange-100",
    },
  };

  const selectedTone = tones[tone] ?? tones.navy;

  return (
    <article
      className={`group relative min-h-[124px] overflow-hidden rounded-2xl border p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(0,0,0,0.28)] ${selectedTone.card}`}
      style={{
        animation: `waitlessFadeUp 0.5s ease-out ${index * 0.08}s both`,
      }}
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full blur-2xl transition group-hover:scale-125 ${selectedTone.glow}`}
      />
      <div className="pointer-events-none absolute inset-y-0 right-[26%] w-px rotate-[8deg] bg-white/[0.03]" />

      <div className="relative flex h-full items-center justify-between gap-5">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-white/85">
            {label}
          </div>

          <div className="mt-2 font-mono text-4xl font-semibold tracking-tight text-white">
            {value}
          </div>

          <div className="mt-1.5 text-[10px] font-semibold text-white/55">
            {description}
          </div>
        </div>

        <span
          className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition group-hover:scale-110 ${selectedTone.iconWrap}`}
        >
          <Icon className="h-7 w-7" strokeWidth={2} />
        </span>
      </div>
    </article>
  );
}

function QueueOverview({ tickets }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
      <PanelHeader
        eyebrow="Live data"
        title="Queue Overview"
        trailing={
          <span className="inline-flex items-center gap-2 text-[11px] text-white/35">
            <span
              className="h-2 w-2 rounded-full bg-teal-400"
              style={{
                animation:
                  "waitlessPulse 1.6s ease-in-out infinite",
              }}
            />
            {tickets.length} ticket{tickets.length === 1 ? "" : "s"}
          </span>
        }
      />

      {tickets.length ? (
        <>
          <div className="space-y-3 px-4 py-4 lg:hidden">
            {tickets.map((ticket) => (
              <QueueMobileCard key={ticket.id} ticket={ticket} />
            ))}
          </div>

          <div className="waitless-dashboard-scrollbar hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {[
                    "Ticket",
                    "Patient",
                    "Department",
                    "Priority",
                    "Status",
                    "Wait",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.045]">
                {tickets.map((ticket) => (
                  <QueueTableRow key={ticket.id} ticket={ticket} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <EmptyPanel message="No patient tickets are currently available." />
      )}
    </article>
  );
}

function QueueTableRow({ ticket }) {
  const status =
    STATUS_META[ticket.status] ?? STATUS_META.waiting;

  const priorityClass =
    PRIORITY_META[ticket.priority] ?? PRIORITY_META.green;

  const priorityLabel =
    ticket.priority === "red" ? "Critical" :
    ticket.priority === "yellow" ? "Serious" :
    ticket.priority === "green" ? "Ambulant" :
    ticket.priority === "black" ? "Deceased" :
    ticket.priority;

  return (
    <tr className="transition-colors hover:bg-white/[0.025]">
      <td className="px-6 py-4">
        <span
          className={`inline-flex h-8 min-w-[4rem] items-center justify-center rounded-lg px-2 font-mono text-xs font-medium ${priorityClass}`}
        >
          {ticket.ticket}
        </span>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-500/20 text-[11px] font-semibold text-teal-100 ring-1 ring-inset ring-white/10">
            {getInitials(ticket.patientName)}
          </span>
          <div>
            <div className="font-medium text-white/90">
              {ticket.patientName}
            </div>
            {ticket.whatsApp ? (
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-teal-400/80">
                <MessageCircle className="h-3 w-3" />
                WhatsApp
              </div>
            ) : null}
          </div>
        </div>
      </td>

      <td className="px-6 py-4 text-sm text-white/45">
        {ticket.department}
      </td>

      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${priorityClass}`}
        >
          {priorityLabel}
        </span>
      </td>

      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${status.dotClassName}`}
          />
          {status.label}
        </span>
      </td>

      <td className="px-6 py-4 font-mono text-xs text-white/50">
        {ticket.waitMinutes}m
      </td>
    </tr>
  );
}

function QueueMobileCard({ ticket }) {
  const status =
    STATUS_META[ticket.status] ?? STATUS_META.waiting;

  const priorityClass =
    PRIORITY_META[ticket.priority] ?? PRIORITY_META.green;

  const priorityLabel =
    ticket.priority === "red" ? "Critical" :
    ticket.priority === "yellow" ? "Serious" :
    ticket.priority === "green" ? "Ambulant" :
    ticket.priority === "black" ? "Deceased" :
    ticket.priority;

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 transition hover:bg-white/[0.05]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-8 min-w-[4rem] items-center justify-center rounded-lg px-2 font-mono text-xs font-medium ${priorityClass}`}
          >
            {ticket.ticket}
          </span>

          <div>
            <div className="font-medium text-white/90">
              {ticket.patientName}
            </div>
            <div className="mt-1 text-xs text-white/45">
              {ticket.department}
            </div>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${status.dotClassName}`}
          />
          {status.label}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityClass}`}>
          {priorityLabel}
        </span>

        <span className="font-mono text-white/55">
          {ticket.waitMinutes}m wait
        </span>
      </div>
    </div>
  );
}

function QueueTrend({ data }) {
  return (
    <article className="rounded-2xl border border-white/[0.08] bg-[#111827] shadow-[0_12px_40px_rgba(0,0,0,0.18)] p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
            Analytics
          </p>

          <h2 className="mt-1 text-lg font-semibold text-white">
            Queue Trend · 7 Days
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <ChartLegend color="#14b8a6" label="Registered" />
          <ChartLegend color="#6366f1" label="Served" />
          <ChartLegend color="#f59e0b" label="Missed" />
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 4,
              right: 6,
              left: -18,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="registeredGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#14b8a6"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="#14b8a6"
                  stopOpacity={0}
                />
              </linearGradient>

              <linearGradient
                id="servedGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#6366f1"
                  stopOpacity={0.25}
                />
                <stop
                  offset="95%"
                  stopColor="#6366f1"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "rgba(255,255,255,0.3)",
                fontSize: 11,
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "rgba(255,255,255,0.3)",
                fontSize: 11,
              }}
            />

            <Tooltip
              contentStyle={{
                background: "#1a2540",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                fontSize: 12,
                color: "#e2e8f0",
                boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
              }}
              cursor={{
                stroke: "rgba(255,255,255,0.12)",
              }}
            />

            <Area
              type="monotone"
              dataKey="registered"
              stroke="#14b8a6"
              strokeWidth={2.5}
              fill="url(#registeredGradient)"
              dot={false}
              activeDot={{ r: 5, fill: "#14b8a6", stroke: "#0a0f1c", strokeWidth: 2 }}
            />

            <Area
              type="monotone"
              dataKey="served"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#servedGradient)"
              dot={false}
              activeDot={{ r: 5, fill: "#6366f1", stroke: "#0a0f1c", strokeWidth: 2 }}
            />

            <Area
              type="monotone"
              dataKey="missed"
              stroke="#f59e0b"
              strokeWidth={1.5}
              fill="none"
              dot={false}
              strokeDasharray="4 3"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function ChartLegend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 text-white/40">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function RecentActivity({ activity, onRefresh }) {
  return (
    <article className="rounded-2xl border border-white/[0.08] bg-[#111827] shadow-[0_12px_40px_rgba(0,0,0,0.18)] p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
            Live feed
          </p>

          <h2 className="mt-1 text-lg font-semibold text-white">
            Recent Activity
          </h2>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-300 transition hover:bg-teal-500/20 hover:text-teal-200"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {activity.length ? (
        <ul className="mt-5 space-y-0">
          {activity.map((item, index) => (
            <ActivityItem
              key={item.id}
              item={item}
              isLast={index === activity.length - 1}
            />
          ))}
        </ul>
      ) : (
        <EmptyPanel message="Recent patient activity will appear here." />
      )}
    </article>
  );
}

function ActivityItem({ item, isLast }) {
  const activityMeta = {
    waiting: {
      label: "Registered",
      icon: Hash,
      color: "#6366f1",
    },
    called: {
      label: "Called",
      icon: Bell,
      color: "#14b8a6",
    },
    "in-service": {
      label: "Serving",
      icon: Activity,
      color: "#14b8a6",
    },
    completed: {
      label: "Completed",
      icon: CheckCircle2,
      color: "#22c55e",
    },
    missed: {
      label: "Missed",
      icon: XCircle,
      color: "#f59e0b",
    },
  };

  const meta =
    activityMeta[item.status] ?? activityMeta.waiting;

  const Icon = meta.icon;

  return (
    <li className="relative flex gap-3 pb-5">
      {!isLast ? (
        <div className="absolute bottom-0 left-[15px] top-8 w-px bg-gradient-to-b from-white/10 to-transparent" />
      ) : null}

      <div
        className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ring-[#111827]"
        style={{
          backgroundColor: `${meta.color}25`,
        }}
      >
        <Icon
          className="h-4 w-4"
          style={{ color: meta.color }}
        />
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-white/75">
            {item.ticket} · {item.patientName}
          </span>

          <span className="shrink-0 text-[11px] text-white/25">
            {formatRelativeTime(item.createdAt)}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: `${meta.color}dd` }}
          >
            {meta.label}
          </span>

          <span className="text-[11px] text-white/30">
            · {item.department}
          </span>
        </div>
      </div>
    </li>
  );
}

function DepartmentLoad({ departments }) {
  const maximum = Math.max(
    ...departments.map((department) => department.total),
    1,
  );

  return (
    <article className="rounded-2xl border border-white/[0.08] bg-[#111827] shadow-[0_12px_40px_rgba(0,0,0,0.18)] p-5 sm:p-6">
      <PanelHeader
        compact
        eyebrow="Operations"
        title="Department Load"
        trailing={
          <span className="text-[11px] text-white/30">
            {departments.length} depts
          </span>
        }
      />

      <div className="mt-5 space-y-4">
        {departments.map((department) => (
          <div key={department.name} className="group">
            <div className="mb-1.5 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/5"
                  style={{
                    backgroundColor: department.color,
                  }}
                />

                <span className="truncate text-sm text-white/70 transition group-hover:text-white/90">
                  {department.name}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-3 text-[11px] text-white/35">
                <span className="text-blue-400">
                  {department.waiting}w
                </span>

                <span className="text-teal-400">
                  {department.active}a
                </span>

                {department.missed > 0 ? (
                  <span className="text-amber-400">
                    {department.missed}m
                  </span>
                ) : null}

                <span className="font-mono font-medium text-white/60">
                  {department.total}
                </span>
              </div>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${(department.total / maximum) * 100}%`,
                  background: `linear-gradient(90deg, ${department.color}99, ${department.color})`,
                  boxShadow: `0 0 12px ${department.color}55`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function SystemAlerts({ id, alerts }) {
  return (
    <article
      id={id}
      className="rounded-2xl border border-white/[0.08] bg-[#111827] shadow-[0_12px_40px_rgba(0,0,0,0.18)] p-5 sm:p-6"
    >
      <PanelHeader
        compact
        eyebrow="Safety"
        title="System Alerts"
        trailing={
          <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-[10px] font-semibold text-rose-400 ring-1 ring-inset ring-rose-400/20">
            {alerts.length} active
          </span>
        }
      />

      {alerts.length ? (
        <div className="mt-5 space-y-3">
          {alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />

            <div>
              <div className="text-sm font-semibold text-emerald-300">
                No active system alerts
              </div>

              <p className="mt-1 text-xs leading-5 text-white/40">
                Queue safety and notification delivery are stable.
              </p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function AlertItem({ alert }) {
  const tones = {
    critical: {
      wrap: "border-rose-500/25 bg-rose-500/10 text-rose-400",
      icon: "text-rose-400",
    },
    warning: {
      wrap: "border-amber-500/25 bg-amber-500/10 text-amber-400",
      icon: "text-amber-400",
    },
    info: {
      wrap: "border-sky-500/25 bg-sky-500/10 text-sky-400",
      icon: "text-sky-400",
    },
  };

  const tone = tones[alert.severity] ?? tones.info;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-4 transition hover:brightness-110 ${tone.wrap}`}
    >
      <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${tone.icon}`} />

      <div className="min-w-0 flex-1">
        <p className="text-sm leading-6 text-white/70">
          {alert.message}
        </p>

        <p className="mt-1 text-xs text-white/30">
          {alert.detail}
        </p>

        <p className="mt-1 text-[10px] text-white/25">
          {alert.time}
        </p>
      </div>
    </div>
  );
}

function QuickActions({
  busiestDepartment,
  ticketCount,
  failedCount,
  safetyCount,
  callNextMutation,
  retryFailedMutation,
  failedNotificationIds,
  onReviewSafety,
  onExport,
}) {
  return (
    <article className="rounded-2xl border border-white/[0.08] bg-[#111827] shadow-[0_12px_40px_rgba(0,0,0,0.18)] p-5 sm:p-6">
      <PanelHeader
        compact
        eyebrow="Staff actions"
        title="Quick Actions"
      />

      <div className="mt-5 space-y-3">
        <ActionButton
          icon={Zap}
          title="Call next patient"
          description={busiestDepartment.name}
          className="border-teal-500/20 bg-teal-500/12 text-teal-300 hover:bg-teal-500/20"
          disabled={
            callNextMutation.isPending ||
            !busiestDepartment.waiting
          }
          onClick={() =>
            callNextMutation.mutate(busiestDepartment.name)
          }
          loading={callNextMutation.isPending}
        />

        <ActionButton
          icon={RefreshCw}
          title="Retry failed alerts"
          description={`${failedCount} notification${
            failedCount === 1 ? "" : "s"
          }`}
          className="border-amber-500/20 bg-amber-500/12 text-amber-300 hover:bg-amber-500/20"
          disabled={
            retryFailedMutation.isPending ||
            !failedNotificationIds.length
          }
          onClick={() =>
            retryFailedMutation.mutate(failedNotificationIds)
          }
          loading={retryFailedMutation.isPending}
        />

        <ActionButton
          icon={Shield}
          title="Review safety watch"
          description={`${safetyCount} overdue ticket${
            safetyCount === 1 ? "" : "s"
          }`}
          className="border-rose-500/20 bg-rose-500/12 text-rose-300 hover:bg-rose-500/20"
          disabled={!safetyCount}
          onClick={onReviewSafety}
        />

        <ActionButton
          icon={FileText}
          title="Export today's report"
          description={`CSV · ${ticketCount} entries`}
          className="border-indigo-500/20 bg-indigo-500/12 text-indigo-300 hover:bg-indigo-500/20"
          disabled={!ticketCount}
          onClick={onExport}
        />
      </div>
    </article>
  );
}

function ActionButton({
  icon: Icon,
  title,
  description,
  className,
  disabled,
  loading,
  onClick,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`group flex min-h-[72px] w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition duration-300 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 ${className}`}
    >
      {loading ? (
        <LoaderCircle className="h-5 w-5 shrink-0 animate-spin" />
      ) : (
        <Icon className="h-5 w-5 shrink-0" />
      )}

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white/85">
          {title}
        </div>

        <div className="mt-1 text-xs text-white/45">
          {description}
        </div>
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 opacity-45 transition group-hover:translate-x-1 group-hover:opacity-90" />
    </button>
  );
}

function PanelHeader({
  eyebrow,
  title,
  trailing,
  compact = false,
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 ${
        compact
          ? "border-b border-white/[0.05] pb-4"
          : "border-b border-white/[0.05] px-5 py-4 sm:px-6"
      }`}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-lg font-semibold text-white">
          {title}
        </h2>
      </div>

      {trailing}
    </div>
  );
}

function EmptyPanel({ message }) {
  return (
    <div className="px-5 py-8 text-sm text-white/35 sm:px-6">
      {message}
    </div>
  );
}

function getInitials(name) {
  if (!name) return "?";

  const parts = String(name).trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function formatRelativeTime(value) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const minutes = Math.max(
    0,
    Math.round((Date.now() - date.getTime()) / 60_000),
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes === 1) {
    return "1 min ago";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours === 1) {
    return "1 hour ago";
  }

  if (hours < 24) {
    return `${hours} hours ago`;
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}