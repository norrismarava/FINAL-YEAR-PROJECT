import crypto from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "../config/env.js";
import { getPool } from "../db/db.js";
import { HttpError } from "../utils/http.js";

const useFileStore = env.databaseProvider === "file";
const codesFilePath = fileURLToPath(
  new URL("../../data/staff-access-codes.json", import.meta.url),
);

const CODE_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

const ALLOWED_ROLES = [
  "admin",
  "doctor",
  "lab-tech",
  "nurse",
  "pharmacist",
  "radiologist",
  "receptionist",
];

function generateCode() {
  const segment = () => crypto.randomBytes(3).toString("hex").toUpperCase();
  return `WL-${segment()}-${segment()}`;
}

function publicCode(record) {
  return {
    id: record.id,
    code: record.code,
    role: record.role,
    department: record.department,
    note: record.note ?? "",
    createdBy: record.created_by ?? null,
    createdAt: record.created_at,
    expiresAt: record.expires_at,
    usedAt: record.used_at ?? null,
    usedBy: record.used_by ?? null,
  };
}

/* ---------- file store ---------- */

function loadCodes() {
  if (!existsSync(codesFilePath)) return [];
  try {
    return JSON.parse(readFileSync(codesFilePath, "utf-8"));
  } catch {
    return [];
  }
}

function saveCodes(codes) {
  mkdirSync(path.dirname(codesFilePath), { recursive: true });
  writeFileSync(codesFilePath, JSON.stringify(codes, null, 2), "utf-8");
}

/* ---------- mysql store ---------- */

let tableEnsured = false;

async function ensureTable() {
  if (tableEnsured) return;
  tableEnsured = true;
  const pool = getPool();
  await pool.execute(`CREATE TABLE IF NOT EXISTS staff_access_codes (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    role VARCHAR(32) NOT NULL,
    department VARCHAR(64) NOT NULL,
    note VARCHAR(255) NULL,
    created_by VARCHAR(64) NULL,
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    used_by VARCHAR(64) NULL
  )`);
}

/* ---------- service ---------- */

export async function createStaffAccessCode({ role, department, note, createdBy }) {
  if (!ALLOWED_ROLES.includes(role)) {
    throw new HttpError(400, "Select a valid staff role for this access code.");
  }
  if (!department?.trim()) {
    throw new HttpError(400, "A department is required for this access code.");
  }

  const record = {
    id: crypto.randomUUID(),
    code: generateCode(),
    role,
    department: department.trim(),
    note: note?.trim() ?? "",
    created_by: createdBy ?? null,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    used_at: null,
    used_by: null,
  };

  if (useFileStore) {
    const codes = loadCodes();
    codes.push(record);
    saveCodes(codes);
    return publicCode(record);
  }

  await ensureTable();
  const pool = getPool();
  await pool.execute(
    `INSERT INTO staff_access_codes
      (id, code, role, department, note, created_by, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id,
      record.code,
      record.role,
      record.department,
      record.note,
      record.created_by,
      new Date(record.created_at),
      new Date(record.expires_at),
    ],
  );
  return publicCode(record);
}

export async function listStaffAccessCodes() {
  if (useFileStore) {
    return loadCodes()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(publicCode);
  }

  await ensureTable();
  const pool = getPool();
  const [rows] = await pool.execute(
    "SELECT * FROM staff_access_codes ORDER BY created_at DESC LIMIT 50",
  );
  return rows.map(publicCode);
}

async function findCode(code) {
  const normalized = (code ?? "").trim().toUpperCase();
  if (!normalized) return null;

  if (useFileStore) {
    return loadCodes().find((c) => c.code === normalized) ?? null;
  }

  await ensureTable();
  const pool = getPool();
  const [rows] = await pool.execute(
    "SELECT * FROM staff_access_codes WHERE code = ? LIMIT 1",
    [normalized],
  );
  return rows[0] ?? null;
}

export async function validateStaffAccessCode(code) {
  const record = await findCode(code);
  if (!record) {
    throw new HttpError(400, "Invalid staff access code.");
  }
  if (record.used_at) {
    throw new HttpError(400, "This access code has already been used.");
  }
  if (new Date(record.expires_at).getTime() < Date.now()) {
    throw new HttpError(400, "This access code has expired. Ask an administrator for a new one.");
  }
  return record;
}

export async function markAccessCodeUsed(codeId, staffId) {
  const usedAt = new Date().toISOString();

  if (useFileStore) {
    const codes = loadCodes();
    const idx = codes.findIndex((c) => c.id === codeId);
    if (idx >= 0) {
      codes[idx].used_at = usedAt;
      codes[idx].used_by = staffId;
      saveCodes(codes);
    }
    return;
  }

  await ensureTable();
  const pool = getPool();
  await pool.execute(
    "UPDATE staff_access_codes SET used_at = ?, used_by = ? WHERE id = ?",
    [new Date(usedAt), staffId, codeId],
  );
}
