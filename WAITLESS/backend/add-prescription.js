import { readFileSync, writeFileSync, existsSync } from "node:fs";

// 1. Add prescription states to queue.constants.js
const constFile = "c:\\Users\\norri\\Videos\\DIGITAL QUE SYSTEM\\WAITLESS\\backend\\src\\modules\\queue\\queue.constants.js";
let constContent = readFileSync(constFile, "utf-8");

const prescriptionConstants = `

export const PRESCRIPTION_STATES = {
  prescribed: {
    label: "Prescribed",
    description: "Medication prescribed by doctor, awaiting pharmacy review",
  },
  dispensing: {
    label: "Dispensing",
    description: "Pharmacy is preparing the medication",
  },
  ready: {
    label: "Ready for Collection",
    description: "Medication ready for patient collection",
  },
  collected: {
    label: "Collected",
    description: "Medication collected by patient",
  },
  cancelled: {
    label: "Cancelled",
    description: "Prescription cancelled",
  },
};

export const PRESCRIPTION_STATE_ORDER = [
  "prescribed",
  "dispensing",
  "ready",
  "collected",
];

export function canTransitionPrescriptionState(from, to) {
  if (from === "cancelled") return false;
  if (from === "collected") return false;
  if (to === "cancelled") return true;
  const fromIdx = PRESCRIPTION_STATE_ORDER.indexOf(from);
  const toIdx = PRESCRIPTION_STATE_ORDER.indexOf(to);
  return toIdx >= 0 && toIdx > fromIdx;
}
`;

if (!constContent.includes("PRESCRIPTION_STATES")) {
  constContent += prescriptionConstants;
  writeFileSync(constFile, constContent, "utf-8");
  console.log("Prescription constants added");
} else {
  console.log("Prescription constants already exist");
}

// 2. Add prescription repository functions to fileQueueRepository.js
const repoFile = "c:\\Users\\norri\\Videos\\DIGITAL QUE SYSTEM\\WAITLESS\\backend\\src\\repositories\\fileQueueRepository.js";
let repoContent = readFileSync(repoFile, "utf-8");

// Add prescriptions to state
if (!repoContent.includes("prescriptions:")) {
  repoContent = repoContent.replace(
    "  notifications: [],\n  nextNotificationSequence: INITIAL_NOTIFICATION_SEQUENCE,\n  ready: false,",
    "  notifications: [],\n  nextNotificationSequence: INITIAL_NOTIFICATION_SEQUENCE,\n  prescriptions: [],\n  nextPrescriptionSequence: 1,\n  ready: false,",
  );
  
  repoContent = repoContent.replace(
    "    nextNotificationSequence: INITIAL_NOTIFICATION_SEQUENCE,\n  };",
    "    nextNotificationSequence: INITIAL_NOTIFICATION_SEQUENCE,\n    prescriptions: [],\n    nextPrescriptionSequence: 1,\n  };",
  );

  // Add prescription functions at end of file
  const prescriptionRepoFns = `
export function listPrescriptions() {
  assertReady();
  return state.prescriptions.map((p) => ({ ...p }));
}

export function findPrescriptionById(id) {
  assertReady();
  return state.prescriptions.find((p) => p.id === id) ?? null;
}

export function findPrescriptionsByTicketId(ticketId) {
  assertReady();
  return state.prescriptions.filter((p) => p.ticketId === ticketId).map((p) => ({ ...p }));
}

export function createPrescription(prescription) {
  assertReady();
  const created = { ...prescription, id: crypto.randomUUID() };
  state.prescriptions.push(created);
  persistState();
  return { ...created };
}

export function updatePrescription(id, updater) {
  assertReady();
  const idx = state.prescriptions.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const updated = updater({ ...state.prescriptions[idx] });
  state.prescriptions[idx] = updated;
  persistState();
  return { ...updated };
}
`;

  repoContent += prescriptionRepoFns;
  writeFileSync(repoFile, repoContent, "utf-8");
  console.log("Prescription repository functions added");
} else {
  console.log("Prescription repository functions already exist");
}

// 3. Add prescription functions to queueRepository.js (the dispatcher)
const queueRepoFile = "c:\\Users\\norri\\Videos\\DIGITAL QUE SYSTEM\\WAITLESS\\backend\\src\\repositories\\queueRepository.js";
let queueRepoContent = readFileSync(queueRepoFile, "utf-8");

if (!queueRepoContent.includes("listPrescriptions")) {
  const prescriptionExports = `
export function listPrescriptions() {
  return getRepository().listPrescriptions();
}

export function findPrescriptionById(id) {
  return getRepository().findPrescriptionById(id);
}

export function findPrescriptionsByTicketId(ticketId) {
  return getRepository().findPrescriptionsByTicketId(ticketId);
}

export function createPrescription(prescription) {
  return getRepository().createPrescription(prescription);
}

export function updatePrescription(id, updater) {
  return getRepository().updatePrescription(id, updater);
}
`;

  queueRepoContent += prescriptionExports;
  writeFileSync(queueRepoFile, queueRepoContent, "utf-8");
  console.log("Queue repository dispatcher updated");
} else {
  console.log("Queue repository already has prescription functions");
}

