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

export function listPatients() {
  return getRepository().listPatients();
}

export function findPatientById(id) {
  return getRepository().findPatientById(id);
}

export function findPatientByPhone(phone) {
  return getRepository().findPatientByPhone(phone);
}

export function findPatientByPatientNumber(patientNumber) {
  return getRepository().findPatientByPatientNumber(patientNumber);
}

export function createPatient(patient) {
  return getRepository().createPatient(patient);
}

export function updatePatient(id, updater) {
  return getRepository().updatePatient(id, updater);
}

export function getNextPatientSequence() {
  return getRepository().getNextPatientSequence();
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

export function listTestOrders() {
  return getRepository().listTestOrders();
}

export function findTestOrderById(id) {
  return getRepository().findTestOrderById(id);
}

export function findTestOrdersByTicketId(ticketId) {
  return getRepository().findTestOrdersByTicketId(ticketId);
}

export function createTestOrder(testOrder) {
  return getRepository().createTestOrder(testOrder);
}

export function updateTestOrder(id, updater) {
  return getRepository().updateTestOrder(id, updater);
}

export function listFeedback() {
  return getRepository().listFeedback();
}

export function findFeedbackByTicketId(ticketId) {
  return getRepository().findFeedbackByTicketId(ticketId);
}

export function createFeedback(feedback) {
  return getRepository().createFeedback(feedback);
}
