import crypto from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  getPasswordPolicyError,
  hashPassword,
  verifyPassword,
} from "./passwordSecurity.js";
import { env } from "../config/env.js";

const staffFilePath = fileURLToPath(
  new URL("../../data/staff-users.json", import.meta.url),
);

const DEFAULT_STAFF = [
  {
    id: crypto.randomUUID(),
    username: "admin",
    email: "admin@waitless.local",
    password_hash: null,
    full_name: "System Administrator",
    role: "admin",
    department: "Administration",
    phone: "",
    employee_id: "WL-001",
    avatar_url: null,
    created_at: new Date().toISOString(),
    last_login_at: null,
  },
  {
    id: crypto.randomUUID(),
    username: "reception1",
    email: "reception@waitless.local",
    password_hash: null,
    full_name: "Grace Reception",
    role: "receptionist",
    department: "OPD",
    phone: "",
    employee_id: "WL-002",
    avatar_url: null,
    created_at: new Date().toISOString(),
    last_login_at: null,
  },
  {
    id: crypto.randomUUID(),
    username: "triage1",
    email: "triage@waitless.local",
    password_hash: null,
    full_name: "Tendai Nurse",
    role: "nurse",
    department: "Casualty / Triage",
    phone: "",
    employee_id: "WL-003",
    avatar_url: null,
    created_at: new Date().toISOString(),
    last_login_at: null,
  },
  {
    id: crypto.randomUUID(),
    username: "doctor1",
    email: "doctor@waitless.local",
    password_hash: null,
    full_name: "Dr. Chuma",
    role: "doctor",
    department: "OPD",
    phone: "",
    employee_id: "WL-004",
    avatar_url: null,
    created_at: new Date().toISOString(),
    last_login_at: null,
  },
  {
    id: crypto.randomUUID(),
    username: "pharmacy1",
    email: "pharmacy@waitless.local",
    password_hash: null,
    full_name: "Pharma Staff",
    role: "pharmacist",
    department: "Pharmacy",
    phone: "",
    employee_id: "WL-005",
    avatar_url: null,
    created_at: new Date().toISOString(),
    last_login_at: null,
  },
];

const DEFAULT_PASSWORD = "Waitless@2025";

let initialized = false;

function loadStaff() {
  if (!existsSync(staffFilePath)) {
    return [];
  }
  const raw = readFileSync(staffFilePath, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStaff(users) {
  writeFileSync(staffFilePath, JSON.stringify(users, null, 2), "utf-8");
}

async function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  let users = loadStaff();
  if (users.length === 0) {
    const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
    users = DEFAULT_STAFF.map((u) => ({
      ...u,
      password_hash: hashedPassword,
    }));
    saveStaff(users);
    console.log(
      `[file-staff] Seeded ${users.length} demo staff accounts. Default password: ${DEFAULT_PASSWORD}`,
    );
  }
}

export async function findStaffByUsername(username) {
  await ensureInitialized();
  const users = loadStaff();
  const normalized = (username ?? "").trim().toLowerCase();
  return (
    users.find(
      (u) => u.username.toLowerCase() === normalized || u.email.toLowerCase() === normalized,
    ) ?? null
  );
}

export async function findStaffById(id) {
  await ensureInitialized();
  const users = loadStaff();
  return users.find((u) => u.id === id) ?? null;
}

export async function verifyStaffPassword(password, passwordHash) {
  return verifyPassword(password, passwordHash);
}

export async function updateStaffLastLogin(id) {
  const users = loadStaff();
  const idx = users.findIndex((u) => u.id === id);
  if (idx >= 0) {
    users[idx].last_login_at = new Date().toISOString();
    saveStaff(users);
  }
}

export async function createStaffUser(data) {
  await ensureInitialized();
  const users = loadStaff();

  const normalizedUsername = (data.username ?? "").trim().toLowerCase();
  const normalizedEmail = (data.email ?? "").trim().toLowerCase();

  if (users.some((u) => u.username.toLowerCase() === normalizedUsername)) {
    throw new Error("A staff account with this username already exists.");
  }
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new Error("A user with this email already exists.");
  }

  const passwordPolicyError = getPasswordPolicyError(data.password);
  if (passwordPolicyError) {
    throw new Error(passwordPolicyError);
  }

  const passwordHash = await hashPassword(data.password);
  const newUser = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    email: normalizedEmail,
    password_hash: passwordHash,
    full_name: data.fullName?.trim() ?? "",
    role: data.role ?? "receptionist",
    department: data.department ?? "OPD",
    phone: data.phone ?? "",
    employee_id: data.employeeId ?? "",
    room_number: data.roomNumber?.trim() || null,
    avatar_url: data.avatarUrl ?? null,
    created_at: new Date().toISOString(),
    last_login_at: null,
  };

  users.push(newUser);
  saveStaff(users);
  return newUser;
}

export async function updateStaffPassword(email, newPassword) {
  const users = loadStaff();
  const idx = users.findIndex(
    (u) => u.email.toLowerCase() === (email ?? "").toLowerCase(),
  );
  if (idx < 0) {
    throw new Error("User not found.");
  }
  const passwordPolicyError = getPasswordPolicyError(newPassword);
  if (passwordPolicyError) {
    throw new Error(passwordPolicyError);
  }
  users[idx].password_hash = await hashPassword(newPassword);
  saveStaff(users);
}

export async function listAllStaff() {
  await ensureInitialized();
  return loadStaff();
}

export async function deleteStaff(id) {
  const users = loadStaff();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) return false;
  users.splice(idx, 1);
  saveStaff(users);
  return true;
}

export async function updateStaffProfile(id, patch) {
  const users = loadStaff();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) {
    throw new Error("User not found");
  }
  if (typeof patch.fullName === "string") users[idx].full_name = patch.fullName;
  if (typeof patch.phone === "string") users[idx].phone = patch.phone;
  if (typeof patch.department === "string") users[idx].department = patch.department;
  if (typeof patch.email === "string") users[idx].email = patch.email;
  if (typeof patch.role === "string") users[idx].role = patch.role;
  if (typeof patch.roomNumber === "string") users[idx].room_number = patch.roomNumber.trim() || null;
  saveStaff(users);
  return users[idx];
}

export async function updateStaffAvatar(id, avatarUrl) {
  const users = loadStaff();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) {
    throw new Error("User not found");
  }
  users[idx].avatar_url = avatarUrl;
  saveStaff(users);
  return users[idx];
}
