import crypto from "node:crypto";

import bcrypt from "bcryptjs";

import { env } from "../config/env.js";
import { getPool } from "../db/db.js";
import { HttpError } from "../utils/http.js";
import * as filePatient from "./filePatientStore.js";
import { createSessionStore } from "./sessionStore.js";

const useFile = env.databaseProvider === "file";

const patientSessionStore = createSessionStore("patient");
const patientSessions = patientSessionStore.load();
const patientPasswordResetTokens = new Map();

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
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    nationalId: user.national_id ?? "",
    dob: user.dob ? String(user.dob).slice(0, 10) : "",
    gender: user.gender ?? "unknown",
    avatarUrl: user.avatar_url ?? null,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at ?? null,
  };
}

function createPatientSession(user) {
  const token = `patient_${crypto.randomBytes(32).toString("hex")}`;
  const expiresAt = new Date(Date.now() + env.authSessionTtlMs).toISOString();

  patientSessions.set(token, {
    token,
    user: publicPatientUser(user),
    expiresAt,
  });
  patientSessionStore.persist();

  return {
    token,
    expiresAt,
    user: publicPatientUser(user),
  };
}

function pruneExpiredPatientSessions() {
  const now = Date.now();
  let changed = false;
  for (const [token, session] of patientSessions.entries()) {
    if (new Date(session.expiresAt).getTime() <= now) {
      patientSessions.delete(token);
      changed = true;
    }
  }
  if (changed) {
    patientSessionStore.persist();
  }
}

