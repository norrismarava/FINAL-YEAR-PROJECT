import crypto from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

const patientFilePath = fileURLToPath(
  new URL("../../data/patient-users.json", import.meta.url),
);

let initialized = false;

function loadPatients() {
  if (!existsSync(patientFilePath)) {
    return [];
  }
  const raw = readFileSync(patientFilePath, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function savePatients(users) {
  writeFileSync(patientFilePath, JSON.stringify(users, null, 2), "utf-8");
}

async function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  if (!existsSync(patientFilePath)) {
    savePatients([]);
    console.log("[file-patient] Initialized empty patient accounts file.");
  }
}

export async function findPatientUserByUsername(identifier) {
  await ensureInitialized();
  const users = loadPatients();
  const normalized = (identifier ?? "").trim().toLowerCase();
  return (
    users.find(
      (u) => u.username.toLowerCase() === normalized || u.email.toLowerCase() === normalized,
    ) ?? null
  );
}

export async function findPatientUserById(id) {
  await ensureInitialized();
  const users = loadPatients();
  return users.find((u) => u.id === id) ?? null;
}

export async function createPatientUserRecord(data) {
  await ensureInitialized();
  const users = loadPatients();

  const normalizedUsername = (data.username ?? "").trim().toLowerCase();
  const normalizedEmail = (data.email ?? "").trim().toLowerCase();

  if (users.some((u) => u.username.toLowerCase() === normalizedUsername)) {
    throw new Error("A patient account with this username already exists.");
  }
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new Error("A patient account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const newUser = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    email: normalizedEmail,
    password_hash: passwordHash,
    full_name: data.fullName?.trim() ?? "",
    phone: data.phone?.trim() ?? "",
    national_id: data.nationalId?.trim() || null,
    dob: data.dob || null,
    gender: data.gender ?? "unknown",
    created_at: new Date().toISOString(),
    last_login_at: null,
  };

  users.push(newUser);
  savePatients(users);
  return newUser;
}

export async function updatePatientLastLogin(id) {
  const users = loadPatients();
  const idx = users.findIndex((u) => u.id === id);
  if (idx >= 0) {
    users[idx].last_login_at = new Date().toISOString();
    savePatients(users);
  }
}

export async function verifyPatientPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export async function updatePatientUserRecord(id, patch) {
  const users = loadPatients();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) {
    throw new Error("Patient not found.");
  }

  if (typeof patch.fullName === "string") users[idx].full_name = patch.fullName.trim();
  if (typeof patch.email === "string") users[idx].email = patch.email.trim().toLowerCase();
  if (typeof patch.phone === "string") users[idx].phone = patch.phone.trim();
  if (typeof patch.nationalId === "string") users[idx].national_id = patch.nationalId.trim() || null;
  if (typeof patch.dob === "string") users[idx].dob = patch.dob || null;
  if (typeof patch.gender === "string") users[idx].gender = patch.gender;
  if (typeof patch.avatarUrl === "string") users[idx].avatar_url = patch.avatarUrl;

  savePatients(users);
  return users[idx];
}

export async function updatePatientPasswordRecord(id, newPassword) {
  const users = loadPatients();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) {
    throw new Error("Patient not found.");
  }
  users[idx].password_hash = await bcrypt.hash(newPassword, 10);
  savePatients(users);
  return users[idx];
}
