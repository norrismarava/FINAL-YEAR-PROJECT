import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { env } from "../config/env.js";
import { createSeedTickets, DEPARTMENTS } from "../modules/queue/queue.constants.js";

const INITIAL_SEQUENCE = 201;
const INITIAL_NOTIFICATION_SEQUENCE = 1;
const schemaPath = fileURLToPath(new URL("../db/schema.sql", import.meta.url));

let pool = null;
let databaseReady = false;

function quoteIdentifier(identifier) {
  return `\`${String(identifier).replaceAll("`", "``")}\``;
}

async function ensureDatabaseExists() {
  if (databaseReady) {
    return;
  }

  const mysql = await import("mysql2/promise");
  const setupConnection = await mysql.createConnection({
    host: env.databaseHost,
    port: env.databasePort,
    user: env.databaseUser,
    password: env.databasePassword,
  });

  try {
    await setupConnection.query(
      `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(env.databaseName)}
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    databaseReady = true;
  } finally {
    await setupConnection.end();
  }
}

function cloneTicket(ticket) {
  return { ...ticket };
}

function cloneNotification(notification) {
  return {
    ...notification,
    attempts: (notification.attempts ?? []).map((attempt) => ({ ...attempt })),
  };
}

async function getPool() {
  if (pool) {
    return pool;
  }

  const mysql = await import("mysql2/promise");
  await ensureDatabaseExists();

  pool = mysql.createPool({
    host: env.databaseHost,
    port: env.databasePort,
    user: env.databaseUser,
    password: env.databasePassword,
    database: env.databaseName,
    waitForConnections: true,
    connectionLimit: env.databaseConnectionLimit,
    timezone: "Z",
    dateStrings: true,
  });

  return pool;
}

async function withConnection(callback) {
  const activePool = await getPool();
  const connection = await activePool.getConnection();

  try {
    return await callback(connection);
  } finally {
    connection.release();
  }
}

async function withTransaction(callback) {
  return withConnection(async (connection) => {
    await connection.beginTransaction();

    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  });
}

function splitSqlStatements(sql) {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function toSqlDateTime(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 23).replace("T", " ");
}

function fromSqlDateTime(value) {
  if (!value) {
    return null;
  }

  return new Date(`${String(value).replace(" ", "T")}Z`).toISOString();
}

function toSqlDate(value) {
  return value?.trim() || null;
}

function fromSqlDate(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}

function getTicketSequence(ticketCode) {
  const [, sequence] = String(ticketCode).split("-");
  const parsed = Number.parseInt(sequence, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapTicketRow(row) {
  return {
    id: row.id,
    ticket: row.ticket_code,
    patientName: row.patient_name,
    nationalId: row.national_id ?? "",
    dob: fromSqlDate(row.dob),
    gender: row.gender ?? "unknown",
    phone: row.phone ?? "",
    address: row.address ?? "",
    patientCategory: row.patient_category ?? "walk-in",
    nextOfKinName: row.next_of_kin_name ?? "",
    nextOfKinPhone: row.next_of_kin_phone ?? "",
    notificationConsent: Boolean(row.notification_consent),
    department: row.department,
    chiefComplaint: row.chief_complaint ?? "",
    priority: row.priority,
    status: row.status,
    registeredAt: fromSqlDateTime(row.registered_at),
    triagedAt: fromSqlDateTime(row.triaged_at),
    calledAt: fromSqlDateTime(row.called_at),
    serviceStartedAt: fromSqlDateTime(row.service_started_at),
    missedAt: fromSqlDateTime(row.missed_at),
    recalledAt: fromSqlDateTime(row.recalled_at),
    transferredAt: fromSqlDateTime(row.transferred_at),
    previousDepartment: row.previous_department ?? "",
    recallCount: Number(row.recall_count ?? 0),
    completedAt: fromSqlDateTime(row.completed_at),
    whatsApp: Boolean(row.whatsapp_enabled),
  };
}

function mapNotificationRow(row, attempts = []) {
  return {
    id: row.id,
    sequence: Number(row.sequence_number),
    ticketId: row.ticket_id,
    ticket: row.ticket_code,
    patientName: row.patient_name,
    department: row.department,
    priority: row.priority,
    channel: row.channel,
    type: row.type,
    status: row.status,
    title: row.title,
    message: row.message,
    recipient: row.recipient,
    destination: row.destination,
    provider: row.provider,
    providerMessageId: row.provider_message_id,
    createdAt: fromSqlDateTime(row.created_at),
    sentAt: fromSqlDateTime(row.sent_at),
    deliveredAt: fromSqlDateTime(row.delivered_at),
    lastAttemptAt: fromSqlDateTime(row.last_attempt_at),
    nextRetryAt: fromSqlDateTime(row.next_retry_at),
    errorCode: row.error_code,
    errorMessage: row.error_message,
    maxAttempts: Number(row.max_attempts ?? 1),
    attempts,
  };
}

function mapAttemptRow(row) {
  return {
    sequence: Number(row.sequence_number),
    status: row.status,
    attemptedAt: fromSqlDateTime(row.attempted_at),
    completedAt: fromSqlDateTime(row.completed_at),
    providerMessageId: row.provider_message_id,
    errorCode: row.error_code,
    errorMessage: row.error_message,
  };
}

async function insertDepartments(connection) {
  for (const department of DEPARTMENTS) {
    await connection.execute("INSERT IGNORE INTO departments (name) VALUES (?)", [
      department,
    ]);
  }
}

async function insertCounters(connection) {
  await connection.execute(
    "INSERT IGNORE INTO system_counters (name, value) VALUES (?, ?), (?, ?)",
    [
      "ticket_sequence",
      INITIAL_SEQUENCE,
      "notification_sequence",
      INITIAL_NOTIFICATION_SEQUENCE,
    ],
  );
}

async function ensureColumn(connection, tableName, columnName, definition) {
  const [rows] = await connection.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [env.databaseName, tableName, columnName],
  );

  if (!rows.length) {
    await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
  }
}

async function ensureTicketSchema(connection) {
  await ensureColumn(
    connection,
    "tickets",
    "patient_category",
    "patient_category VARCHAR(80) NOT NULL DEFAULT 'walk-in' AFTER address",
  );
  await ensureColumn(
    connection,
    "tickets",
    "next_of_kin_name",
    "next_of_kin_name VARCHAR(160) NOT NULL DEFAULT '' AFTER patient_category",
  );
  await ensureColumn(
    connection,
    "tickets",
    "next_of_kin_phone",
    "next_of_kin_phone VARCHAR(80) NOT NULL DEFAULT '' AFTER next_of_kin_name",
  );
  await ensureColumn(
    connection,
    "tickets",
    "notification_consent",
    "notification_consent BOOLEAN NOT NULL DEFAULT FALSE AFTER next_of_kin_phone",
  );
  await ensureColumn(
    connection,
    "tickets",
    "missed_at",
    "missed_at DATETIME(3) NULL AFTER service_started_at",
  );
  await ensureColumn(
    connection,
    "tickets",
    "recalled_at",
    "recalled_at DATETIME(3) NULL AFTER missed_at",
  );
  await ensureColumn(
    connection,
    "tickets",
    "transferred_at",
    "transferred_at DATETIME(3) NULL AFTER recalled_at",
  );
  await ensureColumn(
    connection,
    "tickets",
    "previous_department",
    "previous_department VARCHAR(80) NOT NULL DEFAULT '' AFTER transferred_at",
  );
  await ensureColumn(
    connection,
    "tickets",
    "recall_count",
    "recall_count INT NOT NULL DEFAULT 0 AFTER previous_department",
  );
}

async function insertTicket(connection, ticket) {
  await connection.execute(
    `INSERT INTO tickets (
      id,
      ticket_code,
      sequence_number,
      patient_name,
      national_id,
      dob,
      gender,
      phone,
      address,
      patient_category,
      next_of_kin_name,
      next_of_kin_phone,
      notification_consent,
      department,
      chief_complaint,
      priority,
      status,
      registered_at,
      triaged_at,
      called_at,
      service_started_at,
      missed_at,
      recalled_at,
      transferred_at,
      previous_department,
      recall_count,
      completed_at,
      whatsapp_enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ticket.id,
      ticket.ticket,
      getTicketSequence(ticket.ticket),
      ticket.patientName,
      ticket.nationalId ?? "",
      toSqlDate(ticket.dob),
      ticket.gender ?? "unknown",
      ticket.phone ?? "",
      ticket.address ?? "",
      ticket.patientCategory ?? "walk-in",
      ticket.nextOfKinName ?? "",
      ticket.nextOfKinPhone ?? "",
      Boolean(ticket.notificationConsent),
      ticket.department,
      ticket.chiefComplaint ?? "",
      ticket.priority,
      ticket.status,
      toSqlDateTime(ticket.registeredAt),
      toSqlDateTime(ticket.triagedAt),
      toSqlDateTime(ticket.calledAt),
      toSqlDateTime(ticket.serviceStartedAt),
      toSqlDateTime(ticket.missedAt),
      toSqlDateTime(ticket.recalledAt),
      toSqlDateTime(ticket.transferredAt),
      ticket.previousDepartment ?? "",
      Number(ticket.recallCount ?? 0),
      toSqlDateTime(ticket.completedAt),
      Boolean(ticket.whatsApp),
    ],
  );
}

async function replaceTicket(connection, ticket) {
  await connection.execute(
    `UPDATE tickets SET
      ticket_code = ?,
      sequence_number = ?,
      patient_name = ?,
      national_id = ?,
      dob = ?,
      gender = ?,
      phone = ?,
      address = ?,
      patient_category = ?,
      next_of_kin_name = ?,
      next_of_kin_phone = ?,
      notification_consent = ?,
      department = ?,
      chief_complaint = ?,
      priority = ?,
      status = ?,
      registered_at = ?,
      triaged_at = ?,
      called_at = ?,
      service_started_at = ?,
      missed_at = ?,
      recalled_at = ?,
      transferred_at = ?,
      previous_department = ?,
      recall_count = ?,
      completed_at = ?,
      whatsapp_enabled = ?
    WHERE id = ?`,
    [
      ticket.ticket,
      getTicketSequence(ticket.ticket),
      ticket.patientName,
      ticket.nationalId ?? "",
      toSqlDate(ticket.dob),
      ticket.gender ?? "unknown",
      ticket.phone ?? "",
      ticket.address ?? "",
      ticket.patientCategory ?? "walk-in",
      ticket.nextOfKinName ?? "",
      ticket.nextOfKinPhone ?? "",
      Boolean(ticket.notificationConsent),
      ticket.department,
      ticket.chiefComplaint ?? "",
      ticket.priority,
      ticket.status,
      toSqlDateTime(ticket.registeredAt),
      toSqlDateTime(ticket.triagedAt),
      toSqlDateTime(ticket.calledAt),
      toSqlDateTime(ticket.serviceStartedAt),
      toSqlDateTime(ticket.missedAt),
      toSqlDateTime(ticket.recalledAt),
      toSqlDateTime(ticket.transferredAt),
      ticket.previousDepartment ?? "",
      Number(ticket.recallCount ?? 0),
      toSqlDateTime(ticket.completedAt),
      Boolean(ticket.whatsApp),
      ticket.id,
    ],
  );
}

async function insertNotification(connection, notification) {
  await connection.execute(
    `INSERT INTO notifications (
      id,
      sequence_number,
      ticket_id,
      ticket_code,
      patient_name,
      department,
      priority,
      channel,
      type,
      status,
      title,
      message,
      recipient,
      destination,
      provider,
      provider_message_id,
      created_at,
      sent_at,
      delivered_at,
      last_attempt_at,
      next_retry_at,
      error_code,
      error_message,
      max_attempts
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      notification.id,
      notification.sequence,
      notification.ticketId,
      notification.ticket,
      notification.patientName,
      notification.department,
      notification.priority,
      notification.channel,
      notification.type,
      notification.status,
      notification.title,
      notification.message,
      notification.recipient,
      notification.destination ?? null,
      notification.provider ?? null,
      notification.providerMessageId ?? null,
      toSqlDateTime(notification.createdAt),
      toSqlDateTime(notification.sentAt),
      toSqlDateTime(notification.deliveredAt),
      toSqlDateTime(notification.lastAttemptAt),
      toSqlDateTime(notification.nextRetryAt),
      notification.errorCode ?? null,
      notification.errorMessage ?? null,
      notification.maxAttempts ?? 1,
    ],
  );

  await insertNotificationAttempts(connection, notification);
}

async function replaceNotification(connection, notification) {
  await connection.execute(
    `UPDATE notifications SET
      sequence_number = ?,
      ticket_id = ?,
      ticket_code = ?,
      patient_name = ?,
      department = ?,
      priority = ?,
      channel = ?,
      type = ?,
      status = ?,
      title = ?,
      message = ?,
      recipient = ?,
      destination = ?,
      provider = ?,
      provider_message_id = ?,
      created_at = ?,
      sent_at = ?,
      delivered_at = ?,
      last_attempt_at = ?,
      next_retry_at = ?,
      error_code = ?,
      error_message = ?,
      max_attempts = ?
    WHERE id = ?`,
    [
      notification.sequence,
      notification.ticketId,
      notification.ticket,
      notification.patientName,
      notification.department,
      notification.priority,
      notification.channel,
      notification.type,
      notification.status,
      notification.title,
      notification.message,
      notification.recipient,
      notification.destination ?? null,
      notification.provider ?? null,
      notification.providerMessageId ?? null,
      toSqlDateTime(notification.createdAt),
      toSqlDateTime(notification.sentAt),
      toSqlDateTime(notification.deliveredAt),
      toSqlDateTime(notification.lastAttemptAt),
      toSqlDateTime(notification.nextRetryAt),
      notification.errorCode ?? null,
      notification.errorMessage ?? null,
      notification.maxAttempts ?? 1,
      notification.id,
    ],
  );

  await connection.execute("DELETE FROM notification_attempts WHERE notification_id = ?", [
    notification.id,
  ]);
  await insertNotificationAttempts(connection, notification);
}

async function insertNotificationAttempts(connection, notification) {
  for (const attempt of notification.attempts ?? []) {
    await connection.execute(
      `INSERT INTO notification_attempts (
        notification_id,
        sequence_number,
        status,
        attempted_at,
        completed_at,
        provider_message_id,
        error_code,
        error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        notification.id,
        attempt.sequence,
        attempt.status,
        toSqlDateTime(attempt.attemptedAt),
        toSqlDateTime(attempt.completedAt),
        attempt.providerMessageId ?? null,
        attempt.errorCode ?? null,
        attempt.errorMessage ?? null,
      ],
    );
  }
}

