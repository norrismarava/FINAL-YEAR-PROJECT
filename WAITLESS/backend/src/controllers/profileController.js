import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "../config/env.js";
import { requireStaffSession } from "../services/sessionService.js";

import {
  getStoredStaffUsers,
  upsertStaffUserProfile,
  updateStaffUserAvatar,
} from "../services/profileService.js";




export async function getMeController({ req }) {
  const session = requireStaffSession(req);

  // Profile is stored on the user record.
  const users = getStoredStaffUsers();
  const user = users.find((u) => u.id === session.user.id) ?? null;

  return {
    status: 200,
    body: {
      ...session,
      user: {
        ...session.user,
        // staff-users.json stores core fields at top-level.
        ...(user ?? {}),
        avatarUrl: user?.avatarUrl ?? null,
      },
    },
  };
}


export async function saveProfileController({ req, body }) {
  const session = requireStaffSession(req);

  const { fullName, phone, department, email, role } = body ?? {};

  const users = getStoredStaffUsers();
  const existing = users.find((u) => u.id === session.user.id);
  if (!existing) {
    return {
      status: 404,
      body: { message: "User not found." },
    };
  }

  // Persist core fields onto the stored user record.
  upsertStaffUserProfile(existing.id, {
    fullName,
    phone,
    department,
    email,
    role,
  });

  return {
    status: 200,
    body: { message: "Profile updated" },
  };
}


export async function saveAvatarController({ req, body }) {
  const session = requireStaffSession(req);

  const { avatarBase64 } = body ?? {};
  if (!avatarBase64) {
    return { status: 400, body: { message: "avatarBase64 is required" } };
  }

  // Write avatar to disk.
  const users = getStoredStaffUsers();
  const existing = users.find((u) => u.id === session.user.id);
  if (!existing) {
    return { status: 404, body: { message: "User not found." } };
  }

  const dataDir = path.join(process.cwd(), "data", "avatars");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const filePath = path.join(dataDir, `${existing.id}.jpg`);
  const buffer = Buffer.from(avatarBase64, "base64");
  fs.writeFileSync(filePath, buffer);

  const avatarUrl = `/data/avatars/${existing.id}.jpg`;

  updateStaffUserAvatar(existing.id, {
    avatarUrl,
  });

  return {
    status: 200,
    body: { message: "Avatar updated", avatarUrl },
  };
}


