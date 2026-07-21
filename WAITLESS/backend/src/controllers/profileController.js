import { requireStaffSession } from "../services/sessionService.js";
import { readAvatarImage, saveAvatarImage } from "../services/avatarService.js";

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
  const publicUser = user
    ? Object.fromEntries(
        Object.entries(user).filter(([key]) => key !== "password"),
      )
    : {};

  return {
    status: 200,
    body: {
      ...session,
      user: {
        ...session.user,
        // staff-users.json stores core fields at top-level.
        ...publicUser,
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

  const users = getStoredStaffUsers();
  const existing = users.find((u) => u.id === session.user.id);
  if (!existing) {
    return { status: 404, body: { message: "User not found." } };
  }

  const avatarUrl = saveAvatarImage(existing.id, avatarBase64);

  updateStaffUserAvatar(existing.id, {
    avatarUrl,
  });

  return {
    status: 200,
    body: { message: "Avatar updated", avatarUrl },
  };
}

export async function getAvatarController({ params, res }) {
  const image = readAvatarImage(params.userId);

  res.writeHead(200, {
    "cache-control": "public, max-age=86400",
    "content-length": image.length,
    "content-type": "image/jpeg",
  });
  res.end(image);

  return {
    status: 200,
    body: null,
    handled: true,
  };
}