async function fetchNotificationAttempts(connection, notificationIds) {
  if (!notificationIds.length) {
    return new Map();
  }

  const placeholders = notificationIds.map(() => "?").join(", ");
  const [rows] = await connection.query(
    `SELECT * FROM notification_attempts
     WHERE notification_id IN (${placeholders})
     ORDER BY notification_id, sequence_number`,
    notificationIds,
  );
  const byNotification = new Map();

  for (const row of rows) {
    const attempts = byNotification.get(row.notification_id) ?? [];
    attempts.push(mapAttemptRow(row));
    byNotification.set(row.notification_id, attempts);
  }

  return byNotification;
}

async function fetchNotificationByWhere(whereSql, params) {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      `SELECT * FROM notifications WHERE ${whereSql} LIMIT 1`,
      params,
    );

    if (!rows.length) {
      return null;
    }

    const attemptsByNotification = await fetchNotificationAttempts(connection, [
      rows[0].id,
    ]);
    return mapNotificationRow(rows[0], attemptsByNotification.get(rows[0].id) ?? []);
  });
}

async function getNextCounter(name) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT value FROM system_counters WHERE name = ? FOR UPDATE",
      [name],
    );

    const current = Number(rows[0]?.value ?? 1);
    await connection.execute("UPDATE system_counters SET value = ? WHERE name = ?", [
      current + 1,
      name,
    ]);
    return current;
  });
}

