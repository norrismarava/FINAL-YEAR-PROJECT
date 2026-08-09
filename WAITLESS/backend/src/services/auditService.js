import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { env } from "../config/env.js";
import { getPool } from "../db/db.js";

const REDACTED_VALUE = "[REDACTED]";
const SENSITIVE_KEY_PATTERN =
  /password|passcode|token|secret|authorization|cookie|avatarbase64|access.?key|private.?key/i;
const MAX_LIMIT = 500;

let fileAppendQueue = Promise.resolve();

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function sanitizeValue(value, seen = new WeakSet()) {
  if (value === null || value === undefined) {
    return value ?? null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key)
        ? REDACTED_VALUE
        : sanitizeValue(entry, seen),
    ]),
  );
}

function normalizeActor(actor) {
  if (!actor) {
    return null;
  }

  return sanitizeValue({
    id: actor.id ?? null,
    name: actor.name ?? actor.fullName ?? actor.username ?? "Staff member",
    role: actor.role ?? null,
    department: actor.department ?? null,
  });
}

function hashEvent(event) {
  return crypto.createHash("sha256").update(stableStringify(event)).digest("hex");
}

function buildEvent(input, previousHash = null) {
  const event = {
    id: input.id ?? crypto.randomUUID(),
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    actor: normalizeActor(input.actor),
    action: String(input.action ?? "unknown"),
    entityType: String(input.entityType ?? "system"),
    entityId: input.entityId ? String(input.entityId) : null,
    entityLabel: input.entityLabel ? String(input.entityLabel) : null,
    outcome: String(input.outcome ?? "success"),
    before: sanitizeValue(input.before),
    after: sanitizeValue(input.after),
    metadata: sanitizeValue(input.metadata),
    previousHash,
  };

  return {
    ...event,
    eventHash: hashEvent(event),
  };
}

