import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, Clock3, MessageCircle, RefreshCw } from "lucide-react";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export default function NotificationAnalyticsPanels({ analytics, audit, departmentIssues }) {
  return (
    <div
      id="analytics"
      className="staff-dashboard-analytics mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.92fr]"
    >
      <NotificationTrendPanel analytics={analytics} />
      <NotificationAuditPanel audit={audit} departmentIssues={departmentIssues} />
    </div>
  );
}

function NotificationTrendPanel({ analytics }) {
  const hasTrendData = analytics.trend.some((entry) => entry.total > 0);

  return (
    <article className="staff-dashboard-chart surface-panel p-6 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Notification analytics</div>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">Volume by hour</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sent versus failed delivery events across the current reporting window.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Sent
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            Failed
          </span>
        </div>
      </div>

      {hasTrendData ? (
        <>
          <ChartContainer
            className="mt-6 h-[18rem] w-full"
            config={{
              total: {
                label: "Sent",
                color: "var(--color-primary)",
              },
              attention: {
                label: "Failed",
                color: "var(--color-destructive)",
              },
            }}
          >
            <AreaChart data={analytics.trend}>
              <defs>
                <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="fillAttention" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-attention)" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="var(--color-attention)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--color-total)"
                fill="url(#fillTotal)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="attention"
                stroke="var(--color-attention)"
                fill="url(#fillAttention)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-background/70 px-4 py-4 text-sm text-muted-foreground">
          Trend data will appear here as patient notifications are generated over time.
        </div>
      )}
    </article>
  );
}

function NotificationAuditPanel({ audit, departmentIssues }) {
  const resolvedNotifications = audit.deliveredCount + audit.retryableCount;
  const failureRate = resolvedNotifications
    ? Math.round((audit.retryableCount / resolvedNotifications) * 100)
    : 0;

  return (
    <article className="staff-dashboard-health surface-panel p-6 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Delivery health</div>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">Health metrics</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Key delivery performance indicators.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <HealthMetric
          icon={CheckCircle2}
          label="Read rate"
          value={`${audit.readRate}%`}
          progress={audit.readRate}
          tone="green"
        />
        <HealthMetric
          icon={MessageCircle}
          label="WhatsApp share"
          value={`${audit.whatsAppShare}%`}
          progress={audit.whatsAppShare}
          tone="cyan"
        />
        <HealthMetric
          icon={RefreshCw}
          label="Avg. retry attempts"
          value={`${audit.averageAttemptsPerWhatsApp}x`}
          progress={Math.min(audit.averageAttemptsPerWhatsApp * 28, 100)}
          tone="blue"
        />
        <HealthMetric
          icon={Clock3}
          label="Oldest outstanding"
          value={`${audit.oldestOutstandingMinutes || 0} min`}
          progress={Math.min((audit.oldestOutstandingMinutes / 60) * 100, 100)}
          tone="amber"
        />
        <HealthMetric
          icon={AlertTriangle}
          label="Failure rate"
          value={`${failureRate}%`}
          progress={failureRate}
          tone="red"
          detail={`${departmentIssues.length} department${departmentIssues.length === 1 ? "" : "s"} affected`}
        />
      </div>
    </article>
  );
}

function HealthMetric({ icon: Icon, label, value, progress, tone, detail }) {
  return (
    <div className={`staff-dashboard-health-metric staff-dashboard-health-metric--${tone}`}>
      <div className="flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-3 text-sm text-muted-foreground">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        <span className="font-display text-2xl font-bold tracking-tight text-foreground">
          {value}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${Math.max(progress, 3)}%` }} />
      </div>
      {detail ? <div className="mt-2 text-[11px] text-muted-foreground">{detail}</div> : null}
    </div>
  );
}