export async function initializeQueueRepository() {
  await withConnection(async (connection) => {
    const schema = await fs.readFile(schemaPath, "utf8");

    for (const statement of splitSqlStatements(schema)) {
      await connection.query(statement);
    }

    await insertDepartments(connection);
    await insertCounters(connection);
    await ensureTicketSchema(connection);

    const [rows] = await connection.execute("SELECT COUNT(*) AS total FROM tickets");
    const hasTickets = Number(rows[0]?.total ?? 0) > 0;

    if (!hasTickets && env.databaseSeedDemoData) {
      for (const ticket of createSeedTickets()) {
        await insertTicket(connection, ticket);
      }
    }
  });
}

export async function listTickets() {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT * FROM tickets ORDER BY registered_at DESC, ticket_code DESC",
    );
    return rows.map(mapTicketRow).map(cloneTicket);
  });
}

export async function findTicketById(id) {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute("SELECT * FROM tickets WHERE id = ? LIMIT 1", [
      id,
    ]);
    return rows.length ? cloneTicket(mapTicketRow(rows[0])) : null;
  });
}

export async function createTicket(ticket) {
  await withConnection((connection) => insertTicket(connection, ticket));
  return cloneTicket(ticket);
}

export async function updateTicket(id, updater) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.execute("SELECT * FROM tickets WHERE id = ? LIMIT 1", [
      id,
    ]);

    if (!rows.length) {
      return null;
    }

    const current = mapTicketRow(rows[0]);
    const nextValue =
      typeof updater === "function"
        ? await updater(cloneTicket(current))
        : { ...current, ...updater };

    await replaceTicket(connection, nextValue);
    return cloneTicket(nextValue);
  });
}

