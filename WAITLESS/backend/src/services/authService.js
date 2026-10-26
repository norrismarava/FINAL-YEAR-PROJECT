import crypto from "node:crypto";

import { env } from "../config/env.js";
import { getPool } from "../db/db.js";
import { saveAvatarImage } from "./avatarService.js";
import {
  getPasswordPolicyError,
  hashPassword,
  verifyPassword,
} from "./passwordSecurity.js";
import { HttpError } from "../utils/http.js";
import * as fileStaff from "./fileStaffStore.js";
import {
  markAccessCodeUsed,
  validateStaffAccessCode,
} from "./staffAccessCodeService.js";
import { createSessionStore } from "./sessionStore.js";

const useFileStaff = env.databaseProvider === "file";
const useDatabase = env.databaseProvider === "mysql";

function publicStaffUserFromRow(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    department: user.department,
    employeeId: user.employee_id,
    roomNumber: user.room_number ?? null,
    avatarUrl: user.avatar_url ?? null,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at ?? null,
  };
}

const staffSessionStore = createSessionStore("staff");
const sessions = staffSessionStore.load();
const passwordResetTokens = new Map();

function normalizeUsername(username) {
  return username?.trim().toLowerCase() ?? "";
}

function normalizeEmail(email) {
  return email?.trim().toLowerCase() ?? "";
}

function publicStaffUser(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    department: user.department,
    employeeId: user.employee_id,
    roomNumber: user.room_number ?? null,
    avatarUrl: user.avatar_url ?? null,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
  };
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + env.authSessionTtlMs).toISOString();

  sessions.set(token, {
    token,
    user: publicStaffUser(user),
    expiresAt,
  });
  staffSessionStore.persist();

  return {
    token,
    expiresAt,
    user: publicStaffUser(user),
  };
}

function pruneExpiredSessions() {
  const now = Date.now();
  let changed = false;

  for (const [token, session] of sessions.entries()) {
    if (new Date(session.expiresAt).getTime() <= now) {
      sessions.delete(token);
      changed = true;
    }
  }

  if (changed) {
    staffSessionStore.persist();
  }
}

export async function loginStaff({ username, password }) {
  pruneExpiredSessions();
  const normalizedIdentifier = normalizeUsername(username);

  if (!normalizedIdentifier || typeof password !== "string") {
    throw new HttpError(401, "Invalid username, email, or password.");
  }

  if (useFileStaff) {
    const user = await fileStaff.findStaffByUsername(normalizedIdentifier);
    if (!user || !(await fileStaff.verifyStaffPassword(password, user.password_hash))) {
      throw new HttpError(401, "Invalid username, email, or password.");
    }
    await fileStaff.updateStaffLastLogin(user.id);
    return createSession(user);
  }

  const pool = getPool();
  const [rows] = await pool.execute(
    "SELECT * FROM staff_users WHERE username = ? OR email = ? LIMIT 1",
    [normalizedIdentifier, normalizedIdentifier],
  );

  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new HttpError(401, "Invalid username, email, or password.");
  }

  await pool.execute(
    "UPDATE staff_users SET last_login_at = NOW() WHERE id = ?",
    [user.id],
  );

  return createSession(user);
}

