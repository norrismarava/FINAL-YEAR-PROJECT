import crypto from "node:crypto";

import { env } from "../config/env.js";
import { priorityRank } from "../modules/queue/queue.constants.js";
import {
  createNotification,
  findNotificationById,
  findNotificationByProviderMessageId,
  getNextNotificationSequence,
  listNotifications,
  updateNotification,
} from "../repositories/queueRepository.js";
import { broadcastQueueEvent } from "../sockets/queueEvents.js";
import { HttpError } from "../utils/http.js";
import { sendWhatsAppMessage } from "./whatsAppProvider.js";

const NEAR_TURN_WINDOW = 2;
const scheduledRetries = new Map();

function createNotificationPayload({
  ticket,
  channel,
  type,
  status,
  title,
  message,
  recipient,
  destination = null,
}) {
  const timestamp = new Date().toISOString();
  const isWhatsApp = channel === "whatsapp";

  return {
    id: crypto.randomUUID(),
    sequence: getNextNotificationSequence(),
    ticketId: ticket.id,
    ticket: ticket.ticket,
    patientName: ticket.patientName,
    department: ticket.department,
    priority: ticket.priority,
    channel,
    type,
    status,
    title,
    message,
    recipient,
    destination,
    provider: isWhatsApp ? env.whatsAppProvider : null,
    providerMessageId: null,
    createdAt: timestamp,
    sentAt: channel === "display-board" ? timestamp : null,
    deliveredAt: status === "delivered" || status === "read" ? timestamp : null,
    lastAttemptAt: null,
    nextRetryAt: null,
    errorCode: null,
    errorMessage: null,
    maxAttempts: isWhatsApp ? env.whatsAppRetryDelaysMs.length + 1 : 1,
    attempts: [],
  };
}

function createPatientRecipient(ticket) {
  return ticket.phone?.trim() || `${ticket.patientName} (opted in)`;
}

function createPatientDestination(ticket) {
  return ticket.phone?.trim() || null;
}

function sortWaitingTickets(tickets) {
  return [...tickets].sort(
    (a, b) =>
      priorityRank(a.priority) - priorityRank(b.priority) ||
      b.waitMinutes - a.waitMinutes ||
      new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime(),
  );
}

function broadcastNotificationEvent(type, notification) {
  broadcastQueueEvent(type, {
    id: notification.id,
    ticketId: notification.ticketId,
    ticket: notification.ticket,
    channel: notification.channel,
    type: notification.type,
    status: notification.status,
    retryCount: notification.attempts.length,
    nextRetryAt: notification.nextRetryAt,
    errorCode: notification.errorCode,
  });
}

async function createStoredNotification(notification) {
  const created = await createNotification(notification);
  broadcastNotificationEvent("notification.created", created);
  return created;
}

function clearScheduledRetry(notificationId) {
  const timerId = scheduledRetries.get(notificationId);
  if (timerId) {
    clearTimeout(timerId);
    scheduledRetries.delete(notificationId);
  }
}

function scheduleRetry(notificationId, nextRetryAt) {
  clearScheduledRetry(notificationId);

  if (!nextRetryAt) {
    return;
  }

  const delayMs = Math.max(0, new Date(nextRetryAt).getTime() - Date.now());
  const timerId = setTimeout(() => {
    scheduledRetries.delete(notificationId);
    void attemptWhatsAppDelivery(notificationId);
  }, delayMs);

  scheduledRetries.set(notificationId, timerId);
}

function appendAttempt(notification, attempt) {
  return [
    ...notification.attempts,
    {
      sequence: notification.attempts.length + 1,
      ...attempt,
    },
  ];
}

function mapProviderStatus(status) {
  const normalized = String(status ?? "").toLowerCase();

  if (normalized === "delivered") {
    return "delivered";
  }

  if (normalized === "read") {
    return "read";
  }

  if (normalized === "failed") {
    return "failed";
  }

  return "sent";
}

function getNextRetryAt(completedAttempts, maxAttempts) {
  const delayMs = env.whatsAppRetryDelaysMs[completedAttempts - 1];

  if (delayMs === undefined || completedAttempts >= maxAttempts) {
    return null;
  }

  return new Date(Date.now() + delayMs).toISOString();
}

