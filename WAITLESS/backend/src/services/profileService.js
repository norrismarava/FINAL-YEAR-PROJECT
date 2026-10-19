import { getPool } from "../db/db.js";
import { HttpError } from "../utils/http.js";
import { env } from "../config/env.js";
import * as fileStaff from "./fileStaffStore.js";

const useFileStaff = env.databaseProvider === "file";

export async function getStoredStaffUsers() {
  if (useFileStaff) {
    return fileStaff.listAllStaff();
  }
  const pool = getPool();
  const [rows] = await pool.execute("SELECT * FROM staff_users ORDER BY created_at");
  return rows;
}

export async function getStaffUserById(id) {
  if (useFileStaff) {
    return fileStaff.findStaffById(id);
  }
  const pool = getPool();
  const [rows] = await pool.execute(
    "SELECT * FROM staff_users WHERE id = ? LIMIT 1",
    [id],
  );
  return rows[0] ?? null;
}

export async function upsertStaffUserProfile(userId, patch) {
  if (useFileStaff) {
    const existing = await fileStaff.findStaffById(userId);
    if (!existing) {
      throw new HttpError(404, "User not found");
    }
    await fileStaff.updateStaffProfile(userId, patch);
    return;
  }

  const pool = getPool();
  const existing = await getStaffUserById(userId);
  if (!existing) {
    throw new HttpError(404, "User not found");
  }

  const fields = [];
  const values = [];

  if (typeof patch.fullName === "string") {
    fields.push("full_name = ?");
    values.push(patch.fullName);
  }
  if (typeof patch.phone === "string") {
    fields.push("phone = ?");
    values.push(patch.phone);
  }
  if (typeof patch.department === "string") {
    fields.push("department = ?");
    values.push(patch.department);
  }
  if (typeof patch.email === "string") {
    fields.push("email = ?");
    values.push(patch.email);
  }
  if (typeof patch.role === "string") {
    fields.push("role = ?");
    values.push(patch.role);
  }
  if (typeof patch.roomNumber === "string") {
    fields.push("room_number = ?");
    values.push(patch.roomNumber.trim() || null);
  }

  if (fields.length === 0) {
    return;
  }

  values.push(userId);
  await pool.execute(
    `UPDATE staff_users SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );
}

export async function updateStaffUserAvatar(userId, { avatarUrl }) {
  if (useFileStaff) {
    const existing = await fileStaff.findStaffById(userId);
    if (!existing) {
      throw new HttpError(404, "User not found");
    }
    await fileStaff.updateStaffAvatar(userId, avatarUrl);
    return;
  }

  const pool = getPool();
  const existing = await getStaffUserById(userId);
  if (!existing) {
    throw new HttpError(404, "User not found");
  }

  await pool.execute(
    "UPDATE staff_users SET avatar_url = ? WHERE id = ?",
    [avatarUrl, userId],
  );
}
