import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Clock3,
  FileClock,
  Fingerprint,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { LoadingPanel } from "@/components/ui/system-loader";
import { useApiResource } from "@/hooks/useApiResource";
import { fetchAuditEvents } from "@/services/queueApi";

const ACTION_LABELS = {
  "notification.retry-requested": "Notification retry requested",
  "prescription.created": "Prescription created",
  "prescription.state-changed": "Prescription state changed",
  "profile.avatar-updated": "Profile photo updated",
  "profile.updated": "Profile updated",
  "staff.created": "Staff account created",
  "staff.login": "Staff signed in",
  "test-order.created": "Test order created",
  "test-order.state-changed": "Test order state changed",
  "ticket.arrival-confirmed": "Patient arrival confirmed",
  "ticket.called": "Patient called",
  "ticket.priority-assigned": "Priority assigned",
  "ticket.recalled": "Missed patient recalled",
  "ticket.registered": "Patient registered",
  "ticket.status-changed": "Ticket status changed",
  "ticket.transferred": "Ticket transferred",
  "ticket.triage-assessed": "Triage assessment saved",
};
const EMPTY_EVENTS = [];

const ACTION_OPTIONS = Object.entries(ACTION_LABELS).sort((left, right) =>
  left[1].localeCompare(right[1]),
);

const ENTITY_OPTIONS = [
  ["ticket", "Tickets"],
  ["staff", "Staff accounts"],
  ["notification", "Notifications"],
  ["prescription", "Prescriptions"],
  ["test-order", "Test orders"],
];

const RANGE_OPTIONS = [
  ["all", "All time"],
  ["24h", "Last 24 hours"],
  ["7d", "Last 7 days"],
  ["30d", "Last 30 days"],
];