function normalizeDeliveryError(error) {
  return {
    code: error?.code ? String(error.code) : "DELIVERY_FAILED",
    message: error?.message || "Notification delivery failed.",
  };
}

function buildRetryableFailureState(notification, error, attemptStartedAt) {
  const deliveryError = normalizeDeliveryError(error);
  const completedAttempts = notification.attempts.length + 1;
  const nextRetryAt = getNextRetryAt(
    completedAttempts,
    notification.maxAttempts,
  );

  return {
    ...notification,
    status: nextRetryAt ? "retrying" : "failed",
    lastAttemptAt: attemptStartedAt,
    nextRetryAt,
    errorCode: deliveryError.code,
    errorMessage: deliveryError.message,
    attempts: appendAttempt(notification, {
      status: "failed",
      attemptedAt: attemptStartedAt,
      completedAt: new Date().toISOString(),
      providerMessageId: null,
      errorCode: deliveryError.code,
      errorMessage: deliveryError.message,
    }),
  };
}

async function attemptWhatsAppDelivery(notificationId) {
  const notification = await findNotificationById(notificationId);

  if (!notification || notification.channel !== "whatsapp") {
    return null;
  }

  if (notification.status === "sending") {
    return notification;
  }

  if (notification.status === "delivered" || notification.status === "read") {
    return notification;
  }

  clearScheduledRetry(notificationId);

  const attemptStartedAt = new Date().toISOString();
  const sending = await updateNotification(notificationId, (current) => ({
    ...current,
    status: "sending",
    lastAttemptAt: attemptStartedAt,
    nextRetryAt: null,
    errorCode: null,
    errorMessage: null,
  }));

  if (!sending) {
    return null;
  }

  broadcastNotificationEvent("notification.updated", sending);

  try {
    const delivery = await sendWhatsAppMessage(sending);
    const finalizedAt = new Date().toISOString();
    const status = mapProviderStatus(delivery.status);
    const updated = await updateNotification(notificationId, (current) => ({
      ...current,
      provider: delivery.provider ?? current.provider,
      providerMessageId: delivery.providerMessageId ?? current.providerMessageId,
      status,
      sentAt:
        status === "sent" || status === "delivered" || status === "read"
          ? current.sentAt ?? finalizedAt
          : current.sentAt,
      deliveredAt:
        status === "delivered" || status === "read"
          ? finalizedAt
          : current.deliveredAt,
      lastAttemptAt: attemptStartedAt,
      nextRetryAt: null,
      errorCode: null,
      errorMessage: null,
      attempts: appendAttempt(current, {
        status,
        attemptedAt: attemptStartedAt,
        completedAt: finalizedAt,
        providerMessageId: delivery.providerMessageId ?? null,
        errorCode: null,
        errorMessage: null,
      }),
    }));

    if (updated) {
      broadcastNotificationEvent("notification.updated", updated);
    }

    return updated;
  } catch (error) {
    const retrying = await updateNotification(notificationId, (current) =>
      buildRetryableFailureState(current, error, attemptStartedAt),
    );

    if (retrying) {
      broadcastNotificationEvent("notification.updated", retrying);
      scheduleRetry(retrying.id, retrying.nextRetryAt);
    }

    return retrying;
  }
}

async function createDisplayBoardNotification(ticket, payload) {
  return createStoredNotification(
    createNotificationPayload({
      ticket,
      channel: "display-board",
      status: "delivered",
      ...payload,
    }),
  );
}

async function createWhatsAppNotification(ticket, payload) {
  const created = await createStoredNotification(
    createNotificationPayload({
      ticket,
      channel: "whatsapp",
      status: "queued",
      recipient: createPatientRecipient(ticket),
      destination: createPatientDestination(ticket),
      ...payload,
    }),
  );

  void attemptWhatsAppDelivery(created.id);
  return created;
}

export async function initializeNotificationDeliveryService() {
  for (const notification of await listNotifications()) {
    if (notification.channel !== "whatsapp") {
      continue;
    }

    if (notification.status === "queued" || notification.status === "sending") {
      scheduleRetry(notification.id, new Date().toISOString());
      continue;
    }

    if (notification.status === "retrying") {
      scheduleRetry(
        notification.id,
        notification.nextRetryAt ?? new Date().toISOString(),
      );
    }
  }
}

