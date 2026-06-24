import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { AlertTriangle, TrendingUp } from "lucide-react";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export default function NotificationAnalyticsPanels({ analytics, audit, departmentIssues }) {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <NotificationTrendPanel analytics={analytics} />
      <NotificationAuditPanel audit={audit} departmentIssues={departmentIssues} />
    </div>
  );
}

function NotificationTrendPanel({ analytics }) {
  const hasTrendData = analytics.trend.some((entry) => entry.total > 0);
  const activeStatuses = analytics.statusMix.filter((entry) => entry.value > 0);

  return (
    <article className="surface-panel p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Delivery trends</div>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
            Seven-day notification performance
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Compare total patient alerts, successful delivery outcomes, and items that still needed
            attention across the past week.
          </p>
        </div>
        <TrendingUp className="h-5 w-5 text-muted-foreground" />
      </div>

      {hasTrendData ? (
        <>
          <ChartContainer
            className="mt-6 h-[18rem] w-full"
            config={{
              total: {
                label: "Total alerts",
                color: "var(--color-primary)",
              },
              delivered: {
                label: "Delivered / read",
                color: "var(--color-priority-green)",
              },
              attention: {
                label: "Needs attention",
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
                <linearGradient id="fillDelivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-delivered)" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="var(--color-delivered)" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--color-total)"
                fill="url(#fillTotal)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="delivered"
                stroke="var(--color-delivered)"
                fill="url(#fillDelivered)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="attention"
                stroke="var(--color-attention)"
                fill="transparent"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>

          <div className="mt-5 flex flex-wrap gap-2">
            {activeStatuses.map((status) => (
              <span
                key={status.status}
                className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground"
              >
                {status.label}: {status.value}
              </span>
            ))}
          </div>
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
  return (
    <article className="surface-panel p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Audit report</div>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
            Delivery reliability audit
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Spot recurring failure patterns, departments carrying issue volume, and how much effort
            retries are consuming.
          </p>
        </div>
        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <AuditStat label="Retryable now" value={audit.retryableCount} />
        <AuditStat label="Read rate" value={`${audit.readRate}%`} />
        <AuditStat label="WhatsApp share" value={`${audit.whatsAppShare}%`} />
        <AuditStat
          label="Oldest open issue"
          value={audit.oldestOutstandingMinutes ? `${audit.oldestOutstandingMinutes}m` : "0m"}
        />
      </div>

      {departmentIssues.length ? (
        <div className="mt-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Department issue map
          </div>
          <ChartContainer
            className="mt-3 h-[14rem] w-full"
            config={{
              issues: {
                label: "Issues",
                color: "var(--color-destructive)",
              },
            }}
          >
            <BarChart data={departmentIssues} layout="vertical" margin={{ left: 12 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="department"
                tickLine={false}
                axisLine={false}
                width={92}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="issues" radius={[0, 8, 8, 0]} fill="var(--color-issues)" />
            </BarChart>
          </ChartContainer>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-background/70 px-4 py-4 text-sm text-muted-foreground">
          No department has accumulated delivery issues yet.
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Top failure reasons
          </div>
          <span className="text-xs text-muted-foreground">
            Avg. {audit.averageAttemptsPerWhatsApp} attempts per WhatsApp alert
          </span>
        </div>

        {audit.topFailureReasons.length ? (
          <ul className="mt-3 space-y-2">
            {audit.topFailureReasons.map((entry) => (
              <li
                key={`${entry.code ?? entry.reason}-${entry.count}`}
                className="rounded-2xl border border-border/70 bg-background/80 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{entry.reason}</div>
                    {entry.code && (
                      <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {entry.code}
                      </div>
                    )}
                  </div>
                  <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                    {entry.count}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-border bg-background/70 px-4 py-4 text-sm text-muted-foreground">
            No recurring failure reasons have been recorded yet.
          </div>
        )}
      </div>
    </article>
  );
}

function AuditStat({ label, value }) {
  return (
    <div className="surface-panel-muted px-4 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
