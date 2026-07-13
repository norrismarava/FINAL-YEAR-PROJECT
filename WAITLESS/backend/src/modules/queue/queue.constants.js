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
  "OPD",
  "Casualty / Triage",
  "Pharmacy",
  "Laboratory",
  "Radiology",
  "OI Clinic",
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
  "waiting",
  "called",
  "in-service",
  "missed",
  "completed",
];

const TICKET_PREFIX = {
  red: "R",
  yellow: "Y",
  green: "G",
  black: "B",
};

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
    department: "OPD",
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
    department: "OPD",
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

export function createTicketCode(priority, sequence) {
  return `${TICKET_PREFIX[priority]}-${String(sequence).padStart(3, "0")}`;
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
      ticket: createTicketCode(row.priority, row.sequence),
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
