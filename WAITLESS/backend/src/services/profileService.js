import fs from "node:fs";
import path from "node:path";

import { HttpError } from "../utils/http.js";

const usersFilePath = path.join(process.cwd(), "data", "staff-users.json");

export function getStoredStaffUsers() {
  // Load users from file if exists (same mechanism as authService)
  if (!fs.existsSync(usersFilePath)) {
    return [];
  }

  const data = fs.readFileSync(usersFilePath, "utf8");
  return JSON.parse(data);
}

export function saveStoredStaffUsers(users) {
  const dataDir = path.dirname(usersFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

export function upsertStaffUserProfile(userId, patch) {
  const users = getStoredStaffUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    throw new HttpError(404, "User not found");
  }

  // In this codebase, staff users are stored with fields at the top-level.
  // We keep them compatible:
  // - name is stored as `name`
  // - phone/department/role/email are top-level.
  const target = users[idx];

  if (typeof patch.fullName === "string") target.name = patch.fullName;
  if (typeof patch.phone === "string") target.phone = patch.phone;
  if (typeof patch.department === "string") target.department = patch.department;
  if (typeof patch.email === "string") target.email = patch.email;
  if (typeof patch.role === "string") target.role = patch.role;

  users[idx] = target;
  saveStoredStaffUsers(users);
}

export function updateStaffUserAvatar(userId, { avatarUrl }) {
  const users = getStoredStaffUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    throw new HttpError(404, "User not found");
  }

  users[idx].avatarUrl = avatarUrl;
  saveStoredStaffUsers(users);
}