export async function registerPatientAccount({
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
  const trimmedNationalId = nationalId?.trim();
  if (!trimmedNationalId) {
    throw new HttpError(400, "National ID is required.");
  }
  if (!password || password.length < 6) {
    throw new HttpError(400, "Password must be at least 6 characters.");
  }

  if (useFile) {
    const existing = await filePatient.findPatientUserByUsername(normalizedUsername);
    if (existing) {
      throw new HttpError(400, "A patient account with this username or email already exists.");
    }
    const existingEmail = await filePatient.findPatientUserByUsername(normalizedEmail);
    if (existingEmail) {
      throw new HttpError(400, "A patient account with this email already exists.");
    }
    const nationalIdTaken = (await filePatient.listAllPatients()).some(
      (u) => u.national_id === trimmedNationalId,
    );
    if (nationalIdTaken) {
      throw new HttpError(400, "A patient account with this ID number already exists.");
    }

    const newUser = await filePatient.createPatientUserRecord({
      fullName: trimmedName,
      username: normalizedUsername,
      email: normalizedEmail,
      phone: phone.trim(),
      nationalId: trimmedNationalId,
      dob: dob || null,
      gender: gender ?? "unknown",
      password,
    });

    await filePatient.updatePatientLastLogin(newUser.id);
    return createPatientSession(newUser);
  }

  const pool = getPool();
  const [usernameRows] = await pool.execute(
    "SELECT id FROM patient_users WHERE username = ?",
    [normalizedUsername],
  );
  if (usernameRows.length) {
    throw new HttpError(400, "A patient account with this username already exists.");
  }

  const [emailRows] = await pool.execute(
    "SELECT id FROM patient_users WHERE email = ?",
    [normalizedEmail],
  );
  if (emailRows.length) {
    throw new HttpError(400, "A patient account with this email already exists.");
  }

  const [nationalIdRows] = await pool.execute(
    "SELECT id FROM patient_users WHERE national_id = ? LIMIT 1",
    [trimmedNationalId],
  );
  if (nationalIdRows.length) {
    throw new HttpError(400, "A patient account with this ID number already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();

  await pool.query(
    `INSERT INTO patient_users (
      id, username, email, password_hash, full_name, phone,
      national_id, dob, gender, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      id,
      normalizedUsername,
      normalizedEmail,
      passwordHash,
      trimmedName,
      phone.trim(),
      trimmedNationalId,
      dob || null,
      gender ?? "unknown",
    ],
  );

  const [newRows] = await pool.execute(
    "SELECT * FROM patient_users WHERE id = ? LIMIT 1",
    [id],
  );

  const newUser = newRows[0];

  await pool.execute(
    "UPDATE patient_users SET last_login_at = NOW() WHERE id = ?",
    [id],
  );

  return createPatientSession(newUser);
}

export async function loginPatient({ identifier, password }) {
  pruneExpiredPatientSessions();

  if (useFile) {
    const user = await filePatient.findPatientUserByUsername(identifier ?? "");
    if (!user || !(await filePatient.verifyPatientPassword(password, user.password_hash))) {
      throw new HttpError(401, "Invalid username, email, or password.");
    }
    await filePatient.updatePatientLastLogin(user.id);
    return createPatientSession(user);
  }

  const pool = getPool();

  const [rows] = await pool.execute(
    "SELECT * FROM patient_users WHERE username = ? OR email = ? LIMIT 1",
    [identifier?.trim().toLowerCase() ?? "", identifier?.trim().toLowerCase() ?? ""],
  );

  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new HttpError(401, "Invalid username, email, or password.");
  }

  await pool.execute(
    "UPDATE patient_users SET last_login_at = NOW() WHERE id = ?",
    [user.id],
  );

  return createPatientSession(user);
}

export async function requestPatientPasswordReset({ identifier }) {
  const normalized = normalizeEmail(identifier);

  let user = null;
  if (useFile) {
    user = await filePatient.findPatientUserByUsername(normalized);
  } else {
    const pool = getPool();
    const [rows] = await pool.execute(
      "SELECT id FROM patient_users WHERE username = ? OR email = ? LIMIT 1",
      [normalized, normalized],
    );
    user = rows[0] ?? null;
  }

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000).toISOString();

    patientPasswordResetTokens.set(token, {
      userId: user.id,
      expiresAt,
    });

    console.log(
      `Patient password reset link for ${normalized}: http://localhost:3000/patient/reset-password?token=${token}`,
    );
  }

  return {
    message:
      "If an account with these details exists, a password reset link has been sent.",
  };
}

export async function resetPatientPassword({ token, password }) {
  const resetData = patientPasswordResetTokens.get(token);

  if (!resetData || new Date(resetData.expiresAt).getTime() < Date.now()) {
    patientPasswordResetTokens.delete(token);
    throw new HttpError(400, "Invalid or expired reset token.");
  }

  if (!password || password.length < 6) {
    throw new HttpError(400, "Password must be at least 6 characters.");
  }

  if (useFile) {
    await filePatient.updatePatientPasswordRecord(resetData.userId, password);
  } else {
    const pool = getPool();
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      "UPDATE patient_users SET password_hash = ? WHERE id = ?",
      [passwordHash, resetData.userId],
    );
    if (result.affectedRows === 0) {
      throw new HttpError(400, "User not found.");
    }
  }

  patientPasswordResetTokens.delete(token);

  return { message: "Password reset successfully" };
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

  // Sliding expiry — activity renews the session; the TTL only lapses idle.
  session.expiresAt = new Date(Date.now() + env.authSessionTtlMs).toISOString();
  patientSessionStore.persist();

  return session;
}

export function requirePatientSession(req) {
  const session = getPatientSessionFromRequest(req);

  if (!session) {
    throw new HttpError(401, "Patient login is required.");
  }

  return session;
}

export { publicPatientUser };

export async function updatePatientProfile(req, patch) {
  const session = requirePatientSession(req);
  const userId = session.user.id;

  if (useFile) {
    const updated = await filePatient.updatePatientUserRecord(userId, patch);
    session.user = publicPatientUser(updated);
    const newSession = createPatientSession(updated);
    return newSession;
  }

  const pool = getPool();
  const fields = [];
  const values = [];

  if (typeof patch.fullName === "string") {
    fields.push("full_name = ?");
    values.push(patch.fullName.trim());
  }
  if (typeof patch.email === "string") {
    fields.push("email = ?");
    values.push(patch.email.trim().toLowerCase());
  }
  if (typeof patch.phone === "string") {
    fields.push("phone = ?");
    values.push(patch.phone.trim());
  }
  if (typeof patch.nationalId === "string") {
    fields.push("national_id = ?");
    values.push(patch.nationalId.trim() || null);
  }
  if (typeof patch.dob === "string") {
    fields.push("dob = ?");
    values.push(patch.dob || null);
  }
  if (typeof patch.gender === "string") {
    fields.push("gender = ?");
    values.push(patch.gender);
  }
  if (typeof patch.avatarUrl === "string") {
    fields.push("avatar_url = ?");
    values.push(patch.avatarUrl);
  }

  if (fields.length === 0) {
    return session;
  }

  values.push(userId);
  await pool.execute(
    `UPDATE patient_users SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );

  const [rows] = await pool.execute(
    "SELECT * FROM patient_users WHERE id = ? LIMIT 1",
    [userId],
  );
  const updatedUser = rows[0];
  session.user = publicPatientUser(updatedUser);
  const newSession = createPatientSession(updatedUser);
  return newSession;
}

export async function changePatientPassword(req, currentPassword, newPassword) {
  const session = requirePatientSession(req);
  const userId = session.user.id;

  if (!newPassword || newPassword.length < 6) {
    throw new HttpError(400, "New password must be at least 6 characters.");
  }

  if (useFile) {
    const user = await filePatient.findPatientUserById(userId);
    if (!user) {
      throw new HttpError(404, "Patient not found.");
    }
    const valid = await filePatient.verifyPatientPassword(currentPassword, user.password_hash);
    if (!valid) {
      throw new HttpError(401, "Current password is incorrect.");
    }
    await filePatient.updatePatientPasswordRecord(userId, newPassword);
    return;
  }

  const pool = getPool();
  const [rows] = await pool.execute(
    "SELECT * FROM patient_users WHERE id = ? LIMIT 1",
    [userId],
  );
  const user = rows[0];
  if (!user) {
    throw new HttpError(404, "Patient not found.");
  }
  if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
    throw new HttpError(401, "Current password is incorrect.");
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await pool.execute(
    "UPDATE patient_users SET password_hash = ? WHERE id = ?",
    [newHash, userId],
  );
}

export async function listPatientUsers() {
  if (useFile) {
    const users = await filePatient.listAllPatients();
    return users.map(publicPatientUser);
  }

  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, username, email, full_name, phone, national_id, dob, gender,
            avatar_url, created_at, last_login_at
     FROM patient_users
     ORDER BY created_at DESC`,
  );
  return rows.map(publicPatientUser);
}

export async function deletePatientAccount(id) {
  let user;
  if (useFile) {
    const users = await filePatient.listAllPatients();
    user = users.find((u) => u.id === id) ?? null;
    if (!user) {
      throw new HttpError(404, "Patient account not found.");
    }
    await filePatient.deletePatientUser(id);
  } else {
    const pool = getPool();
    const [rows] = await pool.execute(
      "SELECT * FROM patient_users WHERE id = ? LIMIT 1",
      [id],
    );
    user = rows[0] ?? null;
    if (!user) {
      throw new HttpError(404, "Patient account not found.");
    }
    await pool.execute("DELETE FROM patient_users WHERE id = ?", [id]);
  }

  for (const [token, session] of patientSessions.entries()) {
    if (session.user?.id === id) {
      patientSessions.delete(token);
      patientSessionStore.persist();
    }
  }

  return publicPatientUser(user);
}
