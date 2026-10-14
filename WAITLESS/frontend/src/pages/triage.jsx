import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock3,
  FlaskConical,
  LoaderCircle,
  MessageCircle,
  Navigation,
  Pill,
  Search,
  ShieldAlert,
  Siren,
  Stethoscope,
  Timer,
  Users,
  Wifi,
} from "lucide-react";

import { LoadingPanel } from "@/components/ui/system-loader";
import { useLiveRefresh } from "@/context/LiveRefreshContext";
import { useApiAction, useApiResource } from "@/hooks/useApiResource";
import { PRIORITY_META, priorityChipClass } from "@/services/queueMeta";
import { assignTicketPriority, createPrescription, createTestOrder, fetchNextRoute, fetchPrescriptionsForTicket, fetchTestOrdersForTicket, fetchTickets, saveTriageAssessment } from "@/services/queueApi";
import { useQueueRealtime } from "@/sockets/QueueRealtimeProvider";
import { useFormDraft } from "@/utils/formDraft";

const isBrowser = typeof window !== "undefined";
const EMPTY_TICKETS = [];
const TRIAGE_PRIORITIES = ["red", "yellow", "green", "black"];
const PRIORITY_DOT = {
  red: "bg-priority-red",
  yellow: "bg-priority-yellow",
  green: "bg-priority-green",
  black: "bg-priority-black",
};
const EMPTY_ASSESSMENT = {
  bloodPressureSystolic: "",
  bloodPressureDiastolic: "",
  heartRate: "",
  temperature: "",
  respiratoryRate: "",
  oxygenSaturation: "",
  symptoms: "",
  painScore: 0,
  severity: "",
  notes: "",
};
const LIVE_STATUS_META = {
  connected: {
    label: "Live sync",
    className: "bg-priority-green/15 text-priority-green",
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

export default function TriagePage() {
  const { refreshLiveData } = useLiveRefresh();
  const realtime = useQueueRealtime();
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadWaitingTickets = useCallback(() => fetchTickets({ status: "waiting" }), []);
  const ticketsQuery = useApiResource(loadWaitingTickets, { enabled: isBrowser });

  const assignMutation = useApiAction(
    ({ id, priority }) => assignTicketPriority(id, priority),
    {
      onSuccess: refreshLiveData,
    },
  );

  const assessmentMutation = useApiAction(
    ({ id, payload }) => saveTriageAssessment(id, payload),
    {
      onSuccess: refreshLiveData,
    },
  );

  const [assessment, setAssessment] = useState(EMPTY_ASSESSMENT);

  const draftKey = selectedId ? `triage-assessment-${selectedId}` : "triage-assessment";
  const formDraft = useFormDraft(draftKey, assessment);

  useEffect(() => {
    if (formDraft.hasDraft && formDraft.draft?.data) {
      const saved = formDraft.draft.data;
      const hasValues = Object.values(saved).some(
        (v) => v !== "" && v !== 0 && v != null,
      );
      if (hasValues) {
        setAssessment(saved);
      }
    }
  }, [formDraft.draft?.savedAt]);

  const tickets = ticketsQuery.data ?? EMPTY_TICKETS;
  const filteredTickets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return tickets;
    }

    return tickets.filter((ticket) => {
      const haystack = [
        ticket.ticket,
        ticket.patientName,
        ticket.department,
        ticket.chiefComplaint,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [tickets, searchTerm]);
  const selected = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) ?? null,
    [tickets, selectedId],
  );
  const liveMeta = LIVE_STATUS_META[realtime.status] ?? LIVE_STATUS_META.connecting;
  const awaitingCount = tickets.length;
  const avgWait = awaitingCount
    ? Math.round(
        tickets.reduce((sum, ticket) => sum + (ticket.waitMinutes ?? 0), 0) /
          awaitingCount,
      )
    : 0;
  const longestWait = tickets.length
    ? Math.max(...tickets.map((ticket) => ticket.waitMinutes ?? 0))
    : 0;
  const whatsAppCount = tickets.filter((ticket) => ticket.whatsApp).length;
  const priorityCounts = TRIAGE_PRIORITIES.reduce((accumulator, priority) => {
    accumulator[priority] = tickets.filter((ticket) => ticket.priority === priority).length;
    return accumulator;
  }, {});

  useEffect(() => {
    if (!tickets.length) {
      setSelectedId(null);
      return;
    }

    const nextList = filteredTickets.length ? filteredTickets : tickets;
    if (!selectedId || !nextList.some((ticket) => ticket.id === selectedId)) {
      setSelectedId(nextList[0].id);
    }
  }, [tickets, filteredTickets, selectedId]);

  function updateAssessment(key, value) {
    setAssessment((prev) => ({ ...prev, [key]: value }));
  }

  const liveEmergencyTriggers = useMemo(() => {
    const triggers = [];
    const v = {
      oxygenSaturation: assessment.oxygenSaturation ? Number(assessment.oxygenSaturation) : null,
      heartRate: assessment.heartRate ? Number(assessment.heartRate) : null,
      bloodPressureSystolic: assessment.bloodPressureSystolic ? Number(assessment.bloodPressureSystolic) : null,
      temperature: assessment.temperature ? Number(assessment.temperature) : null,
      respiratoryRate: assessment.respiratoryRate ? Number(assessment.respiratoryRate) : null,
    };
    const pain = assessment.painScore != null ? Number(assessment.painScore) : null;
    if (v.oxygenSaturation != null && v.oxygenSaturation < 90) triggers.push("SpO2 below 90%");
    if (v.heartRate != null && (v.heartRate > 130 || v.heartRate < 40)) triggers.push("Heart rate outside 40-130 bpm");
    if (v.bloodPressureSystolic != null && (v.bloodPressureSystolic > 180 || v.bloodPressureSystolic < 80)) triggers.push("Systolic BP outside 80-180 mmHg");
    if (v.temperature != null && v.temperature >= 39.5) triggers.push("Temperature at or above 39.5C");
    if (v.respiratoryRate != null && (v.respiratoryRate > 30 || v.respiratoryRate < 8)) triggers.push("Respiratory rate outside 8-30 /min");
    if (pain != null && pain >= 9) triggers.push("Pain score 9 or 10");
    return triggers;
  }, [assessment]);

  function assign(priority) {
    if (!selected) return;
    assessmentMutation.mutate({
      id: selected.id,
      payload: {
        priority,
        vitals: {
          bloodPressureSystolic: assessment.bloodPressureSystolic ? Number(assessment.bloodPressureSystolic) : null,
          bloodPressureDiastolic: assessment.bloodPressureDiastolic ? Number(assessment.bloodPressureDiastolic) : null,
          heartRate: assessment.heartRate ? Number(assessment.heartRate) : null,
          temperature: assessment.temperature ? Number(assessment.temperature) : null,
          respiratoryRate: assessment.respiratoryRate ? Number(assessment.respiratoryRate) : null,
          oxygenSaturation: assessment.oxygenSaturation ? Number(assessment.oxygenSaturation) : null,
        },
        symptoms: assessment.symptoms,
        painScore: assessment.painScore,
        severity: assessment.severity,
        notes: assessment.notes,
      },
    }, {
      onSuccess: () => {
        formDraft.clear();
        setAssessment(EMPTY_ASSESSMENT);
      },
    });
  }

  return (
    <section className="staff-module-page mx-auto min-h-[calc(100vh-7rem)] w-full max-w-[96rem] px-1 py-6 sm:py-8">
      {/* Page header */}
      <header className="surface-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
              <Stethoscope className="h-5 w-5" />
            </span>
            <div>
              <div className="eyebrow">Clinical intake</div>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Triage console
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Review waiting patients, capture vitals, and assign a severity lane.
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${liveMeta.className}`}
          >
            <Wifi className="h-3.5 w-3.5" />
            {liveMeta.label}
          </span>
        </div>

        {/* KPI row */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            icon={Users}
            accent="text-primary bg-primary/15"
            label="Awaiting triage"
            value={awaitingCount}
            detail={`${filteredTickets.length} shown in list`}
          />
          <KpiTile
            icon={Timer}
            accent="text-amber-500 bg-amber-500/15"
            label="Average wait"
            value={`${avgWait}m`}
            detail={`${longestWait}m longest wait`}
          />
          <KpiTile
            icon={MessageCircle}
            accent="text-emerald-500 bg-emerald-500/15"
            label="WhatsApp ready"
            value={whatsAppCount}
            detail="Can receive alerts"
          />
          <KpiTile
            icon={Activity}
            accent="text-sky-400 bg-sky-400/15"
            label="Red / Yellow"
            value={`${priorityCounts.red + priorityCounts.yellow}`}
            detail="High-priority cases waiting"
          />
        </div>

        {/* Priority mix */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border/60 bg-background/50 px-4 py-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Queue mix
          </span>
          {TRIAGE_PRIORITIES.map((priority) => (
            <span key={priority} className="inline-flex items-center gap-1.5 text-xs font-semibold">
              <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[priority]}`} />
              {PRIORITY_META[priority].short}
              <span className="tabular-nums text-muted-foreground">{priorityCounts[priority]}</span>
            </span>
          ))}
        </div>
      </header>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        {/* ── Waiting intake list ── */}
        <div className="surface-panel self-start">
          <PanelHeader
            icon={Users}
            title="Waiting intake"
            subtitle="Ordered by arrival — red and yellow escalate first"
            count={filteredTickets.length}
          />
          <div className="border-b border-border/60 px-5 py-3">
            <label className="relative block">
              <span className="sr-only">Search waiting patients</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by patient, ticket, complaint, or department"
                className="input-base h-9 pl-10 text-sm"
              />
            </label>
          </div>

          {ticketsQuery.isLoading ? (
            <LoadingPanel
              compact
              className="px-5 py-6"
              message="Fetching patients waiting for triage."
              surface={false}
              title="Loading queue"
            />
          ) : ticketsQuery.isError ? (
            <div className="px-5 py-6 text-sm text-destructive">
              {ticketsQuery.error.message}
            </div>
          ) : filteredTickets.length ? (
            <div className="divide-y divide-border/50">
              {filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  className={`w-full px-5 py-3.5 text-left transition-colors ${
                    selectedId === ticket.id
                      ? "border-l-2 border-l-primary bg-primary-soft/40"
                      : "border-l-2 border-l-transparent hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`inline-grid h-9 w-14 shrink-0 place-items-center rounded-lg font-display text-xs font-bold ${priorityChipClass[ticket.priority]}`}
                      >
                        {ticket.ticket}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{ticket.patientName}</div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {ticket.department}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold tabular-nums text-muted-foreground">
                      <Clock3 className="h-3 w-3" />
                      {ticket.waitMinutes}m
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {ticket.whatsApp ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <MessageCircle className="h-2.5 w-2.5" />
                        WhatsApp
                      </span>
                    ) : null}
                    {ticket.chiefComplaint ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {ticket.chiefComplaint}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              {tickets.length
                ? "No patients match the current search."
                : "No patients are currently waiting for triage."}
            </div>
          )}
        </div>

        {/* ── Selected patient work area ── */}
        <div className="surface-panel">
          {selected ? (
            <>
              {/* Patient header */}
              <div className="border-b border-border/60 px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`inline-grid h-11 w-[4.25rem] shrink-0 place-items-center rounded-xl font-display text-base font-bold ${priorityChipClass[selected.priority]}`}
                    >
                      {selected.ticket}
                    </span>
                    <div>
                      <div className="eyebrow">Selected patient</div>
                      <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
                        {selected.patientName}
                      </h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {selected.department} · registered {formatTime(selected.registeredAt)} · {selected.waitMinutes}m waiting · {selected.whatsApp ? "WhatsApp" : "Walk-in"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${priorityChipClass[selected.priority]}`}
                  >
                    {PRIORITY_META[selected.priority].short}
                  </span>
                </div>
              </div>

              <div className="px-5 py-5 sm:px-6">
                {/* Chief complaint */}
                <div className="rounded-xl border border-border/60 bg-background/50 px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Chief complaint
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-foreground">
                    {selected.chiefComplaint || "No chief complaint recorded yet."}
                  </p>
                </div>

                {/* Previous assessment */}
                {selected.triageAssessment ? (
                  <div className="mt-4 rounded-xl border border-primary/20 bg-primary-soft/30 px-4 py-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Previous assessment
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {selected.triageAssessment.vitals?.bloodPressureSystolic ? (
                        <VitalChip label="BP" value={`${selected.triageAssessment.vitals.bloodPressureSystolic}/${selected.triageAssessment.vitals.bloodPressureDiastolic}`} />
                      ) : null}
                      {selected.triageAssessment.vitals?.heartRate ? (
                        <VitalChip label="HR" value={`${selected.triageAssessment.vitals.heartRate} bpm`} />
                      ) : null}
                      {selected.triageAssessment.vitals?.temperature ? (
                        <VitalChip label="Temp" value={`${selected.triageAssessment.vitals.temperature}°C`} />
                      ) : null}
                      {selected.triageAssessment.vitals?.respiratoryRate ? (
                        <VitalChip label="RR" value={`${selected.triageAssessment.vitals.respiratoryRate}/min`} />
                      ) : null}
                      {selected.triageAssessment.vitals?.oxygenSaturation ? (
                        <VitalChip label="SpO₂" value={`${selected.triageAssessment.vitals.oxygenSaturation}%`} />
                      ) : null}
                      {selected.triageAssessment.painScore != null ? (
                        <VitalChip label="Pain" value={`${selected.triageAssessment.painScore}/10`} />
                      ) : null}
                    </div>
                    {selected.triageAssessment.symptoms ? (
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {selected.triageAssessment.symptoms}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                      {selected.triageAssessment.severity ? (
                        <span>
                          Severity: <span className="font-semibold capitalize">{selected.triageAssessment.severity}</span>
                        </span>
                      ) : null}
                      <span>
                        Assessed {new Date(selected.triageAssessment.assessedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Vitals intake */}
                <div className="mt-5">
                  <SectionLabel
                    icon={Activity}
                    title="Vitals"
                    subtitle="Captured values feed the emergency fast-track check below"
                  />
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <TriageField label="BP Systolic" unit="mmHg">
                      <input type="number" value={assessment.bloodPressureSystolic} onChange={(e) => updateAssessment("bloodPressureSystolic", e.target.value)} placeholder="120" className="input-base h-9 text-sm" />
                    </TriageField>
                    <TriageField label="BP Diastolic" unit="mmHg">
                      <input type="number" value={assessment.bloodPressureDiastolic} onChange={(e) => updateAssessment("bloodPressureDiastolic", e.target.value)} placeholder="80" className="input-base h-9 text-sm" />
                    </TriageField>
                    <TriageField label="Heart rate" unit="bpm">
                      <input type="number" value={assessment.heartRate} onChange={(e) => updateAssessment("heartRate", e.target.value)} placeholder="72" className="input-base h-9 text-sm" />
                    </TriageField>
                    <TriageField label="Temperature" unit="°C">
                      <input type="number" step="0.1" value={assessment.temperature} onChange={(e) => updateAssessment("temperature", e.target.value)} placeholder="36.8" className="input-base h-9 text-sm" />
                    </TriageField>
                    <TriageField label="Resp rate" unit="/min">
                      <input type="number" value={assessment.respiratoryRate} onChange={(e) => updateAssessment("respiratoryRate", e.target.value)} placeholder="16" className="input-base h-9 text-sm" />
                    </TriageField>
                    <TriageField label="SpO₂" unit="%">
                      <input type="number" value={assessment.oxygenSaturation} onChange={(e) => updateAssessment("oxygenSaturation", e.target.value)} placeholder="98" className="input-base h-9 text-sm" />
                    </TriageField>
                  </div>

                  <div className="mt-4">
                    <TriageField label="Symptoms & observations" full>
                      <textarea value={assessment.symptoms} onChange={(e) => updateAssessment("symptoms", e.target.value)} rows={2} placeholder="Presenting symptoms, visible distress, relevant history…" className="input-base resize-none text-sm" />
                    </TriageField>
                  </div>

                  <div className="mt-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Pain score (0–10)
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {[0,1,2,3,4,5,6,7,8,9,10].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => updateAssessment("painScore", score)}
                          className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                            assessment.painScore === score
                              ? score >= 7 ? "bg-red-500 text-white" : score >= 4 ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                              : "border border-border/70 bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                      <span className="ml-2 text-[10px] text-muted-foreground">No pain — severe</span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <TriageField label="Severity assessment">
                      <select value={assessment.severity} onChange={(e) => updateAssessment("severity", e.target.value)} className="input-base h-9 text-sm">
                        <option value="">Select severity…</option>
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                        <option value="critical">Critical</option>
                        <option value="life-threatening">Life-threatening</option>
                      </select>
                    </TriageField>
                    <TriageField label="Clinical notes">
                      <textarea value={assessment.notes} onChange={(e) => updateAssessment("notes", e.target.value)} rows={1} placeholder="Allergies, medications, notes…" className="input-base resize-none text-sm" />
                    </TriageField>
                  </div>
                </div>

                {/* Emergency fast-track */}
                {liveEmergencyTriggers.length > 0 ? (
                  <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <Siren className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-500" />
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-red-500">
                          Emergency fast-track triggered
                        </div>
                        <p className="mt-1 text-xs leading-5 text-red-600/90">
                          Vitals indicate a critical condition — this patient will be
                          auto-classified <strong>Red</strong> on assignment.
                        </p>
                        <ul className="mt-2 space-y-1">
                          {liveEmergencyTriggers.map((t) => (
                            <li key={t} className="flex items-center gap-1.5 text-[11px] text-red-600/80">
                              <AlertTriangle className="h-3 w-3" /> {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Assign severity */}
                <div className="mt-6">
                  <SectionLabel
                    icon={ShieldAlert}
                    title="Assign severity"
                    subtitle="The queue reroutes immediately after assignment"
                  />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {TRIAGE_PRIORITIES.map((priority) => {
                      const meta = PRIORITY_META[priority];
                      const isCurrent = selected.priority === priority;
                      const isPending =
                        assessmentMutation.isPending &&
                        assessmentMutation.variables?.id === selected.id &&
                        assessmentMutation.variables?.payload?.priority === priority;

                      return (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => assign(priority)}
                          disabled={assessmentMutation.isPending}
                          className={`group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all disabled:opacity-70 ${
                            isCurrent ? "border-foreground/40" : "border-transparent"
                          } ${priorityChipClass[priority]}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-display text-sm font-bold uppercase tracking-[0.2em]">
                                {meta.short}
                              </div>
                              <div className="mt-0.5 text-xs font-semibold opacity-90">
                                {meta.label}
                              </div>
                            </div>
                            {isPending ? (
                              <LoaderCircle className="h-4 w-4 animate-spin opacity-85" />
                            ) : isCurrent ? (
                              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                                Current
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2.5 text-xs leading-5 opacity-85">
                            {meta.description}
                          </p>
                          <div className="mt-3 rounded-lg border border-current/15 bg-black/5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                            Route to {meta.destination}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Feedback */}
                {assessmentMutation.data?.triageAssessment ? (
                  <div className="mt-4 rounded-xl border border-primary/25 bg-primary-soft/40 px-4 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Assessment saved
                    </div>
                    {assessmentMutation.data.triageAssessment.emergencyTriggers?.length > 0 ? (
                      <p className="mt-1.5 text-xs font-semibold text-red-500">
                        Auto-classified as Red: {assessmentMutation.data.triageAssessment.emergencyTriggers.join(", ")}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Priority set to {assessmentMutation.data.priority}. Vitals and assessment recorded.
                      </p>
                    )}
                    {assessmentMutation.data.triageAssessment.autoClassified ? (
                      <p className="mt-1 text-[11px] text-amber-600">
                        Escalation alert broadcast to connected staff dashboards.
                      </p>
                    ) : null}
                    {selected.department !== assessmentMutation.data.department ? (
                      <p className="mt-1 text-[11px] text-primary">
                        Auto-rerouted from {selected.department} to {assessmentMutation.data.department}.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {assessmentMutation.isError ? (
                  <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {assessmentMutation.error.message}
                  </div>
                ) : null}

                <PrescriptionPanel ticketId={selected.id} />
                <TestOrderPanel ticketId={selected.id} />
                <RoutingSuggestionBanner ticketId={selected.id} />
              </div>
            </>
          ) : (
            <div className="grid min-h-[24rem] place-items-center px-6 text-center">
              <div className="max-w-sm">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold tracking-tight">
                  No patient selected
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Choose a patient from the waiting intake list to open the triage
                  work panel.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Building blocks ---------- */

function PanelHeader({ icon: Icon, title, subtitle, count }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-base font-bold">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {typeof count === "number" ? (
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold tabular-nums">
          {count}
        </span>
      ) : null}
    </div>
  );
}

function KpiTile({ icon: Icon, accent, label, value, detail }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/50 px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${accent}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-display text-2xl font-bold tabular-nums tracking-tight">
          {value}
        </span>
      </div>
      <div className="mt-2.5 text-xs font-semibold">{label}</div>
      {detail ? (
        <div className="mt-0.5 text-[11px] text-muted-foreground">{detail}</div>
      ) : null}
    </div>
  );
}

function SectionLabel({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div>
        <div className="text-sm font-bold">{title}</div>
        {subtitle ? (
          <div className="text-[11px] text-muted-foreground">{subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}

function VitalChip({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/70 px-2 py-1 text-[11px]">
      <span className="font-semibold text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </span>
  );
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

function TriageField({ label, unit, full, children }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? "sm:col-span-3" : ""}`}>
      <span className="flex items-baseline justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
        {unit ? <span className="font-medium normal-case tracking-normal">{unit}</span> : null}
      </span>
      {children}
    </label>
  );
}

function PrescriptionPanel({ ticketId }) {
  const { refreshToken } = useLiveRefresh();
  const [items, setItems] = useState([{ drugName: "", dosage: "", quantity: "", instructions: "" }]);
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loader = useCallback(() => fetchPrescriptionsForTicket(ticketId), [ticketId]);
  const query = useApiResource(loader, { enabled: isBrowser && !!ticketId, refreshToken });

  const createMut = useApiAction(
    ({ id, payload }) => createPrescription(id, payload),
    {
      onSuccess: () => {
        query.refetch();
        setShowForm(false);
        setItems([{ drugName: "", dosage: "", quantity: "", instructions: "" }]);
        setNotes("");
      },
    },
  );

  function updateItem(idx, key, value) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { drugName: "", dosage: "", quantity: "", instructions: "" }]);
  }

  function removeItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function submit() {
    const valid = items.filter((it) => it.drugName.trim());
    if (valid.length === 0) return;
    createMut.mutate({ id: ticketId, payload: { items: valid, notes } });
  }

  const prescriptions = query.data ?? [];

  return (
    <div className="mt-5 border-t border-border/60 pt-5">
      <div className="flex items-center justify-between">
        <SectionLabel
          icon={Pill}
          title="Prescriptions"
          subtitle="Pharmacy orders for this visit"
        />
        {prescriptions.length ? (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold tabular-nums">
            {prescriptions.length}
          </span>
        ) : null}
      </div>

      {prescriptions.length > 0 && (
        <div className="mt-3 space-y-2">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="rounded-lg border border-border/60 bg-background/50 px-3.5 py-2.5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {rx.state}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(rx.createdAt).toLocaleString()}
                </span>
              </div>
              <ul className="mt-2 space-y-0.5">
                {rx.items?.map((item) => (
                  <li key={item.id} className="text-xs">
                    <span className="font-medium">{item.drugName}</span>
                    {" — "}{item.dosage}
                    {item.quantity && ` (${item.quantity})`}
                  </li>
                ))}
              </ul>
              {rx.notes ? (
                <p className="mt-1 text-[10px] italic text-muted-foreground">&ldquo;{rx.notes}&rdquo;</p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="mt-3 space-y-2.5">
          {items.map((item, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_0.5fr_0.5fr_auto]">
              <input
                type="text"
                placeholder="Drug name"
                value={item.drugName}
                onChange={(e) => updateItem(idx, "drugName", e.target.value)}
                className="input-base h-9 text-sm"
              />
              <input
                type="text"
                placeholder="Dosage"
                value={item.dosage}
                onChange={(e) => updateItem(idx, "dosage", e.target.value)}
                className="input-base h-9 text-sm"
              />
              <input
                type="text"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                className="input-base h-9 text-sm"
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="h-9 rounded-lg border border-border px-2 text-xs text-muted-foreground hover:bg-muted"
              >
                Remove
              </button>
              <input
                type="text"
                placeholder="Instructions (e.g. Take 1 tablet 3x daily)"
                value={item.instructions}
                onChange={(e) => updateItem(idx, "instructions", e.target.value)}
                className="input-base h-9 text-sm sm:col-span-4"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted"
          >
            + Add item
          </button>
          <input
            type="text"
            placeholder="Prescription notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-base h-9 text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={createMut.isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg gradient-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {createMut.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Create prescription
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </div>
          {createMut.isError && (
            <p className="text-xs text-destructive">{createMut.error.message}</p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary hover:bg-primary/15"
        >
          <Pill className="h-4 w-4" />
          New prescription
        </button>
      )}
    </div>
  );
}

const TEST_TYPE_OPTIONS = [
  { value: "blood-count", label: "Full Blood Count" },
  { value: "urinalysis", label: "Urinalysis" },
  { value: "blood-glucose", label: "Blood Glucose" },
  { value: "malaria-smear", label: "Malaria Smear" },
  { value: "hiv-test", label: "HIV Test" },
  { value: "tb-sputum", label: "TB Sputum" },
  { value: "x-ray-chest", label: "Chest X-Ray" },
  { value: "ultrasound", label: "Ultrasound" },
  { value: "ct-scan", label: "CT Scan" },
  { value: "other", label: "Other" },
];

function TestOrderPanel({ ticketId }) {
  const { refreshToken } = useLiveRefresh();
  const [testType, setTestType] = useState("");
  const [priority, setPriority] = useState("routine");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loader = useCallback(() => fetchTestOrdersForTicket(ticketId), [ticketId]);
  const query = useApiResource(loader, { enabled: isBrowser && !!ticketId, refreshToken });

  const createMut = useApiAction(
    ({ id, payload }) => createTestOrder(id, payload),
    {
      onSuccess: () => {
        query.refetch();
        setShowForm(false);
        setTestType("");
        setPriority("routine");
        setNotes("");
      },
    },
  );

  function submit() {
    if (!testType) return;
    createMut.mutate({ id: ticketId, payload: { testType, priority, notes } });
  }

  const orders = query.data ?? [];

  return (
    <div className="mt-5 border-t border-border/60 pt-5">
      <div className="flex items-center justify-between">
        <SectionLabel
          icon={FlaskConical}
          title="Test orders"
          subtitle="Laboratory & radiology requests"
        />
        {orders.length ? (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold tabular-nums">
            {orders.length}
          </span>
        ) : null}
      </div>

      {orders.length > 0 && (
        <div className="mt-3 space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="rounded-lg border border-border/60 bg-background/50 px-3.5 py-2.5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {order.state}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(order.orderedAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium">
                {TEST_TYPE_OPTIONS.find((t) => t.value === order.testType)?.label ?? order.testType}
              </p>
              {order.priority !== "routine" && (
                <span className="mt-1 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                  {order.priority}
                </span>
              )}
              {order.notes ? (
                <p className="mt-1 text-[10px] italic text-muted-foreground">&ldquo;{order.notes}&rdquo;</p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="mt-3 space-y-2.5">
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            className="input-base h-9 text-sm"
          >
            <option value="">Select test type…</option>
            {TEST_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="input-base h-9 text-sm"
          >
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="stat">STAT</option>
          </select>
          <input
            type="text"
            placeholder="Order notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-base h-9 text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={createMut.isPending || !testType}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg gradient-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {createMut.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Create test order
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </div>
          {createMut.isError && (
            <p className="text-xs text-destructive">{createMut.error.message}</p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary hover:bg-primary/15"
        >
          <FlaskConical className="h-4 w-4" />
          New test order
        </button>
      )}
    </div>
  );
}

const ROUTE_PRIORITY_STYLES = {
  high: "border-primary/40 bg-primary/10 text-primary",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  low: "border-zinc-500/30 bg-zinc-500/10 text-muted-foreground",
};

function RoutingSuggestionBanner({ ticketId }) {
  const { refreshToken } = useLiveRefresh();
  const loader = useCallback(() => fetchNextRoute(ticketId), [ticketId]);
  const query = useApiResource(loader, { enabled: isBrowser && !!ticketId, refreshToken });

  const data = query.data;
  if (!data || data.suggestions.length === 0) return null;

  return (
    <div className="mt-5 border-t border-border/60 pt-5">
      <SectionLabel
        icon={Navigation}
        title="Suggested next route"
        subtitle="Based on complaint and department rules"
      />
      <div className="mt-3 space-y-2">
        {data.suggestions.map((s, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${ROUTE_PRIORITY_STYLES[s.priority] ?? ROUTE_PRIORITY_STYLES.low}`}
          >
            <div>
              <span className="font-display text-sm font-bold">{s.department}</span>
              <p className="text-xs opacity-80">{s.reason}</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide">{s.priority}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
