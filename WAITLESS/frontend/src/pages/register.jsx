import { useCallback, useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Copy,
  History,
  LoaderCircle,
  MessageCircle,
  Printer,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  Share2,
  UserRound,
  UserPlus,
  X,
} from "lucide-react";

import { DEPARTMENTS } from "@/services/queueMeta";
import {
  confirmArrival,
  fetchPatientMatches,
  fetchTickets,
  fetchQueueMeta,
  registerPatient,
} from "@/services/queueApi";
import { useLiveRefresh } from "@/context/LiveRefreshContext";
import { useApiAction, useApiResource } from "@/hooks/useApiResource";
import {
  buildTrackingUrl,
  printQueueTicket,
  shareQueueTicket,
} from "@/services/queueTicketHandoff";
import { useFormDraft } from "@/utils/formDraft";

const isBrowser = typeof window !== "undefined";
const INITIAL_FORM = {
  patientId: null,
  fullName: "",
  nationalId: "",
  phone: "",
  dept: "",
  notificationConsent: true,
  whatsApp: true,
};

export default function RegisterPage() {
  const { refreshLiveData } = useLiveRefresh();
  const [submitted, setSubmitted] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const formDraft = useFormDraft("register-patient", form);

  useEffect(() => {
    if (formDraft.hasDraft && formDraft.draft?.data && !submitted) {
      const saved = formDraft.draft.data;
      const hasValues = saved.fullName || saved.nationalId || saved.phone;
      if (hasValues) {
        setForm(saved);
      }
    }
  }, [formDraft.draft?.savedAt]);
  const [lookupTerm, setLookupTerm] = useState("");
  const [appliedPatientId, setAppliedPatientId] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [handoffState, setHandoffState] = useState("");
  const [formError, setFormError] = useState("");
  const [showPreRegistered, setShowPreRegistered] = useState(false);

  const loadPreRegistered = useCallback(
    () => fetchTickets({ status: "pre-registered" }),
    [],
  );
  const preRegisteredQuery = useApiResource(loadPreRegistered, {
    enabled: false,
  });
    const confirmArrivalMutation = useApiAction(
    ({ id, department }) => confirmArrival(id, department),
    {
      onSuccess: () => {
        refreshLiveData();
        preRegisteredQuery.refetch();
      },
    },
  );

  const loadMeta = useCallback(() => fetchQueueMeta(), []);
  const metaQuery = useApiResource(loadMeta, { enabled: isBrowser });
  const patientLookupMutation = useApiAction(fetchPatientMatches);

  const registerMutation = useApiAction(registerPatient, {
    onSuccess: (ticket) => {
      setSubmitted(ticket);
      setAppliedPatientId(null);
      setLookupTerm("");
      setHandoffState("");
      formDraft.clear();
      refreshLiveData();
    },
  });

  const departments = metaQuery.data?.departments ?? DEPARTMENTS;

  function submit(event) {
    event.preventDefault();
    if (!form.fullName.trim()) {
      setFormError("Full name is required.");
      return;
    }
    if (!/^\d{8,9}[A-Z]\d{2}$/.test(form.nationalId.trim())) {
      setFormError("ID number format: digits, one letter, then 2 digits — e.g. 67143396U56.");
      return;
    }
    if (!form.phone.trim()) {
      setFormError("Phone number is required for queue notifications.");
      return;
    }
    if (!form.dept) {
      setFormError("Please select a department to issue the ticket.");
      return;
    }
    setFormError("");
    registerMutation.mutate(form);
  }

  function lookupExistingPatients() {
    const normalizedLookup = lookupTerm.trim();
    if (normalizedLookup.length < 2) {
      return;
    }

    patientLookupMutation.mutate(normalizedLookup);
  }

  function applyReturningPatient(profile) {
    setForm((current) => ({
      ...current,
      patientId: profile.id,
      fullName: profile.patientName ?? "",
      nationalId: (profile.nationalId ?? "")
        .replace(/[^0-9a-zA-Z]/g, "")
        .toUpperCase(),
      phone: profile.phone ?? "",
      // Department is never autofilled — the receptionist chooses where this
      // visit is going, every time.
      dept: "",
    }));
    setAppliedPatientId(profile.id);
    setLookupTerm(profile.patientNumber ?? profile.patientName ?? "");
    setFormError("");
  }

  function resetRegistrationForm() {
    setForm(INITIAL_FORM);
    setAppliedPatientId(null);
    setLookupTerm("");
    setHandoffState("");
    patientLookupMutation.reset();
  }

  function applyQrLookup(value) {
    setLookupTerm(value);
    setScannerOpen(false);
    patientLookupMutation.mutate(value);
  }

  async function copyRegistrationValue(value, label) {
    try {
      await copyTextToClipboard(value);
      setHandoffState(label);
      window.setTimeout(() => setHandoffState(""), 2200);
    } catch (error) {
      setHandoffState("Copy is not available on this device yet.");
      window.setTimeout(() => setHandoffState(""), 2600);
    }
  }

  async function handlePrintTicket() {
    try {
      setHandoffState("Preparing printable ticket...");
      await printQueueTicket(submitted);
      setHandoffState("Print dialog opened.");
    } catch (error) {
      setHandoffState(error.message || "The ticket could not be printed.");
    }
  }

  async function handleShareTicket() {
    try {
      setHandoffState(await shareQueueTicket(submitted));
    } catch (error) {
      setHandoffState(error.message || "The ticket could not be shared.");
    }
  }

  /* ────────────────────────── Success view ────────────────────────── */

  if (submitted) {
    const channels = submitted.handoff?.channels ?? {};

    return (
      <section className="staff-module-page mx-auto min-h-[calc(100vh-7rem)] w-full max-w-4xl px-1 py-6 sm:py-8">
        <div className="surface-panel p-6 sm:p-8">
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-priority-green/15 text-priority-green">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <div className="eyebrow mt-4">Ticket issued</div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Patient is in the queue
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {submitted.patientName} is registered and routed to {submitted.department}.
            </p>
          </div>

          {/* Ticket card */}
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-primary/20 bg-primary-soft/50 px-6 py-6 text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              Ticket code
            </div>
            <div className="mt-2 font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
              {submitted.ticket}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {submitted.department}
            </div>

            <div className="mt-5 grid w-full max-w-md grid-cols-2 gap-2 sm:grid-cols-4">
              <ChannelDeliveryStatus label="Print" status={channels.print?.status ?? "ready"} />
              <ChannelDeliveryStatus label="Phone" status={channels.phone?.status ?? "ready"} />
              <ChannelDeliveryStatus
                label="WhatsApp"
                status={
                  channels.whatsapp?.status ??
                  (submitted.whatsApp ? "queued" : "disabled")
                }
              />
              <ChannelDeliveryStatus label="Display" status={channels.displayBoard?.status ?? "synced"} />
            </div>
          </div>

          {/* Handoff actions */}
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              onClick={() => copyRegistrationValue(submitted.ticket, "Ticket code copied.")}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Copy className="h-3.5 w-3.5 text-primary" />
              Copy ticket
            </button>
            <button
              type="button"
              onClick={() =>
                copyRegistrationValue(buildTrackingUrl(submitted), "Tracking link copied.")
              }
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Copy className="h-3.5 w-3.5 text-primary" />
              Copy tracking link
            </button>
            <button
              type="button"
              onClick={handlePrintTicket}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Printer className="h-3.5 w-3.5 text-primary" />
              Print ticket
            </button>
            <button
              type="button"
              onClick={handleShareTicket}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Share2 className="h-3.5 w-3.5 text-primary" />
              Send to phone
            </button>
          </div>

          <p className="mt-4 min-h-5 text-center text-xs font-medium text-primary">
            {handoffState || "Share the ticket code or tracking link with the patient."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 border-t border-border/60 pt-6">
            <button
              type="button"
              onClick={() => {
                setSubmitted(null);
                resetRegistrationForm();
              }}
              className="inline-flex items-center gap-2 rounded-lg gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant"
            >
              <UserPlus className="h-4 w-4" />
              Register another patient
            </button>
            <Link
              to={`/track?ticket=${encodeURIComponent(submitted.ticket)}`}
              className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Track ticket
            </Link>
            <Link
              to="/queue"
              className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Queue board
            </Link>
          </div>
        </div>
      </section>
    );
  }

  /* ────────────────────────── Form view ────────────────────────── */

  return (
    <section className="staff-module-page mx-auto min-h-[calc(100vh-7rem)] w-full max-w-[96rem] px-1 py-6 sm:py-8">
      {/* Page header */}
      <header className="surface-panel flex flex-wrap items-start justify-between gap-4 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
            <UserPlus className="h-5 w-5" />
          </span>
          <div>
            <div className="eyebrow">Front desk</div>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Register a patient
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Capture the patient, issue a live queue ticket, and open their notification channel.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={resetRegistrationForm}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          New blank form
        </button>
      </header>

      {/* Pre-registered arrivals */}
      <div className="mt-5">
        <PreRegisteredArrivals
          show={showPreRegistered}
          onToggle={() => {
            setShowPreRegistered(!showPreRegistered);
            if (!showPreRegistered) preRegisteredQuery.refetch();
          }}
          tickets={preRegisteredQuery.data ?? []}
          departments={departments}
          loading={preRegisteredQuery.loading}
          onConfirm={(id, department) =>
            confirmArrivalMutation.mutate({ id, department })
          }
          confirmingId={confirmArrivalMutation.variables?.id}
          error={confirmArrivalMutation.error?.message}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        {/* ── Registration form ── */}
        <form onSubmit={submit} className="surface-panel">
          {/* Returning patient lookup */}
          <div className="border-b border-border/60 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                  <History className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold">Returning patient?</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Search by name, phone, ID, patient number, or scan their QR card.
                  </p>
                </div>
              </div>
              {appliedPatientId ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-priority-green/30 bg-priority-green/10 px-2.5 py-1 text-xs font-semibold text-priority-green">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Record applied
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Search returning patients</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={lookupTerm}
                  onChange={(event) => setLookupTerm(event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      lookupExistingPatients();
                    }
                  }}
                  className="input-base h-10 pl-10 text-sm"
                  placeholder="Name, phone, national ID, patient number, or ticket"
                />
              </label>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={lookupExistingPatients}
                  disabled={patientLookupMutation.isPending || lookupTerm.trim().length < 2}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg gradient-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {patientLookupMutation.isPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary/25 bg-primary-soft/70 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
                >
                  <ScanLine className="h-4 w-4" />
                  Scan QR
                </button>
              </div>
            </div>

            {patientLookupMutation.isError ? (
              <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {patientLookupMutation.error.message}
              </div>
            ) : null}

            {patientLookupMutation.data ? (
              patientLookupMutation.data.length ? (
                <div className="mt-4 grid gap-3">
                  {patientLookupMutation.data.map((profile) => (
                    <ReturningPatientCard
                      key={profile.id}
                      profile={profile}
                      isApplied={appliedPatientId === profile.id}
                      onApply={() => applyReturningPatient(profile)}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-border bg-background/60 px-4 py-3 text-xs text-muted-foreground">
                  No previous patient record matched that search.
                </div>
              )
            ) : null}
          </div>

          {/* Patient details — only what the queue needs */}
          <FormSection title="Patient details">
            <Field label="National ID" required>
              <input
                required
                maxLength={12}
                value={form.nationalId}
                onChange={(event) =>
                  setForm({
                    ...form,
                    nationalId: event.target.value
                      .replace(/[^0-9a-zA-Z]/g, "")
                      .toUpperCase(),
                  })
                }
                className="input-base h-9 text-sm"
                placeholder="e.g. 67143396U56"
              />
            </Field>
            <Field label="Full name" required>
              <input
                required
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                className="input-base h-9 text-sm"
                placeholder="e.g. Tariro Moyo"
              />
            </Field>
            <Field label="Mobile / WhatsApp" required full>
              <input
                required
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className="input-base h-9 text-sm"
                placeholder="+263 77 123 4567"
              />
            </Field>
          </FormSection>

          {/* Visit routing */}
          <FormSection title="Visit routing">
            <Field label="Department" required full>
              <select
                required
                value={form.dept}
                onChange={(event) => setForm({ ...form, dept: event.target.value })}
                className="input-base h-9 text-sm"
              >
                <option value="" disabled>
                  Select department…
                </option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </Field>
          </FormSection>

          {/* Consent + submit */}
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="space-y-2.5">
              <ConsentToggle
                checked={form.notificationConsent}
                onChange={(checked) =>
                  setForm({
                    ...form,
                    notificationConsent: checked,
                    whatsApp: checked ? form.whatsApp : false,
                  })
                }
                title="Patient consents to queue notifications"
                description="Capture consent before sending WhatsApp or web queue updates."
              />
              <ConsentToggle
                checked={form.whatsApp}
                disabled={!form.notificationConsent}
                onChange={(checked) => setForm({ ...form, whatsApp: checked })}
                title="Use WhatsApp for queue alerts"
                description="Registration, near-turn, missed-turn, and call-up alerts."
              />
            </div>

            {formError || registerMutation.isError ? (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {formError || registerMutation.error?.message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
            >
              {registerMutation.isPending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Issuing ticket…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Issue digital ticket
                </>
              )}
            </button>
          </div>
        </form>

        {/* ── Side panel: desk notes ── */}
        <aside className="space-y-5 self-start">
          <div className="surface-panel p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <h2 className="font-display text-base font-bold">How registration flows</h2>
            </div>
            <ol className="mt-4 space-y-3">
              {[
                "Search by ticket code, name, ID or phone — details auto-fill.",
                "Confirm national ID, name and phone, then pick the department.",
                "The ticket lands on the live board and staff dashboard instantly.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-[11px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-6 text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="surface-panel p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                <MessageCircle className="h-4 w-4" />
              </span>
              <h2 className="font-display text-base font-bold">WhatsApp alerts</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Enable WhatsApp when a reachable number is available — patients get registration,
              near-turn, and call alerts, which reduces crowding around the waiting area.
            </p>
          </div>
        </aside>
      </div>

      {scannerOpen ? (
        <QrPatientScanner onClose={() => setScannerOpen(false)} onScan={applyQrLookup} />
      ) : null}
    </section>
  );
}

/* ---------- Building blocks ---------- */

function FormSection({ title, children }) {
  return (
    <div className="border-b border-border/60 px-5 py-5 sm:px-6">
      <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function ConsentToggle({ checked, onChange, disabled, title, description }) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border border-border/60 bg-background/50 px-4 py-3.5 text-sm ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-primary"
      />
      <span>
        <span className="font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

function ChannelDeliveryStatus({ label, status }) {
  const isDisabled = status === "disabled";

  return (
    <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-0.5 text-xs font-bold capitalize ${
          isDisabled ? "text-muted-foreground" : "text-priority-green"
        }`}
      >
        {status}
      </div>
    </div>
  );
}

function ReturningPatientCard({ profile, isApplied, onApply }) {
  return (
    <article
      className={`rounded-xl border px-4 py-3.5 transition-all ${
        isApplied
          ? "border-primary/30 bg-primary-soft/45 shadow-card"
          : "border-border/60 bg-background/60"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-display text-base font-bold tracking-tight">
              {profile.patientName}
            </div>
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
              {profile.totalVisits} visit{profile.totalVisits === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
            {profile.patientNumber ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 font-semibold text-primary">
                <QrCode className="h-3 w-3" />
                {profile.patientNumber}
              </span>
            ) : null}
            {profile.phone ? (
              <span className="rounded-full bg-muted px-2 py-0.5 font-semibold">{profile.phone}</span>
            ) : null}
            {profile.nationalId ? (
              <span className="rounded-full bg-muted px-2 py-0.5 font-semibold">
                {profile.nationalId}
              </span>
            ) : null}
            {profile.patientCategory ? (
              <span className="rounded-full bg-muted px-2 py-0.5 font-semibold capitalize">
                {profile.patientCategory.replaceAll("-", " ")}
              </span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onApply}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            isApplied
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-foreground hover:bg-muted"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          {isApplied ? "Applied" : "Use record"}
        </button>
      </div>

      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <LookupMeta label="Last visit" value={formatVisitDate(profile.lastVisitAt)} />
        <LookupMeta label="Last dept" value={profile.lastDepartment || "Unknown"} />
        <LookupMeta label="Latest ticket" value={profile.lastTicket || "—"} />
      </div>
    </article>
  );
}

function QrPatientScanner({ onClose, onScan }) {
  const scannerId = `patient-qr-${useId().replaceAll(":", "")}`;
  const [error, setError] = useState("");

  useEffect(() => {
    let scanner = null;
    let cancelled = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        scanner = new Html5Qrcode(scannerId);
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          (decodedText) => onScan(decodedText),
          () => {},
        );
      } catch (scannerError) {
        if (!cancelled) {
          setError(
            scannerError?.message ||
              "Camera access is unavailable. Enter the patient number in the search field instead.",
          );
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      if (scanner?.isScanning) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => scanner.clear());
      } else {
        scanner?.clear();
      }
    };
  }, [onScan, scannerId]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-qr-title"
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">Patient lookup</div>
            <h2 id="patient-qr-title" className="mt-2 font-display text-xl font-bold">
              Scan WaitLess QR
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR scanner"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 min-h-72 overflow-hidden rounded-xl border border-border bg-slate-950 p-2">
          <div id={scannerId} className="min-h-64 w-full" />
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Hold the patient QR card inside the frame. The matching patient record will
            open automatically.
          </p>
        )}
      </div>
    </div>
  );
}

function LookupMeta({ label, value }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-xs font-semibold text-foreground">{value}</div>
    </div>
  );
}

function formatVisitDate(value) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Field({ label, children, required, full }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}

async function copyTextToClipboard(value) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard is not available.");
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

function PreRegisteredRow({ ticket, departments, onConfirm, confirmingId }) {
  const [dept, setDept] = useState("");
  const [rowError, setRowError] = useState("");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-14 place-items-center rounded-lg bg-amber-500/12 font-display text-xs font-bold text-amber-600 dark:text-amber-300">
          {ticket.ticket}
        </span>
        <div>
          <div className="text-sm font-semibold">{ticket.patientName}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Reported at reception &middot; {ticket.phone || "No phone recorded"}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={dept}
          onChange={(e) => {
            setDept(e.target.value);
            setRowError("");
          }}
          className="h-9 min-w-44 rounded-lg border border-border/60 bg-background px-3 text-xs font-medium focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Select department…</option>
          {departments.map((deptOption) => (
            <option key={deptOption} value={deptOption}>
              {deptOption}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            if (!dept) {
              setRowError("Pick the department first.");
              return;
            }
            onConfirm(ticket.id, dept);
          }}
          disabled={confirmingId === ticket.id}
          className="rounded-lg gradient-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-elegant disabled:opacity-60"
        >
          {confirmingId === ticket.id ? (
            <span className="flex items-center gap-1.5">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              Booking…
            </span>
          ) : (
            "Book into queue"
          )}
        </button>
      </div>
      {rowError ? (
        <p className="w-full text-xs font-semibold text-destructive">{rowError}</p>
      ) : null}
    </div>
  );
}

function PreRegisteredArrivals({ show, onToggle, tickets, departments = [], loading, onConfirm, confirmingId, error }) {
  return (
    <div className="surface-panel overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-500">
            <UserRound className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold">Pre-registered arrivals</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Online registrations waiting to be verified at the desk.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {tickets.length > 0 ? (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-300">
              {tickets.length} pending
            </span>
          ) : null}
          <span className="text-xs font-semibold text-muted-foreground">
            {show ? "Hide" : "Show"}
          </span>
        </div>
      </button>
      {show ? (
        <div className="border-t border-border/60 px-5 py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading pre-registered patients…
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pre-registered patients awaiting arrival.</p>
          ) : (
            <div className="space-y-2.5">
              {tickets.map((ticket) => (
                <PreRegisteredRow
                  key={ticket.id}
                  ticket={ticket}
                  departments={departments}
                  onConfirm={onConfirm}
                  confirmingId={confirmingId}
                />
              ))}
            </div>
          )}
          {error ? (
            <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