function parseJson(value) {
  if (value === null || value === undefined || typeof value === "object") {
    return value ?? null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function mapDatabaseEvent(row) {
  return {
    id: row.id,
    occurredAt:
      row.occurred_at instanceof Date
        ? row.occurred_at.toISOString()
        : new Date(`${row.occurred_at}Z`).toISOString(),
    actor: row.actor_id
      ? {
          id: row.actor_id,
          name: row.actor_name,
          role: row.actor_role,
          department: row.actor_department,
        }
      : null,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityLabel: row.entity_label,
    outcome: row.outcome,
    before: parseJson(row.before_state),
    after: parseJson(row.after_state),
    metadata: parseJson(row.metadata),
    previousHash: row.previous_hash,
    eventHash: row.event_hash,
  };
}

async function readFileEvents() {
  try {
    const contents = await fs.readFile(env.auditLogPath, "utf8");
    return contents
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function appendFileEvent(input) {
  await fs.mkdir(path.dirname(env.auditLogPath), { recursive: true });
  const events = await readFileEvents();
  const event = buildEvent(input, events.at(-1)?.eventHash ?? null);
  await fs.appendFile(env.auditLogPath, `${JSON.stringify(event)}\n`, "utf8");
  return event;
}

async function appendDatabaseEvent(input) {
  const pool = getPool();
  const connection = await pool.getConnection();
  let lockAcquired = false;

  try {
    const [lockRows] = await connection.query(
      "SELECT GET_LOCK('waitless_audit_chain', 5) AS acquired",
    );
    lockAcquired = Number(lockRows[0]?.acquired) === 1;
    if (!lockAcquired) {
      throw new Error("Timed out while acquiring the audit chain lock.");
    }

    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT event_hash
       FROM audit_events
       WHERE event_hash NOT IN (
         SELECT previous_hash FROM audit_events WHERE previous_hash IS NOT NULL
       )
       LIMIT 1`,
    );
    const event = buildEvent(input, rows[0]?.event_hash ?? null);

    await connection.execute(
      `INSERT INTO audit_events (
        id, occurred_at, actor_id, actor_name, actor_role, actor_department,
        action, entity_type, entity_id, entity_label, outcome, before_state,
        after_state, metadata, previous_hash, event_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id,
        new Date(event.occurredAt),
        event.actor?.id ?? null,
        event.actor?.name ?? null,
        event.actor?.role ?? null,
        event.actor?.department ?? null,
        event.action,
        event.entityType,
        event.entityId,
        event.entityLabel,
        event.outcome,
        event.before === null ? null : JSON.stringify(event.before),
        event.after === null ? null : JSON.stringify(event.after),
        event.metadata === null ? null : JSON.stringify(event.metadata),
        event.previousHash,
        event.eventHash,
      ],
    );
    await connection.commit();
    return event;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    if (lockAcquired) {
      await connection.query("SELECT RELEASE_LOCK('waitless_audit_chain')");
    }
    connection.release();
  }
}

export async function recordAuditEvent(input) {
  if (env.databaseProvider === "file") {
    const queuedAppend = fileAppendQueue.then(() => appendFileEvent(input));
    fileAppendQueue = queuedAppend.catch(() => undefined);
    return queuedAppend;
  }

  return appendDatabaseEvent(input);
}

export async function recordAuditEventSafely(input) {
  try {
    return await recordAuditEvent(input);
  } catch (error) {
    console.error("Failed to record audit event.", error);
    return null;
  }
}

function normalizeFilters(filters = {}) {
  const parsedLimit = Number.parseInt(filters.limit ?? "100", 10);
  return {
    action: filters.action?.trim() || null,
    actorId: filters.actorId?.trim() || null,
    entityType: filters.entityType?.trim() || null,
    from: filters.from?.trim() || null,
    to: filters.to?.trim() || null,
    query: filters.query?.trim().toLowerCase() || null,
    limit: Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 100, 1), MAX_LIMIT),
  };
}

function matchesFilters(event, filters) {
  const searchable = [
    event.actor?.name,
    event.actor?.role,
    event.action,
    event.entityType,
    event.entityLabel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    (!filters.action || event.action === filters.action) &&
    (!filters.actorId || event.actor?.id === filters.actorId) &&
    (!filters.entityType || event.entityType === filters.entityType) &&
    (!filters.from || new Date(event.occurredAt) >= new Date(filters.from)) &&
    (!filters.to || new Date(event.occurredAt) <= new Date(filters.to)) &&
    (!filters.query || searchable.includes(filters.query))
  );
}

function verifyEvents(events) {
  if (!events.length) {
    return { valid: true, checked: 0, brokenAt: null };
  }

  const nextByPreviousHash = new Map();

  for (const storedEvent of events) {
    const { eventHash, ...event } = storedEvent;
    if (hashEvent(event) !== eventHash) {
      return { valid: false, checked: events.length, brokenAt: storedEvent.id };
    }

    if (nextByPreviousHash.has(event.previousHash)) {
      return { valid: false, checked: events.length, brokenAt: storedEvent.id };
    }
    nextByPreviousHash.set(event.previousHash, storedEvent);
  }

  let current = nextByPreviousHash.get(null);
  let visited = 0;
  const visitedHashes = new Set();

  while (current && !visitedHashes.has(current.eventHash)) {
    visited += 1;
    visitedHashes.add(current.eventHash);
    current = nextByPreviousHash.get(current.eventHash);
  }

  return visited === events.length
    ? { valid: true, checked: visited, brokenAt: null }
    : { valid: false, checked: visited, brokenAt: current?.id ?? null };
}

async function listFileAuditEvents(filters) {
  const allEvents = await readFileEvents();
  const events = allEvents
    .filter((event) => matchesFilters(event, filters))
    .sort((left, right) => new Date(right.occurredAt) - new Date(left.occurredAt))
    .slice(0, filters.limit);

  return {
    events,
    count: events.length,
    integrity: verifyEvents(allEvents),
  };
}

async function listDatabaseAuditEvents(filters) {
  const where = [];
  const values = [];

  if (filters.action) {
    where.push("action = ?");
    values.push(filters.action);
  }
  if (filters.actorId) {
    where.push("actor_id = ?");
    values.push(filters.actorId);
  }
  if (filters.entityType) {
    where.push("entity_type = ?");
    values.push(filters.entityType);
  }
  if (filters.from) {
    where.push("occurred_at >= ?");
    values.push(new Date(filters.from));
  }
  if (filters.to) {
    where.push("occurred_at <= ?");
    values.push(new Date(filters.to));
  }
  if (filters.query) {
    where.push("LOWER(CONCAT_WS(' ', actor_name, actor_role, action, entity_type, entity_label)) LIKE ?");
    values.push(`%${filters.query}%`);
  }

  const pool = getPool();
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT * FROM audit_events ${clause} ORDER BY occurred_at DESC, id DESC LIMIT ?`,
    [...values, filters.limit],
  );
  const [integrityRows] = await pool.query(
    "SELECT * FROM audit_events",
  );

  return {
    events: rows.map(mapDatabaseEvent),
    count: rows.length,
    integrity: verifyEvents(integrityRows.map(mapDatabaseEvent)),
  };
}

export async function listAuditEvents(filters = {}) {
  const normalizedFilters = normalizeFilters(filters);
  return env.databaseProvider === "file"
    ? listFileAuditEvents(normalizedFilters)
    : listDatabaseAuditEvents(normalizedFilters);
}

export const auditInternals = {
  REDACTED_VALUE,
  buildEvent,
  verifyEvents,
};