export async function dispatchRegistrationNotification(ticket) {
  if (!ticket.whatsApp) {
    return null;
  }

  return createWhatsAppNotification(ticket, {
    type: "queue-registered",
    title: `WhatsApp updates enabled for ${ticket.ticket}`,
    message: `Hello ${ticket.patientName}, you are registered for ${ticket.department}. We will alert you again when your turn gets closer.`,
  });
}

export async function dispatchCallNotifications(ticket) {
  const notifications = [];

  notifications.push(
    await createDisplayBoardNotification(ticket, {
      type: "queue-called",
      title: `${ticket.ticket} called to ${ticket.department}`,
      message: `${ticket.patientName} should proceed to ${ticket.department}.`,
      recipient: "Waiting area display",
    }),
  );

  if (ticket.whatsApp) {
    notifications.push(
      await createWhatsAppNotification(ticket, {
        type: "queue-called",
        title: `WhatsApp alert queued for ${ticket.ticket}`,
        message: `Hello ${ticket.patientName}, please proceed to ${ticket.department}. Your ticket ${ticket.ticket} is now being called.`,
      }),
    );
  }

  return notifications;
}

export async function dispatchTurnReadinessNotifications(tickets) {
  const notifications = [];
  const alreadyNotified = new Set(
    (await listNotifications())
      .filter((notification) => notification.type === "queue-ready-soon")
      .map((notification) => notification.ticketId),
  );
  const waitingByDepartment = new Map();

  for (const ticket of tickets) {
    if (ticket.status !== "waiting" || !ticket.whatsApp) {
      continue;
    }

    if (!waitingByDepartment.has(ticket.department)) {
      waitingByDepartment.set(ticket.department, []);
    }

    waitingByDepartment.get(ticket.department).push(ticket);
  }

  for (const departmentTickets of waitingByDepartment.values()) {
    const ranked = sortWaitingTickets(departmentTickets);

    for (
      let index = 0;
      index < ranked.length && index < NEAR_TURN_WINDOW;
      index += 1
    ) {
      const ticket = ranked[index];

      if (alreadyNotified.has(ticket.id)) {
        continue;
      }

      const patientsAhead = index;
      const aheadLabel =
        patientsAhead === 0
          ? "you are next in line"
          : `there ${patientsAhead === 1 ? "is" : "are"} ${patientsAhead} patient${patientsAhead === 1 ? "" : "s"} ahead of you`;

      notifications.push(
        await createWhatsAppNotification(ticket, {
          type: "queue-ready-soon",
          title:
            patientsAhead === 0
              ? `${ticket.ticket} is almost ready for ${ticket.department}`
              : `${ticket.ticket} is moving up in ${ticket.department}`,
          message: `Hello ${ticket.patientName}, ${aheadLabel} in ${ticket.department}. Please stay nearby for your call.`,
        }),
      );

      alreadyNotified.add(ticket.id);
    }
  }

  return notifications;
}

export async function getRecentNotifications(limit = 8) {
  return (await listNotifications()).slice(0, limit);
}

export async function getNotificationsForTicket(ticketId, limit = 10) {
  return (await listNotifications())
    .filter((notification) => notification.ticketId === ticketId)
    .slice(0, limit);
}

export async function retryNotification(notificationId) {
  const notification = await findNotificationById(notificationId);

  if (!notification) {
    throw new HttpError(404, "Notification not found.");
  }

  if (notification.channel !== "whatsapp") {
    throw new HttpError(400, "Only WhatsApp notifications can be retried.");
  }

  if (notification.status === "delivered" || notification.status === "read") {
    throw new HttpError(400, "Delivered notifications do not need a retry.");
  }

  clearScheduledRetry(notificationId);
  const updated = await updateNotification(notificationId, (current) => ({
    ...current,
    status: "queued",
    nextRetryAt: null,
    errorCode: null,
    errorMessage: null,
  }));

  if (updated) {
    broadcastNotificationEvent("notification.updated", updated);
  }

  void attemptWhatsAppDelivery(notificationId);
  return updated;
}

