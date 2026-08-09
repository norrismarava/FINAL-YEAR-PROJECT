import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findTicketById, updateTicket, listTickets } from "../repositories/queueRepository.js";

const STREAMS_FILE = fileURLToPath(
  new URL("../../data/oi-clinic-streams.json", import.meta.url),
);

export const OI_SERVICE_STREAMS = [
  {
    id: "art",
    label: "ART Review",
    description: "Antiretroviral therapy management and refill",
    typicalDurationMinutes: 15,
    requiresViralLoad: true,
  },
  {
    id: "tb",
    label: "TB Screening & Treatment",
    description: "Tuberculosis screening, sputum test, and treatment follow-up",
    typicalDurationMinutes: 20,
    requiresSputumTest: true,
  },
  {
    id: "viral-load",
    label: "Viral Load Monitoring",
    description: "CD4/viral load blood draw and result review",
    typicalDurationMinutes: 10,
    requiresLabTest: true,
  },
  {
    id: "counselling",
    label: "Counselling",
    description: "HIV counselling, adherence support, and psychosocial care",
    typicalDurationMinutes: 30,
  },
  {
    id: "screening",
    label: "General Screening",
    description: "Routine health screening (BP, glucose, STI, cancer screening)",
    typicalDurationMinutes: 15,
  },
];

const STREAM_STATES = {
  waiting: { label: "Waiting", color: "blue" },
  "in-session": { label: "In Session", color: "amber" },
  completed: { label: "Completed", color: "green" },
  referred: { label: "Referred", color: "purple" },
};

export function getServiceStreams() {
  return OI_SERVICE_STREAMS;
}

export function getStreamStates() {
  return STREAM_STATES;
}

let cachedVisits = null;

async function loadVisits() {
  if (cachedVisits) return cachedVisits;
  try {
    const raw = await fs.readFile(STREAMS_FILE, "utf8");
    cachedVisits = JSON.parse(raw);
  } catch {
    cachedVisits = [];
  }
  return cachedVisits;
}

async function saveVisits(visits) {
  cachedVisits = visits;
  const dir = path.dirname(STREAMS_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
  await fs.writeFile(STREAMS_FILE, JSON.stringify(visits, null, 2), "utf8");
}

export async function createOIClinicVisit({ ticketId, streamId, notes }, staff) {
  const ticket = await findTicketById(ticketId);
  if (!ticket) {
    return { ok: false, error: "Ticket not found" };
  }

  const stream = OI_SERVICE_STREAMS.find((s) => s.id === streamId);
  if (!stream) {
    return { ok: false, error: "Invalid service stream" };
  }

  const visits = await loadVisits();
  const visit = {
    id: crypto.randomUUID(),
    ticketId,
    ticketCode: ticket.ticket,
    patientName: ticket.patientName,
    department: ticket.department,
    streamId,
    streamLabel: stream.label,
    state: "waiting",
    notes: notes?.trim() ?? "",
    createdBy: staff ? { id: staff.id, name: staff.name, role: staff.role } : null,
    createdAt: new Date().toISOString(),
    stateHistory: [{ state: "waiting", at: new Date().toISOString(), actor: staff ? staff.name : "system" }],
    startedAt: null,
    completedAt: null,
    referredTo: null,
  };

  visits.push(visit);
  await saveVisits(visits);

  await updateTicket(ticketId, (t) => ({
    ...t,
    oiClinicVisit: { streamId, streamLabel: stream.label, visitId: visit.id },
  }));

  return { ok: true, visit };
}

export async function getOIClinicVisits(filters = {}) {
  let visits = await loadVisits();
  if (filters.streamId) {
    visits = visits.filter((v) => v.streamId === filters.streamId);
  }
  if (filters.state) {
    visits = visits.filter((v) => v.state === filters.state);
  }
  if (filters.ticketId) {
    visits = visits.filter((v) => v.ticketId === filters.ticketId);
  }
  return visits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function updateOIClinicVisitState(visitId, newState, options = {}, staff) {
  const visits = await loadVisits();
  const visit = visits.find((v) => v.id === visitId);
  if (!visit) {
    return { ok: false, error: "OI Clinic visit not found" };
  }

  if (!STREAM_STATES[newState]) {
    return { ok: false, error: "Invalid visit state" };
  }

  visit.state = newState;
  visit.stateHistory.push({
    state: newState,
    at: new Date().toISOString(),
    actor: staff ? staff.name : "system",
  });

  if (newState === "in-session" && !visit.startedAt) {
    visit.startedAt = new Date().toISOString();
  }
  if (newState === "completed") {
    visit.completedAt = new Date().toISOString();
  }
  if (newState === "referred" && options.referredTo) {
    visit.referredTo = options.referredTo;
  }

  await saveVisits(visits);
  return { ok: true, visit };
}

export async function getOIClinicSummary() {
  const visits = await loadVisits();
  const byStream = {};
  for (const stream of OI_SERVICE_STREAMS) {
    const streamVisits = visits.filter((v) => v.streamId === stream.id);
    byStream[stream.id] = {
      label: stream.label,
      total: streamVisits.length,
      waiting: streamVisits.filter((v) => v.state === "waiting").length,
      inSession: streamVisits.filter((v) => v.state === "in-session").length,
      completed: streamVisits.filter((v) => v.state === "completed").length,
      referred: streamVisits.filter((v) => v.state === "referred").length,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayVisits = visits.filter((v) => new Date(v.createdAt) >= today);

  return {
    total: visits.length,
    today: todayVisits.length,
    byStream,
    lastUpdatedAt: new Date().toISOString(),
  };
}
