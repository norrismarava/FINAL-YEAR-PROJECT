import { env } from "../config/env.js";
import * as fileRepository from "./fileQueueRepository.js";
import * as mysqlRepository from "./mysqlQueueRepository.js";

const repositories = {
  file: fileRepository,
  mysql: mysqlRepository,
};

function getRepository() {
  const repository = repositories[env.databaseProvider];

  if (!repository) {
    throw new Error(
      `Unsupported DB_PROVIDER "${env.databaseProvider}". Use "file" or "mysql".`,
    );
  }

  return repository;
}

export function initializeQueueRepository() {
  return getRepository().initializeQueueRepository();
}

export function listTickets() {
  return getRepository().listTickets();
}

export function findTicketById(id) {
  return getRepository().findTicketById(id);
}

export function createTicket(ticket) {
  return getRepository().createTicket(ticket);
}

export function updateTicket(id, updater) {
  return getRepository().updateTicket(id, updater);
}

export function getNextSequence() {
  return getRepository().getNextSequence();
}

export function listNotifications() {
  return getRepository().listNotifications();
}

export function createNotification(notification) {
  return getRepository().createNotification(notification);
}

export function findNotificationById(id) {
  return getRepository().findNotificationById(id);
}

export function findNotificationByProviderMessageId(providerMessageId) {
  return getRepository().findNotificationByProviderMessageId(providerMessageId);
}

export function updateNotification(id, updater) {
  return getRepository().updateNotification(id, updater);
}

export function getNextNotificationSequence() {
  return getRepository().getNextNotificationSequence();
}
