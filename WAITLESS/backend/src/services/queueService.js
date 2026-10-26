import crypto from "node:crypto";

import {
  createTicketCode,
  DEPARTMENTS,
  DEPARTMENT_ROUTING_RULES,
  EMERGENCY_VITAL_THRESHOLDS,
  PATIENT_CATEGORIES,
  PRESCRIPTION_STATES,
  canTransitionPrescriptionState,
  TEST_ORDER_STATES,
  canTransitionTestOrderState,
  TEST_ORDER_TYPES,
  PRIORITY_META,
  priorityRank,
  TICKET_STATUSES,
} from "../modules/queue/queue.constants.js";
import {
  createPatient,
  createTicket,
  findPatientById,
  findPatientByPhone,
  findPatientByPatientNumber,
  findTicketById,
  findPrescriptionById,
  findPrescriptionsByTicketId,
  findTestOrderById,
  findTestOrdersByTicketId,
  getNextPatientSequence,
  getNextSequence,
  listPatients,
  listTickets,
  listNotifications,
  listPrescriptions,
  listTestOrders,
  createPrescription,
  createTestOrder,
  updatePatient,
  updateTicket,
  updatePrescription,
  updateTestOrder,
  createFeedback,
  findFeedbackByTicketId,
} from "../repositories/queueRepository.js";
import { broadcastQueueEvent } from "../sockets/queueEvents.js";
import { HttpError } from "../utils/http.js";
import { recordAuditEventSafely } from "./auditService.js";
import { env } from "../config/env.js";
import {
  dispatchCallNotifications,
  dispatchMissedTurnNotification,
  dispatchPrescriptionReadyNotification,
  dispatchRegistrationNotification,
  dispatchTestResultReadyNotification,
  dispatchTurnReadinessNotifications,
  dispatchTransferNotification,
  getNotificationsForTicket,
} from "./notificationService.js";
import {
  getTriageReassessmentThresholds,
  getEtaParameters,
  getOIPrivacyMode,
} from "./configService.js";

const FALLBACK_TRIAGE_THRESHOLDS = { red: 10, yellow: 30 };
const FALLBACK_ETA = { minutesPerPatientAhead: 7, baselineMinutes: 3, activeDepartmentBonusMinutes: 4 };

const OI_CLINIC_DEPARTMENT = "OI Clinic";

function maskOITicket(ticket) {
  if (ticket.department !== OI_CLINIC_DEPARTMENT) return ticket;
  return {
    ...ticket,
    patientName: "Confidential Patient",
    chiefComplaint: "OI Clinic appointment",
    phone: "",
    nationalId: "",
    dob: "",
    address: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
  };
}

function maskOITickets(tickets) {
  return tickets.map(maskOITicket);
}

// Public surfaces (tracking, boards) must never expose patient identity.
// Only operational fields leave the server — no names, IDs, contacts,
// complaints or next-of-kin data.
function sanitizePublicTicket(ticket) {
  return {
    id: ticket.id,
    ticket: ticket.ticket,
    department: ticket.department,
    previousDepartment: ticket.previousDepartment ?? "",
    priority: ticket.priority,
    status: ticket.status,
    registeredAt: ticket.registeredAt,
    triagedAt: ticket.triagedAt,
    calledAt: ticket.calledAt,
    calledRoom: ticket.calledRoom ?? null,
    calledBy: ticket.calledBy ?? null,
    serviceStartedAt: ticket.serviceStartedAt,
    missedAt: ticket.missedAt,
    recalledAt: ticket.recalledAt,
    completedAt: ticket.completedAt,
    waitMinutes: ticket.waitMinutes ?? null,
    whatsApp: Boolean(ticket.whatsApp),
  };
}

function maskOITrackingResponse(response) {
  const ticket = response.ticket;
  if (!ticket || ticket.department !== OI_CLINIC_DEPARTMENT) return response;
  return {
    ...response,
    ticket: maskOITicket(ticket),
    queue: {
      ...response.queue,
      activeInDepartment: (response.queue?.activeInDepartment ?? []).map((entry) => ({
        ...entry,
        patientName: entry.department === OI_CLINIC_DEPARTMENT ? "Confidential Patient" : entry.patientName,
      })),
    },
  };
}

function enrichTicket(ticket) {
  return {
    ...ticket,
    waitMinutes: Math.max(
      1,
      Math.round((Date.now() - new Date(ticket.registeredAt).getTime()) / 60_000),
    ),
  };
}

function sortWaitingTickets(tickets) {
  return [...tickets].sort(
    (a, b) =>
      priorityRank(a.priority) - priorityRank(b.priority) ||
      b.waitMinutes - a.waitMinutes ||
      new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime(),
  );
}

function sortAllTickets(tickets) {
  const statusRank = {
    called: 0,
    "in-service": 1,
    waiting: 2,
    "pre-registered": 3,
    missed: 4,
    completed: 5,
  };

  return [...tickets].sort(
    (a, b) =>
      statusRank[a.status] - statusRank[b.status] ||
      priorityRank(a.priority) - priorityRank(b.priority) ||
      b.waitMinutes - a.waitMinutes,
  );
}

async function getLiveTickets() {
  return (await listTickets()).map(enrichTicket);
}

function refreshTurnReadinessNotifications() {
  void getLiveTickets()
    .then((tickets) => dispatchTurnReadinessNotifications(tickets))
    .catch((error) => {
      console.error("Failed to refresh turn-readiness notifications.", error);
    });
}

function ensurePriority(priority) {
  if (!Object.hasOwn(PRIORITY_META, priority)) {
    throw new HttpError(400, "Invalid priority value.");
  }
}

function ensureDepartment(department) {
  if (!DEPARTMENTS.includes(department)) {
    throw new HttpError(400, "Invalid department value.");
  }
}

function ensurePatientCategory(category) {
  if (!PATIENT_CATEGORIES.includes(category)) {
    throw new HttpError(400, "Invalid patient category value.");
  }
}


function actorInfo(staff) {
  if (!staff) return null;
  return {
    id: staff.id,
    name: staff.name,
    role: staff.role,
    department: staff.department,
  };
}

function appendActionLog(ticket, action, staff) {
  const actor = actorInfo(staff);
  if (!actor) return ticket;
  const entry = { action, actor, at: new Date().toISOString() };
  const log = [...(ticket.actionLog ?? []), entry];
  return { ...ticket, actionLog: log, lastActionBy: actor, lastActionAt: entry.at };
}

function ticketAuditState(ticket) {
  if (!ticket) return null;
  return {
    ticket: ticket.ticket,
    status: ticket.status,
    priority: ticket.priority,
    department: ticket.department,
    previousDepartment: ticket.previousDepartment || null,
    recallCount: Number(ticket.recallCount ?? 0),
  };
}

function recordTicketAudit(action, before, after, staff, metadata) {
  const ticket = after ?? before;
  return recordAuditEventSafely({
    actor: staff,
    action,
    entityType: "ticket",
    entityId: ticket?.id,
    entityLabel: ticket?.ticket,
    before: ticketAuditState(before),
    after: ticketAuditState(after),
    metadata,
  });
}


function ensureStatus(status) {
  if (!TICKET_STATUSES.includes(status)) {
    throw new HttpError(400, "Invalid status value.");
  }
}

function evaluateEmergencyVitals(vitals, painScore) {
  const triggers = [];
  const v = vitals ?? {};
  if (v.oxygenSaturation != null && v.oxygenSaturation < EMERGENCY_VITAL_THRESHOLDS.oxygenSaturation.min) {
    triggers.push(EMERGENCY_VITAL_THRESHOLDS.oxygenSaturation.label);
  }
  if (v.heartRate != null && (v.heartRate > EMERGENCY_VITAL_THRESHOLDS.heartRate.max || v.heartRate < EMERGENCY_VITAL_THRESHOLDS.heartRate.min)) {
    triggers.push(EMERGENCY_VITAL_THRESHOLDS.heartRate.label);
  }
  if (v.bloodPressureSystolic != null && (v.bloodPressureSystolic > EMERGENCY_VITAL_THRESHOLDS.bloodPressureSystolic.max || v.bloodPressureSystolic < EMERGENCY_VITAL_THRESHOLDS.bloodPressureSystolic.min)) {
    triggers.push(EMERGENCY_VITAL_THRESHOLDS.bloodPressureSystolic.label);
  }
  if (v.temperature != null && v.temperature >= EMERGENCY_VITAL_THRESHOLDS.temperature.min) {
    triggers.push(EMERGENCY_VITAL_THRESHOLDS.temperature.label);
  }
  if (v.respiratoryRate != null && (v.respiratoryRate > EMERGENCY_VITAL_THRESHOLDS.respiratoryRate.max || v.respiratoryRate < EMERGENCY_VITAL_THRESHOLDS.respiratoryRate.min)) {
    triggers.push(EMERGENCY_VITAL_THRESHOLDS.respiratoryRate.label);
  }
  if (painScore != null && painScore >= EMERGENCY_VITAL_THRESHOLDS.painScore.min) {
    triggers.push(EMERGENCY_VITAL_THRESHOLDS.painScore.label);
  }
  return triggers;
}

function routeDepartmentByComplaint(chiefComplaint) {
  const text = (chiefComplaint ?? "").toLowerCase();
  if (!text) return null;
  for (const rule of DEPARTMENT_ROUTING_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.department;
    }
  }
  return null;
}

function createTicketEventPayload(ticket) {
  return {
    id: ticket.id,
    ticket: ticket.ticket,
    department: ticket.department,
    priority: ticket.priority,
    status: ticket.status,
    room: ticket.calledRoom ?? null,
    calledBy: ticket.calledBy ?? null,
  };
}

async function buildReassessmentAlerts(tickets) {
  let thresholds;
  try {
    thresholds = await getTriageReassessmentThresholds();
  } catch {
    thresholds = FALLBACK_TRIAGE_THRESHOLDS;
  }
  return tickets
    .filter((ticket) => {
      const threshold = thresholds[ticket.priority];
      return (
        ticket.status === "waiting" &&
        threshold &&
        ticket.waitMinutes >= threshold
      );
    })
    .map((ticket) => ({
      id: ticket.id,
      ticket: ticket.ticket,
      patientName: ticket.patientName,
      department: ticket.department,
      priority: ticket.priority,
      waitMinutes: ticket.waitMinutes,
      thresholdMinutes: thresholds[ticket.priority],
      message: `${ticket.ticket} needs triage reassessment after ${ticket.waitMinutes} minutes waiting.`,
    }))
    .sort(
      (left, right) =>
        priorityRank(left.priority) - priorityRank(right.priority) ||
        right.waitMinutes - left.waitMinutes,
    );
}

function normalizeTicketCode(ticketCode) {
  return ticketCode?.trim().toUpperCase() ?? "";
}

function buildRegistrationHandoff(ticket, registrationNotification) {
  return {
    token: ticket.ticket,
    patientNumber: ticket.patientNumber ?? null,
    department: ticket.department,
    issuedAt: ticket.registeredAt,
    trackingPath: `/track?ticket=${encodeURIComponent(ticket.ticket)}`,
    channels: {
      print: {
        status: "ready",
      },
      phone: {
        status: "ready",
        recipient: ticket.phone || null,
      },
      whatsapp: {
        status: registrationNotification?.status ?? "disabled",
        notificationId: registrationNotification?.id ?? null,
      },
      displayBoard: {
        status: "synced",
      },
    },
  };
}

async function buildEstimatedWaitMinutes(patientsAhead, activeInDepartmentCount) {
  let etaParams;
  try {
    etaParams = await getEtaParameters();
  } catch {
    etaParams = FALLBACK_ETA;
  }
  if (patientsAhead <= 0) {
    return activeInDepartmentCount
      ? etaParams.baselineMinutes + etaParams.activeDepartmentBonusMinutes
      : etaParams.baselineMinutes;
  }

  return patientsAhead * etaParams.minutesPerPatientAhead + (activeInDepartmentCount ? etaParams.activeDepartmentBonusMinutes : 0);
}

function canRetryNotificationStatus(status) {
  return status === "queued" || status === "retrying" || status === "failed";
}