// 4. Add prescription service functions to queueService.js
const svcFile = "c:\\Users\\norri\\Videos\\DIGITAL QUE SYSTEM\\WAITLESS\\backend\\src\\services\\queueService.js";
let svcContent = readFileSync(svcFile, "utf-8");

if (!svcContent.includes("createPrescription")) {
  // Add imports for prescription repository functions
  svcContent = svcContent.replace(
    "  updateNotification,\n} from \"../repositories/queueRepository.js\";",
    "  updateNotification,\n  listPrescriptions,\n  findPrescriptionById,\n  findPrescriptionsByTicketId,\n  createPrescription,\n  updatePrescription,\n} from \"../repositories/queueRepository.js\";",
  );

  // Add prescription constants import
  svcContent = svcContent.replace(
    "  DEPARTMENT_ROUTING_RULES,\n} from \"./queue/queue.constants.js\";",
    "  DEPARTMENT_ROUTING_RULES,\n  PRESCRIPTION_STATES,\n  canTransitionPrescriptionState,\n} from \"../modules/queue/queue.constants.js\";",
  );

  // Add prescription service functions at end of file
  const prescriptionSvc = `
const PRESCRIPTION_STATE_META = PRESCRIPTION_STATES;

export async function getPrescriptions(filters = {}) {
  let prescriptions = await listPrescriptions();
  if (filters.ticketId) {
    prescriptions = prescriptions.filter((p) => p.ticketId === filters.ticketId);
  }
  if (filters.state) {
    prescriptions = prescriptions.filter((p) => p.state === filters.state);
  }
  return prescriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getPrescriptionsForTicket(ticketId) {
  return findPrescriptionsByTicketId(ticketId);
}

export async function createPrescriptionRecord({ ticketId, items, notes }, staff) {
  const existing = await findTicketById(ticketId);
  if (!existing) {
    throw new HttpError(404, "Ticket not found.");
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, "At least one prescription item is required.");
  }

  const prescription = await createPrescription({
    ticketId,
    ticketCode: existing.ticket,
    patientName: existing.patientName,
    department: existing.department,
    items: items.map((item) => ({
      id: crypto.randomUUID(),
      drugName: item.drugName?.trim(),
      dosage: item.dosage?.trim(),
      quantity: item.quantity?.trim() ?? "1",
      instructions: item.instructions?.trim() ?? "",
    })),
    state: "prescribed",
    notes: notes?.trim() ?? "",
    prescribedBy: actorInfo(staff),
    createdAt: new Date().toISOString(),
    stateHistory: [{ state: "prescribed", actor: actorInfo(staff), at: new Date().toISOString() }],
  });

  broadcastQueueEvent("prescription.created", {
    prescriptionId: prescription.id,
    ticketId,
    ticketCode: existing.ticket,
    state: prescription.state,
  });

  return prescription;
}

export async function updatePrescriptionState(id, newState, staff) {
  const existing = await findPrescriptionById(id);
  if (!existing) {
    throw new HttpError(404, "Prescription not found.");
  }

  if (!PRESCRIPTION_STATE_META[newState]) {
    throw new HttpError(400, "Invalid prescription state.");
  }

  if (!canTransitionPrescriptionState(existing.state, newState)) {
    throw new HttpError(409, \`Cannot transition from "\${existing.state}" to "\${newState}".\`);
  }

  const updated = await updatePrescription(id, (p) => ({
    ...p,
    state: newState,
    stateHistory: [...(p.stateHistory ?? []), { state: newState, actor: actorInfo(staff), at: new Date().toISOString() }],
    ...(newState === "collected" ? { collectedAt: new Date().toISOString(), collectedBy: actorInfo(staff) } : {}),
    ...(newState === "dispensing" ? { dispensingStartedAt: new Date().toISOString() } : {}),
    ...(newState === "ready" ? { readyAt: new Date().toISOString() } : {}),
  }));

  broadcastQueueEvent("prescription.state-updated", {
    prescriptionId: id,
    ticketId: existing.ticketId,
    ticketCode: existing.ticketCode,
    oldState: existing.state,
    newState,
  });

  return updated;
}

export async function getPrescriptionSummary() {
  const prescriptions = await listPrescriptions();
  const byState = {};
  for (const state of Object.keys(PRESCRIPTION_STATE_META)) {
    byState[state] = 0;
  }
  for (const p of prescriptions) {
    byState[p.state] = (byState[p.state] ?? 0) + 1;
  }
  return {
    total: prescriptions.length,
    byState,
    lastUpdatedAt: new Date().toISOString(),
  };
}
`;

  svcContent += prescriptionSvc;
  writeFileSync(svcFile, svcContent, "utf-8");
  console.log("Prescription service functions added");
} else {
  console.log("Prescription service functions already exist");
}

console.log("All backend prescription changes done");
