import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FlaskConical,
  HeartPulse,
  LoaderCircle,
  Pill,
  Search,
  UserRound,
  UserSearch,
} from "lucide-react";

import { fetchPatientHistory, searchPatientDirectory } from "@/services/authApi";
import { LoadingPanel } from "@/components/ui/system-loader";

const TICKET_STATUS_COLORS = {
  waiting: "bg-sky-400/15 text-sky-300 ring-sky-300/25",
  called: "bg-cyan-400/15 text-cyan-300 ring-cyan-300/25",
  "in-service": "bg-amber-400/15 text-amber-300 ring-amber-300/25",
  completed: "bg-emerald-400/15 text-emerald-300 ring-emerald-300/25",
  missed: "bg-rose-400/15 text-rose-300 ring-rose-300/25",
};

const PRIORITY_COLORS = {
  red: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  yellow: "bg-amber-400/15 text-amber-300 ring-amber-300/25",
  green: "bg-emerald-400/15 text-emerald-300 ring-emerald-300/25",
  black: "bg-zinc-500/20 text-zinc-300 ring-zinc-400/30",
};

function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return withTime
    ? date.toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function chip(text, cls) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ring-1 ring-inset ${cls}`}>
      {text}
    </span>
  );
}

export default function PatientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const openPatient = useCallback(async (key) => {
    if (!key) return;
    setError("");
    setHistoryLoading(true);
    try {
      const data = await fetchPatientHistory(key);
      setHistory(data);
      setSearchParams({ key }, { replace: true });
    } catch (err) {
      setError(err.message);
      setHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  }, [setSearchParams]);

  // Deep link: /admin/patients?key=...
  useEffect(() => {
    const key = searchParams.get("key");
    if (key && !history) {
      openPatient(key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return undefined;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      searchPatientDirectory(q)
        .then((res) => setResults(res?.patients ?? []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function closeHistory() {
    setHistory(null);
    setSearchParams({}, { replace: true });
  }

  return (
    <section className="staff-module-page mx-auto min-h-[calc(100vh-7rem)] w-full max-w-[96rem] px-1 py-6 sm:py-8">
      <header className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:p-8">
        <span className="absolute inset-x-0 top-0 h-0.5 bg-[linear-gradient(90deg,transparent,#14b8a6,transparent)]" />
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="bg-gradient-to-r from-teal-300 to-teal-300 bg-clip-text text-[11px] font-black uppercase tracking-[0.32em] text-transparent">
                Clinical records
              </span>
              <span className="h-px w-9 bg-gradient-to-l from-transparent to-teal-300/60" />
            </div>
            <h1 className="mt-3 inline-flex items-center gap-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Patient Records
              <span className="mt-1 h-px w-10 bg-gradient-to-l from-transparent to-teal-300/50" />
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/45 sm:text-base">
              Search any patient to see their full history — visits, prescriptions, test orders, appointments and OI clinic sessions.
            </p>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-teal-300/20 bg-teal-400/10 text-teal-300">
            <UserSearch className="h-5 w-5" />
          </span>
        </div>

        <label className="relative mt-6 block max-w-xl">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            type="text"
            placeholder="Search by name, phone, national ID, or patient number…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 w-full rounded-full border border-white/10 bg-white/[0.05] pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-teal-300/40"
          />
          {searching ? (
            <LoaderCircle className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-teal-300" />
          ) : null}
        </label>
      </header>

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300">
          {error}
        </p>
      ) : null}

      {/* Search results */}
      {!history && results.length > 0 ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
          {results.map((patient) => (
            <button
              key={`${patient.kind}-${patient.id}`}
              type="button"
              onClick={() => openPatient(patient.nationalId || patient.phone || patient.id)}
              className="flex w-full items-center gap-4 border-b border-white/[0.05] px-5 py-3.5 text-left transition-colors last:border-0 hover:bg-white/[0.03]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,rgba(13,148,136,0.55),rgba(34,211,238,0.35))] text-[11px] font-bold text-white">
                {(patient.name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-white">{patient.name}</span>
                <span className="block truncate text-xs text-white/40">
                  {[
                    patient.patientNumber && `#${patient.patientNumber}`,
                    patient.nationalId,
                    patient.phone,
                    patient.username && `@${patient.username}`,
                  ].filter(Boolean).join("  ·  ")}
                </span>
              </span>
              {patient.kind === "account" ? chip("Portal account", "bg-teal-400/15 text-teal-300 ring-teal-300/25") : chip("Registered", "bg-white/[0.06] text-white/50 ring-white/10")}
            </button>
          ))}
        </div>
      ) : null}

      {!history && query.trim() && !searching && results.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center text-sm text-white/35">
          No patients match “{query.trim()}”.
        </div>
      ) : null}

      {historyLoading ? (
        <LoadingPanel className="mt-5" title="Loading patient record" message="Gathering visits, prescriptions and orders." />
      ) : history ? (
        <div className="mt-5 space-y-4">
          {/* Patient header */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
            <span className="absolute inset-x-0 top-0 h-0.5 bg-[linear-gradient(90deg,transparent,#22d3ee,transparent)]" />
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={closeHistory}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 text-xs font-semibold text-white/60 transition hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[linear-gradient(135deg,rgba(13,148,136,0.55),rgba(34,211,238,0.35))] text-sm font-bold text-white">
                {(history.patient.name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-bold text-white">{history.patient.name ?? "Unknown patient"}</h2>
                  {history.patient.hasPortalAccount ? chip("Portal account", "bg-teal-400/15 text-teal-300 ring-teal-300/25") : null}
                  {history.patient.patientNumber ? chip(`#${history.patient.patientNumber}`, "bg-white/[0.06] text-white/60 ring-white/15") : null}
                </div>
                <p className="mt-0.5 text-xs text-white/45">
                  {[
                    history.patient.nationalId && `ID ${history.patient.nationalId}`,
                    history.patient.phone,
                    history.patient.gender && history.patient.gender !== "unknown" ? history.patient.gender : null,
                    history.patient.dob && `DOB ${history.patient.dob}`,
                  ].filter(Boolean).join("  ·  ") || "No contact details on file"}
                </p>
              </div>
            </div>

            {/* Summary chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { icon: ClipboardList, label: `${history.summary.visits} visits`, tint: "#38bdf8" },
                { icon: Pill, label: `${history.summary.prescriptions} prescriptions`, tint: "#fbbf24" },
                { icon: FlaskConical, label: `${history.summary.testOrders} test orders`, tint: "#a78bfa" },
                { icon: CalendarDays, label: `${history.summary.appointments} appointments`, tint: "#34d399" },
                { icon: HeartPulse, label: `${history.summary.oiVisits} OI visits`, tint: "#fb7185" },
              ].map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/70"
                >
                  <s.icon className="h-3.5 w-3.5" style={{ color: s.tint }} />
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          {/* Visit history */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Visit history</span>
              <span className="h-px flex-1 bg-white/[0.07]" />
            </div>
            {history.tickets.length === 0 ? (
              <p className="py-4 text-center text-sm text-white/35">No queue visits on record.</p>
            ) : (
              <div className="space-y-3">
                {history.tickets.map((ticket) => (
                  <div key={ticket.id} className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 pl-5">
                    <span className="absolute inset-y-0 left-0 w-0.5 bg-[linear-gradient(180deg,#38bdf8,#38bdf833)]" />
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-white">{ticket.ticket}</span>
                      {chip(ticket.department, "bg-cyan-400/15 text-cyan-300 ring-cyan-300/25")}
                      {ticket.priority ? chip(ticket.priority, PRIORITY_COLORS[ticket.priority] ?? "bg-white/[0.06] text-white/50 ring-white/10") : null}
                      {ticket.status ? chip(ticket.status.replace(/-/g, " "), TICKET_STATUS_COLORS[ticket.status] ?? "bg-white/[0.06] text-white/50 ring-white/10") : null}
                      <span className="ml-auto text-xs text-white/40">{formatDate(ticket.registeredAt, true)}</span>
                    </div>
                    {ticket.chiefComplaint ? (
                      <p className="mt-2 text-sm text-white/70">“{ticket.chiefComplaint}”</p>
                    ) : null}

                    {ticket.prescriptions?.length ? (
                      <div className="mt-3 space-y-1.5">
                        {ticket.prescriptions.map((rx) => (
                          <div key={rx.id} className="flex items-start gap-2 rounded-lg bg-amber-400/[0.06] px-3 py-2 text-xs ring-1 ring-inset ring-amber-400/15">
                            <Pill className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                            <span className="text-white/70">
                              {(rx.items ?? []).map((i) => `${i.drugName} ${i.dosage}`).join(", ") || "Prescription"}
                              <span className="ml-2 font-semibold text-amber-300/90">{rx.state?.replace(/-/g, " ")}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {ticket.testOrders?.length ? (
                      <div className="mt-3 space-y-1.5">
                        {ticket.testOrders.map((order) => (
                          <div key={order.id} className="flex items-start gap-2 rounded-lg bg-violet-400/[0.06] px-3 py-2 text-xs ring-1 ring-inset ring-violet-400/15">
                            <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
                            <span className="text-white/70">
                              {order.testType}
                              <span className="ml-2 font-semibold text-violet-300/90">{order.state?.replace(/-/g, " ")}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Appointments + OI visits */}
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
              <div className="mb-4 flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-emerald-300" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Appointments</span>
                <span className="h-px flex-1 bg-white/[0.07]" />
              </div>
              {history.appointments.length === 0 ? (
                <p className="py-3 text-center text-sm text-white/35">No appointments on record.</p>
              ) : (
                <div className="space-y-2">
                  {history.appointments.map((appt) => (
                    <div key={appt.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white/85">{appt.serviceLabel ?? appt.serviceCategory}</div>
                        <div className="text-xs text-white/40">{formatDate(appt.date)} · {appt.timeSlot}</div>
                      </div>
                      {chip(appt.status, TICKET_STATUS_COLORS[appt.status] ?? "bg-white/[0.06] text-white/50 ring-white/10")}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
              <div className="mb-4 flex items-center gap-3">
                <HeartPulse className="h-4 w-4 text-pink-300" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">OI Clinic visits</span>
                <span className="h-px flex-1 bg-white/[0.07]" />
              </div>
              {history.oiVisits.length === 0 ? (
                <p className="py-3 text-center text-sm text-white/35">No OI Clinic sessions on record.</p>
              ) : (
                <div className="space-y-2">
                  {history.oiVisits.map((visit) => (
                    <div key={visit.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white/85">{visit.streamLabel ?? visit.streamId}</div>
                        <div className="text-xs text-white/40">{visit.ticketCode} · {formatDate(visit.createdAt)}</div>
                      </div>
                      {chip(visit.state?.replace(/-/g, " ") ?? "—", TICKET_STATUS_COLORS[visit.state] ?? "bg-pink-400/15 text-pink-300 ring-pink-300/25")}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-teal-400/10 text-teal-300 ring-1 ring-inset ring-teal-300/20">
            <Activity className="h-5 w-5" />
          </span>
          <p className="max-w-sm text-sm text-white/40">
            Search above to open a patient’s record — you’ll see every visit, prescription, lab order, appointment and OI session linked to them.
          </p>
        </div>
      )}
    </section>
  );
}