function buildNotificationAnalytics(allNotifications) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const statusOrder = [
    "queued",
    "sending",
    "sent",
    "delivered",
    "read",
    "retrying",
    "failed",
  ];
  const whatsAppNotifications = allNotifications.filter(
    (notification) => notification.channel === "whatsapp",
  );
  const deliveredCount = allNotifications.filter((notification) =>
    notification.status === "delivered" || notification.status === "read",
  ).length;
  const readCount = allNotifications.filter(
    (notification) => notification.status === "read",
  ).length;
  const retryableCount = allNotifications.filter((notification) =>
    canRetryNotificationStatus(notification.status),
  ).length;
  const totalAttempts = whatsAppNotifications.reduce(
    (sum, notification) => sum + (notification.attempts?.length ?? 0),
    0,
  );
  const outstandingNotifications = allNotifications.filter((notification) =>
    ["queued", "sending", "retrying", "failed"].includes(notification.status),
  );
  const oldestOutstandingMinutes = outstandingNotifications.length
    ? Math.max(
        ...outstandingNotifications.map((notification) =>
          Math.max(
            0,
            Math.round(
              (Date.now() - new Date(notification.createdAt).getTime()) / 60_000,
            ),
          ),
        ),
      )
    : 0;
  const trend = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const start = new Date(today);
    start.setDate(start.getDate() - offset);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const dailyNotifications = allNotifications.filter((notification) => {
      const createdAt = new Date(notification.createdAt).getTime();
      return createdAt >= start.getTime() && createdAt < end.getTime();
    });

    trend.push({
      date: start.toISOString(),
      label: start.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      }),
      total: dailyNotifications.length,
      delivered: dailyNotifications.filter(
        (notification) =>
          notification.status === "delivered" || notification.status === "read",
      ).length,
      attention: dailyNotifications.filter(
        (notification) =>
          notification.status === "failed" || notification.status === "retrying",
      ).length,
      inflight: dailyNotifications.filter((notification) =>
        ["queued", "sending", "sent"].includes(notification.status),
      ).length,
    });
  }

  const statusMix = statusOrder.map((status) => ({
    status,
    label:
      {
        queued: "Queued",
        sending: "Sending",
        sent: "Sent",
        delivered: "Delivered",
        read: "Read",
        retrying: "Retrying",
        failed: "Failed",
      }[status] ?? status,
    value: allNotifications.filter((notification) => notification.status === status)
      .length,
  }));

  const failureReasons = new Map();

  for (const notification of allNotifications) {
    if (
      notification.status !== "failed" &&
      notification.status !== "retrying"
    ) {
      continue;
    }

    const reasonKey =
      notification.errorCode || notification.errorMessage || "Unknown failure";
    const current = failureReasons.get(reasonKey) ?? {
      code: notification.errorCode ?? null,
      reason: notification.errorMessage || reasonKey,
      count: 0,
    };

    current.count += 1;
    failureReasons.set(reasonKey, current);
  }

  const departmentIssues = DEPARTMENTS.map((department) => {
    const scoped = allNotifications.filter(
      (notification) => notification.department === department,
    );

    return {
      department,
      total: scoped.length,
      issues: scoped.filter(
        (notification) =>
          notification.status === "failed" || notification.status === "retrying",
      ).length,
      delivered: scoped.filter(
        (notification) =>
          notification.status === "delivered" || notification.status === "read",
      ).length,
    };
  })
    .filter((entry) => entry.total > 0 || entry.issues > 0)
    .sort(
      (left, right) =>
        right.issues - left.issues ||
        right.total - left.total ||
        left.department.localeCompare(right.department),
    );

  return {
    trend,
    statusMix,
    departmentIssues,
    audit: {
      retryableCount,
      readRate: whatsAppNotifications.length
        ? Math.round((readCount / whatsAppNotifications.length) * 100)
        : 0,
      whatsAppShare: allNotifications.length
        ? Math.round(
            (whatsAppNotifications.length / allNotifications.length) * 100,
          )
        : 0,
      averageAttemptsPerWhatsApp: whatsAppNotifications.length
        ? Number((totalAttempts / whatsAppNotifications.length).toFixed(1))
        : 0,
      oldestOutstandingMinutes,
      topFailureReasons: [...failureReasons.values()]
        .sort(
          (left, right) =>
            right.count - left.count || left.reason.localeCompare(right.reason),
        )
        .slice(0, 4),
      deliveredCount,
    },
  };
}

function applyStatusTransition(ticket, status) {
  const now = new Date().toISOString();

  switch (status) {
    case "pre-registered":
      return {
        ...ticket,
        status,
        calledAt: null,
        serviceStartedAt: null,
        missedAt: null,
        completedAt: null,
      };
    case "waiting":
      return {
        ...ticket,
        status,
        calledAt: null,
        calledBy: null,
        calledRoom: null,
        serviceStartedAt: null,
        missedAt: null,
        completedAt: null,
      };
    case "called":
      return {
        ...ticket,
        status,
        calledAt: now,
        serviceStartedAt: null,
        missedAt: null,
        completedAt: null,
      };
    case "in-service":
      return {
        ...ticket,
        status,
        calledAt: ticket.calledAt ?? now,
        serviceStartedAt: now,
        missedAt: null,
        completedAt: null,
      };
    case "missed":
      return {
        ...ticket,
        status,
        missedAt: now,
        serviceStartedAt: null,
        completedAt: null,
      };
    case "completed":
      return {
        ...ticket,
        status,
        calledAt: ticket.calledAt ?? now,
        serviceStartedAt: ticket.serviceStartedAt ?? now,
        completedAt: now,
      };
    default:
      return ticket;
  }
}

function ensureStatusTransition(currentStatus, nextStatus) {
  const allowedTransitions = {
    "pre-registered": ["waiting"],
    waiting: ["called", "in-service"],
    called: ["waiting", "in-service", "missed", "completed"],
    "in-service": ["completed"],
    missed: ["waiting", "called"],
    completed: [],
  };

  if (currentStatus === nextStatus) {
    return;
  }

  if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
    throw new HttpError(
      400,
      `Cannot move a ticket from ${currentStatus} to ${nextStatus}.`,
    );
  }
}

export function getMeta() {
  return {
    departments: DEPARTMENTS,
    patientCategories: PATIENT_CATEGORIES,
    priorities: PRIORITY_META,
    statuses: TICKET_STATUSES,
  };
}

export async function getTickets(filters = {}) {
  let tickets = await getLiveTickets();

  if (filters.status) {
    tickets = tickets.filter((ticket) => ticket.status === filters.status);
  }

  if (filters.department) {
    tickets = tickets.filter((ticket) => ticket.department === filters.department);
  }

  return sortAllTickets(tickets);
}

function buildPatientProfiles(patients, tickets) {
  const visits = [...tickets].sort(
    (left, right) =>
      new Date(right.registeredAt).getTime() - new Date(left.registeredAt).getTime(),
  );

  return patients.map((patient) => {
    const recentVisits = visits
      .filter((ticket) => ticket.patientId === patient.id)
      .slice(0, 5)
      .map((ticket) => ({
        ticket: ticket.ticket,
        department: ticket.department,
        priority: ticket.priority,
        status: ticket.status,
        registeredAt: ticket.registeredAt,
      }));
    const latestVisit = recentVisits[0] ?? null;

    return {
      ...patient,
      qrLookupValue: `WAITLESS:PATIENT:${patient.patientNumber}`,
      lastDepartment: latestVisit?.department ?? "",
      lastTicket: latestVisit?.ticket ?? "",
      lastVisitAt: latestVisit?.registeredAt ?? patient.lastVisitAt,
      totalVisits: visits.filter((ticket) => ticket.patientId === patient.id).length,
      recentVisits,
    };
  });
}

function normalizeIdentity(value) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

function normalizePatientLookup(value) {
  const trimmed = value?.trim() ?? "";
  const qrMatch = /^waitless:patient:(.+)$/i.exec(trimmed);
  return (qrMatch?.[1] ?? trimmed).toLowerCase();
}

function scorePatientProfile(profile, normalizedQuery) {
  if (!normalizedQuery) {
    return 0;
  }

  const patientName = profile.patientName?.toLowerCase() ?? "";
  const compactQuery = normalizeIdentity(normalizedQuery);
  const phone = normalizeIdentity(profile.phone);
  const nationalId = normalizeIdentity(profile.nationalId);
  const patientNumber = profile.patientNumber?.toLowerCase() ?? "";
  const lastTicket = profile.lastTicket?.toLowerCase() ?? "";
  const recentTickets = profile.recentVisits.map((visit) => visit.ticket.toLowerCase());
  const recentDepartments = profile.recentVisits.map((visit) =>
    visit.department.toLowerCase(),
  );

  if (patientNumber === normalizedQuery) {
    return 520;
  }

  if (recentTickets.includes(normalizedQuery) || lastTicket === normalizedQuery) {
    return 420;
  }

  if (nationalId && nationalId === compactQuery) {
    return 360;
  }

  if (phone && phone === compactQuery) {
    return 340;
  }

  if (patientName.startsWith(normalizedQuery)) {
    return 280;
  }

  if (patientName.includes(normalizedQuery)) {
    return 220;
  }

  if (patientNumber.includes(normalizedQuery)) {
    return 210;
  }

  if (compactQuery && nationalId.includes(compactQuery)) {
    return 200;
  }

  if (compactQuery && phone.includes(compactQuery)) {
    return 190;
  }

  if (recentTickets.some((ticket) => ticket.includes(normalizedQuery))) {
    return 170;
  }

  if (recentDepartments.some((department) => department.includes(normalizedQuery))) {
    return 90;
  }

  return 0;
}

export async function searchPatients(queryText) {
  const normalizedQuery = normalizePatientLookup(queryText);
  if (normalizedQuery.length < 2) {
    return [];
  }

  const [patients, tickets] = await Promise.all([listPatients(), listTickets()]);
  const profiles = buildPatientProfiles(patients, tickets);

  return profiles
    .map((profile) => ({
      profile,
      score: scorePatientProfile(profile, normalizedQuery),
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        new Date(right.profile.lastVisitAt).getTime() -
          new Date(left.profile.lastVisitAt).getTime() ||
        right.profile.totalVisits - left.profile.totalVisits ||
        left.profile.patientName.localeCompare(right.profile.patientName),
    )
    .slice(0, 8)
    .map((entry) => entry.profile);
}

function findMatchingPatient(patients, payload) {
  const nationalId = normalizeIdentity(payload.nationalId);
  const phone = normalizeIdentity(payload.phone);
  const patientName = payload.fullName?.trim().toLowerCase() ?? "";

  return patients.find((patient) => {
    if (nationalId && normalizeIdentity(patient.nationalId) === nationalId) {
      return true;
    }

    if (
      phone &&
      normalizeIdentity(patient.phone) === phone &&
      patient.patientName.trim().toLowerCase() === patientName
    ) {
      return true;
    }

    return Boolean(
      patientName &&
        payload.dob &&
        patient.patientName.trim().toLowerCase() === patientName &&
        patient.dob === payload.dob,
    );
  });
}

function mergePatientProfile(current, payload, now) {
  return {
    ...current,
    patientName: payload.fullName?.trim() || current.patientName,
    nationalId: payload.nationalId?.trim() || current.nationalId,
    dob: payload.dob || current.dob,
    gender: payload.gender || current.gender,
    phone: payload.phone?.trim() || current.phone,
    address: payload.address?.trim() || current.address,
    patientCategory: payload.patientCategory || current.patientCategory,
    nextOfKinName: payload.nextOfKinName?.trim() || current.nextOfKinName,
    nextOfKinPhone: payload.nextOfKinPhone?.trim() || current.nextOfKinPhone,
    updatedAt: now,
    lastVisitAt: now,
  };
}

async function resolvePatientProfile(payload, now) {
  const patients = await listPatients();
  let existing = null;

  if (payload.patientId) {
    existing = await findPatientById(payload.patientId);
    if (!existing) {
      throw new HttpError(404, "The selected patient record no longer exists.");
    }
  } else {
    existing = findMatchingPatient(patients, payload) ?? null;
  }

  if (existing) {
    const conflictingRecord = patients.find(
      (patient) =>
        patient.id !== existing.id &&
        normalizeIdentity(payload.nationalId) &&
        normalizeIdentity(patient.nationalId) === normalizeIdentity(payload.nationalId),
    );
    if (conflictingRecord) {
      throw new HttpError(
        409,
        `National ID already belongs to patient ${conflictingRecord.patientNumber}.`,
      );
    }

    return updatePatient(existing.id, (current) =>
      mergePatientProfile(current, payload, now),
    );
  }

  const sequence = await getNextPatientSequence();
  return createPatient({
    id: crypto.randomUUID(),
    patientNumber: `WL-P${String(sequence).padStart(6, "0")}`,
    patientName: payload.fullName.trim(),
    nationalId: payload.nationalId?.trim() ?? "",
    dob: payload.dob ?? "",
    gender: payload.gender ?? "unknown",
    phone: payload.phone?.trim() ?? "",
    address: payload.address?.trim() ?? "",
    patientCategory: payload.patientCategory ?? "walk-in",
    nextOfKinName: payload.nextOfKinName?.trim() ?? "",
    nextOfKinPhone: payload.nextOfKinPhone?.trim() ?? "",
    createdAt: now,
    updatedAt: now,
    lastVisitAt: now,
  });
}

// A patient may only hold one open ticket at a time — anything not
// completed is still "live" and must not be double-booked.
async function findOpenTicketForPatient(patientId) {
  return (await getLiveTickets())
    .filter(
      (entry) => entry.patientId === patientId && entry.status !== "completed",
    )
    .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt))[0];
}

