import crypto from "node:crypto";

export const PRIORITY_META = {
  red: {
    label: "Priority I - Critical",
    short: "Red",
    description: "Respiratory arrest, severe burns, life-threatening cases",
    destination: "Casualty Resuscitation Room",
  },
  yellow: {
    label: "Priority II - Serious",
    short: "Yellow",
    description: "Seriously ill, but not immediately life-threatening",
    destination: "Casualty Observation Ward",
  },
  green: {
    label: "Priority III - Ambulant",
    short: "Green",
    description: "Minor injuries and stable walking patients",
    destination: "Casualty Waiting Area",
  },
  black: {
    label: "Priority IV - Deceased",
    short: "Black",
    description: "Awaiting mortuary transfer",
    destination: "Holding Bay",
  },
};

export const DEPARTMENTS = [
  "Casualty / Triage",
  "Pharmacy",
  "Laboratory",
  "Radiology",
  "OI Clinic",
  "Dental Clinic",
];

export const PATIENT_CATEGORIES = [
  "walk-in",
  "referred",
  "emergency",
  "elderly",
  "pregnant",
  "child",
  "disabled",
  "chronic-care",
];

export const PRIORITY_ORDER = ["red", "yellow", "green", "black"];
export const TICKET_STATUSES = [
  "pre-registered",
  "waiting",
  "called",
  "in-service",
  "missed",
  "completed",
];

export const DEPARTMENT_TOKEN_PREFIX = {
  "Casualty / Triage": "TRI",
  Pharmacy: "PHA",
  Laboratory: "LAB",
  Radiology: "RAD",
  "OI Clinic": "OIC",
  "Dental Clinic": "DEN",
};

export const EMERGENCY_VITAL_THRESHOLDS = {
  oxygenSaturation: { min: 90, label: "SpO2 below 90%" },
  heartRate: { max: 130, min: 40, label: "Heart rate outside 40-130 bpm" },
  bloodPressureSystolic: { max: 180, min: 80, label: "Systolic BP outside 80-180 mmHg" },
  temperature: { min: 39.5, label: "Temperature at or above 39.5°C" },
  respiratoryRate: { max: 30, min: 8, label: "Respiratory rate outside 8-30 /min" },
  painScore: { min: 9, label: "Pain score 9 or 10" },
};

export const DEPARTMENT_ROUTING_RULES = [
  {
    department: "Casualty / Triage",
    keywords: ["chest pain", "breathing", "respiratory", "distress", "unconscious", "bleeding", "trauma", "injury", "accident", "severe burn", "stroke", "seizure", "collapse", "cardiac", "arrest", "shock", "poisoning", "overdose", "anaphylaxis", "choking", "drowning"],
  },
  {
    department: "Pharmacy",
    keywords: ["medication", "refill", "prescription", "pharmacy", "drug", "art", "arv", "collect medicine"],
  },
  {
    department: "Laboratory",
    keywords: ["blood test", "lab", "laboratory", "cbc", "urinalysis", "specimen", "sample", "blood work", "culture", "malaria test", "hiv test", "glucose test", "fasting blood"],
  },
  {
    department: "Radiology",
    keywords: ["x-ray", "xray", "radiology", "scan", "ultrasound", "ct scan", "mri", "imaging", "fracture", "bone"],
  },
  {
    department: "OI Clinic",
    keywords: ["oi clinic", "art review", "hiv", "arv", "opportunistic infection", "cd4", "viral load"],
  },
  {
    department: "Dental Clinic",
    keywords: ["dental", "tooth", "teeth", "toothache", "gum", "molar", "cavity", "filling", "extraction", "denture", "braces", "oral", "mouth", "jaw pain", "bleeding gums"],
  },
];

const SEEDED_TICKETS = [
  {
    sequence: 101,
    patientName: "Tariro Moyo",
    priority: "red",
    department: "Casualty / Triage",
    status: "in-service",
    minutesAgo: 4,
    chiefComplaint: "Severe burns",
    whatsApp: true,
  },
  {
    sequence: 102,
    patientName: "Brian Chuma",
    priority: "yellow",
    department: "Casualty / Triage",
    status: "in-service",
    minutesAgo: 12,
    chiefComplaint: "Shortness of breath",
    whatsApp: true,
  },
  {
    sequence: 103,
    patientName: "Rumbidzai Ncube",
    priority: "green",
    department: "Laboratory",
    status: "in-service",
    minutesAgo: 20,
    chiefComplaint: "CBC follow-up",
    whatsApp: false,
  },
  {
    sequence: 104,
    patientName: "Tendai Sibanda",
    priority: "yellow",
    department: "Casualty / Triage",
    status: "waiting",
    minutesAgo: 18,
    chiefComplaint: "Chest pain",
    whatsApp: true,
  },
  {
    sequence: 105,
    patientName: "Chipo Mlambo",
    priority: "green",
    department: "Casualty / Triage",
    status: "waiting",
    minutesAgo: 31,
    chiefComplaint: "Headache",
    whatsApp: true,
  },
  {
    sequence: 106,
    patientName: "Farai Gora",
    priority: "green",
    department: "Pharmacy",
    status: "waiting",
    minutesAgo: 26,
    chiefComplaint: "Medication refill",
    whatsApp: false,
  },
  {
    sequence: 107,
    patientName: "Nyasha Pinduka",
    priority: "red",
    department: "Casualty / Triage",
    status: "waiting",
    minutesAgo: 7,
    chiefComplaint: "Respiratory distress",
    whatsApp: true,
  },
  {
    sequence: 108,
    patientName: "Anesu Kuda",
    priority: "green",
    department: "Radiology",
    status: "waiting",
    minutesAgo: 42,
    chiefComplaint: "X-ray review",
    whatsApp: true,
  },
  {
    sequence: 109,
    patientName: "Tatenda Rwizi",
    priority: "yellow",
    department: "Laboratory",
    status: "waiting",
    minutesAgo: 16,
    chiefComplaint: "High fever",
    whatsApp: false,
  },
  {
    sequence: 110,
    patientName: "Munyaradzi Dube",
    priority: "green",
    department: "OI Clinic",
    status: "waiting",
    minutesAgo: 39,
    chiefComplaint: "ART review",
    whatsApp: true,
  },
  {
    sequence: 111,
    patientName: "Vimbai Tavares",
    priority: "green",
    department: "Pharmacy",
    status: "waiting",
    minutesAgo: 24,
    chiefComplaint: "Prescription collection",
    whatsApp: false,
  },
  {
    sequence: 112,
    patientName: "Kudzai Bhero",
    priority: "black",
    department: "Casualty / Triage",
    status: "waiting",
    minutesAgo: 13,
    chiefComplaint: "Awaiting transfer",
    whatsApp: false,
  },
];

