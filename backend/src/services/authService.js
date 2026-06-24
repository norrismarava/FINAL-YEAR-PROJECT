import crypto from "node:crypto";

import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

const sessions = new Map();

function normalizeUsername(username) {
  return username?.trim().toLowerCase() ?? "";
}

function publicStaffUser(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };
}

function findStaffUser(username) {
  const normalizedUsername = normalizeUsername(username);
  return env.staffUsers.find(
    (user) => normalizeUsername(user.username) === normalizedUsername,
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

  const user = findStaffUser(username);
  if (!verifyPassword(user, password)) {
    throw new HttpError(401, "Invalid username or password.");
  }

  return createSession(user);
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