export async function registerPatient(payload) {
  const actor = payload?._actor ?? null;

  const patientName = payload.fullName?.trim();
  const department = payload.dept ?? payload.department;
  const patientCategory = payload.patientCategory ?? "walk-in";

  if (!patientName) {
    throw new HttpError(400, "Full name is required.");
  }

  if (!department) {
    throw new HttpError(400, "Select the department this patient is going to.");
  }

  ensureDepartment(department);
  ensurePatientCategory(patientCategory);

  const registeredAt = new Date().toISOString();
  const patient = await resolvePatientProfile(payload, registeredAt);

  if (!patient.nationalId?.trim()) {
    throw new HttpError(400, "National ID is required.");
  }

  // If the patient self-registered already, they hold a pre-registered
  // ticket with a code — confirm THAT ticket into the queue instead of
  // minting a second code they'd have to keep track of.
  const pendingPreRegistered = (await getLiveTickets())
    .filter(
      (entry) =>
        entry.patientId === patient.id && entry.status === "pre-registered",
    )
    .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt))[0];
  if (pendingPreRegistered) {
    const confirmed = await confirmArrival(
      pendingPreRegistered.id,
      actor ?? { role: "reception", fullName: "Front desk" },
      department,
    );
    return { ...confirmed, reusedPreRegisteredTicket: true };
  }

  const openTicket = await findOpenTicketForPatient(patient.id);
  if (openTicket) {
    throw new HttpError(
      409,
      `${patient.patientName} already holds ticket ${openTicket.ticket} (${openTicket.status}) in ${openTicket.department}. Complete or recall that ticket first.`,
    );
  }

  const sequence = await getNextSequence();
  const notificationConsent = Boolean(payload.notificationConsent);
  const ticket = {
    id: crypto.randomUUID(),
    ticket: createTicketCode(sequence),
    patientId: patient.id,
    patientNumber: patient.patientNumber,
    patientName,
    nationalId: payload.nationalId?.trim() || patient.nationalId,
    dob: payload.dob ?? "",
    gender: payload.gender ?? "unknown",
    phone: payload.phone?.trim() ?? "",
    address: payload.address?.trim() ?? "",
    patientCategory,
    nextOfKinName: payload.nextOfKinName?.trim() ?? "",
    nextOfKinPhone: payload.nextOfKinPhone?.trim() ?? "",
    notificationConsent,
    department,
    chiefComplaint: payload.chiefComplaint?.trim() ?? "",
    priority: "green",
    status: "waiting",
    registeredAt,
    triagedAt: null,
    calledAt: null,
    serviceStartedAt: null,
    completedAt: null,
    missedAt: null,
    recalledAt: null,
    transferredAt: null,
    previousDepartment: "",
    recallCount: 0,
    registeredBy: actorInfo(actor),
    actionLog: actor ? [{ action: "registered", actor: actorInfo(actor), at: registeredAt }] : [],
    whatsApp: notificationConsent && Boolean(payload.whatsApp),
  };

  const createdTicket = enrichTicket(await createTicket(ticket));

  await recordTicketAudit(
    "ticket.registered",
    null,
    createdTicket,
    actor,
    { source: actor ? "staff" : "self-service" },
  );

  broadcastQueueEvent("ticket.registered", createTicketEventPayload(createdTicket));
  const registrationNotification =
    await dispatchRegistrationNotification(createdTicket);
  refreshTurnReadinessNotifications();

  return {
    ...createdTicket,
    handoff: buildRegistrationHandoff(
      createdTicket,
      registrationNotification,
    ),
  };
}

export async function assignPriority(id, priority, staff) {
  ensurePriority(priority);

  const existing = await findTicketById(id);
  if (!existing) {
    throw new HttpError(404, "Ticket not found.");
  }

  const updatedTicket = enrichTicket(
    await updateTicket(id, (ticket) => appendActionLog({
      ...ticket,
      priority,
      triagedAt: new Date().toISOString(),
    }, "priority-assigned", staff)),
  );

  await recordTicketAudit("ticket.priority-assigned", existing, updatedTicket, staff);

  broadcastQueueEvent(
    "ticket.priority-updated",
    createTicketEventPayload(updatedTicket),
  );
  await dispatchTurnReadinessNotifications(await getLiveTickets());

  return updatedTicket;
}

export async function recallMissedPatient(id, options = {}, staff) {
  const existing = await findTicketById(id);
  if (!existing) {
    throw new HttpError(404, "Ticket not found.");
  }

  if (existing.status !== "missed") {
    throw new HttpError(400, "Only missed tickets can be recalled.");
  }

  const reinsertion = options.reinsertionPosition ?? "back";
  const recalledAt = new Date().toISOString();

  let newRegisteredAt = recalledAt;
  if (reinsertion === "front") {
    newRegisteredAt = new Date(Date.now() - 86400000).toISOString();
  } else if (reinsertion === "original" && existing.registeredAt) {
    newRegisteredAt = existing.registeredAt;
  } else if (reinsertion === "places") {
    // "N places back" — land the ticket just after the Nth waiting patient in
    // the same department + priority band, so N patients are called first.
    const places = Math.max(1, Number(options.places) || 3);
    const bandWaiting = sortWaitingTickets(
      (await getLiveTickets()).filter(
        (ticket) =>
          ticket.status === "waiting" &&
          ticket.department === existing.department &&
          ticket.priority === existing.priority,
      ),
    );
    const anchor = bandWaiting[Math.min(places, bandWaiting.length) - 1];
    if (anchor?.registeredAt) {
      newRegisteredAt = new Date(
        new Date(anchor.registeredAt).getTime() + 1000,
      ).toISOString();
    }
  } else if (reinsertion === "offset" && options.offsetMinutes) {
    newRegisteredAt = new Date(Date.now() - options.offsetMinutes * 60000).toISOString();
  }

  const updatedTicket = enrichTicket(
    await updateTicket(id, (ticket) => ({
      ...applyStatusTransition(ticket, "waiting"),
      recalledAt,
      registeredAt: newRegisteredAt,
      recallCount: Number(ticket.recallCount ?? 0) + 1,
      recallReinsertion: reinsertion,
    })),
  );

  await recordTicketAudit("ticket.recalled", existing, updatedTicket, staff, {
    reinsertion,
    places: options.places ?? null,
  });

  broadcastQueueEvent("ticket.recalled", createTicketEventPayload(updatedTicket));
  await dispatchTurnReadinessNotifications(await getLiveTickets());

  return updatedTicket;
}

export async function transferPatient(id, department, staff) {
  ensureDepartment(department);

  const existing = await findTicketById(id);
  if (!existing) {
    throw new HttpError(404, "Ticket not found.");
  }

  if (existing.status === "completed") {
    throw new HttpError(400, "Completed tickets cannot be transferred.");
  }

  if (existing.department === department) {
    throw new HttpError(400, "Ticket is already in that department.");
  }

  const transferredAt = new Date().toISOString();
  const previousDepartment = existing.department;
  const updatedTicket = enrichTicket(
    await updateTicket(id, (ticket) => ({
      ...ticket,
      department,
      previousDepartment,
      transferredAt,
      status: "waiting",
      calledAt: null,
      calledBy: null,
      calledRoom: null,
      serviceStartedAt: null,
      missedAt: null,
      completedAt: null,
    })),
  );

  await recordTicketAudit("ticket.transferred", existing, updatedTicket, staff);

  broadcastQueueEvent("ticket.transferred", createTicketEventPayload(updatedTicket));
  await dispatchTransferNotification(updatedTicket, previousDepartment);
  await dispatchTurnReadinessNotifications(await getLiveTickets());

  return updatedTicket;
}

export async function callNextPatient(department, staff, room) {
  // Non-admin staff are scoped to their assigned department — a pharmacist
  // can only call Pharmacy patients, a lab-tech Laboratory, and so on.
  if (staff?.role !== "admin" && staff?.department?.trim()) {
    department = staff.department;
  }
  if (department) {
    ensureDepartment(department);
  }

  const calledRoom = room?.trim() || staff?.roomNumber || null;
  const callerName = staff?.username ?? staff?.name ?? null;
  const liveTickets = await getLiveTickets();

  // Close this staff member's open tickets in the department before calling
  // the next patient, so the board never accumulates stale "serving" tiles.
  const ownOpenTickets = liveTickets.filter(
    (ticket) =>
      ticket.calledBy === callerName &&
      callerName != null &&
      (ticket.status === "called" || ticket.status === "in-service") &&
      (!department || ticket.department === department),
  );

  for (const openTicket of ownOpenTickets) {
    const completed = enrichTicket(
      await updateTicket(openTicket.id, (ticket) =>
        applyStatusTransition(ticket, "completed"),
      ),
    );
    await recordTicketAudit("ticket.completed", openTicket, completed, staff, {
      reason: "auto-completed on call-next",
    });
    broadcastQueueEvent(
      "ticket.status-updated",
      createTicketEventPayload(completed),
    );
  }

  const waitingTickets = sortWaitingTickets(
    liveTickets.filter(
      (ticket) =>
        ticket.status === "waiting" &&
        (!department || ticket.department === department),
    ),
  );

  const nextTicket = waitingTickets[0];

  if (!nextTicket) {
    throw new HttpError(
      404,
      department
        ? `No waiting patients found for ${department}.`
        : "No waiting patients found in the queue.",
    );
  }

  const updatedTicket = enrichTicket(
    await updateTicket(nextTicket.id, (ticket) => ({
      ...applyStatusTransition(ticket, "called"),
      calledBy: callerName,
      calledRoom,
    })),
  );

  await recordTicketAudit("ticket.called", nextTicket, updatedTicket, staff);

  broadcastQueueEvent("ticket.called", createTicketEventPayload(updatedTicket));
  await dispatchCallNotifications(updatedTicket);
  await dispatchTurnReadinessNotifications(await getLiveTickets());

  return updatedTicket;
}

const secondCallAnnounced = new Set();

// Periodic sweep: re-announce unanswered calls once ("second call"), then
// park them as missed so the board keeps flowing without manual cleanup.
export async function sweepUnansweredCalls({
  secondCallAfterMs = 45_000,
  autoMissAfterMs = 90_000,
} = {}) {
  const now = Date.now();
  const live = await getLiveTickets();

  for (const ticket of live) {
    if (ticket.status !== "called" || !ticket.calledAt) {
      secondCallAnnounced.delete(ticket.id);
      continue;
    }

    const elapsed = now - new Date(ticket.calledAt).getTime();

    if (elapsed >= autoMissAfterMs) {
      const missed = enrichTicket(
        await updateTicket(ticket.id, (current) =>
          applyStatusTransition(current, "missed"),
        ),
      );
      secondCallAnnounced.delete(ticket.id);
      await recordTicketAudit("ticket.auto-missed", ticket, missed, null, {
        unansweredMs: autoMissAfterMs,
      });
      broadcastQueueEvent(
        "ticket.status-updated",
        createTicketEventPayload(missed),
      );
      broadcastQueueEvent("ticket.missed", createTicketEventPayload(missed));
      await dispatchMissedTurnNotification(missed);
      continue;
    }

    if (elapsed >= secondCallAfterMs && !secondCallAnnounced.has(ticket.id)) {
      secondCallAnnounced.add(ticket.id);
      broadcastQueueEvent("ticket.called", {
        ...createTicketEventPayload(ticket),
        attempt: 2,
      });
    }
  }
}

export async function updatePatientStatus(id, status, staff, room) {
  ensureStatus(status);

  const existing = await findTicketById(id);
  if (!existing) {
    throw new HttpError(404, "Ticket not found.");
  }

  ensureStatusTransition(existing.status, status);

  const updatedTicket = enrichTicket(
    await updateTicket(id, (ticket) => {
      const next = applyStatusTransition(ticket, status);
      if (status === "called") {
        return {
          ...next,
          calledBy: staff?.username ?? staff?.name ?? null,
          calledRoom: room?.trim() || staff?.roomNumber || null,
        };
      }
      return next;
    }),
  );

  await recordTicketAudit("ticket.status-changed", existing, updatedTicket, staff);

  broadcastQueueEvent(
    "ticket.status-updated",
    createTicketEventPayload(updatedTicket),
  );

  if (status === "called") {
    await dispatchCallNotifications(updatedTicket);
  }

  if (status === "missed") {
    await dispatchMissedTurnNotification(updatedTicket);
  }

  await dispatchTurnReadinessNotifications(await getLiveTickets());

  return updatedTicket;
}


