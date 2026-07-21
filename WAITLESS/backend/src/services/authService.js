import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { env } from "../config/env.js";
import { saveAvatarImage } from "./avatarService.js";
import { HttpError } from "../utils/http.js";

const sessions = new Map();
const passwordResetTokens = new Map();

const usersFilePath = path.join(process.cwd(), "data", "staff-users.json");

function loadStaffUsers() {
  if (!fs.existsSync(usersFilePath)) {
    return [...env.staffUsers];
  }

  try {
    const data = fs.readFileSync(usersFilePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load staff users from file:", error);
    return [...env.staffUsers];
  }
}

let staffUsers = loadStaffUsers();

function saveStaffUsers() {
  try {
    const dataDir = path.dirname(usersFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(usersFilePath, JSON.stringify(staffUsers, null, 2));
  } catch (error) {
    console.error("Failed to save staff users:", error);
  }
}

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
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    department: user.department,
    employeeId: user.employeeId,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

function findStaffUser(username) {
  const normalizedUsername = normalizeUsername(username);
  return staffUsers.find(
    (user) => normalizeUsername(user.username) === normalizedUsername,
  );
}

function findStaffUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return staffUsers.find(
    (user) => normalizeEmail(user.email) === normalizedEmail,
  );
}

function verifyPassword(user, password) {
  if (!user || typeof password !== "string") {
    return false;
  }

  // Demo mode supports plain env passwords. Replace with hashes before deployment.
  return user.password === password;
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + env.authSessionTtlMs).toISOString();

  sessions.set(token, {
    token,
    user: publicStaffUser(user),
    expiresAt,
  });

  return {
    token,
    expiresAt,
    user: publicStaffUser(user),
  };
}

function pruneExpiredSessions() {
  const now = Date.now();

  for (const [token, session] of sessions.entries()) {
    if (new Date(session.expiresAt).getTime() <= now) {
      sessions.delete(token);
    }
  }
}

export function loginStaff({ username, password }) {
  pruneExpiredSessions();
  staffUsers = loadStaffUsers();

  const user = findStaffUser(username) ?? findStaffUserByEmail(username);
  if (!verifyPassword(user, password)) {
    throw new HttpError(401, "Invalid username, email, or password.");
  }

  user.lastLoginAt = new Date().toISOString();
  saveStaffUsers();

  return createSession(user);
}

export function registerStaff({
  fullName,
  username,
  email,
  phone,
  department,
  role,
  employeeId,
  password,
  avatarBase64,
}) {
  staffUsers = loadStaffUsers();

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

  if (findStaffUser(normalizedUsername)) {
    throw new HttpError(
      400,
      "A staff account with this username already exists.",
    );
  }

  // Check if email already exists
  const existingUser = findStaffUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new HttpError(400, "A user with this email already exists.");
  }

  // Check if employee ID already exists
  const existingEmployeeId = staffUsers.find(
    (user) => user.employeeId === employeeId,
  );
  if (existingEmployeeId) {
    throw new HttpError(400, "A user with this employee ID already exists.");
  }

  // Create new user
  const newUser = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    name: fullName,
    email: normalizedEmail,
    phone,
    department,
    role,
    employeeId,
    password, // In production, this should be hashed
    createdAt: new Date().toISOString(),
  };

  if (avatarBase64) {
    newUser.avatarUrl = saveAvatarImage(newUser.id, avatarBase64);
  }

  staffUsers.push(newUser);
  saveStaffUsers();

  return {
    message: "Staff member registered successfully",
    user: publicStaffUser(newUser),
  };
}

export function requestPasswordReset({ email }) {
  const user = findStaffUserByEmail(email);
  if (!user) {
    // For security, don't reveal if email exists
    return {
      message:
        "If an account with this email exists, a password reset link has been sent.",
    };
  }

  // Generate reset token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  passwordResetTokens.set(token, {
    email,
    expiresAt,
  });

  // In production, send email with reset link
  console.log(
    `Password reset link for ${email}: http://localhost:3000/reset-password?token=${token}`,
  );

  return {
    message:
      "If an account with this email exists, a password reset link has been sent.",
  };
}

export function resetPassword({ token, password }) {
  const resetData = passwordResetTokens.get(token);

  if (!resetData) {
    throw new HttpError(400, "Invalid or expired reset token.");
  }

  if (new Date(resetData.expiresAt).getTime() < Date.now()) {
    passwordResetTokens.delete(token);
    throw new HttpError(400, "Invalid or expired reset token.");
  }

  const user = findStaffUserByEmail(resetData.email);
  if (!user) {
    throw new HttpError(400, "User not found.");
  }

  // Update password
  user.password = password; // In production, this should be hashed
  saveStaffUsers();

  // Remove used token
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