export default function AuditTrailPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [range, setRange] = useState("7d");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const from = useMemo(() => resolveRangeStart(range), [range]);
  const loadAuditEvents = useCallback(
    () => {
      void refreshKey;
      return fetchAuditEvents({
        query: search.trim(),
        action,
        entityType,
        from,
        limit: 250,
      });
    },
    [action, entityType, from, refreshKey, search],
  );
  const auditQuery = useApiResource(loadAuditEvents);
  const events = auditQuery.data?.events ?? EMPTY_EVENTS;
  const integrity = auditQuery.data?.integrity;
  const selectedEvent = events.find((event) => event.id === selectedId) ?? events[0] ?? null;

  useEffect(() => {
    if (!selectedEvent) {
      setSelectedId(null);
    } else if (selectedEvent.id !== selectedId) {
      setSelectedId(selectedEvent.id);
    }
  }, [selectedEvent, selectedId]);

  const staffActors = useMemo(
    () => new Set(events.map((event) => event.actor?.id).filter(Boolean)).size,
    [events],
  );
  const entityCount = useMemo(
    () => new Set(events.map((event) => `${event.entityType}:${event.entityId}`)).size,
    [events],
  );

  return (
    <section className="mx-auto w-full max-w-[112rem] px-4 py-6 sm:px-6 lg:px-8">
      <header className="overflow-hidden rounded-lg border border-cyan-300/15 bg-[linear-gradient(135deg,#071327,#0a1a31_58%,#083249)] p-6 shadow-[0_24px_70px_-42px_rgba(34,211,238,0.5)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">
              <LockKeyhole className="h-4 w-4" />
              Administrator control
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
              Audit trail
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
              Review who changed operational records, what changed, and when it happened.
            </p>
          </div>

          <IntegrityBadge integrity={integrity} />
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <Metric label="Events shown" value={events.length} icon={FileClock} />
          <Metric label="Staff actors" value={staffActors} icon={UserRound} />
          <Metric label="Records affected" value={entityCount} icon={Fingerprint} />
        </div>
      </header>

      <div className="mt-5 rounded-lg border border-white/10 bg-[#0a1427] p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_15rem_13rem_12rem_auto]">
          <label className="relative block">
            <span className="sr-only">Search audit events</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search staff, action, or record"
              className="h-11 w-full rounded-lg border border-white/10 bg-[#0d1a30] pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-400/50"
            />
          </label>

          <AuditSelect label="Action" value={action} onChange={setAction}>
            <option value="">All actions</option>
            {ACTION_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </AuditSelect>

          <AuditSelect label="Record type" value={entityType} onChange={setEntityType}>
            <option value="">All record types</option>
            {ENTITY_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </AuditSelect>

          <AuditSelect label="Time range" value={range} onChange={setRange}>
            {RANGE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </AuditSelect>

          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            title="Refresh audit trail"
            aria-label="Refresh audit trail"
            className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-[#0d1a30] text-slate-300 transition-colors hover:border-cyan-400/35 hover:text-cyan-300"
          >
            <RefreshCw className={`h-4 w-4 ${auditQuery.isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {auditQuery.isLoading ? (
        <LoadingPanel
          className="mt-5"
          title="Loading the audit trail"
          message="Verifying the event chain and preparing recent staff activity."
        />
      ) : auditQuery.isError ? (
        <div className="mt-5 rounded-lg border border-red-400/25 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {auditQuery.error.message}
        </div>
      ) : events.length ? (
        <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
          <AuditEventList events={events} selectedId={selectedEvent?.id} onSelect={setSelectedId} />
          <AuditEventDetail event={selectedEvent} />
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-white/12 bg-[#0a1427] px-6 py-14 text-center">
          <FileClock className="mx-auto h-7 w-7 text-slate-600" />
          <h2 className="mt-3 font-display text-lg font-bold text-white">No matching events</h2>
          <p className="mt-2 text-sm text-slate-500">Adjust the filters to review a wider activity window.</p>
        </div>
      )}
    </section>
  );
}

function AuditEventList({ events, selectedId, onSelect }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0a1427]">
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400">Recorded activity</div>
          <h2 className="mt-1 font-display text-xl font-bold text-white">Recent events</h2>
        </div>
        <span className="text-xs text-slate-500">Newest first</span>
      </div>

      <div className="max-h-[48rem] divide-y divide-white/7 overflow-y-auto">
        {events.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => onSelect(event.id)}
            className={`grid w-full gap-3 px-5 py-4 text-left transition-colors sm:grid-cols-[minmax(0,1fr)_10rem_1.25rem] sm:items-center ${
              event.id === selectedId ? "bg-cyan-400/8" : "hover:bg-white/[0.025]"
            }`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <ActionBadge action={event.action} />
                <span className="truncate text-sm font-semibold text-white">
                  {ACTION_LABELS[event.action] ?? humanize(event.action)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span>{event.actor?.name ?? "Patient self-service"}</span>
                <span aria-hidden="true">&bull;</span>
                <span>{event.entityLabel ?? event.entityType}</span>
              </div>
            </div>
            <time className="text-xs text-slate-500 sm:text-right" dateTime={event.occurredAt}>
              {formatDateTime(event.occurredAt)}
            </time>
            <ChevronRight className="hidden h-4 w-4 text-slate-600 sm:block" />
          </button>
        ))}
      </div>
    </div>
  );
}

function AuditEventDetail({ event }) {
  const changes = getChanges(event?.before, event?.after);

  return (
    <aside className="rounded-lg border border-white/10 bg-[#0a1427] p-5 xl:sticky xl:top-28">
      <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400">Event inspection</div>
          <h2 className="mt-1 font-display text-xl font-bold text-white">Change details</h2>
        </div>
        <LockKeyhole className="h-5 w-5 text-slate-500" />
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <Detail label="Performed by" value={event?.actor?.name ?? "Patient self-service"} />
        <Detail label="Role" value={humanize(event?.actor?.role ?? "public")} />
        <Detail label="Record" value={event?.entityLabel ?? event?.entityId ?? "System"} />
        <Detail label="Time" value={formatDateTime(event?.occurredAt)} />
      </dl>

      <div className="mt-5 border-t border-white/8 pt-5">
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Recorded changes</h3>
        {changes.length ? (
          <div className="mt-3 space-y-2">
            {changes.map((change) => (
              <div key={change.field} className="rounded-lg border border-white/8 bg-[#0d1a30] px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{humanize(change.field)}</div>
                <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
                  <span className="truncate text-slate-500">{formatValue(change.before)}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-cyan-500" />
                  <span className="truncate text-right font-semibold text-slate-200">{formatValue(change.after)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-slate-500">
            This event records an action without a before-and-after state change.
          </p>
        )}
      </div>

      {event?.metadata && Object.keys(event.metadata).length ? (
        <div className="mt-5 border-t border-white/8 pt-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Context</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(event.metadata).map(([key, value]) => (
              <span key={key} className="rounded-md border border-white/8 bg-white/[0.025] px-2.5 py-1.5 text-xs text-slate-400">
                {humanize(key)}: <strong className="font-semibold text-slate-200">{formatValue(value)}</strong>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex items-start gap-3 border-t border-white/8 pt-5 text-xs leading-5 text-slate-500">
        <Fingerprint className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
        <span className="break-all">Event fingerprint: {event?.eventHash ?? "Unavailable"}</span>
      </div>
    </aside>
  );
}

function IntegrityBadge({ integrity }) {
  if (!integrity) {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-400">
        <Clock3 className="h-4 w-4" /> Checking integrity
      </span>
    );
  }

  return integrity.valid ? (
    <span className="inline-flex items-center gap-2 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300">
      <ShieldCheck className="h-4 w-4" /> Chain verified ({integrity.checked})
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-md border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300">
      <ShieldAlert className="h-4 w-4" /> Integrity warning
    </span>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="flex min-h-24 items-center gap-4 rounded-lg border border-white/8 bg-white/[0.035] px-4 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="font-display text-2xl font-bold text-white">{value}</div>
        <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function AuditSelect({ label, value, onChange, children }) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-white/10 bg-[#0d1a30] px-3 text-sm text-slate-200 outline-none transition-colors focus:border-cyan-400/50"
      >
        {children}
      </select>
    </label>
  );
}

function ActionBadge({ action }) {
  const className = action?.startsWith("ticket.")
    ? "border-blue-400/20 bg-blue-400/10 text-blue-300"
    : action?.startsWith("staff.") || action?.startsWith("profile.")
      ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
      : action?.startsWith("notification.")
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

  return <span className={`h-2 w-2 shrink-0 rounded-full border ${className}`} />;
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-600">{label}</dt>
      <dd className="mt-1 truncate text-sm font-semibold text-slate-200">{value || "Not recorded"}</dd>
    </div>
  );
}

function getChanges(before, after) {
  const fields = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  return [...fields]
    .filter((field) => JSON.stringify(before?.[field] ?? null) !== JSON.stringify(after?.[field] ?? null))
    .map((field) => ({ field, before: before?.[field], after: after?.[field] }));
}

function resolveRangeStart(range) {
  const duration = { "24h": 1, "7d": 7, "30d": 30 }[range];
  if (!duration) return "";
  return new Date(Date.now() - duration * 24 * 60 * 60 * 1000).toISOString();
}

function formatDateTime(value) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
  });
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "None";
  if (Array.isArray(value)) return value.join(", ") || "None";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function humanize(value) {
  return String(value ?? "")
    .replaceAll(".", " ")
    .replaceAll("-", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
