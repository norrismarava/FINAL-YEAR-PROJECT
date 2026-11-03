import { requireStaffSession } from "../services/sessionService.js";
import { readAvatarImage, saveAvatarImage } from "../services/avatarService.js";
import { recordAuditEventSafely } from "../services/auditService.js";

import {
  getStoredStaffUsers,
  upsertStaffUserProfile,
  updateStaffUserAvatar,
} from "../services/profileService.js";

export async function getMeController({ req }) {
  const session = requireStaffSession(req);

  const users = await getStoredStaffUsers();
  const user = users.find((u) => u.id === session.user.id) ?? null;

  return {
    status: 200,
    body: {
      ...session,
      user: {
        ...session.user,
        ...(user?.full_name ? { name: user.full_name } : {}),
        ...(user?.phone ? { phone: user.phone } : {}),
        ...(user?.department ? { department: user.department } : {}),
        ...(user?.email ? { email: user.email } : {}),
        ...(user?.role ? { role: user.role } : {}),
        roomNumber: user?.room_number ?? null,
        avatarUrl: user?.avatar_url ?? null,
      },
    },
  };
}

export async function saveProfileController({ req, body }) {
  const session = requireStaffSession(req);

  const { fullName, phone, department, email, roomNumber } = body ?? {};

  const users = await getStoredStaffUsers();
  const existing = users.find((u) => u.id === session.user.id);
  if (!existing) {
    return {
      status: 404,
      body: { message: "User not found." },
    };
  }

  await upsertStaffUserProfile(existing.id, {
    fullName,
    phone,
    department,
    email,
    roomNumber,
  });

  // Keep the live session snapshot in sync so new details (e.g. the
  // consultation room) are used by calls without needing a re-login.
  if (typeof fullName === "string") session.user.name = fullName;
  if (typeof phone === "string") session.user.phone = phone;
  if (typeof department === "string") session.user.department = department;
  if (typeof email === "string") session.user.email = email;
  if (typeof roomNumber === "string") {
    session.user.roomNumber = roomNumber.trim() || null;
  }

  const changedFields = [
    ["fullName", existing.full_name, fullName],
    ["phone", existing.phone, phone],
    ["department", existing.department, department],
    ["email", existing.email, email],
    ["roomNumber", existing.room_number, roomNumber],
  ]
    .filter(([, previous, next]) => typeof next === "string" && previous !== next)
    .map(([field]) => field);

  await recordAuditEventSafely({
    actor: session.user,
    action: "profile.updated",
    entityType: "staff",
    entityId: existing.id,
    entityLabel: existing.username,
    metadata: { changedFields },
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

  const users = await getStoredStaffUsers();
  const existing = users.find((u) => u.id === session.user.id);
  if (!existing) {
    return { status: 404, body: { message: "User not found." } };
  }

  const avatarUrl = saveAvatarImage(existing.id, avatarBase64);

  await updateStaffUserAvatar(existing.id, {
    avatarUrl,
  });

  await recordAuditEventSafely({
    actor: session.user,
    action: "profile.avatar-updated",
    entityType: "staff",
    entityId: existing.id,
    entityLabel: existing.username,
    metadata: { hadAvatar: Boolean(existing.avatar_url) },
  });

  return {
    status: 200,
    body: { message: "Avatar updated", avatarUrl },
  };
}

export async function removeAvatarController({ req }) {
  const session = requireStaffSession(req);

  const users = await getStoredStaffUsers();
  const existing = users.find((u) => u.id === session.user.id);
  if (!existing) {
    return { status: 404, body: { message: "User not found." } };
  }

  await updateStaffUserAvatar(existing.id, { avatarUrl: null });

  await recordAuditEventSafely({
    actor: session.user,
    action: "profile.avatar-removed",
    entityType: "staff",
    entityId: existing.id,
    entityLabel: existing.username,
    metadata: { hadAvatar: Boolean(existing.avatar_url) },
  });

  return {
    status: 200,
    body: { message: "Avatar removed", avatarUrl: null },
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