export async function retryNotificationsBulk(notificationIds) {
  const uniqueIds = [...new Set((notificationIds ?? []).filter(Boolean))];

  if (!uniqueIds.length) {
    throw new HttpError(400, "Provide at least one notification id to retry.");
  }

  const notifications = [];
  const skipped = [];

  for (const notificationId of uniqueIds) {
    const notification = await findNotificationById(notificationId);

    if (!notification) {
      skipped.push({
        id: notificationId,
        reason: "Notification not found.",
      });
      continue;
    }

    if (notification.channel !== "whatsapp") {
      skipped.push({
        id: notificationId,
        ticket: notification.ticket,
        reason: "Only WhatsApp notifications can be retried.",
      });
      continue;
    }

    if (!canRetryNotificationStatus(notification.status)) {
      skipped.push({
        id: notificationId,
        ticket: notification.ticket,
        reason: "This notification is already delivered.",
      });
      continue;
    }

    notifications.push(await retryNotification(notificationId));
  }

  return {
    notifications,
    requested: uniqueIds.length,
    retried: notifications.length,
    skipped,
  };
}

function canRetryNotificationStatus(status) {
  return status === "queued" || status === "retrying" || status === "failed";
}

function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!env.whatsAppAppSecret) {
    return true;
  }

  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", env.whatsAppAppSecret)
    .update(rawBody)
    .digest("hex");

  const actual = Buffer.from(signatureHeader.slice("sha256=".length));
  const expectedBuffer = Buffer.from(expected);

  if (actual.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(actual, expectedBuffer);
}

function buildWebhookFailureState(notification, statusEntry) {
  const nextRetryAt = getNextRetryAt(
    notification.attempts.length,
    notification.maxAttempts,
  );
  const errorMessage =
    statusEntry.errors?.[0]?.title ||
    statusEntry.errors?.[0]?.message ||
    "WhatsApp provider reported a delivery failure.";
  const errorCode = statusEntry.errors?.[0]?.code
    ? String(statusEntry.errors[0].code)
    : "PROVIDER_FAILED";

  return {
    ...notification,
    status: nextRetryAt ? "retrying" : "failed",
    deliveredAt: null,
    nextRetryAt,
    errorCode,
    errorMessage,
  };
}

async function applyWebhookStatus(statusEntry) {
  const providerMessageId = statusEntry.id;

  if (!providerMessageId) {
    return null;
  }

  const notification = await findNotificationByProviderMessageId(providerMessageId);

  if (!notification) {
    return null;
  }

  clearScheduledRetry(notification.id);

  const nextStatus = mapProviderStatus(statusEntry.status);
  const updated = await updateNotification(notification.id, (current) => {
    if (nextStatus === "failed") {
      return buildWebhookFailureState(current, statusEntry);
    }

    const timestamp = new Date().toISOString();
    return {
      ...current,
      status: nextStatus,
      sentAt: current.sentAt ?? timestamp,
      deliveredAt:
        nextStatus === "delivered" || nextStatus === "read"
          ? timestamp
          : current.deliveredAt,
      nextRetryAt: null,
      errorCode: null,
      errorMessage: null,
    };
  });

  if (updated) {
    broadcastNotificationEvent("notification.updated", updated);

    if (updated.status === "retrying") {
      scheduleRetry(updated.id, updated.nextRetryAt);
    }
  }

  return updated;
}

export function verifyWhatsAppWebhook(query) {
  const mode = query.get("hub.mode");
  const token = query.get("hub.verify_token");
  const challenge = query.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    token === env.whatsAppWebhookVerifyToken &&
    challenge
  ) {
    return challenge;
  }

  throw new HttpError(403, "Webhook verification failed.");
}

export async function processWhatsAppWebhook({ rawBody, body, signature }) {
  if (!verifyWebhookSignature(rawBody ?? "", signature)) {
    throw new HttpError(403, "Invalid webhook signature.");
  }

  const statuses = [];

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const status of change.value?.statuses ?? []) {
        statuses.push(status);
      }
    }
  }

  const updatedNotifications = (
    await Promise.all(statuses.map((statusEntry) => applyWebhookStatus(statusEntry)))
  ).filter(Boolean);

  return {
    received: true,
    updated: updatedNotifications.length,
  };
}