export async function getNextSequence() {
  return getNextCounter("ticket_sequence");
}

export async function listNotifications() {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT * FROM notifications ORDER BY sequence_number DESC",
    );
    const attemptsByNotification = await fetchNotificationAttempts(
      connection,
      rows.map((row) => row.id),
    );

    return rows
      .map((row) => mapNotificationRow(row, attemptsByNotification.get(row.id) ?? []))
      .map(cloneNotification);
  });
}

export async function createNotification(notification) {
  await withTransaction((connection) => insertNotification(connection, notification));
  return cloneNotification(notification);
}

export async function findNotificationById(id) {
  const notification = await fetchNotificationByWhere("id = ?", [id]);
  return notification ? cloneNotification(notification) : null;
}

export async function findNotificationByProviderMessageId(providerMessageId) {
  const notification = await fetchNotificationByWhere("provider_message_id = ?", [
    providerMessageId,
  ]);
  return notification ? cloneNotification(notification) : null;
}

export async function updateNotification(id, updater) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT * FROM notifications WHERE id = ? LIMIT 1",
      [id],
    );

    if (!rows.length) {
      return null;
    }

    const attemptsByNotification = await fetchNotificationAttempts(connection, [id]);
    const current = mapNotificationRow(rows[0], attemptsByNotification.get(id) ?? []);
    const nextValue =
      typeof updater === "function"
        ? await updater(cloneNotification(current))
        : { ...current, ...updater };

    await replaceNotification(connection, nextValue);
    return cloneNotification(nextValue);
  });
}

export async function getNextNotificationSequence() {
  return getNextCounter("notification_sequence");
}
