import fs from "node:fs";
import path from "node:path";

import { HttpError } from "../utils/http.js";

const avatarsDirectory = path.join(process.cwd(), "data", "avatars");
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function safeAvatarId(userId) {
  const value = String(userId ?? "");
  const safeValue = value.replace(/[^a-zA-Z0-9_-]/g, "");

  if (!safeValue || safeValue !== value) {
    throw new HttpError(400, "Invalid staff avatar identifier.");
  }

  return safeValue;
}

function avatarFilePath(userId) {
  return path.join(avatarsDirectory, `${safeAvatarId(userId)}.jpg`);
}

export function buildAvatarUrl(userId, version = Date.now()) {
  return `/api/profile/avatar/${encodeURIComponent(safeAvatarId(userId))}?v=${version}`;
}

export function saveAvatarImage(userId, avatarBase64) {
  const normalizedBase64 = String(avatarBase64 ?? "")
    .replace(/^data:image\/jpeg;base64,/, "")
    .trim();

  if (!normalizedBase64 || !/^[a-zA-Z0-9+/]+={0,2}$/.test(normalizedBase64)) {
    throw new HttpError(400, "Choose a valid JPEG profile image.");
  }

  const buffer = Buffer.from(normalizedBase64, "base64");
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  if (!isJpeg) {
    throw new HttpError(400, "Profile images must be uploaded as JPEG files.");
  }

  if (buffer.length > MAX_AVATAR_BYTES) {
    throw new HttpError(
      413,
      "Profile image is too large. Choose an image under 2 MB.",
    );
  }

  fs.mkdirSync(avatarsDirectory, { recursive: true });
  fs.writeFileSync(avatarFilePath(userId), buffer);

  return buildAvatarUrl(userId);
}

export function readAvatarImage(userId) {
  const filePath = avatarFilePath(userId);

  if (!fs.existsSync(filePath)) {
    throw new HttpError(404, "Profile image not found.");
  }

  return fs.readFileSync(filePath);
}