const PRIORITY_ETA_WEIGHTS = { red: 0.1, yellow: 0.4, green: 1.0, black: 1.5 };
const DEFAULT_SERVICE_TIME_MINUTES = 12;
const BOTTLENECK_WAIT_THRESHOLD_MINUTES = 45;
const BOTTLENECK_QUEUE_THRESHOLD = 8;

function calculateHistoricalServiceTime(tickets) {
  const completed = tickets.filter(
    (t) => t.status === "completed" && t.serviceStartedAt && t.completedAt,
  );
  if (!completed.length) return DEFAULT_SERVICE_TIME_MINUTES;
  const totalMinutes = completed.reduce((sum, t) => {
    const duration = (new Date(t.completedAt).getTime() - new Date(t.serviceStartedAt).getTime()) / 60000;
    return sum + Math.max(1, duration);
  }, 0);
  return Math.round(totalMinutes / completed.length);
}

function calculateDepartmentETA(deptWaiting, deptActive, avgServiceTime) {
  if (!deptWaiting.length) return 0;
  const activeCount = Math.max(1, deptActive);
  const weightedQueue = deptWaiting.reduce((sum, t) => {
    return sum + (PRIORITY_ETA_WEIGHTS[t.priority] ?? 1.0);
  }, 0);
  const etaMinutes = Math.round((weightedQueue * avgServiceTime) / activeCount);
  return Math.max(1, etaMinutes);
}

function detectBottlenecks(tickets) {
  const warnings = [];
  const byDept = {};
  for (const t of tickets) {
    if (!byDept[t.department]) byDept[t.department] = { waiting: [], active: 0, missed: 0 };
    if (t.status === "waiting") byDept[t.department].waiting.push(t);
    if (t.status === "called" || t.status === "in-service") byDept[t.department].active += 1;
    if (t.status === "missed") byDept[t.department].missed += 1;
  }
  for (const [dept, data] of Object.entries(byDept)) {
    if (data.waiting.length >= BOTTLENECK_QUEUE_THRESHOLD) {
      warnings.push({
        department: dept,
        type: "long-queue",
        severity: data.waiting.length >= BOTTLENECK_QUEUE_THRESHOLD * 1.5 ? "critical" : "warning",
        message: `${dept} has ${data.waiting.length} patients waiting (threshold: ${BOTTLENECK_QUEUE_THRESHOLD})`,
        waitingCount: data.waiting.length,
        activeCount: data.active,
      });
    }
    const maxWait = data.waiting.length
      ? Math.max(...data.waiting.map((t) => t.waitMinutes ?? 0))
      : 0;
    if (maxWait >= BOTTLENECK_WAIT_THRESHOLD_MINUTES) {
      warnings.push({
        department: dept,
        type: "long-wait",
        severity: maxWait >= BOTTLENECK_WAIT_THRESHOLD_MINUTES * 1.5 ? "critical" : "warning",
        message: `Longest wait in ${dept} is ${maxWait} minutes (threshold: ${BOTTLENECK_WAIT_THRESHOLD_MINUTES}m)`,
        maxWaitMinutes: maxWait,
        waitingCount: data.waiting.length,
      });
    }
    if (data.active === 0 && data.waiting.length > 0) {
      warnings.push({
        department: dept,
        type: "no-staff",
        severity: "warning",
        message: `No staff serving in ${dept} with ${data.waiting.length} patients waiting`,
        waitingCount: data.waiting.length,
        activeCount: 0,
      });
    }
    if (data.missed >= 3) {
      warnings.push({
        department: dept,
        type: "high-missed",
        severity: "warning",
        message: `${data.missed} missed turns in ${dept}`,
        missedCount: data.missed,
      });
    }
  }
  return warnings.sort((a, b) => {
    const rank = { critical: 0, warning: 1 };
    return (rank[a.severity] ?? 2) - (rank[b.severity] ?? 2);
  });
}