// Tickets are dept-neutral now: A001..A999, B001..B999, ... Z999, then the
// cycle repeats. The department is assigned at reception when the ticket is
// issued onto a queue — not baked into the code the patient holds.
const TICKET_CODES_PER_LETTER = 999;
const TICKET_CODE_CYCLE = 26 * TICKET_CODES_PER_LETTER;

export function createTicketCode(sequence) {
  const zeroBased =
    (Math.max(1, Number(sequence) || 1) - 1) % TICKET_CODE_CYCLE;
  const letter = String.fromCharCode(
    65 + Math.floor(zeroBased / TICKET_CODES_PER_LETTER),
  );
  const number = (zeroBased % TICKET_CODES_PER_LETTER) + 1;
  return `${letter}${String(number).padStart(3, "0")}`;
}

export function priorityRank(priority) {
  return PRIORITY_ORDER.indexOf(priority);
}

export function createSeedTickets() {
  return SEEDED_TICKETS.map((row) => {
    const registeredAt = new Date(Date.now() - row.minutesAgo * 60_000).toISOString();
    const triagedAt =
      row.priority === "green"
        ? null
        : new Date(Date.now() - row.minutesAgo * 55_000).toISOString();
    const calledAt =
      row.status === "in-service"
        ? new Date(Date.now() - Math.max(row.minutesAgo - 2, 1) * 60_000).toISOString()
        : null;
    const serviceStartedAt =
      row.status === "in-service"
        ? new Date(Date.now() - Math.max(row.minutesAgo - 1, 1) * 60_000).toISOString()
        : null;

    return {
      id: crypto.randomUUID(),
      ticket: createTicketCode(row.sequence),
      patientName: row.patientName,
      nationalId: "",
      dob: "",
      gender: "unknown",
      phone: "",
      address: "",
      patientCategory: "walk-in",
      nextOfKinName: "",
      nextOfKinPhone: "",
      notificationConsent: row.whatsApp,
      department: row.department,
      chiefComplaint: row.chiefComplaint,
      priority: row.priority,
      status: row.status,
      registeredAt,
      triagedAt,
      calledAt,
      serviceStartedAt,
      missedAt: null,
      recalledAt: null,
      transferredAt: null,
      previousDepartment: "",
      recallCount: 0,
      completedAt: null,
      whatsApp: row.whatsApp,
    };
  });
}


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

export const TEST_ORDER_STATES = {
  ordered: {
    label: "Ordered",
    description: "Test ordered by doctor, awaiting sample collection",
  },
  "sample-collected": {
    label: "Sample Collected",
    description: "Specimen collected, test in progress",
  },
  "in-progress": {
    label: "In Progress",
    description: "Laboratory processing the test",
  },
  completed: {
    label: "Completed",
    description: "Test completed, result ready for review",
  },
  "result-ready": {
    label: "Result Ready",
    description: "Result ready, awaiting doctor review and patient return",
  },
  cancelled: {
    label: "Cancelled",
    description: "Test order cancelled",
  },
};

export const TEST_ORDER_STATE_ORDER = [
  "ordered",
  "sample-collected",
  "in-progress",
  "completed",
  "result-ready",
];

export function canTransitionTestOrderState(from, to) {
  if (from === "cancelled") return false;
  if (from === "result-ready") return false;
  if (to === "cancelled") return true;
  const fromIdx = TEST_ORDER_STATE_ORDER.indexOf(from);
  const toIdx = TEST_ORDER_STATE_ORDER.indexOf(to);
  return toIdx >= 0 && toIdx > fromIdx;
}

export const TEST_ORDER_TYPES = [
  "blood-count",
  "urinalysis",
  "blood-glucose",
  "malaria-smear",
  "hiv-test",
  "tb-sputum",
  "x-ray-chest",
  "ultrasound",
  "ct-scan",
  "other",
];
