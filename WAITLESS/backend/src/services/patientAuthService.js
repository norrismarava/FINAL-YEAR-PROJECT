import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

const patientSessions = new Map();

const patientsFilePath = path.join(process.cwd(), "data", "patient-users.json");

let patientUsers = [];

if (fs.existsSync(patientsFilePath)) {
  try {
    const data = fs.readFileSync(patientsFilePath, "utf8");
    patientUsers = JSON.parse(data);
  } catch (error) {
    console.error("Failed to load patient users from file:", error);
  }
}

function savePatientUsers() {
  try {
    const dataDir = path.dirname(patientsFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(patientsFilePath, JSON.stringify(patientUsers, null, 2));
  } catch (error) {
    console.error("Failed to save patient users:", error);
  }
}

function normalizeEmail(email) {
  return email?.trim().toLowerCase() ?? "";
}

function normalizeUsername(username) {
  return username?.trim().toLowerCase() ?? "";
}

function publicPatientUser(user) {
  return {
    id: user.id,
    username: user.username ?? "",
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    nationalId: user.nationalId ?? "",
    dob: user.dob ?? "",
    gender: user.gender ?? "unknown",
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt ?? null,
  };
}

function findPatientByUsername(username) {
  const normalizedUsername = normalizeUsername(username);
  return patientUsers.find(
    (user) => normalizeUsername(user.username) === normalizedUsername,
  );
}

function findPatientByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return patientUsers.find(
    (user) => normalizeEmail(user.email) === normalizedEmail,
  );
}

function findPatientById(id) {
  return patientUsers.find((user) => user.id === id);
}

function verifyPassword(user, password) {
  if (!user || typeof password !== "string") {
    return false;
  }
  return user.password === password;
}

function createPatientSession(user) {
  const token = `patient_${crypto.randomBytes(32).toString("hex")}`;
  const expiresAt = new Date(Date.now() + env.authSessionTtlMs).toISOString();

  patientSessions.set(token, {
    token,
    user: publicPatientUser(user),
    expiresAt,
  });

  return {
    token,
    expiresAt,
    user: publicPatientUser(user),
  };
}

function pruneExpiredPatientSessions() {
  const now = Date.now();
  for (const [token, session] of patientSessions.entries()) {
    if (new Date(session.expiresAt).getTime() <= now) {
      patientSessions.delete(token);
    }
  }
}

export function registerPatientAccount({
  fullName,
  username,
  email,
  phone,
  nationalId,
  dob,
  gender,
  password,
}) {
  const trimmedName = fullName?.trim();
  const normalizedUsername = normalizeUsername(username);
  const normalizedEmail = normalizeEmail(email);

  if (!trimmedName) {
    throw new HttpError(400, "Full name is required.");
  }
  if (!normalizedUsername) {
    throw new HttpError(400, "Username is required.");
  }
  if (!/^[a-z0-9._-]{3,32}$/.test(normalizedUsername)) {
    throw new HttpError(
      400,
      "Username must be 3 to 32 characters and use only letters, numbers, dots, underscores, or hyphens.",
    );
  }
  if (!normalizedEmail) {
    throw new HttpError(400, "Email is required.");
  }
  if (!phone?.trim()) {
    throw new HttpError(400, "Phone number is required.");
  }
  if (!password || password.length < 6) {
    throw new HttpError(400, "Password must be at least 6 characters.");
  }

  const existingUsername = findPatientByUsername(normalizedUsername);
  if (existingUsername) {
    throw new HttpError(
      400,
      "A patient account with this username already exists.",
    );
  }

  const existingEmail = findPatientByEmail(normalizedEmail);
  if (existingEmail) {
    throw new HttpError(
      400,
      "A patient account with this email already exists.",
    );
  }

  const newPatient = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    fullName: trimmedName,
    email: normalizedEmail,
    phone: phone.trim(),
    nationalId: nationalId?.trim() ?? "",
    dob: dob ?? "",
    gender: gender ?? "unknown",
    password,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  };

  patientUsers.push(newPatient);
  savePatientUsers();

  const session = createPatientSession(newPatient);
  newPatient.lastLoginAt = new Date().toISOString();
  savePatientUsers();

  return session;
}

export function loginPatient({ identifier, password }) {
  pruneExpiredPatientSessions();

  const user =
    findPatientByUsername(identifier) ?? findPatientByEmail(identifier);
  if (!verifyPassword(user, password)) {
    throw new HttpError(401, "Invalid username, email, or password.");
  }

  user.lastLoginAt = new Date().toISOString();
  savePatientUsers();

  return createPatientSession(user);
}

export function getPatientSessionFromRequest(req) {
  pruneExpiredPatientSessions();

  const authorization = req.headers.authorization ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  const session = patientSessions.get(token);
  if (!session) {
    return null;
  }

  return session;
}

export function requirePatientSession(req) {
  const session = getPatientSessionFromRequest(req);

  if (!session) {
    throw new HttpError(401, "Patient login is required.");
  }

  return session;
}

export { findPatientById, publicPatientUser };
