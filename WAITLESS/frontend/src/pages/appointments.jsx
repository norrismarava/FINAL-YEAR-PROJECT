import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { LoadingPanel } from "@/components/ui/system-loader";
import { useLiveRefresh } from "@/context/LiveRefreshContext";
import { useApiAction, useApiResource } from "@/hooks/useApiResource";
import {
  createAppointment,
  deleteAppointment,
  fetchAppointments,
  fetchAppointmentMeta,
  fetchAppointmentSummary,
  updateAppointment,
  updateAppointmentStatus,
} from "@/services/queueApi";

const isBrowser = typeof window !== "undefined";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked-in", label: "Checked In" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_BADGE = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  confirmed: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "checked-in": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-red-500/15 text-red-700 dark:text-red-300",
  completed: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
};

const EMPTY_FORM = {
  patientName: "",
  patientContact: "",
  patientAge: "",
  patientGender: "",
  serviceCategory: "",
  date: "",
  timeSlot: "",
  notes: "",
};

export default function AppointmentsPage() {
  const { refreshLiveData } = useLiveRefresh();
  const [formState, setFormState] = useState({ mode: null, appointment: null });
  const [deletingAppointment, setDeletingAppointment] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const metaLoader = useCallback(() => fetchAppointmentMeta(), []);
  const metaQuery = useApiResource(metaLoader, { enabled: isBrowser });

  const summaryLoader = useCallback(() => fetchAppointmentSummary(), []);
  const summaryQuery = useApiResource(summaryLoader, { enabled: isBrowser });

  const appointmentsLoader = useCallback(
    () => fetchAppointments({ status: statusFilter, date: dateFilter }),
    [statusFilter, dateFilter],
  );
  const appointmentsQuery = useApiResource(appointmentsLoader, { enabled: isBrowser });

  const saveAction = useApiAction(
    ({ id, payload }) => (id ? updateAppointment(id, payload) : createAppointment(payload)),
    {
      onSuccess: () => {
        refreshLiveData();
        setFormState({ mode: null, appointment: null });
        toast.success(formState.mode === "edit" ? "Appointment updated" : "Appointment booked");
      },
    },
  );

  const deleteAction = useApiAction((id) => deleteAppointment(id), {
    onSuccess: () => {
      refreshLiveData();
      setDeletingAppointment(null);
      toast.success("Appointment deleted");
    },
  });

  const statusAction = useApiAction(({ id, status }) => updateAppointmentStatus(id, status), {
    onSuccess: () => refreshLiveData(),
  });

  const serviceCategories = metaQuery.data?.serviceCategories ?? [];
  const timeSlots = metaQuery.data?.timeSlots ?? [];

  const visibleAppointments = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return appointments;
    return appointments.filter((a) =>
      [a.patientName, a.serviceLabel, a.patientContact, a.notes]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query)),
    );
  }, [appointmentsQuery.data, searchQuery]);

  async function handleSaveForm(payload) {
    try {
      await saveAction.mutate({ id: formState.appointment?.id ?? null, payload });
    } catch (error) {
      toast.error(error?.message ?? "Failed to save appointment");
    }
  }

  async function handleDelete() {
    try {
      await deleteAction.mutate(deletingAppointment.id);
    } catch (error) {
      toast.error(error?.message ?? "Failed to delete appointment");
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await statusAction.mutate({ id, status });
      toast.success(`Appointment ${status.replace("-", " ")}`);
    } catch (error) {
      toast.error(error?.message ?? "Failed to update appointment");
    }
  }

  function openCreateForm() {
    setFormState((current) =>
      current.mode === "create" ? { mode: null, appointment: null } : { mode: "create", appointment: null },
    );
  }

  function openEditForm(appointment) {
    setFormState({ mode: "edit", appointment });
  }

  const filtersActive = Boolean(statusFilter || dateFilter || searchQuery);
  const summary = summaryQuery.data;

  return (
    <section className="staff-module-page mx-auto min-h-[calc(100vh-7rem)] w-full max-w-[96rem] px-1 py-6 sm:py-8">
      <header className="surface-panel flex flex-wrap items-start justify-between gap-5 p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="eyebrow">Clinical schedule</div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Appointments
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            Book, edit, and manage patient appointments by service category and time slot.
          </p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-primary/20 bg-primary-soft text-primary">
          <CalendarDays className="h-5 w-5" />
        </span>
      </header>

      <div className="mt-5">
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, service, contact…"
                className="input-base h-9 w-56 pl-8 text-xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-base h-9 w-auto text-xs"
              aria-label="Filter by status"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-base h-9 w-auto text-xs"
              aria-label="Filter by date"
            />
            {filtersActive ? (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("");
                  setDateFilter("");
                  setSearchQuery("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            ) : null}
            <button
              type="button"
              onClick={refreshLiveData}
              title="Refresh appointments"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            {formState.mode === "create" ? "Close form" : "New appointment"}
          </button>
        </div>

        {/* Summary cards */}
        {summary ? (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Total", value: summary.total ?? 0, color: "bg-blue-500/10 border-blue-500/30" },
              { label: "Today", value: summary.today ?? 0, color: "bg-teal-500/10 border-teal-500/30" },
              { label: "Pending", value: summary.byStatus?.pending ?? 0, color: "bg-amber-500/10 border-amber-500/30" },
              { label: "Confirmed", value: summary.byStatus?.confirmed ?? 0, color: "bg-indigo-500/10 border-indigo-500/30" },
              { label: "Checked In", value: summary.byStatus?.["checked-in"] ?? 0, color: "bg-emerald-500/10 border-emerald-500/30" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl border p-4 ${stat.color}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Meta error notice — form still works once meta loads */}
        {metaQuery.isError ? (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              Service categories and time slots could not be loaded. {metaQuery.error?.message ?? ""}
            </span>
            <button
              type="button"
              onClick={refreshLiveData}
              className="rounded-lg border border-amber-500/40 px-3 py-1 text-xs font-semibold hover:bg-amber-500/10"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Create / edit form */}
        {formState.mode ? (
          <AppointmentForm
            key={formState.appointment?.id ?? "new"}
            serviceCategories={serviceCategories}
            timeSlots={timeSlots}
            appointment={formState.appointment}
            isSubmitting={saveAction.isPending}
            onSubmit={handleSaveForm}
            onCancel={() => setFormState({ mode: null, appointment: null })}
          />
        ) : null}

        {/* Delete confirmation */}
        {deletingAppointment ? (
          <div className="surface-panel mb-4 border border-red-500/30 p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-500/15 text-red-600 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h3 className="font-display text-lg font-bold">Delete appointment?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Permanently remove the appointment for{" "}
                  <span className="font-semibold text-foreground">
                    {deletingAppointment.patientName}
                  </span>{" "}
                  on {deletingAppointment.date} at {deletingAppointment.timeSlot}? This cannot be
                  undone.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteAction.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteAction.isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete permanently
              </button>
              <button
                type="button"
                onClick={() => setDeletingAppointment(null)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
              >
                Keep appointment
              </button>
            </div>
          </div>
        ) : null}

        {/* Appointment list */}
        <div className="surface-panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Scheduled appointments</h2>
            <span className="text-xs text-muted-foreground">
              {visibleAppointments.length} shown
            </span>
          </div>
          <div className="mt-5">
            <AppointmentList
              query={appointmentsQuery}
              appointments={visibleAppointments}
              hasFilters={filtersActive}
              onRetry={refreshLiveData}
              onStatusChange={handleStatusChange}
              onEdit={openEditForm}
              onDelete={setDeletingAppointment}
              pendingStatusId={statusAction.isPending ? statusAction.variables?.id : null}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function AppointmentList({
  query,
  appointments,
  hasFilters,
  onRetry,
  onStatusChange,
  onEdit,
  onDelete,
  pendingStatusId,
}) {
  if (query.isLoading && !query.data) {
    return <LoadingPanel title="Loading appointments" message="Fetching the latest schedule." />;
  }

  if (query.isError && !query.data) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-4 text-sm text-destructive">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">Appointments could not be loaded</p>
          <p className="mt-1">{query.error?.message ?? "Something went wrong."}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold hover:bg-destructive/10"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-background/40 px-6 py-10 text-center">
        <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-semibold text-foreground">No appointments found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {hasFilters
            ? "No appointments match the current filters. Try clearing them."
            : "Book a new appointment to see it here."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => (
        <AppointmentRow
          key={appointment.id}
          appointment={appointment}
          onStatusChange={onStatusChange}
          onEdit={() => onEdit(appointment)}
          onDelete={() => onDelete(appointment)}
          statusPending={pendingStatusId === appointment.id}
        />
      ))}
    </div>
  );
}

function AppointmentForm({
  serviceCategories,
  timeSlots,
  appointment,
  isSubmitting,
  onSubmit,
  onCancel,
}) {
  const isEdit = Boolean(appointment);
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    patientName: appointment?.patientName ?? "",
    patientContact: appointment?.patientContact ?? "",
    patientAge: appointment?.patientAge != null ? String(appointment.patientAge) : "",
    patientGender: appointment?.patientGender ?? "",
    serviceCategory: appointment?.serviceCategory ?? "",
    date: appointment?.date ?? "",
    timeSlot: appointment?.timeSlot ?? "",
    notes: appointment?.notes ?? "",
  }));

  function setField(field) {
    return (e) => setForm((current) => ({ ...current, [field]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.patientName.trim() || !form.serviceCategory || !form.date || !form.timeSlot) return;
    onSubmit({
      patientName: form.patientName.trim(),
      patientContact: form.patientContact.trim(),
      patientAge: form.patientAge ? Number(form.patientAge) : null,
      patientGender: form.patientGender,
      serviceCategory: form.serviceCategory,
      date: form.date,
      timeSlot: form.timeSlot,
      notes: form.notes.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="surface-panel mb-4 space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">
          {isEdit ? "Edit appointment" : "Book new appointment"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Patient name *</label>
          <input
            type="text"
            required
            value={form.patientName}
            onChange={setField("patientName")}
            className="input-base mt-1 h-9 w-full text-sm"
            placeholder="Full name"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Contact number</label>
          <input
            type="tel"
            value={form.patientContact}
            onChange={setField("patientContact")}
            className="input-base mt-1 h-9 w-full text-sm"
            placeholder="+263..."
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Age</label>
          <input
            type="number"
            min={0}
            max={130}
            value={form.patientAge}
            onChange={setField("patientAge")}
            className="input-base mt-1 h-9 w-full text-sm"
            placeholder="Years"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Gender</label>
          <select
            value={form.patientGender}
            onChange={setField("patientGender")}
            className="input-base mt-1 h-9 w-full text-sm"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Service category *</label>
          <select
            required
            value={form.serviceCategory}
            onChange={setField("serviceCategory")}
            className="input-base mt-1 h-9 w-full text-sm"
          >
            <option value="">Select service</option>
            {serviceCategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Date *</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={setField("date")}
            className="input-base mt-1 h-9 w-full text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Time slot *</label>
          <select
            required
            value={form.timeSlot}
            onChange={setField("timeSlot")}
            className="input-base mt-1 h-9 w-full text-sm"
          >
            <option value="">Select time</option>
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="text-xs font-semibold text-muted-foreground">Notes</label>
          <textarea
            value={form.notes}
            onChange={setField("notes")}
            className="input-base mt-1 w-full text-sm"
            rows={2}
            placeholder="Optional notes for the clinic"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {isSubmitting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : isEdit ? (
            <Save className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {isEdit ? "Save changes" : "Book appointment"}
        </button>
      </div>
    </form>
  );
}

function AppointmentRow({ appointment, onStatusChange, onEdit, onDelete, statusPending }) {
  const appt = appointment;
  const canEdit = appt.status !== "cancelled" && appt.status !== "completed";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/60 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold">{appt.patientName}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              STATUS_BADGE[appt.status] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {appt.status}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{appt.serviceLabel}</span>
          <span>
            {appt.date} · {appt.timeSlot}
          </span>
          {appt.patientContact ? <span>{appt.patientContact}</span> : null}
          {appt.patientAge != null ? <span>{appt.patientAge}y</span> : null}
          {appt.patientGender ? <span className="capitalize">{appt.patientGender}</span> : null}
        </div>
        {appt.notes ? (
          <p className="mt-1 text-xs italic text-muted-foreground">"{appt.notes}"</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {statusPending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
        {canEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold hover:bg-accent"
            title="Edit appointment"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        ) : null}
        {appt.status === "pending" ? (
          <button
            type="button"
            disabled={statusPending}
            onClick={() => onStatusChange(appt.id, "confirmed")}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold hover:bg-accent disabled:opacity-50"
          >
            Confirm
          </button>
        ) : null}
        {appt.status === "confirmed" ? (
          <button
            type="button"
            disabled={statusPending}
            onClick={() => onStatusChange(appt.id, "checked-in")}
            className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-300"
          >
            Check in
          </button>
        ) : null}
        {appt.status === "pending" || appt.status === "confirmed" ? (
          <button
            type="button"
            disabled={statusPending}
            onClick={() => onStatusChange(appt.id, "cancelled")}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            Cancel
          </button>
        ) : null}
        {appt.status === "checked-in" ? (
          <button
            type="button"
            disabled={statusPending}
            onClick={() => onStatusChange(appt.id, "completed")}
            className="inline-flex items-center gap-1 rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-500/20 disabled:opacity-50 dark:text-violet-300"
          >
            Complete
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/5 px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-red-500/10"
          title="Delete appointment"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
