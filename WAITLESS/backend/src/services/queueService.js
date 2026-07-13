import crypto from "node:crypto";

import {
  createTicketCode,
  DEPARTMENTS,
  PATIENT_CATEGORIES,
  PRIORITY_META,
  priorityRank,
  TICKET_STATUSES,
} from "../modules/queue/queue.constants.js";
import {
  createTicket,
  findTicketById,
  getNextSequence,
  listTickets,
  listNotifications,
  updateTicket,
} from "../repositories/queueRepository.js";
import { broadcastQueueEvent } from "../sockets/queueEvents.js";
import { HttpError } from "../utils/http.js";
import {
  dispatchCallNotifications,
  dispatchMissedTurnNotification,
  dispatchRegistrationNotification,
  dispatchTurnReadinessNotifications,
  dispatchTransferNotification,
  getNotificationsForTicket,
} from "./notificationService.js";

const TRIAGE_REASSESSMENT_THRESHOLDS_MINUTES = {
  red: 10,
  yellow: 30,
};

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
    missed: 3,
    completed: 4,
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

function ensureStatus(status) {
  if (!TICKET_STATUSES.includes(status)) {
    throw new HttpError(400, "Invalid status value.");
  }
}

function createTicketEventPayload(ticket) {
  return {
    id: ticket.id,
    ticket: ticket.ticket,
    department: ticket.department,
    priority: ticket.priority,
    status: ticket.status,
  };
}

function buildReassessmentAlerts(tickets) {
  return tickets
    .filter((ticket) => {
      const threshold = TRIAGE_REASSESSMENT_THRESHOLDS_MINUTES[ticket.priority];
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
      thresholdMinutes: TRIAGE_REASSESSMENT_THRESHOLDS_MINUTES[ticket.priority],
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

function buildEstimatedWaitMinutes(patientsAhead, activeInDepartmentCount) {
  if (patientsAhead <= 0) {
    return activeInDepartmentCount ? 6 : 3;
  }

  return patientsAhead * 7 + (activeInDepartmentCount ? 4 : 0);
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
    case "waiting":
      return {
        ...ticket,
        status,
        calledAt: null,
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
  const tickets = await getLiveTickets();

  if (filters.status) {
    return sortAllTickets(tickets.filter((ticket) => ticket.status === filters.status));
  }

  return sortAllTickets(tickets);
}

export async function registerPatient(payload) {
  const patientName = payload.fullName?.trim();
  const department = payload.dept ?? payload.department ?? "OPD";
  const patientCategory = payload.patientCategory ?? "walk-in";

  if (!patientName) {
    throw new HttpError(400, "Full name is required.");
  }

  ensureDepartment(department);
  ensurePatientCategory(patientCategory);

  const sequence = await getNextSequence();
  const notificationConsent = Boolean(payload.notificationConsent);
  const ticket = {
    id: crypto.randomUUID(),
    ticket: createTicketCode("green", sequence),
    patientName,
    nationalId: payload.nationalId?.trim() ?? "",
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
    registeredAt: new Date().toISOString(),
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

  broadcastQueueEvent("ticket.registered", createTicketEventPayload(createdTicket));
  await dispatchRegistrationNotification(createdTicket);
  await dispatchTurnReadinessNotifications(await getLiveTickets());

  return createdTicket;
}

export async function assignPriority(id, priority) {
  ensurePriority(priority);

  const existing = await findTicketById(id);
  if (!existing) {
    throw new HttpError(404, "Ticket not found.");
  }

  const updatedTicket = enrichTicket(
    await updateTicket(id, (ticket) => ({
      ...ticket,
      priority,
      ticket: createTicketCode(priority, Number(ticket.ticket.split("-")[1])),
      triagedAt: new Date().toISOString(),
    })),
  );

  broadcastQueueEvent(
    "ticket.priority-updated",
    createTicketEventPayload(updatedTicket),
  );
  await dispatchTurnReadinessNotifications(await getLiveTickets());

  return updatedTicket;
}

export async function recallMissedPatient(id) {
  const existing = await findTicketById(id);
  if (!existing) {
    throw new HttpError(404, "Ticket not found.");
  }

  if (existing.status !== "missed") {
    throw new HttpError(400, "Only missed tickets can be recalled.");
  }

  const recalledAt = new Date().toISOString();
  const updatedTicket = enrichTicket(
    await updateTicket(id, (ticket) => ({
      ...applyStatusTransition(ticket, "waiting"),
      recalledAt,
      registeredAt: recalledAt,
      recallCount: Number(ticket.recallCount ?? 0) + 1,
    })),
  );

  broadcastQueueEvent("ticket.recalled", createTicketEventPayload(updatedTicket));
  await dispatchTurnReadinessNotifications(await getLiveTickets());

  return updatedTicket;
}

export async function transferPatient(id, department) {
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
      serviceStartedAt: null,
      missedAt: null,
      completedAt: null,
    })),
  );

  broadcastQueueEvent("ticket.transferred", createTicketEventPayload(updatedTicket));
  await dispatchTransferNotification(updatedTicket, previousDepartment);
  await dispatchTurnReadinessNotifications(await getLiveTickets());

  return updatedTicket;
}

export async function callNextPatient(department) {
  if (department) {
    ensureDepartment(department);
  }

  const liveTickets = await getLiveTickets();
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
    await updateTicket(nextTicket.id, (ticket) =>
      applyStatusTransition(ticket, "called"),
    ),
  );

  broadcastQueueEvent("ticket.called", createTicketEventPayload(updatedTicket));
  await dispatchCallNotifications(updatedTicket);
  await dispatchTurnReadinessNotifications(await getLiveTickets());

  return updatedTicket;
}

export async function updatePatientStatus(id, status) {
  ensureStatus(status);

  const existing = await findTicketById(id);
  if (!existing) {
    throw new HttpError(404, "Ticket not found.");
  }

  ensureStatusTransition(existing.status, status);

  const updatedTicket = enrichTicket(
    await updateTicket(id, (ticket) => applyStatusTransition(ticket, status)),
  );

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

export async function getQueueBoard() {
  const tickets = await getLiveTickets();
  const nowServing = sortAllTickets(
    tickets.filter(
      (ticket) => ticket.status === "called" || ticket.status === "in-service",
    ),
  );
  const waiting = sortWaitingTickets(
    tickets.filter((ticket) => ticket.status === "waiting"),
  );
  const missed = sortAllTickets(tickets.filter((ticket) => ticket.status === "missed"));

  return {
    nowServing,
    waiting,
    missed,
    totalWaiting: waiting.length,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function getDashboardSummary() {
  const tickets = sortAllTickets(await getLiveTickets());
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
      reassessment: buildReassessmentAlerts(tickets),
    },
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function getNotifications() {
  return (await listNotifications()).slice(0, 20);
}

export async function getTicketTracking(ticketCode) {
  const normalizedTicketCode = normalizeTicketCode(ticketCode);

  if (!normalizedTicketCode) {
    throw new HttpError(400, "Ticket code is required.");
  }

  const tickets = await getLiveTickets();
  const ticket = tickets.find(
    (entry) => normalizeTicketCode(entry.ticket) === normalizedTicketCode,
  );

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

  return {
    ticket,
    queue: {
      departmentPosition,
      patientsAhead,
      estimatedWaitMinutes:
        ticket.status === "waiting"
          ? buildEstimatedWaitMinutes(patientsAhead, activeInDepartment.length)
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
        patientName: entry.patientName,
        priority: entry.priority,
        status: entry.status,
      })),
    },
    notifications: await getNotificationsForTicket(ticket.id),
    lastUpdatedAt: new Date().toISOString(),
  };
}
