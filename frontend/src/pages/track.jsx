import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MessageCircle,
  Search,
  Ticket,
  Timer,
  UserRound,
  Wifi,
} from "lucide-react";

import { LoadingPanel } from "@/components/ui/system-loader";
import {
  PRIORITY_META,
  STATUS_META,
  priorityChipClass,
} from "@/services/queueMeta";
import { fetchTicketTracking } from "@/services/queueApi";
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
const TRACK_STEPS = ["registered", "waiting", "called", "in-service", "completed"];

export const Route = createFileRoute("/track")({
  validateSearch: (search) => ({
    ticket:
      typeof search.ticket === "string" && search.ticket.trim()
        ? search.ticket.trim().toUpperCase()
        : undefined,
  }),
  head: () => ({
    meta: [
      {
        title: "Track Your Ticket - WaitLess",
      },
      {
        name: "description",
        content:
          "Patients can check live queue status, recent alerts, and estimated wait time using their ticket code.",
      },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const realtime = useQueueRealtime();
  const [ticketInput, setTicketInput] = useState(search.ticket ?? "");
  const ticketCode = search.ticket ?? "";
  const liveMeta = LIVE_STATUS_META[realtime.status] ?? LIVE_STATUS_META.connecting;
  const trackingQuery = useQuery({
    queryKey: ["track", ticketCode],
    queryFn: () => fetchTicketTracking(ticketCode),
    enabled: isBrowser && Boolean(ticketCode),
  });

  useEffect(() => {
    setTicketInput(search.ticket ?? "");
  }, [search.ticket]);

  function submit(event) {
    event.preventDefault();
    const nextTicket = ticketInput.trim().toUpperCase();

    navigate({
      to: "/track",
      search: nextTicket ? { ticket: nextTicket } : {},
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="surface-panel p-6 sm:p-8">
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="eyebrow">Patient experience</div>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Track your ticket
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Follow your place in the queue, understand what happens next, and
                  review the alerts sent to your phone in one live patient view.
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
              <HeroTile
                label="Ticket lookup"
                value={ticketCode || "Ready"}
                detail="Use the code printed on the registration ticket."
              />
              <HeroTile
                label="Notification lane"
                value="WhatsApp"
                detail="Registration, near-turn, and final call alerts can appear here."
              />
              <HeroTile
                label="Refresh behaviour"
                value="Live"
                detail="This page updates automatically while the queue is active."
              />
            </div>
          </div>

          <div className="surface-panel-dark p-5 sm:p-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-foreground/70">
              Ticket lookup
            </div>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-primary-foreground">
              Open your live patient view
            </h2>
            <p className="mt-2 text-sm leading-6 text-primary-foreground/80">
              Enter the exact code from your digital ticket to see queue movement and
              recent communication history.
            </p>

            <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-foreground/60" />
                <input
                  value={ticketInput}
                  onChange={(event) => setTicketInput(event.target.value.toUpperCase())}
                  placeholder="e.g. G-105"
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-10 py-3 text-sm text-primary-foreground outline-none transition-colors placeholder:text-primary-foreground/50 focus:border-white/30"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-background px-4 py-3 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5"
              >
                Check ticket
              </button>
            </form>

            <div className="mt-5 rounded-2xl border border-white/12 bg-white/10 p-4">
              <div className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary-foreground/80" />
                <div>
                  <div className="font-semibold text-primary-foreground">
                    Patient notifications
                  </div>
                  <p className="mt-1 text-sm leading-6 text-primary-foreground/80">
                    If WhatsApp is enabled for your ticket, this page will mirror the
                    registration confirmation, the queue warning, and the final call-up.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-6">
        {!ticketCode ? (
          <EmptyTrackingState />
        ) : trackingQuery.isLoading ? (
          <LoadingState />
        ) : trackingQuery.isError ? (
          <ErrorState message={trackingQuery.error.message} />
        ) : (
          <TrackingResults data={trackingQuery.data} />
        )}
      </div>
    </section>
  );
}

function EmptyTrackingState() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="surface-panel grid place-items-center border-dashed p-10 text-center">
        <div className="max-w-md">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
            <BellRing className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold">
            Your updates will appear here
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use your ticket code to open a live patient view with queue status,
            department activity, and recent notifications.
          </p>
        </div>
      </div>

      <div className="surface-panel p-6">
        <div className="eyebrow">What you can follow</div>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
          Your queue journey
        </h2>
        <div className="mt-5 space-y-4">
          {[
            {
              title: "Ticket issued",
              body: "Confirm that your registration succeeded and your queue code is active.",
            },
            {
              title: "Queue movement",
              body: "See how many people are ahead of you and get a rough wait estimate.",
            },
            {
              title: "Call-up alerts",
              body: "Review whether your WhatsApp alerts were sent, delivered, or retried.",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-2xl border border-border/70 bg-background/75 px-4 py-4"
            >
              <span className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-sm font-bold text-primary">
                {index + 1}
              </span>
              <div>
                <div className="font-semibold">{item.title}</div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <LoadingPanel
      message="Checking your queue position and latest notification activity."
      title="Loading your live ticket status"
    />
  );
}

function ErrorState({ message }) {
  return (
    <div className="surface-panel border-destructive/30 bg-destructive/10 px-5 py-6 text-sm text-destructive">
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
  const activeTicketCount = queue.activeInDepartment.length;
  const progressStep = getCurrentProgressStep(ticket.status);
  const progressSteps = buildProgressSteps(ticket, queue);
  const statusTone =
    ticket.status === "completed"
      ? "stable"
      : ticket.status === "called" || ticket.status === "in-service"
        ? "active"
        : "waiting";

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="surface-panel p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Live ticket</div>
              <div className="mt-3 flex items-center gap-3">
                <span
                  className={`inline-grid h-14 w-24 place-items-center rounded-2xl font-display text-xl font-bold ${priorityChipClass[ticket.priority]}`}
                >
                  {ticket.ticket}
                </span>
                <div>
                  <div className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {ticket.patientName}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {ticket.department}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_META[ticket.status]?.className ?? STATUS_META.waiting.className}`}
              >
                {statusLabel}
              </span>
              <div className="mt-2 text-xs text-muted-foreground">
                {PRIORITY_META[ticket.priority].label}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MiniStat
              label="People ahead"
              value={ticket.status === "waiting" ? queue.patientsAhead : "-"}
            />
            <MiniStat
              label="Rough wait"
              value={ticket.status === "waiting" ? `${queue.estimatedWaitMinutes}m` : "Now"}
            />
            <MiniStat label="Last update" value={formatTime(latestStatusTimestamp)} />
          </div>

          <div className={`mt-6 rounded-3xl border px-5 py-5 ${summaryToneClass(statusTone)}`}>
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <div className="font-semibold">{statusSummary.title}</div>
                <p className="mt-1 text-sm leading-6 opacity-90">{statusSummary.body}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="eyebrow">Journey progress</div>
            <div className="mt-4 grid gap-3 md:grid-cols-5">
              {progressSteps.map((step, index) => (
                <JourneyStepCard
                  key={step.key}
                  step={step}
                  index={index}
                  isCurrent={progressStep === step.key}
                />
              ))}
            </div>
          </div>
        </article>

        <div className="space-y-6">
          <article className="surface-panel-dark p-5 sm:p-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-foreground/70">
              Queue pulse
            </div>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-primary-foreground">
                  {ticket.status === "waiting"
                    ? queue.patientsAhead === 0
                      ? "You are next"
                      : `Position ${queue.departmentPosition}`
                    : statusLabel}
                </h2>
                <p className="mt-2 text-sm leading-6 text-primary-foreground/80">
                  {ticket.status === "waiting"
                    ? `There are ${queue.totalWaitingInDepartment} patients still waiting in ${ticket.department}.`
                    : `Your ticket is currently marked as ${statusLabel.toLowerCase()} in ${ticket.department}.`}
                </p>
              </div>
              {ticket.whatsApp ? (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-primary-foreground/85">
                  WhatsApp on
                </span>
              ) : (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-primary-foreground/85">
                  Walk-in mode
                </span>
              )}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <DarkStat
                label="Department wait"
                value={queue.totalWaitingInDepartment}
              />
              <DarkStat label="Hospital wait" value={queue.totalWaitingOverall} />
              <DarkStat label="Active now" value={activeTicketCount} />
            </div>

            <div className="mt-5 rounded-2xl border border-white/12 bg-white/10 p-4">
              <div className="flex items-start gap-3">
                <Timer className="mt-0.5 h-5 w-5 shrink-0 text-primary-foreground/80" />
                <div>
                  <div className="font-semibold text-primary-foreground">
                    What to expect next
                  </div>
                  <p className="mt-1 text-sm leading-6 text-primary-foreground/80">
                    {getNextStepCopy(ticket, queue)}
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className="surface-panel p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="eyebrow">Notification health</div>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
                  Alert summary
                </h2>
              </div>
              <BellRing className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniStat label="Alerts sent" value={notifications.length} />
              <MiniStat label="Delivered / read" value={deliveredNotifications} />
              <MiniStat label="Need attention" value={retryingNotifications} />
              <MiniStat
                label="Channel"
                value={ticket.whatsApp ? "WhatsApp" : "Board only"}
              />
            </div>

            <div className="surface-panel-muted mt-5 px-4 py-4">
              <div className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <div className="font-semibold text-foreground">
                    Communication note
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {ticket.whatsApp
                      ? "Your queue alerts should appear here and on WhatsApp. If delivery is delayed, staff can still call your ticket on the live board."
                      : "This ticket is not linked to WhatsApp, so updates will appear on the public board and in the staff system only."}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="surface-panel p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="eyebrow">Department activity</div>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
                Live service lane
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Patients currently active in {ticket.department}.
              </p>
            </div>
            <UserRound className="h-5 w-5 text-muted-foreground" />
          </div>

          {queue.activeInDepartment.length ? (
            <ul className="mt-5 space-y-3">
              {queue.activeInDepartment.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-2xl border border-border/70 bg-background/80 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`inline-grid h-10 w-16 place-items-center rounded-xl font-display text-sm font-bold ${priorityChipClass[entry.priority]}`}
                    >
                      {entry.ticket}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {STATUS_META[entry.status]?.label ?? entry.status}
                    </span>
                  </div>
                  <div className="mt-3 font-medium">{entry.patientName}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-background/80 px-4 py-4 text-sm text-muted-foreground">
              No patient is currently being served in this department.
            </div>
          )}
        </article>

        <article className="surface-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="eyebrow">Patient alerts</div>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
                Notification timeline
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Alerts recorded for this ticket in the order they were issued.
              </p>
            </div>
            <BellRing className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="mt-5 space-y-3">
            {notifications.length ? (
              notifications.map((notification, index) => (
                <NotificationTimelineItem
                  key={notification.id}
                  notification={notification}
                  isLast={index === notifications.length - 1}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-background/80 px-4 py-4 text-sm text-muted-foreground">
                No alerts have been recorded for this ticket yet.
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

function HeroTile({ label, value, detail }) {
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
      <div className="mt-1 font-display text-3xl font-bold tracking-tight text-primary-foreground">
        {value}
      </div>
    </div>
  );
}

function JourneyStepCard({ step, index, isCurrent }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 ${
        step.state === "complete"
          ? "border-priority-green/30 bg-priority-green/10"
          : step.state === "current"
            ? "border-primary/20 bg-primary-soft/55"
            : "border-border/70 bg-background/80"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${
            step.state === "complete"
              ? "bg-priority-green text-priority-green-foreground"
              : step.state === "current"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {step.state === "complete" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            index + 1
          )}
        </span>
        {isCurrent && (
          <span className="rounded-full bg-background/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground">
            Now
          </span>
        )}
      </div>
      <div className="mt-3 font-semibold">{step.label}</div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.body}</p>
    </div>
  );
}

function NotificationTimelineItem({ notification, isLast }) {
  return (
    <article className="relative rounded-2xl border border-border/70 bg-background/80 px-4 py-4">
      {!isLast && (
        <span className="absolute left-[1.625rem] top-[3.4rem] h-[calc(100%-2.35rem)] w-px bg-border/80" />
      )}
      <div className="flex items-start gap-4">
        <span className="mt-0.5 inline-grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <BellRing className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{notification.title}</div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {notification.message}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <NotificationChannelBadge channel={notification.channel} />
              <NotificationStatusBadge status={notification.status} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <span>{notification.recipient}</span>
            <span>{formatNotificationTimestamp(notification.createdAt)}</span>
          </div>

          {(notification.nextRetryAt || notification.errorMessage) && (
            <div className="mt-3 rounded-xl border border-border/70 bg-muted/35 px-3 py-3 text-[11px] text-muted-foreground">
              {notification.nextRetryAt && (
                <div>
                  Next retry: {formatNotificationTimestamp(notification.nextRetryAt)}
                </div>
              )}
              {notification.errorMessage && (
                <div className="mt-1 text-destructive">{notification.errorMessage}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="surface-panel-muted rounded-xl px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-bold tracking-tight">{value}</div>
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

function buildProgressSteps(ticket, queue) {
  return [
    {
      key: "registered",
      label: "Registered",
      body: `Your ticket was created at ${formatTime(ticket.registeredAt)}.`,
      state: getStepState(ticket.status, "registered"),
    },
    {
      key: "waiting",
      label: "Waiting",
      body:
        ticket.status === "waiting"
          ? `${queue.patientsAhead} patient${queue.patientsAhead === 1 ? "" : "s"} still ahead of you.`
          : "You have moved beyond the waiting stage.",
      state: getStepState(ticket.status, "waiting"),
    },
    {
      key: "called",
      label: "Called",
      body: ticket.calledAt
        ? `Called at ${formatTime(ticket.calledAt)}.`
        : "You will be called when the department is ready.",
      state: getStepState(ticket.status, "called"),
    },
    {
      key: "in-service",
      label: "In service",
      body: ticket.serviceStartedAt
        ? `Service started at ${formatTime(ticket.serviceStartedAt)}.`
        : "A clinician will begin attending to you here.",
      state: getStepState(ticket.status, "in-service"),
    },
    {
      key: "completed",
      label: "Completed",
      body: ticket.completedAt
        ? `Completed at ${formatTime(ticket.completedAt)}.`
        : "This step appears once the visit is finished.",
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

function summaryToneClass(tone) {
  return {
    stable: "border-priority-green/25 bg-priority-green/10 text-priority-green",
    active: "border-accent/25 bg-accent/10 text-accent-foreground",
    waiting: "border-primary/20 bg-primary-soft/55 text-foreground",
  }[tone];
}

function getNextStepCopy(ticket, queue) {
  if (ticket.status === "completed") {
    return "Your visit is marked complete. If you still need help, speak to the front desk or clinical team.";
  }

  if (ticket.status === "in-service") {
    return `A clinician is currently attending to ${ticket.ticket} in ${ticket.department}. Stay with the service team until they finish the visit.`;
  }

  if (ticket.status === "called") {
    return `Proceed to ${ticket.department} now. Your ticket has already been called and should be attended to next.`;
  }

  if (queue.patientsAhead === 0) {
    return `Stay close to ${ticket.department}. ${ticket.ticket} is next in line and may be called at any moment.`;
  }

  return `Remain available while ${queue.patientsAhead} patient${queue.patientsAhead === 1 ? "" : "s"} ahead of you are seen first. Your rough wait is about ${queue.estimatedWaitMinutes} minutes.`;
}

function describeStatus(ticket, queue) {
  if (ticket.status === "called") {
    return {
      title: "Please proceed now",
      body: `Your ticket has been called to ${ticket.department}. Head there as soon as possible so staff can continue your visit without delay.`,
    };
  }

  if (ticket.status === "in-service") {
    return {
      title: "You are being served",
      body: `A clinician is currently attending to ${ticket.ticket} in ${ticket.department}.`,
    };
  }

  if (ticket.status === "completed") {
    return {
      title: "Visit completed",
      body: `This ticket has already been completed in ${ticket.department}.`,
    };
  }

  if (queue.patientsAhead === 0) {
    return {
      title: "You are next in line",
      body: `Stay nearby for ${ticket.department}. The queue is almost ready to call ${ticket.ticket}.`,
    };
  }

  return {
    title: `${queue.patientsAhead} patient${queue.patientsAhead === 1 ? "" : "s"} ahead of you`,
    body: `Your place in ${ticket.department} is currently number ${queue.departmentPosition}. Rough wait is about ${queue.estimatedWaitMinutes} minutes.`,
  };
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

function formatNotificationTimestamp(value) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