export async function registerStaff({
  fullName,
  username,
  email,
  phone,
  department,
  role,
  employeeId,
  roomNumber,
  password,
  avatarBase64,
}) {
  if (useFileStaff) {
    const user = await fileStaff.createStaffUser({
      fullName,
      username,
      email,
      phone,
      department,
      role,
      employeeId,
      roomNumber,
      password,
      avatarUrl: avatarBase64 ? saveAvatarImage(crypto.randomUUID(), avatarBase64) : null,
    });
    return {
      message: "Staff member registered successfully",
      user: publicStaffUserFromRow(user),
    };
  }

  const pool = getPool();
  const normalizedUsername = normalizeUsername(username);
  const normalizedEmail = normalizeEmail(email);

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

  if (!fullName?.trim()) {
    throw new HttpError(400, "Full name is required.");
  }

  if (!department?.trim()) {
    throw new HttpError(400, "Department is required.");
  }

  const allowedRoles = [
    "admin",
    "dentist",
    "doctor",
    "lab-tech",
    "nurse",
    "pharmacist",
    "radiologist",
    "receptionist",
  ];
  if (!allowedRoles.includes(role)) {
    throw new HttpError(400, "Select a valid staff role.");
  }

  const passwordPolicyError = getPasswordPolicyError(password);
  if (passwordPolicyError) {
    throw new HttpError(400, passwordPolicyError);
  }

  const [usernameRows] = await pool.execute(
    "SELECT id FROM staff_users WHERE username = ?",
    [normalizedUsername],
  );
  if (usernameRows.length) {
    throw new HttpError(
      400,
      "A staff account with this username already exists.",
    );
  }

  const [emailRows] = await pool.execute(
    "SELECT id FROM staff_users WHERE email = ?",
    [normalizedEmail],
  );
  if (emailRows.length) {
    throw new HttpError(400, "A user with this email already exists.");
  }

  if (employeeId) {
    const [employeeRows] = await pool.execute(
      "SELECT id FROM staff_users WHERE employee_id = ?",
      [employeeId],
    );
    if (employeeRows.length) {
      throw new HttpError(400, "A user with this employee ID already exists.");
    }
  }

  const passwordHash = await hashPassword(password);
  const id = crypto.randomUUID();
  let avatarUrl = null;

  if (avatarBase64) {
    avatarUrl = saveAvatarImage(id, avatarBase64);
  }

  await pool.execute(
    `INSERT INTO staff_users (
      id, username, email, password_hash, full_name, role, department,
      phone, employee_id, room_number, avatar_url, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      id,
      normalizedUsername,
      normalizedEmail,
      passwordHash,
      fullName,
      role,
      department,
      phone || null,
      employeeId || null,
      roomNumber?.trim() || null,
      avatarUrl,
    ],
  );

  const [newRows] = await pool.execute(
    "SELECT * FROM staff_users WHERE id = ? LIMIT 1",
    [id],
  );

  return {
    message: "Staff member registered successfully",
    user: publicStaffUser(newRows[0]),
  };
}

export async function listStaffUsers() {
  if (useFileStaff) {
    const rows = await fileStaff.listAllStaff();
    return rows.map(publicStaffUserFromRow);
  }

  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, username, email, full_name, role, department, phone, employee_id,
            avatar_url, created_at, last_login_at
     FROM staff_users
     ORDER BY created_at DESC`,
  );
  return rows.map(publicStaffUserFromRow);
}

export async function changeStaffPassword(userId, { currentPassword, newPassword }) {
  if (!currentPassword || typeof currentPassword !== "string") {
    throw new HttpError(400, "Your current password is required.");
  }
  const policyError = getPasswordPolicyError(newPassword);
  if (policyError) {
    throw new HttpError(400, policyError);
  }
  if (newPassword === currentPassword) {
    throw new HttpError(400, "Your new password must be different from the current one.");
  }

  if (useFileStaff) {
    const user = await fileStaff.findStaffById(userId);
    if (!user || !(await fileStaff.verifyStaffPassword(currentPassword, user.password_hash))) {
      throw new HttpError(401, "Current password is incorrect.");
    }
    await fileStaff.updateStaffPassword(user.email, newPassword);
  } else {
    const pool = getPool();
    const [rows] = await pool.execute(
      "SELECT * FROM staff_users WHERE id = ? LIMIT 1",
      [userId],
    );
    const user = rows[0];
    if (!user || !(await verifyPassword(currentPassword, user.password_hash))) {
      throw new HttpError(401, "Current password is incorrect.");
    }

    const passwordHash = await hashPassword(newPassword);
    await pool.execute(
      "UPDATE staff_users SET password_hash = ? WHERE id = ?",
      [passwordHash, userId],
    );
  }

  // Drop every session for this user — they sign back in with the new password.
  for (const [token, session] of sessions.entries()) {
    if (session.user?.id === userId) {
      sessions.delete(token);
      staffSessionStore.persist();
    }
  }

  return { message: "Password updated." };
}

