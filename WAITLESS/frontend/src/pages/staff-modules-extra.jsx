import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Timer,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { LoadingPanel } from "@/components/ui/system-loader";
import { useLiveRefresh } from "@/context/LiveRefreshContext";
import { useApiAction, useApiResource } from "@/hooks/useApiResource";
import { DEPARTMENTS } from "@/services/queueMeta";
import {
  createBackup,
  createFollowUpAppointment,
  createHospital,
  exportSyncData,
  fetchAppointmentReminders,
  fetchBottleneckAnalysis,
  fetchFollowUpsForTicket,
  fetchHospitals,
  fetchSyncStatus,
  fetchWaitTimePrediction,
  importSyncData,
  markAppointmentReminderSent,
  updateHospital,
} from "@/services/queueApi";

const isBrowser = typeof window !== "undefined";
const EMPTY_LIST = [];

/* =========================================================
   Shared helpers (mirror staff-modules.jsx conventions)
   ========================================================= */

function ModulePage({ eyebrow, title, description, icon: Icon, children }) {
  return (
    <section className="staff-module-page mx-auto min-h-[calc(100vh-7rem)] w-full max-w-[96rem] px-1 py-6 sm:py-8">
      <header className="surface-panel flex flex-wrap items-start justify-between gap-5 p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
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

function MetricTile({ label, value, detail, icon: Icon, accent = "text-primary bg-primary/15" }) {
  return (
    <div className="surface-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">
            {value}
          </div>
          {detail ? (
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{detail}</p>
          ) : null}
        </div>
        {Icon ? (
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${accent}`}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function EmptyMessage({ children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

/* =========================================================
   MODULE 20.1, Hospitals management (multi-hospital)
   ========================================================= */

export function HospitalsPage() {
  const { refreshToken, refreshLiveData } = useLiveRefresh();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const loader = useCallback(() => fetchHospitals(), []);
  const query = useApiResource(loader, { enabled: isBrowser, refreshToken });

  const createAction = useApiAction(createHospital, {
    onSuccess: () => {
      refreshLiveData();
      toast.success("Hospital added");
    },
  });
  const updateAction = useApiAction(
    (vars) => updateHospital(vars.id, vars.payload),
    {
      onSuccess: () => {
        refreshLiveData();
        toast.success("Hospital updated");
      },
    },
  );

  const hospitals = query.data?.hospitals ?? EMPTY_LIST;

  async function handleSubmit(formData) {
    try {
      if (editing) {
        await updateAction.mutate({ id: editing.id, payload: formData });
      } else {
        await createAction.mutate(formData);
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      toast.error(err.message ?? "Failed to save hospital");
    }
  }

  if (query.isLoading && !query.data) {
    return <LoadingPanel label="Loading hospitals…" />;
  }

  return (
    <ModulePage
      eyebrow="Global scale"
      title="Hospitals"
      description="Manage every hospital running WaitLess. Each hospital keeps its own departments, staff, queues, reports and settings."
      icon={Building2}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {hospitals.length} hospital{hospitals.length === 1 ? "" : "s"} registered
        </p>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowForm((v) => !v);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          <Plus className="h-3.5 w-3.5" />
          {showForm ? "Close form" : "Add hospital"}
        </button>
      </div>

      {showForm && (
        <HospitalForm
          hospital={editing}
          onSubmit={handleSubmit}
          isSubmitting={createAction.isPending || updateAction.isPending}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      <QueryBoundary query={query} title="Loading hospitals">
        <div className="surface-panel p-6">
          <h2 className="font-display text-2xl font-bold">Registered hospitals</h2>
          <div className="mt-5 space-y-3">
            {hospitals.length === 0 ? (
              <EmptyMessage>No hospitals registered yet.</EmptyMessage>
            ) : (
              hospitals.map((hospital) => (
                <HospitalRow
                  key={hospital.id}
                  hospital={hospital}
                  onEdit={() => {
                    setEditing(hospital);
                    setShowForm(true);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </QueryBoundary>
    </ModulePage>
  );
}

function HospitalForm({ hospital, onSubmit, isSubmitting, onCancel }) {
  const [name, setName] = useState(hospital?.name ?? "");
  const [location, setLocation] = useState(hospital?.location ?? "");
  const [active, setActive] = useState(hospital?.active ?? true);

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ name, location, active });
  }

  return (
    <form onSubmit={handleSubmit} className="surface-panel mb-4 space-y-4 p-6">
      <h2 className="font-display text-xl font-bold">
        {hospital ? "Edit hospital" : "Add a new hospital"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Hospital name
          </span>
          <input
            className="input-base"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chinhoyi Provincial Hospital"
            required
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Location
          </span>
          <input
            className="input-base"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Chinhoyi, Zimbabwe"
            required
          />
        </label>
      </div>
      <label className="flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        <span>Active (available for new visits)</span>
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {hospital ? "Save changes" : "Add hospital"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}

function HospitalRow({ hospital, onEdit }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-primary-soft text-primary">
          <Building2 className="h-5 w-5" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-bold text-foreground">
              {hospital.name}
            </h3>
            {hospital.isDefault && (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                Default
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                hospital.active
                  ? "bg-priority-green/15 text-priority-green"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {hospital.active ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {hospital.location || "Location not set"}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/60"
      >
        Edit
      </button>
    </div>
  );
}

/* =========================================================
   MODULE 21, AI Insights (wait prediction + bottlenecks)
   ========================================================= */

export function AIInsightsPage() {
  const { refreshLiveData, refreshToken } = useLiveRefresh();
  const [department, setDepartment] = useState(DEPARTMENTS[0]);

  const bottleneckLoader = useCallback(() => fetchBottleneckAnalysis(), []);
  const bottleneckQuery = useApiResource(bottleneckLoader, { enabled: isBrowser, refreshToken });

  const predictLoader = useCallback(
    () => fetchWaitTimePrediction(department),
    [department],
  );
  const predictQuery = useApiResource(predictLoader, { enabled: isBrowser, refreshToken });

  const bottlenecks = bottleneckQuery.data?.bottlenecks ?? EMPTY_LIST;
  const prediction = predictQuery.data;

  return (
    <ModulePage
      eyebrow="Intelligent improvement"
      title="AI Insights"
      description="Predicted waiting times and automatic bottleneck detection help you respond before queues become too long."
      icon={Brain}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Wait-time prediction */}
        <article className="surface-panel">
          <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold">Wait time prediction</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Estimated wait for the next patient in each department
              </p>
            </div>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="input-base h-9 w-auto text-sm"
                aria-label="Department"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => refreshLiveData()}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
            <QueryBoundary query={predictQuery} title="Loading prediction">
              {prediction ? (
                <div className="mt-6">
                  <div className="flex items-end gap-3">
                    <span className="font-display text-5xl font-bold tracking-tight text-foreground">
                      {prediction.predictedWaitMinutes}
                    </span>
                    <span className="mb-2 text-sm font-semibold text-muted-foreground">
                      min predicted
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                      {prediction.patientsAhead} ahead
                    </span>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                      ~{prediction.avgServiceTimeMinutes} min / patient
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        prediction.confidence === "high"
                          ? "bg-priority-green/15 text-priority-green"
                          : prediction.confidence === "medium"
                            ? "bg-priority-yellow/15 text-priority-yellow"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {prediction.confidence} confidence
                    </span>
                  </div>
                  {prediction.byPriority &&
                    Object.keys(prediction.byPriority).length > 0 && (
                      <div className="mt-5 space-y-2">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                          Breakdown by priority
                        </h3>
                        {Object.entries(prediction.byPriority).map(([prio, info]) => (
                          <div
                            key={prio}
                            className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm"
                          >
                            <span className="font-semibold capitalize">{prio}</span>
                            <span className="text-xs text-muted-foreground">
                              {info.count} patient{info.count === 1 ? "" : "s"} · ~
                              {info.estimatedWait} min
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ) : null}
            </QueryBoundary>
          </div>
        </article>

        {/* Bottleneck detection */}
        <article className="surface-panel self-start">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold">Bottleneck detection</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Departments slowing the whole hospital flow
                </p>
              </div>
            </div>
            {bottlenecks.length ? (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold tabular-nums">
                {bottlenecks.length}
              </span>
            ) : null}
          </div>
          <div className="p-4">
            <QueryBoundary query={bottleneckQuery} title="Loading bottlenecks">
              <div className="space-y-2.5">
                {bottlenecks.length === 0 ? (
                  <EmptyMessage>
                    <CheckCircle2 className="h-8 w-8 text-priority-green" />
                    No bottlenecks detected right now.
                  </EmptyMessage>
                ) : (
                  bottlenecks.map((b) => (
                    <BottleneckCard key={b.department} bottleneck={b} />
                  ))
                )}
              </div>
            </QueryBoundary>
          </div>
        </article>
      </div>
    </ModulePage>
  );
}

function BottleneckCard({ bottleneck }) {
  const severity = bottleneck.severity;
  const severityClass =
    severity === "critical"
      ? "bg-destructive/15 text-destructive"
      : severity === "high"
        ? "bg-priority-red/15 text-priority-red"
        : severity === "moderate"
          ? "bg-priority-yellow/15 text-priority-yellow"
          : "bg-priority-green/15 text-priority-green";

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">
            {bottleneck.department}
          </h3>
          <div className="mt-1 flex flex-wrap gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${severityClass}`}>
              {severity}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              score {bottleneck.bottleneckScore}
            </span>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>{bottleneck.waiting} waiting</div>
          <div>{bottleneck.inService} in service</div>
          {bottleneck.missed > 0 && (
            <div className="text-priority-yellow">{bottleneck.missed} missed</div>
          )}
        </div>
      </div>
      {bottleneck.factors?.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {bottleneck.factors.map((factor, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-0.5 text-priority-yellow">•</span>
              {factor}
            </li>
          ))}
        </ul>
      )}
      {bottleneck.recommendation && (
        <p className="mt-3 rounded-lg bg-primary-soft/60 px-3 py-2 text-xs font-medium text-primary">
          {bottleneck.recommendation}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   MODULE 13.3 / 20.4, Sync & Backup
   ========================================================= */

export function SyncPage() {
  const { refreshLiveData } = useLiveRefresh();
  const [busy, setBusy] = useState(false);

  const statusLoader = useCallback(() => fetchSyncStatus(), []);
  const statusQuery = useApiResource(statusLoader, { enabled: isBrowser });

  const status = statusQuery.data;

  async function handleExport() {
    try {
      setBusy(true);
      const data = await exportSyncData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `waitless-export-${new Date().toISOString().slice(0, 19)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
      refreshLiveData();
    } catch (err) {
      toast.error(err.message ?? "Export failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleBackup() {
    try {
      setBusy(true);
      await createBackup();
      toast.success("Backup created on the server");
      refreshLiveData();
    } catch (err) {
      toast.error(err.message ?? "Backup failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const text = await file.text();
      const payload = JSON.parse(text);
      await importSyncData(payload);
      toast.success("Data imported successfully");
      refreshLiveData();
    } catch (err) {
      toast.error(err.message ?? "Import failed, check the file format");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <ModulePage
      eyebrow="Resilient deployment"
      title="Sync & Backup"
      description="Export, import and back up hospital data for cloud, local or hybrid deployment. Keep operations running even on low-bandwidth networks."
      icon={Database}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="surface-panel p-6 lg:col-span-1">
          <h2 className="font-display text-xl font-bold">Status</h2>
          <QueryBoundary query={statusQuery} title="Loading sync status">
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
                <span className="text-sm text-muted-foreground">Last sync</span>
                <span className="text-sm font-semibold text-foreground">
                  {status?.lastSyncAt
                    ? new Date(status.lastSyncAt).toLocaleString()
                    : "Never"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
                <span className="text-sm text-muted-foreground">Server time</span>
                <span className="text-sm font-semibold text-foreground">
                  {status?.serverTime
                    ? new Date(status.serverTime).toLocaleTimeString()
                    : "N/A"}
                </span>
              </div>
              {status?.lastSyncSummary && (
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                  {JSON.stringify(status.lastSyncSummary)}
                </div>
              )}
            </div>
          </QueryBoundary>
        </article>

        <article className="surface-panel p-6 lg:col-span-2">
          <h2 className="font-display text-xl font-bold">Data operations</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Export the full dataset to a JSON file, restore from an import, or
            create a timestamped backup on the server.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={busy}
              className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:bg-primary-soft/40 disabled:opacity-60"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <Download className="h-5 w-5" />
              </span>
              <span className="font-semibold text-foreground">Export</span>
              <span className="text-xs text-muted-foreground">
                Download all data as JSON
              </span>
            </button>
            <label className="flex cursor-pointer flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:bg-primary-soft/40 disabled:opacity-60">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <Upload className="h-5 w-5" />
              </span>
              <span className="font-semibold text-foreground">Import</span>
              <span className="text-xs text-muted-foreground">
                Restore from a JSON file
              </span>
              <input
                type="file"
                accept="application/json"
                onChange={handleImport}
                disabled={busy}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={handleBackup}
              disabled={busy}
              className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:bg-primary-soft/40 disabled:opacity-60"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <Save className="h-5 w-5" />
              </span>
              <span className="font-semibold text-foreground">Backup</span>
              <span className="text-xs text-muted-foreground">
                Save a server-side snapshot
              </span>
            </button>
          </div>
          {busy && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Working…
            </div>
          )}
        </article>
      </div>
    </ModulePage>
  );
}

/* =========================================================
   MODULE 14.3, Appointment Reminders
   ========================================================= */

export function AppointmentRemindersPage() {
  const { refreshLiveData, refreshToken } = useLiveRefresh();
  const [days, setDays] = useState(3);

  const loader = useCallback(
    () => fetchAppointmentReminders(days),
    [days],
  );
  const query = useApiResource(loader, { enabled: isBrowser, refreshToken });

  const sendAction = useApiAction(markAppointmentReminderSent, {
    onSuccess: () => {
      refreshLiveData();
      toast.success("Reminder marked as sent");
    },
  });

  const reminders = query.data?.reminders ?? EMPTY_LIST;

  async function handleMarkSent(id) {
    try {
      await sendAction.mutate(id);
    } catch (err) {
      toast.error(err.message ?? "Failed to update reminder");
    }
  }

  return (
    <ModulePage
      eyebrow="Clinical schedule"
      title="Appointment Reminders"
      description="See upcoming appointments and mark reminders as sent through WhatsApp, web push, SMS or email to reduce no-shows."
      icon={Send}
    >
      {/* Toolbar */}
      <div className="surface-panel mb-4 flex flex-wrap items-center gap-3 p-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          Next
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="input-base h-9 w-auto text-sm"
          >
            <option value={1}>1 day</option>
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => refreshLiveData()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <QueryBoundary query={query} title="Loading reminders">
        <div className="surface-panel">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                <Send className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold">Upcoming reminders</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Appointment reminders due in the next {days} day{days === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold tabular-nums">
              {reminders.length}
            </span>
          </div>
          <div className="space-y-2.5 p-4">
            {reminders.length === 0 ? (
              <EmptyMessage>
                <CheckCircle2 className="h-8 w-8 text-priority-green" />
                No reminders due in the next {days} day{days === 1 ? "" : "s"}.
              </EmptyMessage>
            ) : (
              reminders.map((r) => (
                <ReminderRow
                  key={r.id}
                  reminder={r}
                  onMarkSent={() => handleMarkSent(r.id)}
                  updating={
                    sendAction.isPending && sendAction.variables === r.id
                  }
                />
              ))
            )}
          </div>
        </div>
      </QueryBoundary>
    </ModulePage>
  );
}

function ReminderRow({ reminder, onMarkSent, updating }) {
  const apptDate = reminder.appointmentDate
    ? new Date(reminder.appointmentDate)
    : null;
  const isPast = apptDate && apptDate < new Date();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${
            isPast
              ? "bg-priority-yellow/15 text-priority-yellow"
              : "bg-primary-soft text-primary"
          }`}
        >
          <CalendarDays className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-base font-bold text-foreground">
            {reminder.patientName ?? "Unknown patient"}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {reminder.serviceCategory ?? "Appointment"} ·{" "}
            {apptDate ? apptDate.toLocaleString() : "Date pending"}
          </p>
          {reminder.contact && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Contact: {reminder.contact}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {reminder.reminderSent ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-priority-green/15 px-3 py-1 text-xs font-semibold text-priority-green">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Sent
          </span>
        ) : (
          <button
            type="button"
            onClick={onMarkSent}
            disabled={updating}
            className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {updating ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Mark sent
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   MODULE 14.2, Follow-up Appointments
   ========================================================= */

export function FollowUpsPage() {
  const { refreshLiveData, refreshToken } = useLiveRefresh();
  const [ticketId, setTicketId] = useState("");
  const [showForm, setShowForm] = useState(false);

  const followUpsLoader = useCallback(
    () => (ticketId ? fetchFollowUpsForTicket(ticketId) : Promise.resolve([])),
    [ticketId],
  );
  const followUpsQuery = useApiResource(followUpsLoader, {
    enabled: isBrowser && Boolean(ticketId),
    refreshToken,
  });

  const createAction = useApiAction(createFollowUpAppointment, {
    onSuccess: () => {
      refreshLiveData();
      toast.success("Follow-up scheduled");
    },
  });

  const followUps = followUpsQuery.data ?? EMPTY_LIST;

  async function handleCreate(formData) {
    try {
      await createAction.mutate({ ...formData, ticketId });
      setShowForm(false);
    } catch (err) {
      toast.error(err.message ?? "Failed to schedule follow-up");
    }
  }

  return (
    <ModulePage
      eyebrow="Clinical schedule"
      title="Follow-up Appointments"
      description="Schedule the next visit for chronic-care patients after consultation and keep a history of follow-ups per patient."
      icon={CalendarDays}
    >
      {/* Toolbar */}
      <div className="surface-panel mb-4 flex flex-wrap items-center gap-3 p-3">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Ticket or patient ID</span>
          <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder="Enter ticket / patient ID"
            className="input-base h-9 pl-9 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          disabled={!ticketId}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg gradient-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {showForm ? "Close form" : "New follow-up"}
        </button>
      </div>

      {showForm && ticketId ? (
        <FollowUpForm
          onSubmit={handleCreate}
          isSubmitting={createAction.isPending}
          onCancel={() => setShowForm(false)}
        />
      ) : null}

      {ticketId ? (
        <QueryBoundary query={followUpsQuery} title="Loading follow-ups">
          <div className="surface-panel">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold">
                    Follow-ups for {ticketId}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Scheduled review visits for this patient
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold tabular-nums">
                {followUps.length}
              </span>
            </div>
            <div className="space-y-2.5 p-4">
              {followUps.length === 0 ? (
                <EmptyMessage>No follow-ups recorded for this patient.</EmptyMessage>
              ) : (
                followUps.map((f) => <FollowUpRow key={f.id} followUp={f} />)
              )}
            </div>
          </div>
        </QueryBoundary>
      ) : (
        <div className="surface-panel p-10">
          <EmptyMessage>
            <CalendarDays className="h-8 w-8 text-muted-foreground" />
            Enter a ticket ID above to view or schedule follow-ups.
          </EmptyMessage>
        </div>
      )}
    </ModulePage>
  );
}

function FollowUpForm({ onSubmit, isSubmitting, onCancel }) {
  const [appointmentDate, setAppointmentDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [serviceCategory, setServiceCategory] = useState("OPD review");
  const [notes, setNotes] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ appointmentDate, timeSlot, serviceCategory, notes });
  }

  return (
    <form onSubmit={handleSubmit} className="surface-panel mb-4 space-y-4 p-6">
      <h2 className="font-display text-xl font-bold">Schedule a follow-up</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Appointment date
          </span>
          <input
            type="date"
            className="input-base"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            required
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Time slot
          </span>
          <input
            className="input-base"
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            placeholder="e.g. 09:00"
            required
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Service category
          </span>
          <select
            className="input-base"
            value={serviceCategory}
            onChange={(e) => setServiceCategory(e.target.value)}
          >
            <option value="OPD review">OPD review</option>
            <option value="OI Clinic">OI Clinic</option>
            <option value="ART resupply">ART resupply</option>
            <option value="TB review">TB review</option>
            <option value="Follow-up consultation">Follow-up consultation</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Notes
          </span>
          <input
            className="input-base"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional clinical notes"
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Schedule follow-up
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}

function FollowUpRow({ followUp }) {
  const date = followUp.appointmentDate
    ? new Date(followUp.appointmentDate)
    : null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
          <CalendarDays className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-base font-bold text-foreground">
            {followUp.serviceCategory ?? "Follow-up"}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {date ? date.toLocaleDateString() : "Date pending"}
            {followUp.timeSlot ? ` · ${followUp.timeSlot}` : ""}
          </p>
          {followUp.notes && (
            <p className="mt-1 text-xs text-muted-foreground">{followUp.notes}</p>
          )}
        </div>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          followUp.status === "completed"
            ? "bg-priority-green/15 text-priority-green"
            : followUp.status === "cancelled"
              ? "bg-destructive/15 text-destructive"
              : "bg-primary-soft text-primary"
        }`}
      >
        {followUp.status ?? "pending"}
      </span>
    </div>
  );
}
