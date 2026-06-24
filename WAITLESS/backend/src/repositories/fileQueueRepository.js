import fs from "node:fs";
import path from "node:path";

import { env } from "../config/env.js";
import { createSeedTickets } from "../modules/queue/queue.constants.js";

const INITIAL_SEQUENCE = 201;
const INITIAL_NOTIFICATION_SEQUENCE = 1;

const state = {
  tickets: [],
  nextSequence: INITIAL_SEQUENCE,
  notifications: [],
  nextNotificationSequence: INITIAL_NOTIFICATION_SEQUENCE,
  ready: false,
};

function cloneTicket(ticket) {
  return { ...ticket };
}

function cloneNotification(notification) {
  return {
    ...notification,
    attempts: (notification.attempts ?? []).map((attempt) => ({ ...attempt })),
  };
}

function createInitialState() {
  return {
    tickets: createSeedTickets(),
    nextSequence: INITIAL_SEQUENCE,
    notifications: [],
    nextNotificationSequence: INITIAL_NOTIFICATION_SEQUENCE,
  };
}

function assertReady() {
  if (!state.ready) {
    throw new Error("Queue repository was accessed before initialization.");
  }
}

function persistState() {
  const targetPath = env.stateFilePath;
  const targetDir = path.dirname(targetPath);
  const tempPath = `${targetPath}.tmp`;

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(
    tempPath,
    JSON.stringify(
      {
        tickets: state.tickets,
        nextSequence: state.nextSequence,
        notifications: state.notifications,
        nextNotificationSequence: state.nextNotificationSequence,
      },
      null,
      2,
    ),
    "utf8",
  );
  fs.renameSync(tempPath, targetPath);
}

function normalizeTicket(ticket) {
  return {
    ...ticket,
    triagedAt: ticket.triagedAt ?? null,
    calledAt: ticket.calledAt ?? null,
    serviceStartedAt: ticket.serviceStartedAt ?? null,
    completedAt: ticket.completedAt ?? null,
    whatsApp: Boolean(ticket.whatsApp),
  };
}

function normalizeNotification(notification) {
  return {
    ...notification,
    destination: notification.destination ?? null,
    provider: notification.provider ?? null,
    providerMessageId: notification.providerMessageId ?? null,
    deliveredAt: notification.deliveredAt ?? null,
    sentAt: notification.sentAt ?? null,
    lastAttemptAt: notification.lastAttemptAt ?? null,
    nextRetryAt: notification.nextRetryAt ?? null,
    errorCode: notification.errorCode ?? null,
    errorMessage: notification.errorMessage ?? null,
    maxAttempts: notification.maxAttempts ?? 1,
    attempts: Array.isArray(notification.attempts)
      ? notification.attempts.map((attempt, index) => ({
          sequence: attempt.sequence ?? index + 1,
          status: attempt.status ?? notification.status ?? "queued",
          attemptedAt: attempt.attemptedAt ?? notification.createdAt,
          completedAt: attempt.completedAt ?? attempt.attemptedAt ?? notification.createdAt,
          providerMessageId: attempt.providerMessageId ?? null,
          errorCode: attempt.errorCode ?? null,
          errorMessage: attempt.errorMessage ?? null,
        }))
      : [],
  };
}

function applyState(nextState) {
  state.tickets = nextState.tickets.map(normalizeTicket).map(cloneTicket);
  state.nextSequence = nextState.nextSequence;
  state.notifications = (nextState.notifications ?? [])
    .map(normalizeNotification)
    .map(cloneNotification);
  state.nextNotificationSequence =
    nextState.nextNotificationSequence ?? INITIAL_NOTIFICATION_SEQUENCE;
  state.ready = true;
}

function isValidState(parsed) {
  return (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray(parsed.tickets) &&
    Number.isInteger(parsed.nextSequence) &&
    (parsed.notifications === undefined || Array.isArray(parsed.notifications)) &&
    (parsed.nextNotificationSequence === undefined ||
      Number.isInteger(parsed.nextNotificationSequence))
  );
}

export async function initializeQueueRepository() {
  const targetPath = env.stateFilePath;

  if (!fs.existsSync(targetPath)) {
    applyState(createInitialState());
    persistState();
    return;
  }

  try {
    const raw = fs.readFileSync(targetPath, "utf8");
    const parsed = JSON.parse(raw);

    if (!isValidState(parsed)) {
      throw new Error("Persisted queue state has an invalid shape.");
    }

    applyState(parsed);
  } catch (error) {
    const backupPath = `${targetPath}.corrupt-${Date.now()}`;

    console.error(
      `Failed to load persisted queue state. Backing it up to ${backupPath}.`,
      error,
    );

    try {
      fs.renameSync(targetPath, backupPath);
    } catch (renameError) {
      console.error("Failed to back up corrupt queue state file.", renameError);
    }

    applyState(createInitialState());
    persistState();
  }
}

export async function listTickets() {
  assertReady();
  return state.tickets.map(cloneTicket);
}

export async function findTicketById(id) {
  assertReady();
  const ticket = state.tickets.find((entry) => entry.id === id);
  return ticket ? cloneTicket(ticket) : null;
}

export async function createTicket(ticket) {
  assertReady();
  state.tickets.unshift(cloneTicket(ticket));
  persistState();
  return cloneTicket(ticket);
}

export async function updateTicket(id, updater) {
  assertReady();
  const index = state.tickets.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  const current = state.tickets[index];
  const nextValue =
    typeof updater === "function"
      ? await updater(cloneTicket(current))
      : { ...current, ...updater };

  state.tickets[index] = cloneTicket(nextValue);
  persistState();
  return cloneTicket(nextValue);
}

export async function getNextSequence() {
  assertReady();
  const sequence = state.nextSequence;
  state.nextSequence += 1;
  persistState();
  return sequence;
}

export async function listNotifications() {
  assertReady();
  return state.notifications.map(cloneNotification);
}

export async function createNotification(notification) {
  assertReady();
  state.notifications.unshift(cloneNotification(notification));
  persistState();
  return cloneNotification(notification);
}

export async function findNotificationById(id) {
  assertReady();
  const notification = state.notifications.find((entry) => entry.id === id);
  return notification ? cloneNotification(notification) : null;
}

export async function findNotificationByProviderMessageId(providerMessageId) {
  assertReady();
  const notification = state.notifications.find(
    (entry) => entry.providerMessageId === providerMessageId,
  );
  return notification ? cloneNotification(notification) : null;
}

export async function updateNotification(id, updater) {
  assertReady();
  const index = state.notifications.findIndex((entry) => entry.id === id);
  if (index === -1) {
    return null;
  }

  const current = state.notifications[index];
  const nextValue =
    typeof updater === "function"
      ? await updater(cloneNotification(current))
      : { ...current, ...updater };

  state.notifications[index] = cloneNotification(nextValue);
  persistState();
  return cloneNotification(nextValue);
}

export async function getNextNotificationSequence() {
  assertReady();
  const sequence = state.nextNotificationSequence;
  state.nextNotificationSequence += 1;
  persistState();
  return sequence;
}
