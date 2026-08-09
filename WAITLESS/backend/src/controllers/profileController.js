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
        avatarUrl: user?.avatar_url ?? null,
      },
    },
  };
}

export async function saveProfileController({ req, body }) {
  const session = requireStaffSession(req);

  const { fullName, phone, department, email } = body ?? {};

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
  });

  const changedFields = [
    ["fullName", existing.full_name, fullName],
    ["phone", existing.phone, phone],
    ["department", existing.department, department],
    ["email", existing.email, email],
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