export async function deleteStaffUser(id, actorId) {
  if (id === actorId) {
    throw new HttpError(400, "You cannot delete your own account.");
  }

  const findUser = async () => {
    if (useFileStaff) {
      const rows = await fileStaff.listAllStaff();
      return rows.find((u) => u.id === id) ?? null;
    }
    const pool = getPool();
    const [rows] = await pool.execute("SELECT * FROM staff_users WHERE id = ? LIMIT 1", [id]);
    return rows[0] ?? null;
  };

  const user = await findUser();
  if (!user) {
    throw new HttpError(404, "Staff account not found.");
  }

  if (user.role === "admin") {
    let adminCount;
    if (useFileStaff) {
      const rows = await fileStaff.listAllStaff();
      adminCount = rows.filter((u) => u.role === "admin").length;
    } else {
      const pool = getPool();
      const [rows] = await pool.execute(
        "SELECT COUNT(*) AS total FROM staff_users WHERE role = 'admin'",
      );
      adminCount = rows[0]?.total ?? 0;
    }
    if (adminCount <= 1) {
      throw new HttpError(400, "Cannot delete the last administrator account.");
    }
  }

  if (useFileStaff) {
    await fileStaff.deleteStaff(id);
  } else {
    const pool = getPool();
    await pool.execute("DELETE FROM staff_users WHERE id = ?", [id]);
  }

  for (const [token, session] of sessions.entries()) {
    if (session.user?.id === id) {
      sessions.delete(token);
      staffSessionStore.persist();
    }
  }

  return publicStaffUserFromRow(user);
}

export async function registerStaffWithAccessCode({
  accessCode,
  fullName,
  username,
  email,
  phone,
  employeeId,
  password,
}) {
  const codeRecord = await validateStaffAccessCode(accessCode);

  const result = await registerStaff({
    fullName,
    username,
    email,
    phone,
    department: codeRecord.department,
    role: codeRecord.role,
    employeeId,
    password,
  });

  await markAccessCodeUsed(codeRecord.id, result.user.id);

  return {
    message: "Staff account created successfully",
    user: result.user,
    assignedRole: codeRecord.role,
    assignedDepartment: codeRecord.department,
  };
}

export async function requestPasswordReset({ email }) {
  const normalizedEmail = normalizeEmail(email);

  if (useFileStaff) {
    const user = await fileStaff.findStaffByUsername(normalizedEmail);
    if (!user) {
      return {
        message: "If an account with this email exists, a password reset link has been sent.",
      };
    }
  } else {
    const pool = getPool();
    const [rows] = await pool.execute(
      "SELECT id FROM staff_users WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );
    if (!rows.length) {
      return {
        message: "If an account with this email exists, a password reset link has been sent.",
      };
    }
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 3600000).toISOString();

  passwordResetTokens.set(token, {
    email: normalizedEmail,
    expiresAt,
  });

  console.log(
    `Password reset link for ${normalizedEmail}: http://localhost:3000/reset-password?token=${token}`,
  );

  return {
    message:
      "If an account with this email exists, a password reset link has been sent.",
  };
}

export async function resetPassword({ token, password }) {
  const resetData = passwordResetTokens.get(token);

  if (!resetData) {
    throw new HttpError(400, "Invalid or expired reset token.");
  }

  if (new Date(resetData.expiresAt).getTime() < Date.now()) {
    passwordResetTokens.delete(token);
    throw new HttpError(400, "Invalid or expired reset token.");
  }

  const passwordPolicyError = getPasswordPolicyError(password);
  if (passwordPolicyError) {
    throw new HttpError(400, passwordPolicyError);
  }

  if (useFileStaff) {
    await fileStaff.updateStaffPassword(resetData.email, password);
  } else {
    const pool = getPool();
    const passwordHash = await hashPassword(password);
    const [result] = await pool.execute(
      "UPDATE staff_users SET password_hash = ? WHERE email = ?",
      [passwordHash, resetData.email],
    );
    if (result.affectedRows === 0) {
      throw new HttpError(400, "User not found.");
    }
  }

  passwordResetTokens.delete(token);

  return {
    message: "Password reset successfully",
  };
}

export function getSessionFromRequest(req) {
  pruneExpiredSessions();

  const authorization = req.headers.authorization ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  const session = sessions.get(token);
  if (!session) {
    return null;
  }

  // Sliding expiry — every authenticated request renews the session so
  // active users are never kicked out; the TTL only lapses on inactivity.
  session.expiresAt = new Date(Date.now() + env.authSessionTtlMs).toISOString();
  staffSessionStore.persist();

  return {
    token,
    expiresAt: session.expiresAt,
    user: session.user,
  };
}

export function requireStaffSession(req, allowedRoles = []) {
  const session = getSessionFromRequest(req);

  if (!session) {
    throw new HttpError(401, "Staff login is required.");
  }

  if (
    allowedRoles.length &&
    session.user.role !== "admin" &&
    !allowedRoles.includes(session.user.role)
  ) {
    throw new HttpError(403, "You do not have permission for this action.");
  }

  return session;
}
