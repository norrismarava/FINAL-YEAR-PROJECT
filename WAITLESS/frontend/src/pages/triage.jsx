import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
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

  const [assessment, setAssessment] = useState({
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
  });

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
  const departmentCounts = tickets.reduce((accumulator, ticket) => {
    accumulator[ticket.department] = (accumulator[ticket.department] ?? 0) + 1;
    return accumulator;
  }, {});
  const busiestDepartmentEntry = Object.entries(departmentCounts).sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  )[0];
  const busiestDepartment = busiestDepartmentEntry?.[0] ?? "No queue yet";
  const priorityCounts = TRIAGE_PRIORITIES.reduce((accumulator, priority) => {
    accumulator[priority] = tickets.filter((ticket) => ticket.priority === priority).length;
    return accumulator;
  }, {});
  const activeAssignTarget = assignMutation.variables ?? null;

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
        setAssessment({
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
        });
      },
    });
  }

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl">
        <header className="surface-panel page-section-rise p-6 sm:p-8">
        <div className="relative grid gap-6 xl:grid-cols-[1.2fr_0.85fr]">
          <div>
            <div className="eyebrow">Clinical intake</div>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Triage console
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Review incoming patients, assign the correct severity colour, and let
                  the queue auto-route them into the right clinical lane.
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${liveMeta.className}`}
              >
                <Wifi className="h-3.5 w-3.5" />
                {liveMeta.label}
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <OverviewTile
                label="Awaiting triage"
                value={awaitingCount}
                detail={`${filteredTickets.length} shown in the active list`}
              />
              <OverviewTile
                label="Average wait"
                value={`${avgWait}m`}
                detail={`${longestWait}m is the longest current wait`}
              />
              <OverviewTile
                label="WhatsApp ready"
                value={whatsAppCount}
                detail="Patients can receive near-turn and call-up alerts"
              />
              <OverviewTile
                label="Most pressure"
                value={busiestDepartment}
                detail="Department with the largest waiting intake"
              />
            </div>
          </div>

          <div className="surface-panel-dark p-5 sm:p-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-foreground/70">
              Queue mix
            </div>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-primary-foreground">
                  Triage protocol reminder
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-primary-foreground/80">
                  Red and yellow cases should be escalated immediately. Green stays in
                  the ambulant flow, while black routes to holding procedures.
                </p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-primary-foreground/85">
                {awaitingCount} in flow
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {TRIAGE_PRIORITIES.map((priority) => (
                <ProtocolCountCard
                  key={priority}
                  priority={priority}
                  count={priorityCounts[priority]}
                />
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/12 bg-white/10 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary-foreground/80" />
                <div>
                  <div className="font-semibold text-primary-foreground">
                    Auto-routing stays active
                  </div>
                  <p className="mt-1 text-sm leading-6 text-primary-foreground/80">
                    Once a priority is assigned, the ticket keeps its place in the live
                    system and updates the board, tracker, and staff dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr] page-section-rise page-section-rise-delay-1">
          <div className="space-y-6">
          <article className="surface-panel overflow-hidden">
            <div className="border-b border-border/70 px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="eyebrow">Waiting intake</div>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
                    Awaiting triage list
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Search by ticket, patient, department, or complaint to jump to the
                    right case quickly.
                  </p>
                </div>
                <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  {filteredTickets.length} visible
                </span>
              </div>

              <label className="mt-5 block">
                <span className="sr-only">Search waiting patients</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by patient, ticket, complaint, or department"
                    className="input-base pl-10"
                  />
                </div>
              </label>
            </div>

            {ticketsQuery.isLoading ? (
              <LoadingPanel
                compact
                className="px-5 py-6 sm:px-6"
                message="Fetching patients waiting for triage."
                surface={false}
                title="Loading queue"
              />
            ) : ticketsQuery.isError ? (
              <div className="px-5 py-6 text-sm text-destructive sm:px-6">
                {ticketsQuery.error.message}
              </div>
            ) : filteredTickets.length ? (
              <div className="space-y-3 px-4 py-4 sm:px-6">
                {filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedId(ticket.id)}
                    className={`surface-hover-card group w-full rounded-2xl border px-4 py-4 text-left ${
                      selectedId === ticket.id
                        ? "border-primary/20 bg-primary-soft/55 shadow-card"
                        : "border-border/70 bg-background/80 hover:border-primary/15 hover:bg-primary-soft/25"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={`inline-grid h-10 w-16 place-items-center rounded-xl font-display text-sm font-bold ${priorityChipClass[ticket.priority]}`}
                        >
                          {ticket.ticket}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{ticket.patientName}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {ticket.department}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1" />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <QueueChip icon={Timer} label={`${ticket.waitMinutes}m waiting`} />
                      <QueueChip
                        icon={MessageCircle}
                        label={ticket.whatsApp ? "WhatsApp on" : "Walk-in"}
                      />
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {ticket.chiefComplaint || "No chief complaint recorded yet."}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-5 py-6 text-sm text-muted-foreground sm:px-6">
                {tickets.length
                  ? "No patients match the current search."
                  : "No patients are currently waiting for triage."}
              </div>
            )}
          </article>

            <article className="surface-panel page-section-rise page-section-rise-delay-2 p-6">
            <div className="eyebrow">Protocol guide</div>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
              Colour lanes at a glance
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {TRIAGE_PRIORITIES.map((priority) => (
                <ProtocolGuideCard key={priority} priority={priority} />
              ))}
            </div>
            </article>
          </div>

          <article className="surface-panel page-section-rise page-section-rise-delay-2 p-6 sm:p-8">
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="eyebrow">Selected patient</div>
                  <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
                    {selected.patientName}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Ticket {selected.ticket} in {selected.department}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${priorityChipClass[selected.priority]}`}
                >
                  Current: {PRIORITY_META[selected.priority].short}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <DetailCard label="Wait time" value={`${selected.waitMinutes}m`} />
                <DetailCard
                  label="Registered"
                  value={formatTime(selected.registeredAt)}
                />
                <DetailCard label="Department" value={selected.department} />
                <DetailCard
                  label="Contact channel"
                  value={selected.whatsApp ? "WhatsApp" : "Web / walk-in"}
                />
              </div>

              <div className="surface-panel-muted mt-6 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Chief complaint
                </div>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  {selected.chiefComplaint || "No chief complaint recorded yet."}
                </p>
              </div>

              {selected.triageAssessment ? (
                <div className="mt-6 rounded-2xl border border-primary/20 bg-primary-soft/30 px-5 py-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Previous assessment
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {selected.triageAssessment.vitals?.bloodPressureSystolic ? (
                      <div className="text-sm"><span className="text-muted-foreground">BP:</span> <span className="font-semibold">{selected.triageAssessment.vitals.bloodPressureSystolic}/{selected.triageAssessment.vitals.bloodPressureDiastolic} mmHg</span></div>
                    ) : null}
                    {selected.triageAssessment.vitals?.heartRate ? (
                      <div className="text-sm"><span className="text-muted-foreground">HR:</span> <span className="font-semibold">{selected.triageAssessment.vitals.heartRate} bpm</span></div>
                    ) : null}
                    {selected.triageAssessment.vitals?.temperature ? (
                      <div className="text-sm"><span className="text-muted-foreground">Temp:</span> <span className="font-semibold">{selected.triageAssessment.vitals.temperature} C</span></div>
                    ) : null}
                    {selected.triageAssessment.vitals?.respiratoryRate ? (
                      <div className="text-sm"><span className="text-muted-foreground">RR:</span> <span className="font-semibold">{selected.triageAssessment.vitals.respiratoryRate}/min</span></div>
                    ) : null}
                    {selected.triageAssessment.vitals?.oxygenSaturation ? (
                      <div className="text-sm"><span className="text-muted-foreground">SpO2:</span> <span className="font-semibold">{selected.triageAssessment.vitals.oxygenSaturation}%</span></div>
                    ) : null}
                    {selected.triageAssessment.painScore != null ? (
                      <div className="text-sm"><span className="text-muted-foreground">Pain:</span> <span className="font-semibold">{selected.triageAssessment.painScore}/10</span></div>
                    ) : null}
                  </div>
                  {selected.triageAssessment.symptoms ? (
                    <p className="mt-3 text-sm text-muted-foreground">{selected.triageAssessment.symptoms}</p>
                  ) : null}
                  {selected.triageAssessment.severity ? (
                    <div className="mt-2 text-sm"><span className="text-muted-foreground">Severity:</span> <span className="font-semibold capitalize">{selected.triageAssessment.severity}</span></div>
                  ) : null}
                  {selected.triageAssessment.notes ? (
                    <p className="mt-2 text-sm text-muted-foreground">{selected.triageAssessment.notes}</p>
                  ) : null}
                  <p className="mt-3 text-xs text-muted-foreground">Assessed at {new Date(selected.triageAssessment.assessedAt).toLocaleString()}</p>
                </div>
              ) : null}

                            <div className="mt-6 surface-panel-muted px-5 py-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Triage assessment
                </div>
                <h3 className="mt-2 font-display text-xl font-bold tracking-tight">Clinical intake form</h3>
                <p className="mt-1 text-sm text-muted-foreground">Capture vitals, symptoms, and pain score before assigning severity.</p>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <TriageField label="BP Systolic (mmHg)">
                    <input type="number" value={assessment.bloodPressureSystolic} onChange={(e) => updateAssessment("bloodPressureSystolic", e.target.value)} placeholder="120" className="input-base" />
                  </TriageField>
                  <TriageField label="BP Diastolic (mmHg)">
                    <input type="number" value={assessment.bloodPressureDiastolic} onChange={(e) => updateAssessment("bloodPressureDiastolic", e.target.value)} placeholder="80" className="input-base" />
                  </TriageField>
                  <TriageField label="Heart Rate (bpm)">
                    <input type="number" value={assessment.heartRate} onChange={(e) => updateAssessment("heartRate", e.target.value)} placeholder="72" className="input-base" />
                  </TriageField>
                  <TriageField label="Temperature (C)">
                    <input type="number" step="0.1" value={assessment.temperature} onChange={(e) => updateAssessment("temperature", e.target.value)} placeholder="36.8" className="input-base" />
                  </TriageField>
                  <TriageField label="Resp Rate (/min)">
                    <input type="number" value={assessment.respiratoryRate} onChange={(e) => updateAssessment("respiratoryRate", e.target.value)} placeholder="16" className="input-base" />
                  </TriageField>
                  <TriageField label="SpO2 (%)">
                    <input type="number" value={assessment.oxygenSaturation} onChange={(e) => updateAssessment("oxygenSaturation", e.target.value)} placeholder="98" className="input-base" />
                  </TriageField>
                </div>

                <div className="mt-4">
                  <TriageField label="Symptoms and clinical observations" full>
                    <textarea value={assessment.symptoms} onChange={(e) => updateAssessment("symptoms", e.target.value)} rows={3} placeholder="Describe presenting symptoms, visible distress, relevant history..." className="input-base resize-none" />
                  </TriageField>
                </div>

                <div className="mt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Pain score (0-10)</div>
                  <div className="mt-3 flex items-center gap-2">
                    {[0,1,2,3,4,5,6,7,8,9,10].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => updateAssessment("painScore", score)}
                        className={`h-10 w-10 rounded-lg text-sm font-bold transition-all ${
                          assessment.painScore === score
                            ? score >= 7 ? "bg-red-500 text-white" : score >= 4 ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                            : "border border-border/70 bg-background/80 text-muted-foreground hover:bg-muted"
                        }`}
                      >{score}</button>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                    <span>No pain</span><span>Moderate</span><span>Severe</span>
                  </div>
                </div>

                <div className="mt-4">
                  <TriageField label="Severity assessment" full>
                    <select value={assessment.severity} onChange={(e) => updateAssessment("severity", e.target.value)} className="input-base h-9 text-sm">
                      <option value="">Select severity…</option>
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                      <option value="critical">Critical</option>
                      <option value="life-threatening">Life-threatening</option>
                    </select>
                  </TriageField>
                </div>

                <div className="mt-4">
                  <TriageField label="Clinical notes" full>
                    <textarea value={assessment.notes} onChange={(e) => updateAssessment("notes", e.target.value)} rows={2} placeholder="Additional clinical notes, allergies, medications..." className="input-base resize-none" />
                  </TriageField>
                </div>
              </div>

              {liveEmergencyTriggers.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <Siren className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <div>
                      <div className="font-display text-sm font-bold uppercase tracking-[0.2em] text-red-500">Emergency fast-track triggered</div>
                      <p className="mt-1 text-sm text-red-600/90">Vital signs indicate a critical condition. This patient will be auto-classified as <strong>Red</strong> on assignment.</p>
                      <ul className="mt-2 space-y-1">
                        {liveEmergencyTriggers.map((t) => (
                          <li key={t} className="flex items-center gap-2 text-xs text-red-600/80"><AlertTriangle className="h-3 w-3" /> {t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}

              {assessmentMutation.data?.triageAssessment ? (
                <div className="mt-4 rounded-2xl border border-primary/20 bg-primary-soft/30 px-5 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Assessment saved</div>
                  {assessmentMutation.data.triageAssessment.emergencyTriggers?.length > 0 ? (
                    <p className="mt-2 text-sm font-semibold text-red-500">Auto-classified as Red due to: {assessmentMutation.data.triageAssessment.emergencyTriggers.join(", ")}</p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">Priority set to {assessmentMutation.data.priority}. Vitals and assessment recorded.</p>
                  )}
                  {assessmentMutation.data.triageAssessment.autoClassified ? (
                    <p className="mt-1 text-xs text-amber-600">Escalation alert broadcast to all connected staff dashboards.</p>
                  ) : null}
                  {selected.department !== assessmentMutation.data.department ? (
                    <p className="mt-1 text-xs text-primary">Department auto-rerouted from {selected.department} to {assessmentMutation.data.department} based on chief complaint.</p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="eyebrow">Assign severity</div>
                    <h3 className="mt-2 font-display text-2xl font-bold tracking-tight">
                      Triage decision panel
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Choose the lane that best matches the patient&apos;s condition.
                      The queue will reroute immediately after assignment.
                    </p>
                  </div>
                  <Stethoscope className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
                        className={`surface-hover-card group rounded-3xl border-2 p-5 text-left disabled:translate-y-0 disabled:opacity-70 ${
                          isCurrent ? "border-foreground/40" : "border-transparent"
                        } ${priorityChipClass[priority]}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-display text-base font-bold uppercase tracking-[0.22em]">
                              {meta.short}
                            </div>
                            <div className="mt-1 text-sm font-semibold opacity-95">
                              {meta.label}
                            </div>
                          </div>
                          {isPending ? (
                            <LoaderCircle className="h-4 w-4 animate-spin opacity-85" />
                          ) : (
                            <Stethoscope className="h-5 w-5 opacity-80" />
                          )}
                        </div>

                        <p className="mt-4 text-sm leading-6 opacity-90">
                          {meta.description}
                        </p>
                        <div className="mt-4 rounded-2xl border border-current/15 bg-black/5 px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em]">
                          Route to {meta.destination}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="surface-panel-muted px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Auto-routing
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    If you keep this patient in{" "}
                    <span className="font-semibold text-foreground">
                      {PRIORITY_META[selected.priority].short}
                    </span>
                    , WaitLess will continue routing them to{" "}
                    <span className="font-semibold text-foreground">
                      {PRIORITY_META[selected.priority].destination}
                    </span>
                    .
                  </p>
                </div>

                <div className="surface-panel-muted px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Handoff reminder
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Confirm the complaint, observe distress level, and escalate red or
                    yellow cases immediately rather than allowing them to remain in the
                    routine waiting flow.
                  </p>
                </div>
              </div>

              {assessmentMutation.isError && (
                <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {assessmentMutation.error.message}
                </div>
              )}

              <PrescriptionPanel ticketId={selected.id} />
              <TestOrderPanel ticketId={selected.id} />
              <RoutingSuggestionBanner ticketId={selected.id} />
            </>
          ) : (
            <div className="grid min-h-[22rem] place-items-center text-center">
              <div className="max-w-md">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">
                  No patient selected
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Choose a patient from the waiting intake list to open the triage
                  decision panel.
                </p>
              </div>
            </div>
          )}
          </article>
        </div>
      </div>
    </section>
  );
}


