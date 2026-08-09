import crypto from "node:crypto";

import { env } from "../config/env.js";
import { getPool } from "../db/db.js";
import {
  getPasswordPolicyError,
  hashPassword,
} from "../services/passwordSecurity.js";

export async function seedDefaultAdmin() {
  const pool = getPool();

  const [rows] = await pool.execute(
    "SELECT id FROM staff_users WHERE role = 'admin' LIMIT 1",
  );

  if (rows.length) {
    return;
  }

  if (!env.initialAdminPassword) {
    throw new Error(
      "No administrator account exists. Set INITIAL_ADMIN_PASSWORD in backend/.env for the one-time secure bootstrap.",
    );
  }

  const passwordPolicyError = getPasswordPolicyError(env.initialAdminPassword);
  if (passwordPolicyError) {
    throw new Error(
      `INITIAL_ADMIN_PASSWORD is not secure enough. ${passwordPolicyError}`,
    );
  }

  const passwordHash = await hashPassword(env.initialAdminPassword);
  const id = crypto.randomUUID();

  await pool.query(
    `INSERT INTO staff_users (id, username, email, password_hash, full_name, role, department, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      id,
      env.initialAdminUsername.toLowerCase(),
      env.initialAdminEmail,
      passwordHash,
      env.initialAdminName,
      "admin",
      "Administration",
    ],
  );

  console.log(
    `Seeded the initial administrator account "${env.initialAdminUsername}".`,
  );
}
