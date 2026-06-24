import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Clock3,
  MessageCircle,
  MonitorSmartphone,
  Users,
  Wifi,
} from "lucide-react";

import { LoadingPanel } from "@/components/ui/system-loader";
import {
  PRIORITY_META,
  STATUS_META,
  priorityChipClass,
} from "@/services/queueMeta";
import { fetchQueueBoard } from "@/services/queueApi";
import { useQueueRealtime } from "@/sockets/QueueRealtimeProvider";

const isBrowser = typeof window !== "undefined";
const LIVE_STATUS_META = {
  connected: {
    label: "Live sync",
    className: "bg-priority-green/20 text-priority-green",
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

export const Route = createFileRoute("/queue")({
  head: () => ({
    meta: [
      {
        title: "Live Queue Board - WaitLess",
      },
      {
        name: "description",
        content:
          "Public queue display board for patient waiting areas, backed by the live system.",
      },
    ],
  }),
  component: QueuePage,
});

function QueuePage() {
  const [now, setNow] = useState(new Date());
  const realtime = useQueueRealtime();

  const queueQuery = useQuery({
    queryKey: ["queue", "board"],
    queryFn: fetchQueueBoard,
    enabled: isBrowser,
  });

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const serving = queueQuery.data?.nowServing ?? [];
  const waiting = queueQuery.data?.waiting ?? [];
  const liveMeta = LIVE_STATUS_META[realtime.status] ?? LIVE_STATUS_META.connecting;
  const whatsAppEnabled = waiting.filter((ticket) => ticket.whatsApp).length;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="surface-panel p-6 sm:p-8">
        <div className="absolute left-0 top-0 h-48 w-48 rounded-full bg-primary-soft/80 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="eyebrow">Public display</div>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Live queue board
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Patient-facing queue updates for the waiting area. Tickets are ordered by
              triage priority first, then by time in queue.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-primary/15 bg-primary-soft/70 px-3 py-1.5 text-xs font-semibold text-primary">
                Chinhoyi Provincial Hospital
              </span>
              <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                Waiting area display
              </span>
              <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                Sorted by priority and wait time
              </span>
            </div>
          </div>

          <div className="surface-panel-dark p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-foreground/70">
                  Queue status
                </div>
                <div className="mt-3 font-display text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
                  {now.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${liveMeta.className}`}
              >
                <Wifi className="h-3.5 w-3.5" />
                {liveMeta.label}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <QueueStat label="Now serving" value={serving.length} />
              <QueueStat label="Waiting" value={waiting.length} />
              <QueueStat label="WhatsApp" value={whatsAppEnabled} />
            </div>

            <div className="mt-5 rounded-2xl border border-white/12 bg-white/10 p-4">
              <div className="flex items-start gap-3">
                <MonitorSmartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary-foreground/80" />
                <div>
                  <div className="font-semibold text-primary-foreground">
                    Display guidance
                  </div>
                  <p className="mt-1 text-sm leading-6 text-primary-foreground/80">
                    Patients receiving WhatsApp alerts can wait more comfortably while
                    staff still call the next ticket in order.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Now serving</div>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Current service windows
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            Live service feed
          </div>
        </div>

        {queueQuery.isLoading ? (
          <LoadingPanel
            className="mt-4"
            message="Refreshing current service windows from the live queue."
            title="Loading the live queue"
          />
        ) : queueQuery.isError ? (
          <div className="surface-panel mt-4 border-destructive/30 bg-destructive/10 px-5 py-6 text-sm text-destructive">
            {queueQuery.error.message}
          </div>
        ) : serving.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {serving.map((ticket) => (
              <article
                key={ticket.id}
                className={`rounded-[1.75rem] p-6 shadow-elegant ${priorityChipClass[ticket.priority]}`}
              >
                <div className="text-[11px] font-bold uppercase tracking-[0.28em] opacity-80">
                  {PRIORITY_META[ticket.priority].short} priority
                </div>
                <div className="mt-2 font-display text-6xl font-bold tracking-tight sm:text-7xl">
                  {ticket.ticket}
                </div>
                <div className="mt-4 text-sm opacity-90">{ticket.patientName}</div>
                <div className="mt-1 text-xs opacity-80">{ticket.department}</div>
                <div className="mt-5 flex items-center justify-between gap-3 text-xs font-semibold">
                  <span className="rounded-full border border-current/15 px-2.5 py-1 uppercase tracking-[0.18em]">
                    {STATUS_META[ticket.status]?.label ?? ticket.status}
                  </span>
                  <span>{ticket.waitMinutes}m in flow</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="surface-panel mt-4 px-5 py-6 text-sm text-muted-foreground">
            No patient is currently being served.
          </div>
        )}
      </div>

      <article className="surface-panel mt-6 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 px-5 py-5 sm:px-6">
          <div>
            <div className="eyebrow">Up next</div>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Waiting queue
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Patients closer to the front of the line appear first. Red and yellow
              priorities always outrank routine tickets.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {waiting.length} patients waiting
          </div>
        </div>

        {queueQuery.isLoading ? (
          <LoadingPanel
            compact
            className="px-5 py-8 sm:px-6"
            message="Ordering tickets by priority and arrival time."
            surface={false}
            title="Loading the waiting list"
          />
        ) : queueQuery.isError ? (
          <div className="px-5 py-6 text-sm text-destructive sm:px-6">
            {queueQuery.error.message}
          </div>
        ) : waiting.length ? (
          <>
            <div className="space-y-3 px-4 py-4 lg:hidden sm:px-6">
              {waiting.map((ticket) => (
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
                        <div className="text-xs text-muted-foreground">
                          {ticket.department}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {ticket.waitMinutes}m
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{PRIORITY_META[ticket.priority].label}</span>
                    {ticket.whatsApp && (
                      <span className="inline-flex items-center gap-1 text-accent">
                        <MessageCircle className="h-3 w-3" />
                        WhatsApp on
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead className="bg-muted/50 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3">Ticket</th>
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Wait</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {waiting.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="bg-background/70 transition-colors hover:bg-primary-soft/25"
                    >
                      <td className="px-6 py-4">
                        <span
                          className={`inline-grid h-10 w-16 place-items-center rounded-xl font-display text-sm font-bold ${priorityChipClass[ticket.priority]}`}
                        >
                          {ticket.ticket}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{ticket.patientName}</div>
                        {ticket.whatsApp && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-accent">
                            <MessageCircle className="h-3 w-3" />
                            WhatsApp on
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {ticket.department}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {PRIORITY_META[ticket.priority].short}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_META[ticket.status]?.className ?? STATUS_META.waiting.className}`}
                        >
                          {STATUS_META[ticket.status]?.label ?? ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold tabular-nums">
                        {ticket.waitMinutes}m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="px-5 py-6 text-sm text-muted-foreground sm:px-6">
            Nobody is waiting in the queue right now.
          </div>
        )}
      </article>
    </section>
  );
}

function QueueStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/65">
        {label}
      </div>
      <div className="mt-1 font-display text-3xl font-bold tracking-tight text-primary-foreground">
        {value}
      </div>
    </div>
  );
}