function OverviewTile({ label, value, detail }) {
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

function ProtocolCountCard({ priority, count }) {
  const meta = PRIORITY_META[priority];

  return (
    <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-4">
      <div
        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${priorityChipClass[priority]}`}
      >
        {meta.short}
      </div>
      <div className="mt-3 font-display text-3xl font-bold tracking-tight text-primary-foreground">
        {count}
      </div>
      <div className="mt-1 text-xs text-primary-foreground/72">{meta.destination}</div>
    </div>
  );
}

function QueueChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function ProtocolGuideCard({ priority }) {
  const meta = PRIORITY_META[priority];

  return (
    <div className="surface-panel-muted surface-hover-card px-4 py-4">
      <div
        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${priorityChipClass[priority]}`}
      >
        {meta.short}
      </div>
      <div className="mt-3 font-display text-lg font-bold tracking-tight">
        {meta.label}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{meta.description}</p>
      <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Route to {meta.destination}
      </div>
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <div className="surface-panel-muted px-4 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
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

function TriageField({ label, full, children }) {
  return (
    <label className={`flex flex-col gap-2 ${full ? "sm:col-span-3" : ""}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{label}</span>
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
    <div className="mt-6 surface-panel-muted px-5 py-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Prescriptions
          </div>
          <h3 className="mt-2 font-display text-xl font-bold tracking-tight">Pharmacy orders</h3>
        </div>
        <Pill className="h-5 w-5 text-muted-foreground" />
      </div>

      {prescriptions.length > 0 && (
        <div className="mt-4 space-y-2">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="rounded-lg border border-border bg-card px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-primary/10 text-primary">
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
              {rx.notes && <p className="mt-1 text-[10px] italic text-muted-foreground">"{rx.notes}"</p>}
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="mt-4 space-y-3">
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
                className="h-9 rounded-lg border border-border px-2 text-xs text-muted-foreground hover:bg-accent"
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addItem}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-accent"
            >
              + Add item
            </button>
          </div>
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
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createMut.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Create prescription
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm hover:bg-accent"
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
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-4 text-sm font-medium text-primary hover:bg-primary/15"
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
    <div className="mt-4 surface-panel-muted px-5 py-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Laboratory &amp; Radiology
          </div>
          <h3 className="mt-2 font-display text-xl font-bold tracking-tight">Test orders</h3>
        </div>
        <FlaskConical className="h-5 w-5 text-muted-foreground" />
      </div>

      {orders.length > 0 && (
        <div className="mt-4 space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="rounded-lg border border-border bg-card px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-primary/10 text-primary">
                  {order.state}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(order.orderedAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium">
                {TEST_TYPE_OPTIONS.find((t) => t.value === order.testType)?.label ?? order.testType}
              </p>
              {order.priority !== "routine" && (
                <span className="mt-1 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                  {order.priority}
                </span>
              )}
              {order.notes && <p className="mt-1 text-[10px] italic text-muted-foreground">"{order.notes}"</p>}
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="mt-4 space-y-3">
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
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createMut.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Create test order
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm hover:bg-accent"
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
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-4 text-sm font-medium text-primary hover:bg-primary/15"
        >
          <FlaskConical className="h-4 w-4" />
          New test order
        </button>
      )}
    </div>
  );
}

const PRIORITY_STYLES = {
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
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        <Navigation className="h-4 w-4" />
        Suggested next route
      </div>
      {data.suggestions.map((s, idx) => (
        <div
          key={idx}
          className={`flex items-center justify-between rounded-xl border px-4 py-3 ${PRIORITY_STYLES[s.priority] ?? PRIORITY_STYLES.low}`}
        >
          <div>
            <span className="font-display text-sm font-bold">{s.department}</span>
            <p className="text-xs opacity-80">{s.reason}</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wide">{s.priority}</span>
        </div>
      ))}
    </div>
  );
}