export async function getETAEstimates() {
  const tickets = await getLiveTickets();
  const avgServiceTime = calculateHistoricalServiceTime(tickets);
  const byDept = {};
  for (const t of tickets) {
    if (!byDept[t.department]) byDept[t.department] = { waiting: [], active: 0 };
    if (t.status === "waiting") byDept[t.department].waiting.push(t);
    if (t.status === "called" || t.status === "in-service") byDept[t.department].active += 1;
  }
  const departments = {};
  for (const dept of DEPARTMENTS) {
    const data = byDept[dept] || { waiting: [], active: 0 };
    departments[dept] = {
      waitingCount: data.waiting.length,
      activeCount: data.active,
      avgServiceTimeMinutes: avgServiceTime,
      etaMinutes: calculateDepartmentETA(data.waiting, data.active, avgServiceTime),
    };
  }
  const bottlenecks = detectBottlenecks(tickets);
  return {
    departments,
    avgServiceTimeMinutes: avgServiceTime,
    bottlenecks,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function getTicketETA(ticketId) {
  const existing = await findTicketById(ticketId);
  if (!existing) {
    throw new HttpError(404, "Ticket not found.");
  }
  const tickets = await getLiveTickets();
  const avgServiceTime = calculateHistoricalServiceTime(tickets);
  const deptWaiting = tickets
    .filter((t) => t.department === existing.department && t.status === "waiting")
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
  const deptActive = tickets.filter(
    (t) => t.department === existing.department && (t.status === "called" || t.status === "in-service"),
  ).length;
  const position = deptWaiting.findIndex((t) => t.id === ticketId);
  const ahead = position >= 0 ? deptWaiting.slice(0, position) : [];
  const weightedAhead = ahead.reduce((sum, t) => sum + (PRIORITY_ETA_WEIGHTS[t.priority] ?? 1.0), 0);
  const ownWeight = PRIORITY_ETA_WEIGHTS[existing.priority] ?? 1.0;
  const activeCount = Math.max(1, deptActive);
  const etaMinutes = Math.round(((weightedAhead + ownWeight) * avgServiceTime) / activeCount);
  return {
    ticketId: existing.id,
    ticket: existing.ticket,
    department: existing.department,
    priority: existing.priority,
    queuePosition: position >= 0 ? position + 1 : null,
    patientsAhead: ahead.length,
    etaMinutes: Math.max(1, etaMinutes),
    avgServiceTimeMinutes: avgServiceTime,
    activeStaff: deptActive,
  };
}
export async function getQueueBoard(department, { publicView = false } = {}) {
  const allTickets = await getLiveTickets();
  const tickets = department ? allTickets.filter((t) => t.department === department) : allTickets;
  const nowServing = sortAllTickets(
    tickets.filter(
      (ticket) => ticket.status === "called" || ticket.status === "in-service",
    ),
  );
  const waiting = sortWaitingTickets(
    tickets.filter((ticket) => ticket.status === "waiting"),
  );
  const missed = sortAllTickets(tickets.filter((ticket) => ticket.status === "missed"));

  const avgServiceTime = calculateHistoricalServiceTime(tickets);
  const bottlenecks = detectBottlenecks(tickets);

  const departmentETAs = {};
  for (const dept of DEPARTMENTS) {
    const deptWaiting = waiting.filter((t) => t.department === dept);
    const deptActive = nowServing.filter((t) => t.department === dept).length;
    departmentETAs[dept] = {
      waitingCount: deptWaiting.length,
      activeCount: deptActive,
      etaMinutes: calculateDepartmentETA(deptWaiting, deptActive, avgServiceTime),
    };
  }

  const oiPrivacy = await getOIPrivacyMode();
  const mask = (list) => {
    const masked = oiPrivacy ? maskOITickets(list) : list;
    return publicView ? masked.map(sanitizePublicTicket) : masked;
  };
  const maskedNowServing = mask(nowServing);
  const maskedWaiting = mask(waiting);
  const maskedMissed = mask(missed);

  return {
    nowServing: maskedNowServing,
    waiting: maskedWaiting,
    missed: maskedMissed,
    totalWaiting: waiting.length,
    avgServiceTimeMinutes: avgServiceTime,
    departmentETAs,
    bottlenecks,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function getDashboardSummary(department) {
  const allTickets = sortAllTickets(await getLiveTickets());
  const tickets = department ? allTickets.filter((t) => t.department === department) : allTickets;
  const waiting = tickets.filter((ticket) => ticket.status === "waiting");
  const allNotifications = await listNotifications();
  const notifications = allNotifications.slice(0, 20);
  const notificationAnalytics = buildNotificationAnalytics(allNotifications);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const metrics = {
    total: tickets.length,
    waiting: waiting.length,
    active:
      tickets.filter(
        (ticket) => ticket.status === "called" || ticket.status === "in-service",
      ).length,
    avgWait: waiting.length
      ? Math.round(
          waiting.reduce((total, ticket) => total + ticket.waitMinutes, 0) /
            waiting.length,
        )
      : 0,
    notificationsToday: allNotifications.filter(
      (notification) =>
        new Date(notification.createdAt).getTime() >= startOfToday.getTime(),
    ).length,
    byPriority: {
      red: 0,
      yellow: 0,
      green: 0,
      black: 0,
    },
    byStatus: {
      waiting: 0,
      called: 0,
      "in-service": 0,
      missed: 0,
      completed: 0,
    },
    notificationChannels: {
      "display-board": 0,
      whatsapp: 0,
    },
    notificationStatuses: {
      queued: 0,
      sending: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      retrying: 0,
      failed: 0,
    },
    byDepartment: DEPARTMENTS.map((department) => ({
      dept: department,
      count: 0,
    })),
  };

  for (const ticket of tickets) {
    metrics.byPriority[ticket.priority] += 1;
    metrics.byStatus[ticket.status] += 1;
    const departmentRow = metrics.byDepartment.find(
      (entry) => entry.dept === ticket.department,
    );
    if (departmentRow) {
      departmentRow.count += 1;
    }
  }

  for (const notification of allNotifications) {
    if (Object.hasOwn(metrics.notificationChannels, notification.channel)) {
      metrics.notificationChannels[notification.channel] += 1;
    }

    if (Object.hasOwn(metrics.notificationStatuses, notification.status)) {
      metrics.notificationStatuses[notification.status] += 1;
    }
  }

  return {
    tickets,
    metrics,
    notifications,
    notificationAnalytics,
    safetyAlerts: {
      reassessment: await buildReassessmentAlerts(tickets),
      bottlenecks: detectBottlenecks(tickets),
    },
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function getNotifications(department) {
  const notifications = await listNotifications();
  const filtered = department ? notifications.filter((n) => n.department === department) : notifications;
  return filtered.slice(0, 20);
}

export async function getTicketTracking(ticketCode) {
  const normalizedTicketCode = normalizeTicketCode(ticketCode);

  if (!normalizedTicketCode) {
    throw new HttpError(400, "Ticket code is required.");
  }

  const tickets = await getLiveTickets();
  // Ticket codes wrap (A001..Z999, then reuse) — prefer a live ticket, and
  // otherwise the most recently issued one sharing this code.
  const matches = tickets
    .filter(
      (entry) => normalizeTicketCode(entry.ticket) === normalizedTicketCode,
    )
    .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
  const ticket =
    matches.find((entry) => entry.status !== "completed") ?? matches[0];

  if (!ticket) {
    throw new HttpError(404, `Ticket ${normalizedTicketCode} was not found.`);
  }

  const departmentWaiting = sortWaitingTickets(
    tickets.filter(
      (entry) =>
        entry.department === ticket.department && entry.status === "waiting",
    ),
  );
  const activeInDepartment = sortAllTickets(
    tickets.filter(
      (entry) =>
        entry.department === ticket.department &&
        (entry.status === "called" || entry.status === "in-service"),
    ),
  );
  const departmentPosition =
    ticket.status === "waiting"
      ? departmentWaiting.findIndex((entry) => entry.id === ticket.id) + 1
      : null;
  const patientsAhead =
    departmentPosition && departmentPosition > 0 ? departmentPosition - 1 : 0;

  const result = {
    ticket,
    queue: {
      departmentPosition,
      patientsAhead,
      estimatedWaitMinutes:
        ticket.status === "waiting"
          ? await buildEstimatedWaitMinutes(patientsAhead, activeInDepartment.length)
          : 0,
      totalWaitingInDepartment: departmentWaiting.length,
      totalWaitingOverall: tickets.filter((entry) => entry.status === "waiting")
        .length,
      missedInDepartment: tickets.filter(
        (entry) => entry.department === ticket.department && entry.status === "missed",
      ).length,
      activeInDepartment: activeInDepartment.map((entry) => ({
        id: entry.id,
        ticket: entry.ticket,
        priority: entry.priority,
        status: entry.status,
      })),
    },
    notifications: await getNotificationsForTicket(ticket.id),
    lastUpdatedAt: new Date().toISOString(),
  };

  result.ticket = sanitizePublicTicket(ticket);

  // Notification bodies embed the patient's name ("Hello Tendai…") —
  // redact it and drop the recipient/contact fields for the public view.
  const privateName = ticket.patientName?.trim();
  result.notifications = (result.notifications ?? []).map((notification) => {
    const redact = (text) =>
      typeof text === "string" && privateName
        ? text
            .split(`Hello ${privateName}`)
            .join("Hello there")
            .split(privateName)
            .join("the patient")
        : text;
    return {
      ...notification,
      title: redact(notification.title),
      message: redact(notification.message),
      recipient: undefined,
      patientName: undefined,
    };
  });

  const oiPrivacy = await getOIPrivacyMode();
  return oiPrivacy ? maskOITrackingResponse(result) : result;
}

export async function kioskLookup(identifier) {
  const value = identifier?.trim();
  if (!value) {
    throw new HttpError(400, "Identifier is required.");
  }

  const patientNumberPattern = /^WL-P\d+$/i;
  let patient = null;

  if (patientNumberPattern.test(value)) {
    patient = await findPatientByPatientNumber(value.toUpperCase());
  }

  if (!patient) {
    patient = await findPatientByPhone(value);
  }

  if (!patient) {
    const needle = normalizeIdentity(value);
    patient =
      (await listPatients()).find(
        (entry) =>
          entry.nationalId && normalizeIdentity(entry.nationalId) === needle,
      ) ?? null;
  }

  if (!patient) {
    throw new HttpError(404, "No patient found. Please register at the front desk.");
  }

  const preRegisteredTicket = (await listTickets()).find(
    (entry) => entry.patientId === patient.id && entry.status === "pre-registered",
  );

  return {
    id: patient.id,
    patientNumber: patient.patientNumber,
    patientName: patient.patientName,
    phone: patient.phone,
    gender: patient.gender,
    dob: patient.dob,
    lastVisitAt: patient.lastVisitAt,
    preRegisteredTicket: preRegisteredTicket
      ? {
          id: preRegisteredTicket.id,
          ticket: preRegisteredTicket.ticket,
          department: preRegisteredTicket.department,
          chiefComplaint: preRegisteredTicket.chiefComplaint,
        }
      : null,
  };
}

export async function kioskCheckIn(payload) {
  const patientId = payload.patientId?.trim();

  if (!patientId) {
    throw new HttpError(400, "Patient ID is required.");
  }

  const patient = await findPatientById(patientId);
  if (!patient) {
    throw new HttpError(404, "Patient not found. Please register at the front desk.");
  }

  const openTicket = await findOpenTicketForPatient(patient.id);
  if (openTicket) {
    if (openTicket.status === "pre-registered") {
      // Idempotent check-in — hand back the same code instead of
      // minting a duplicate the patient would have to track.
      return enrichTicket(openTicket);
    }
    throw new HttpError(
      409,
      `You already have an active ticket ${openTicket.ticket} in ${openTicket.department}. Please proceed to the waiting area.`,
    );
  }

  const registeredAt = new Date().toISOString();
  const sequence = await getNextSequence();
  const notificationConsent = Boolean(payload.notificationConsent);
  const ticket = {
    id: crypto.randomUUID(),
    ticket: createTicketCode(sequence),
    patientId: patient.id,
    patientNumber: patient.patientNumber,
    patientName: patient.patientName,
    nationalId: patient.nationalId ?? "",
    dob: patient.dob ?? "",
    gender: patient.gender ?? "unknown",
    phone: patient.phone ?? "",
    address: patient.address ?? "",
    patientCategory: patient.patientCategory ?? "walk-in",
    nextOfKinName: patient.nextOfKinName ?? "",
    nextOfKinPhone: patient.nextOfKinPhone ?? "",
    notificationConsent,
    department: "Reception",
    chiefComplaint: payload.chiefComplaint?.trim() ?? "",
    priority: "green",
    status: "pre-registered",
    registeredAt,
    triagedAt: null,
    calledAt: null,
    serviceStartedAt: null,
    completedAt: null,
    missedAt: null,
    recalledAt: null,
    transferredAt: null,
    previousDepartment: "",
    recallCount: 0,
    whatsApp: notificationConsent && Boolean(payload.whatsApp),
  };

  const createdTicket = enrichTicket(await createTicket(ticket));

  await updatePatient(patient.id, (current) => ({
    ...current,
    lastVisitAt: registeredAt,
    updatedAt: registeredAt,
  }));

  broadcastQueueEvent("ticket.registered", createTicketEventPayload(createdTicket));
  const registrationNotification =
    await dispatchRegistrationNotification(createdTicket);
  refreshTurnReadinessNotifications();

  return {
    ...createdTicket,
    handoff: buildRegistrationHandoff(
      createdTicket,
      registrationNotification,
    ),
  };
}

export async function preRegisterPatient(payload) {
  const patientName = payload.fullName?.trim();
  const patientCategory = payload.patientCategory ?? "walk-in";

  if (!patientName) {
    throw new HttpError(400, "Full name is required.");
  }

  ensurePatientCategory(patientCategory);

  const registeredAt = new Date().toISOString();
  const patient = await resolvePatientProfile(payload, registeredAt);

  if (!patient.nationalId?.trim()) {
    throw new HttpError(400, "National ID is required.");
  }

  const openTicket = await findOpenTicketForPatient(patient.id);
  if (openTicket) {
    if (openTicket.status === "pre-registered") {
      // Idempotent — return the same code rather than a duplicate.
      return enrichTicket(openTicket);
    }
    throw new HttpError(
      409,
      `You already have an active ticket ${openTicket.ticket} in ${openTicket.department}.`,
    );
  }

  const sequence = await getNextSequence();
  const notificationConsent = Boolean(payload.notificationConsent);
  const ticket = {
    id: crypto.randomUUID(),
    ticket: createTicketCode(sequence),
    patientId: patient.id,
    patientNumber: patient.patientNumber,
    patientName,
    nationalId: payload.nationalId?.trim() || patient.nationalId,
    dob: payload.dob ?? "",
    gender: payload.gender ?? "unknown",
    phone: payload.phone?.trim() ?? "",
    address: payload.address?.trim() ?? "",
    patientCategory,
    nextOfKinName: payload.nextOfKinName?.trim() ?? "",
    nextOfKinPhone: payload.nextOfKinPhone?.trim() ?? "",
    notificationConsent,
    department: "Reception",
    chiefComplaint: payload.chiefComplaint?.trim() ?? "",
    priority: "green",
    status: "pre-registered",
    registeredAt,
    triagedAt: null,
    calledAt: null,
    serviceStartedAt: null,
    completedAt: null,
    missedAt: null,
    recalledAt: null,
    transferredAt: null,
    previousDepartment: "",
    recallCount: 0,
    whatsApp: notificationConsent && Boolean(payload.whatsApp),
  };

  const createdTicket = enrichTicket(await createTicket(ticket));

  await updatePatient(patient.id, (current) => ({
    ...current,
    lastVisitAt: registeredAt,
    updatedAt: registeredAt,
  }));

  broadcastQueueEvent("ticket.registered", createTicketEventPayload(createdTicket));

  return createdTicket;
}

export async function confirmArrival(ticketId, staff, department) {
  if (!department) {
    throw new HttpError(400, "Select the department this patient is going to.");
  }
  ensureDepartment(department);

  const existing = await findTicketById(ticketId);
  if (!existing) {
    throw new HttpError(404, "Ticket not found.");
  }

  if (existing.status !== "pre-registered") {
    throw new HttpError(400, "Only pre-registered tickets can be confirmed for arrival.");
  }

  const updatedTicket = enrichTicket(
    await updateTicket(ticketId, (ticket) => ({
      ...applyStatusTransition(ticket, "waiting"),
      department,
      registeredAt: new Date().toISOString(),
    })),
  );

  await recordTicketAudit("ticket.arrival-confirmed", existing, updatedTicket, staff);

  broadcastQueueEvent("ticket.arrival-confirmed", createTicketEventPayload(updatedTicket));
  const registrationNotification =
    await dispatchRegistrationNotification(updatedTicket);
  refreshTurnReadinessNotifications();

  return {
    ...updatedTicket,
    handoff: buildRegistrationHandoff(
      updatedTicket,
      registrationNotification,
    ),
  };
}

export async function saveTriageAssessment(id, payload, staff) {
  ensurePriority(payload.priority);

  const existing = await findTicketById(id);
  if (!existing) {
    throw new HttpError(404, "Ticket not found.");
  }

  const assessment = {
    vitals: {
      bloodPressureSystolic: payload.vitals?.bloodPressureSystolic ?? null,
      bloodPressureDiastolic: payload.vitals?.bloodPressureDiastolic ?? null,
      heartRate: payload.vitals?.heartRate ?? null,
      temperature: payload.vitals?.temperature ?? null,
      respiratoryRate: payload.vitals?.respiratoryRate ?? null,
      oxygenSaturation: payload.vitals?.oxygenSaturation ?? null,
    },
    symptoms: Array.isArray(payload.symptoms)
      ? payload.symptoms.map((s) => String(s).trim()).filter(Boolean).join(", ")
      : String(payload.symptoms ?? "").trim(),
    painScore: payload.painScore != null ? Number(payload.painScore) : null,
    severity: String(payload.severity ?? "").trim(),
    notes: String(payload.notes ?? "").trim(),
    assessedAt: new Date().toISOString(),
  };

  const emergencyTriggers = evaluateEmergencyVitals(assessment.vitals, assessment.painScore);
  const isEmergencyAutoClassified = emergencyTriggers.length > 0 && payload.priority !== "red";
  const finalPriority = emergencyTriggers.length > 0 ? "red" : payload.priority;
  assessment.emergencyTriggers = emergencyTriggers;
  assessment.autoClassified = isEmergencyAutoClassified;

  const routedDepartment = routeDepartmentByComplaint(existing.chiefComplaint);
  const shouldReroute = routedDepartment && routedDepartment !== existing.department;

  const updatedTicket = enrichTicket(
    await updateTicket(id, (ticket) => ({
      ...ticket,
      priority: finalPriority,
      triagedAt: assessment.assessedAt,
      triageAssessment: assessment,
      ...(shouldReroute ? { department: routedDepartment, previousDepartment: ticket.department } : {}),
    })),
  );

  await recordTicketAudit("ticket.triage-assessed", existing, updatedTicket, staff, {
    autoClassified: isEmergencyAutoClassified,
    emergencyTriggerCount: emergencyTriggers.length,
    rerouted: Boolean(shouldReroute),
  });

  broadcastQueueEvent(
    "ticket.priority-updated",
    createTicketEventPayload(updatedTicket),
  );

  if (finalPriority === "red") {
    broadcastQueueEvent(
      "ticket.emergency-escalation",
      { ...createTicketEventPayload(updatedTicket), emergencyTriggers, autoClassified: isEmergencyAutoClassified },
    );
  }

  if (shouldReroute) {
    broadcastQueueEvent(
      "ticket.department-rerouted",
      { ...createTicketEventPayload(updatedTicket), previousDepartment: existing.department, newDepartment: routedDepartment },
    );
  }

  await dispatchTurnReadinessNotifications(await getLiveTickets());

  return updatedTicket;
}

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

  const normalizedItems = items.map((item) => ({
    id: crypto.randomUUID(),
    drugName: String(item?.drugName ?? "").trim(),
    dosage: String(item?.dosage ?? "").trim(),
    quantity: String(item?.quantity ?? "1").trim() || "1",
    instructions: String(item?.instructions ?? "").trim(),
  }));

  if (normalizedItems.some((item) => !item.drugName)) {
    throw new HttpError(400, "Each prescription item requires a drug name.");
  }

  const prescription = await createPrescription({
    ticketId,
    ticketCode: existing.ticket,
    patientName: existing.patientName,
    department: existing.department,
    items: normalizedItems,
    state: "prescribed",
    notes: notes?.trim() ?? "",
    prescribedBy: actorInfo(staff),
    createdAt: new Date().toISOString(),
    stateHistory: [{ state: "prescribed", actor: actorInfo(staff), at: new Date().toISOString() }],
  });

  await recordAuditEventSafely({
    actor: staff,
    action: "prescription.created",
    entityType: "prescription",
    entityId: prescription.id,
    entityLabel: prescription.ticketCode,
    after: {
      state: prescription.state,
      ticketCode: prescription.ticketCode,
      itemCount: prescription.items?.length ?? 0,
    },
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
    throw new HttpError(409, `Cannot transition from "${existing.state}" to "${newState}".`);
  }

  const updated = await updatePrescription(id, (p) => ({
    ...p,
    state: newState,
    stateHistory: [...(p.stateHistory ?? []), { state: newState, actor: actorInfo(staff), at: new Date().toISOString() }],
    ...(newState === "collected" ? { collectedAt: new Date().toISOString(), collectedBy: actorInfo(staff) } : {}),
    ...(newState === "dispensing" ? { dispensingStartedAt: new Date().toISOString() } : {}),
    ...(newState === "ready" ? { readyAt: new Date().toISOString() } : {}),
  }));

  await recordAuditEventSafely({
    actor: staff,
    action: "prescription.state-changed",
    entityType: "prescription",
    entityId: id,
    entityLabel: existing.ticketCode,
    before: { state: existing.state, ticketCode: existing.ticketCode },
    after: { state: updated.state, ticketCode: updated.ticketCode },
  });

  broadcastQueueEvent("prescription.state-updated", {
    prescriptionId: id,
    ticketId: existing.ticketId,
    ticketCode: existing.ticketCode,
    oldState: existing.state,
    newState,
  });

  if (newState === "ready") {
    const ticket = await findTicketById(existing.ticketId);
    if (ticket) {
      await dispatchPrescriptionReadyNotification(ticket, updated);
    }
  }

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

export async function createTestOrderRecord({ ticketId, testType, priority, notes }, staff) {
  const ticket = await findTicketById(ticketId);
  if (!ticket) throw new HttpError(404, "Ticket not found.");
  if (!TEST_ORDER_TYPES.includes(testType)) {
    throw new HttpError(400, "Invalid test type.");
  }
  const order = await createTestOrder({
    ticketId: ticket.id,
    ticketCode: ticket.ticket,
    patientName: ticket.patientName,
    department: ticket.department,
    testType,
    priority: priority || "routine",
    notes: notes || "",
    state: "ordered",
    orderedBy: actorInfo(staff),
    orderedAt: new Date().toISOString(),
    stateHistory: [{ state: "ordered", at: new Date().toISOString(), actor: actorInfo(staff) }],
  });
  await recordAuditEventSafely({
    actor: staff,
    action: "test-order.created",
    entityType: "test-order",
    entityId: order.id,
    entityLabel: order.ticketCode,
    after: {
      state: order.state,
      ticketCode: order.ticketCode,
      priority: order.priority,
    },
  });
  broadcastQueueEvent("test-order.created", {
    testOrderId: order.id,
    ticketId: ticket.id,
    ticketCode: ticket.ticket,
    testType,
  });
  return order;
}

export async function getTestOrders(filters = {}) {
  let orders = await listTestOrders();
  if (filters.ticketId) {
    orders = orders.filter((o) => o.ticketId === filters.ticketId);
  }
  if (filters.state) {
    orders = orders.filter((o) => o.state === filters.state);
  }
  if (filters.testType) {
    orders = orders.filter((o) => o.testType === filters.testType);
  }
  return orders.sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime());
}

export async function getTestOrdersForTicket(ticketId) {
  return findTestOrdersByTicketId(ticketId);
}

export async function updateTestOrderState(id, newState, staff) {
  const existing = await findTestOrderById(id);
  if (!existing) throw new HttpError(404, "Test order not found.");
  if (!TEST_ORDER_STATES[newState]) {
    throw new HttpError(400, "Invalid test order state.");
  }
  if (!canTransitionTestOrderState(existing.state, newState)) {
    throw new HttpError(409, `Cannot transition from ${existing.state} to ${newState}.`);
  }
  const updated = await updateTestOrder(id, (order) => ({
    ...order,
    state: newState,
    stateHistory: [
      ...order.stateHistory,
      { state: newState, at: new Date().toISOString(), actor: actorInfo(staff) },
    ],
    ...(newState === "sample-collected" ? { sampleCollectedAt: new Date().toISOString() } : {}),
    ...(newState === "in-progress" ? { processingStartedAt: new Date().toISOString() } : {}),
    ...(newState === "completed" ? { completedAt: new Date().toISOString() } : {}),
    ...(newState === "result-ready" ? { resultReadyAt: new Date().toISOString() } : {}),
  }));
  await recordAuditEventSafely({
    actor: staff,
    action: "test-order.state-changed",
    entityType: "test-order",
    entityId: id,
    entityLabel: existing.ticketCode,
    before: { state: existing.state, ticketCode: existing.ticketCode },
    after: { state: updated.state, ticketCode: updated.ticketCode },
  });
  broadcastQueueEvent("test-order.state-updated", {
    testOrderId: id,
    ticketId: existing.ticketId,
    ticketCode: existing.ticketCode,
    oldState: existing.state,
    newState,
  });
  if (newState === "result-ready") {
    const ticket = await findTicketById(existing.ticketId);
    if (ticket) {
      await dispatchTestResultReadyNotification(ticket, updated);
    }
  }
  return updated;
}

export async function getTestOrderSummary() {
  const orders = await listTestOrders();
  const byState = {};
  for (const state of Object.keys(TEST_ORDER_STATES)) {
    byState[state] = 0;
  }
  for (const o of orders) {
    byState[o.state] = (byState[o.state] ?? 0) + 1;
  }
  return {
    total: orders.length,
    byState,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function suggestNextDepartment(ticketId) {
  const ticket = await findTicketById(ticketId);
  if (!ticket) throw new HttpError(404, "Ticket not found.");

  const prescriptions = await findPrescriptionsByTicketId(ticketId);
  const testOrders = await findTestOrdersByTicketId(ticketId);

  const suggestions = [];

  const activePrescriptions = prescriptions.filter(
    (p) => p.state !== "collected" && p.state !== "cancelled",
  );
  if (activePrescriptions.length > 0) {
    const allReady = activePrescriptions.every((p) => p.state === "ready");
    suggestions.push({
      department: "Pharmacy",
      reason: allReady
        ? "Prescription(s) ready for collection"
        : `${activePrescriptions.length} active prescription(s) in progress`,
      priority: allReady ? "high" : "medium",
    });
  }

  const activeTestOrders = testOrders.filter(
    (o) => o.state !== "result-ready" && o.state !== "cancelled",
  );
  if (activeTestOrders.length > 0) {
    const allResultsReady = testOrders.some((o) => o.state === "result-ready");
    if (allResultsReady) {
      suggestions.push({
        department: ticket.previousDepartment || "Casualty / Triage",
        reason: "Lab results ready — return to referring department",
        priority: "high",
      });
    } else {
      const dept = testOrders.some((o) => ["x-ray-chest", "ultrasound", "ct-scan"].includes(o.testType))
        ? "Radiology"
        : "Laboratory";
      suggestions.push({
        department: dept,
        reason: `${activeTestOrders.length} test order(s) in progress`,
        priority: "medium",
      });
    }
  }

  if (suggestions.length === 0 && ticket.status === "completed") {
    suggestions.push({
      department: "Casualty / Triage",
      reason: "No pending prescriptions or test orders — patient may be discharged",
      priority: "low",
    });
  }

  return {
    ticketId: ticket.id,
    ticketCode: ticket.ticket,
    currentDepartment: ticket.department,
    currentStatus: ticket.status,
    suggestions: suggestions.sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[a.priority] - rank[b.priority];
    }),
  };
}

export async function submitFeedback(ticketId, { rating, categories, comment }) {
  const ticket = await findTicketById(ticketId);
  if (!ticket) throw new HttpError(404, "Ticket not found.");
  if (rating == null || rating < 1 || rating > 5) {
    throw new HttpError(400, "Rating must be between 1 and 5.");
  }
  const existing = await findFeedbackByTicketId(ticket.id);
  if (existing.length > 0) {
    throw new HttpError(409, "Feedback was already submitted for this ticket.");
  }
  const feedback = await createFeedback({
    ticketId: ticket.id,
    ticketCode: ticket.ticket,
    patientName: ticket.patientName,
    department: ticket.department,
    rating: Number(rating),
    categories: Array.isArray(categories) ? categories : [],
    comment: comment || "",
    submittedAt: new Date().toISOString(),
  });
  broadcastQueueEvent("feedback.submitted", {
    feedbackId: feedback.id,
    ticketId: ticket.id,
    ticketCode: ticket.ticket,
    rating: feedback.rating,
  });
  return feedback;
}

export async function getFeedbackForTicket(ticketId) {
  // Public endpoint — drop the patient's name from stored feedback rows.
  return (await findFeedbackByTicketId(ticketId)).map(
    ({ patientName: _patientName, ...safe }) => safe,
  );
}

export async function getReassessmentAlerts() {
  const tickets = await getLiveTickets();
  const alerts = await buildReassessmentAlerts(tickets);
  return {
    alerts,
    count: alerts.length,
    thresholds: await getTriageReassessmentThresholds().catch(() => FALLBACK_TRIAGE_THRESHOLDS),
    lastUpdatedAt: new Date().toISOString(),
  };
}

function parseDateFilter(query) {
  const fromStr = query?.get("from");
  const toStr = query?.get("to");
  const from = fromStr ? new Date(fromStr) : null;
  const to = toStr ? new Date(toStr) : null;
  return { from, to };
}

function filterByDate(tickets, from, to) {
  return tickets.filter((t) => {
    const created = new Date(t.registeredAt);
    if (from && created < from) return false;
    if (to && created > to) return false;
    return true;
  });
}

export async function getAverageWaitTimeReport(query) {
  const { from, to } = parseDateFilter(query);
  const allTickets = await getLiveTickets();
  const tickets = filterByDate(allTickets, from, to);

  const byDept = {};
  for (const dept of DEPARTMENTS) {
    const deptTickets = tickets.filter((t) => t.department === dept);
    const waiting = deptTickets.filter((t) => t.status === "waiting");
    const completed = deptTickets.filter((t) => t.status === "completed" && t.serviceStartedAt && t.completedAt);
    const serviceDurations = completed.map((t) =>
      Math.max(1, Math.round((new Date(t.completedAt).getTime() - new Date(t.serviceStartedAt).getTime()) / 60000)),
    );
    const waitDurations = waiting.map((t) => t.waitMinutes ?? 0);
    byDept[dept] = {
      totalTickets: deptTickets.length,
      waiting: waiting.length,
      avgCurrentWait: waitDurations.length ? Math.round(waitDurations.reduce((a, b) => a + b, 0) / waitDurations.length) : 0,
      avgServiceTime: serviceDurations.length ? Math.round(serviceDurations.reduce((a, b) => a + b, 0) / serviceDurations.length) : 0,
      maxWait: waitDurations.length ? Math.max(...waitDurations) : 0,
      completed: completed.length,
    };
  }

  const allWaiting = tickets.filter((t) => t.status === "waiting");
  const allCompleted = tickets.filter((t) => t.status === "completed" && t.serviceStartedAt && t.completedAt);
  const allServiceDurations = allCompleted.map((t) =>
    Math.max(1, Math.round((new Date(t.completedAt).getTime() - new Date(t.serviceStartedAt).getTime()) / 60000)),
  );

  return {
    period: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
    overall: {
      totalTickets: tickets.length,
      avgWait: allWaiting.length ? Math.round(allWaiting.reduce((a, t) => a + (t.waitMinutes ?? 0), 0) / allWaiting.length) : 0,
      avgServiceTime: allServiceDurations.length ? Math.round(allServiceDurations.reduce((a, b) => a + b, 0) / allServiceDurations.length) : 0,
      completed: allCompleted.length,
    },
    byDepartment: byDept,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function getDepartmentPerformanceReport(query) {
  const { from, to } = parseDateFilter(query);
  const allTickets = await getLiveTickets();
  const tickets = filterByDate(allTickets, from, to);

  const byDept = {};
  for (const dept of DEPARTMENTS) {
    const deptTickets = tickets.filter((t) => t.department === dept);
    const completed = deptTickets.filter((t) => t.status === "completed");
    const missed = deptTickets.filter((t) => t.status === "missed");
    const waiting = deptTickets.filter((t) => t.status === "waiting");
    const active = deptTickets.filter((t) => t.status === "called" || t.status === "in-service");
    const serviceDurations = completed
      .filter((t) => t.serviceStartedAt && t.completedAt)
      .map((t) => Math.max(1, Math.round((new Date(t.completedAt).getTime() - new Date(t.serviceStartedAt).getTime()) / 60000)));

    byDept[dept] = {
      totalTickets: deptTickets.length,
      completed: completed.length,
      missed: missed.length,
      missedRate: deptTickets.length ? Math.round((missed.length / deptTickets.length) * 100) : 0,
      waiting: waiting.length,
      active: active.length,
      avgServiceTime: serviceDurations.length ? Math.round(serviceDurations.reduce((a, b) => a + b, 0) / serviceDurations.length) : 0,
      throughput: completed.length,
      byPriority: {
        red: deptTickets.filter((t) => t.priority === "red").length,
        yellow: deptTickets.filter((t) => t.priority === "yellow").length,
        green: deptTickets.filter((t) => t.priority === "green").length,
        black: deptTickets.filter((t) => t.priority === "black").length,
      },
    };
  }

  return {
    period: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
    byDepartment: byDept,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function getNoShowReport(query) {
  const { from, to } = parseDateFilter(query);
  const allTickets = await getLiveTickets();
  const allNotifications = await listNotifications();
  const tickets = filterByDate(allTickets, from, to);

  const missedTickets = tickets.filter((t) => t.status === "missed");
  const completedTickets = tickets.filter((t) => t.status === "completed");

  const missedWithNotifications = missedTickets.map((t) => {
    const notifs = allNotifications.filter((n) => n.ticketId === t.id);
    const delivered = notifs.filter((n) => n.status === "delivered" || n.status === "read");
    const failed = notifs.filter((n) => n.status === "failed");
    return {
      ticketId: t.id,
      ticket: t.ticket,
      patientName: t.patientName,
      department: t.department,
      priority: t.priority,
      waitMinutes: t.waitMinutes,
      notificationConsent: t.notificationConsent,
      notificationsSent: notifs.length,
      notificationsDelivered: delivered.length,
      notificationsFailed: failed.length,
      hadDeliveredNotification: delivered.length > 0,
    };
  });

  const missedWithDeliveredNotif = missedWithNotifications.filter((t) => t.hadDeliveredNotification).length;
  const missedWithoutNotif = missedWithNotifications.filter((t) => t.notificationsSent === 0).length;

  return {
    period: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
    overall: {
      totalTickets: tickets.length,
      missed: missedTickets.length,
      completed: completedTickets.length,
      noShowRate: tickets.length ? Math.round((missedTickets.length / tickets.length) * 100) : 0,
      missedWithDeliveredNotification: missedWithDeliveredNotif,
      missedWithoutNotification: missedWithoutNotif,
      notificationEffect: missedTickets.length > 0
        ? Math.round((missedWithoutNotif / missedTickets.length) * 100)
        : 0,
    },
    missedTickets: missedWithNotifications,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function getTriageReport(query) {
  const { from, to } = parseDateFilter(query);
  const allTickets = await getLiveTickets();
  const tickets = filterByDate(allTickets, from, to);

  const triaged = tickets.filter((t) => t.triageAssessment || t.triagedAt);
  const notTriaged = tickets.filter((t) => !t.triageAssessment && !t.triagedAt);

  const byPriority = {};
  for (const prio of Object.keys(PRIORITY_META)) {
    const prioTickets = triaged.filter((t) => t.priority === prio);
    const withAssessment = prioTickets.filter((t) => t.triageAssessment);
    const autoClassified = withAssessment.filter((t) => t.triageAssessment.autoClassified);
    const emergencyTriggers = withAssessment.flatMap((t) => t.triageAssessment.emergencyTriggers ?? []);

    const triageDurations = withAssessment
      .filter((t) => t.registeredAt && t.triagedAt)
      .map((t) => Math.max(0, Math.round((new Date(t.triagedAt).getTime() - new Date(t.registeredAt).getTime()) / 60000)));

    byPriority[prio] = {
      total: prioTickets.length,
      withAssessment: withAssessment.length,
      autoClassified: autoClassified.length,
      avgTriageTimeMinutes: triageDurations.length ? Math.round(triageDurations.reduce((a, b) => a + b, 0) / triageDurations.length) : 0,
      outcomes: {
        completed: prioTickets.filter((t) => t.status === "completed").length,
        missed: prioTickets.filter((t) => t.status === "missed").length,
        waiting: prioTickets.filter((t) => t.status === "waiting").length,
        inService: prioTickets.filter((t) => t.status === "called" || t.status === "in-service").length,
      },
      emergencyTriggers: emergencyTriggers.slice(0, 10),
    };
  }

  const allTriageDurations = triaged
    .filter((t) => t.registeredAt && t.triagedAt)
    .map((t) => Math.max(0, Math.round((new Date(t.triagedAt).getTime() - new Date(t.registeredAt).getTime()) / 60000)));

  return {
    period: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
    overall: {
      totalTickets: tickets.length,
      triaged: triaged.length,
      notTriaged: notTriaged.length,
      triageRate: tickets.length ? Math.round((triaged.length / tickets.length) * 100) : 0,
      avgTriageTimeMinutes: allTriageDurations.length ? Math.round(allTriageDurations.reduce((a, b) => a + b, 0) / allTriageDurations.length) : 0,
      autoClassified: triaged.filter((t) => t.triageAssessment?.autoClassified).length,
      rerouted: triaged.filter((t) => t.previousDepartment && t.previousDepartment !== t.department).length,
    },
    byPriority: byPriority,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function getLabTurnaroundReport(query) {
  const { from, to } = parseDateFilter(query);
  const orders = await listTestOrders();

  const filtered = orders.filter((o) => {
    const created = new Date(o.orderedAt);
    if (from && created < from) return false;
    if (to && created > to) return false;
    return true;
  });

  const byTestType = {};
  let totalTurnaround = 0;
  let completedCount = 0;

  for (const order of filtered) {
    const type = order.testType ?? "unknown";
    if (!byTestType[type]) {
      byTestType[type] = {
        total: 0,
        completed: 0,
        avgTurnaroundMinutes: 0,
        avgSampleToResultMinutes: 0,
        turnaroundSum: 0,
        sampleToResultSum: 0,
      };
    }
    byTestType[type].total++;

    if (order.resultReadyAt) {
      const ordered = new Date(order.orderedAt).getTime();
      const resultReady = new Date(order.resultReadyAt).getTime();
      const turnaround = Math.max(1, Math.round((resultReady - ordered) / 60000));
      byTestType[type].completed++;
      byTestType[type].turnaroundSum += turnaround;
      totalTurnaround += turnaround;
      completedCount++;

      if (order.sampleCollectedAt) {
        const sampleCollected = new Date(order.sampleCollectedAt).getTime();
        const sampleToResult = Math.max(1, Math.round((resultReady - sampleCollected) / 60000));
        byTestType[type].sampleToResultSum += sampleToResult;
      }
    }
  }

  for (const type of Object.keys(byTestType)) {
    const t = byTestType[type];
    t.avgTurnaroundMinutes = t.completed ? Math.round(t.turnaroundSum / t.completed) : 0;
    t.avgSampleToResultMinutes = t.completed ? Math.round(t.sampleToResultSum / t.completed) : 0;
    delete t.turnaroundSum;
    delete t.sampleToResultSum;
  }

  const pending = filtered.filter((o) => o.state !== "result-ready" && o.state !== "cancelled");
  const inProgress = filtered.filter((o) => o.state === "in-progress" || o.state === "sample-collected");

  return {
    overall: {
      totalOrders: filtered.length,
      completed: completedCount,
      pending: pending.length,
      inProgress: inProgress.length,
      avgTurnaroundMinutes: completedCount ? Math.round(totalTurnaround / completedCount) : 0,
    },
    byTestType,
    pendingDetails: pending.map((o) => ({
      id: o.id,
      ticketCode: o.ticketCode,
      testType: o.testType,
      state: o.state,
      orderedAt: o.orderedAt,
      waitingMinutes: Math.max(1, Math.round((Date.now() - new Date(o.orderedAt).getTime()) / 60000)),
    })),
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function getStaffWorkloadReport(query) {
  const { from, to } = parseDateFilter(query);
  const allTickets = await getLiveTickets();
  const tickets = filterByDate(allTickets, from, to);

  const staffMap = {};

  function ensureStaffEntry(name) {
    const key = name || "Unassigned";
    if (!staffMap[key]) {
      staffMap[key] = {
        staffName: key,
        triaged: 0,
        called: 0,
        completed: 0,
        transferred: 0,
        prescriptionsCreated: 0,
        testOrdersCreated: 0,
        totalActions: 0,
      };
    }
    return staffMap[key];
  }

  for (const ticket of tickets) {
    if (ticket.triagedBy?.name) {
      const entry = ensureStaffEntry(ticket.triagedBy.name);
      entry.triaged++;
      entry.totalActions++;
    }
    if (ticket.calledBy?.name) {
      const entry = ensureStaffEntry(ticket.calledBy.name);
      entry.called++;
      entry.totalActions++;
    }
    if (ticket.completedBy?.name) {
      const entry = ensureStaffEntry(ticket.completedBy.name);
      entry.completed++;
      entry.totalActions++;
    }
    if (ticket.transferredBy?.name) {
      const entry = ensureStaffEntry(ticket.transferredBy.name);
      entry.transferred++;
      entry.totalActions++;
    }
  }

  const prescriptions = await listPrescriptions();
  for (const rx of prescriptions) {
    if (rx.createdBy?.name) {
      const entry = ensureStaffEntry(rx.createdBy.name);
      entry.prescriptionsCreated++;
      entry.totalActions++;
    }
  }

  const testOrders = await listTestOrders();
  for (const order of testOrders) {
    if (order.orderedBy?.name) {
      const entry = ensureStaffEntry(order.orderedBy.name);
      entry.testOrdersCreated++;
      entry.totalActions++;
    }
  }

  const staffList = Object.values(staffMap).sort((a, b) => b.totalActions - a.totalActions);

  return {
    overall: {
      totalStaff: staffList.length,
      totalActions: staffList.reduce((sum, s) => sum + s.totalActions, 0),
      totalTriage: staffList.reduce((sum, s) => sum + s.triaged, 0),
      totalCompleted: staffList.reduce((sum, s) => sum + s.completed, 0),
    },
    byStaff: staffList,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function getOutOfStockReport() {
  const prescriptions = await listPrescriptions();
  const itemMap = {};

  for (const rx of prescriptions) {
    if (!rx.items) continue;
    for (const item of rx.items) {
      const name = item.name?.trim();
      if (!name) continue;
      if (!itemMap[name]) {
        itemMap[name] = {
          name,
          totalPrescribed: 0,
          pendingCount: 0,
          outOfStock: false,
          affectedTickets: [],
        };
      }
      itemMap[name].totalPrescribed++;
      if (item.outOfStock) {
        itemMap[name].outOfStock = true;
      }
      if (rx.state !== "collected" && rx.state !== "cancelled") {
        itemMap[name].pendingCount++;
        if (!itemMap[name].affectedTickets.includes(rx.ticketCode)) {
          itemMap[name].affectedTickets.push(rx.ticketCode);
        }
      }
    }
  }

  const allItems = Object.values(itemMap).sort((a, b) => {
    if (a.outOfStock !== b.outOfStock) return a.outOfStock ? -1 : 1;
    return b.pendingCount - a.pendingCount;
  });

  const outOfStockItems = allItems.filter((i) => i.outOfStock);

  return {
    overall: {
      totalItems: allItems.length,
      outOfStockCount: outOfStockItems.length,
      affectedPendingPrescriptions: outOfStockItems.reduce((sum, i) => sum + i.pendingCount, 0),
    },
    outOfStock: outOfStockItems,
    allItems,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function markPrescriptionItemOutOfStock(prescriptionId, itemName, outOfStock, staff) {
  const existing = await findPrescriptionById(prescriptionId);
  if (!existing) {
    throw new HttpError(404, "Prescription not found.");
  }

  const updated = await updatePrescription(prescriptionId, (p) => ({
    ...p,
    items: (p.items ?? []).map((item) =>
      item.name === itemName
        ? { ...item, outOfStock: Boolean(outOfStock) }
        : item,
    ),
  }));

  await recordAuditEventSafely({
    actor: staff,
    action: outOfStock ? "prescription.item-marked-out-of-stock" : "prescription.item-restocked",
    entityType: "prescription",
    entityId: prescriptionId,
    entityLabel: existing.ticketCode,
    before: { item: itemName },
    after: { item: itemName, outOfStock: Boolean(outOfStock) },
  });

  if (outOfStock) {
    const ticket = await findTicketById(existing.ticketId);
    if (ticket && ticket.whatsApp) {
      const { createWhatsAppNotification } = await import("./notificationService.js");
      await createWhatsAppNotification(ticket, {
        type: "prescription-out-of-stock",
        title: `Item out of stock for ${ticket.ticket}`,
        message: `Hello ${ticket.patientName}, an item in your prescription (${itemName}) is currently out of stock. Pharmacy staff will advise on alternatives. We apologise for the inconvenience.`,
      });
    }
  }

  broadcastQueueEvent("prescription.item-stock-updated", {
    prescriptionId,
    itemName,
    outOfStock: Boolean(outOfStock),
  });

  return updated;
}

export async function getPeakHoursReport(query) {
  const { from, to } = parseDateFilter(query);
  const allTickets = await getLiveTickets();
  const tickets = filterByDate(allTickets, from, to);

  const hourly = {};
  for (let h = 0; h < 24; h++) {
    hourly[h] = { hour: h, registrations: 0, completions: 0, missed: 0 };
  }

  for (const t of tickets) {
    const regHour = new Date(t.registeredAt).getHours();
    hourly[regHour].registrations++;
    if (t.status === "missed") {
      hourly[regHour].missed++;
    }
    if (t.completedAt) {
      const compHour = new Date(t.completedAt).getHours();
      hourly[compHour].completions++;
    }
  }

  const byDeptHourly = {};
  for (const dept of DEPARTMENTS) {
    byDeptHourly[dept] = {};
    for (let h = 0; h < 24; h++) {
      byDeptHourly[dept][h] = 0;
    }
  }
  for (const t of tickets) {
    const regHour = new Date(t.registeredAt).getHours();
    if (byDeptHourly[t.department]) {
      byDeptHourly[t.department][regHour]++;
    }
  }

  const sorted = Object.values(hourly).sort((a, b) => b.registrations - a.registrations);
  const peakHours = sorted.filter((h) => h.registrations > 0).slice(0, 5);

  return {
    hourly: Object.values(hourly),
    byDeptHourly,
    peakHours,
    totalTickets: tickets.length,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function getCongestionReport(query) {
  const { from, to } = parseDateFilter(query);
  const allTickets = await getLiveTickets();
  const tickets = filterByDate(allTickets, from, to);

  const byDept = {};
  for (const dept of DEPARTMENTS) {
    const deptTickets = tickets.filter((t) => t.department === dept);
    const waiting = deptTickets.filter((t) => t.status === "waiting");
    const inService = deptTickets.filter((t) => t.status === "called" || t.status === "in-service");
    const completed = deptTickets.filter((t) => t.status === "completed");
    const missed = deptTickets.filter((t) => t.status === "missed");

    const waitTimes = waiting.map((t) => t.waitMinutes ?? 0);
    const serviceDurations = completed
      .filter((t) => t.serviceStartedAt && t.completedAt)
      .map((t) => Math.max(1, Math.round((new Date(t.completedAt).getTime() - new Date(t.serviceStartedAt).getTime()) / 60000)));

    const avgWait = waitTimes.length ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;
    const avgService = serviceDurations.length ? Math.round(serviceDurations.reduce((a, b) => a + b, 0) / serviceDurations.length) : 0;
    const load = waiting.length + inService.length;
    const capacity = Math.max(1, Math.ceil(deptTickets.length / 8));
    const utilization = Math.min(100, Math.round((load / capacity) * 100));

    let congestionLevel = "low";
    if (utilization >= 80) congestionLevel = "critical";
    else if (utilization >= 60) congestionLevel = "high";
    else if (utilization >= 40) congestionLevel = "moderate";

    byDept[dept] = {
      totalTickets: deptTickets.length,
      waiting: waiting.length,
      inService: inService.length,
      completed: completed.length,
      missed: missed.length,
      missedRate: deptTickets.length ? Math.round((missed.length / deptTickets.length) * 100) : 0,
      avgWaitMinutes: avgWait,
      avgServiceMinutes: avgService,
      load,
      capacity,
      utilization,
      congestionLevel,
    };
  }

  const congested = Object.entries(byDept)
    .filter(([, d]) => d.congestionLevel === "high" || d.congestionLevel === "critical")
    .map(([dept, d]) => ({ department: dept, ...d }))
    .sort((a, b) => b.utilization - a.utilization);

  return {
    byDept,
    congestedDepartments: congested,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function getResourceAllocationReport(query) {
  const { from, to } = parseDateFilter(query);
  const allTickets = await getLiveTickets();
  const tickets = filterByDate(allTickets, from, to);

  const byDept = {};
  for (const dept of DEPARTMENTS) {
    const deptTickets = tickets.filter((t) => t.department === dept);
    const completed = deptTickets.filter((t) => t.status === "completed");
    const serviceDurations = completed
      .filter((t) => t.serviceStartedAt && t.completedAt)
      .map((t) => Math.max(1, Math.round((new Date(t.completedAt).getTime() - new Date(t.serviceStartedAt).getTime()) / 60000)));

    const avgService = serviceDurations.length ? Math.round(serviceDurations.reduce((a, b) => a + b, 0) / serviceDurations.length) : 0;
    const totalServiceTime = serviceDurations.reduce((a, b) => a + b, 0);
    const active = deptTickets.filter((t) => t.status === "waiting" || t.status === "called" || t.status === "in-service");

    byDept[dept] = {
      totalTickets: deptTickets.length,
      completed: completed.length,
      active: active.length,
      avgServiceMinutes: avgService,
      totalServiceMinutes: totalServiceTime,
      estimatedStaffNeeded: Math.max(1, Math.ceil(active.length / 5)),
      throughput: completed.length,
    };
  }

  const prescriptions = await listPrescriptions();
  const testOrders = await listTestOrders();

  const rxByDept = {};
  for (const rx of prescriptions) {
    const dept = rx.department ?? "Pharmacy";
    if (!rxByDept[dept]) rxByDept[dept] = { total: 0, pending: 0, ready: 0, collected: 0 };
    rxByDept[dept].total++;
    if (rx.state === "ready") rxByDept[dept].ready++;
    if (rx.state === "collected") rxByDept[dept].collected++;
    if (rx.state !== "collected" && rx.state !== "cancelled") rxByDept[dept].pending++;
  }

  const labByType = {};
  for (const order of testOrders) {
    const type = order.testType ?? "unknown";
    if (!labByType[type]) labByType[type] = { total: 0, pending: 0, completed: 0 };
    labByType[type].total++;
    if (order.state === "result-ready" || order.state === "completed") labByType[type].completed++;
    else if (order.state !== "cancelled") labByType[type].pending++;
  }

  return {
    byDept,
    pharmacyLoad: rxByDept,
    labLoad: labByType,
    overall: {
      totalTickets: tickets.length,
      totalPrescriptions: prescriptions.length,
      totalTestOrders: testOrders.length,
      totalStaffNeeded: Object.values(byDept).reduce((sum, d) => sum + d.estimatedStaffNeeded, 0),
    },
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function getWhatsAppStatus() {
  const isMetaCloud = env.whatsAppProvider === "meta-cloud";
  const isMock = env.whatsAppProvider === "mock" || !env.whatsAppProvider;

  const credentials = [
    { key: "accessToken", label: "Access Token", configured: Boolean(env.whatsAppAccessToken), required: isMetaCloud, envVar: "WHATSAPP_ACCESS_TOKEN" },
    { key: "phoneNumberId", label: "Phone Number ID", configured: Boolean(env.whatsAppPhoneNumberId), required: isMetaCloud, envVar: "WHATSAPP_PHONE_NUMBER_ID" },
    { key: "appSecret", label: "App Secret", configured: Boolean(env.whatsAppAppSecret), required: false, envVar: "WHATSAPP_APP_SECRET" },
    { key: "webhookVerifyToken", label: "Webhook Verify Token", configured: Boolean(env.whatsAppWebhookVerifyToken), required: false, envVar: "WHATSAPP_WEBHOOK_VERIFY_TOKEN" },
  ];

  const templates = [
    { key: "queueRegistered", label: "Queue Registered", configured: Boolean(env.whatsAppTemplateQueueRegistered), envVar: "WHATSAPP_TEMPLATE_QUEUE_REGISTERED" },
    { key: "queueReadySoon", label: "Queue Ready Soon", configured: Boolean(env.whatsAppTemplateQueueReadySoon), envVar: "WHATSAPP_TEMPLATE_QUEUE_READY_SOON" },
    { key: "queueCalled", label: "Queue Called", configured: Boolean(env.whatsAppTemplateQueueCalled), envVar: "WHATSAPP_TEMPLATE_QUEUE_CALLED" },
  ];

  const missingRequired = credentials.filter((c) => c.required && !c.configured);
  const missingTemplates = templates.filter((t) => !t.configured);

  const allRequiredMet = missingRequired.length === 0;
  const allTemplatesMet = missingTemplates.length === 0;
  const fullyConfigured = isMetaCloud && allRequiredMet && allTemplatesMet;

  let readinessLevel;
  if (isMock) {
    readinessLevel = allTemplatesMet ? "mock-ready" : "mock-incomplete";
  } else if (fullyConfigured) {
    readinessLevel = "production-ready";
  } else if (allRequiredMet) {
    readinessLevel = "credentials-ok-templates-missing";
  } else {
    readinessLevel = "credentials-missing";
  }

  const checklist = [
    {
      item: "Set WHATSAPP_PROVIDER=meta-cloud for live delivery",
      done: isMetaCloud,
      severity: isMock ? "warning" : "info",
    },
    {
      item: "Set WHATSAPP_ACCESS_TOKEN from Meta Business Manager",
      done: Boolean(env.whatsAppAccessToken),
      severity: isMetaCloud && !env.whatsAppAccessToken ? "error" : "info",
    },
    {
      item: "Set WHATSAPP_PHONE_NUMBER_ID from WhatsApp Business Platform",
      done: Boolean(env.whatsAppPhoneNumberId),
      severity: isMetaCloud && !env.whatsAppPhoneNumberId ? "error" : "info",
    },
    {
      item: "Set WHATSAPP_APP_SECRET for webhook signature verification",
      done: Boolean(env.whatsAppAppSecret),
      severity: "info",
    },
    {
      item: "Set WHATSAPP_WEBHOOK_VERIFY_TOKEN for webhook verification",
      done: Boolean(env.whatsAppWebhookVerifyToken),
      severity: "info",
    },
    {
      item: "Configure message templates in Meta Business Manager",
      done: allTemplatesMet,
      severity: missingTemplates.length > 0 ? "warning" : "info",
    },
    {
      item: "Set WHATSAPP_TEMPLATE_QUEUE_REGISTERED template name",
      done: Boolean(env.whatsAppTemplateQueueRegistered),
      severity: "info",
    },
    {
      item: "Set WHATSAPP_TEMPLATE_QUEUE_READY_SOON template name",
      done: Boolean(env.whatsAppTemplateQueueReadySoon),
      severity: "info",
    },
    {
      item: "Set WHATSAPP_TEMPLATE_QUEUE_CALLED template name",
      done: Boolean(env.whatsAppTemplateQueueCalled),
      severity: "info",
    },
    {
      item: "Configure webhook URL in Meta Business Manager",
      done: Boolean(env.whatsAppAppSecret) && Boolean(env.whatsAppWebhookVerifyToken),
      severity: "info",
    },
  ];

  return {
    provider: env.whatsAppProvider,
    readinessLevel,
    fullyConfigured,
    configured: isMetaCloud ? allRequiredMet : true,
    hasAccessToken: Boolean(env.whatsAppAccessToken),
    hasPhoneNumberId: Boolean(env.whatsAppPhoneNumberId),
    hasAppSecret: Boolean(env.whatsAppAppSecret),
    hasWebhookVerifyToken: Boolean(env.whatsAppWebhookVerifyToken),
    templatesConfigured: {
      queueRegistered: Boolean(env.whatsAppTemplateQueueRegistered),
      queueReadySoon: Boolean(env.whatsAppTemplateQueueReadySoon),
      queueCalled: Boolean(env.whatsAppTemplateQueueCalled),
    },
    credentials,
    templates,
    checklist,
    missingRequired: missingRequired.map((c) => c.envVar),
    missingTemplates: missingTemplates.map((t) => t.envVar),
    apiVersion: env.whatsAppApiVersion,
    apiBaseUrl: env.whatsAppApiBaseUrl,
    language: env.whatsAppTemplateLanguage,
    retryDelaysMs: env.whatsAppRetryDelaysMs,
    requestTimeoutMs: env.whatsAppRequestTimeoutMs,
    mockDelayMs: env.whatsAppMockDelayMs,
    mockFailureRate: env.whatsAppMockFailureRate,
    publicAppUrl: env.publicAppUrl,
    webhookUrl: `${env.publicAppUrl}/api/integrations/whatsapp/webhook`,
  };
}
