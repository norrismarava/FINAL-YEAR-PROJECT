import bcrypt from "bcryptjs";

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_BYTES = 72;
const BCRYPT_ROUNDS = 12;

const COMMON_PASSWORDS = new Set([
  "changeme123",
  "password123",
  "qwerty123",
  "welcome123",
]);

export function getPasswordPolicyError(password) {
  if (typeof password !== "string" || !password) {
    return "Password is required.";
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    return `Password must not exceed ${PASSWORD_MAX_BYTES} bytes.`;
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return "Choose a less common password.";
  }

  const characterGroups = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  if (characterGroups < 3) {
    return "Password must include at least three of: uppercase, lowercase, number, and symbol.";
  }

  return null;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password, passwordHash) {
  if (
    typeof password !== "string" ||
    typeof passwordHash !== "string" ||
    !/^\$2[abxy]\$\d{2}\$/.test(passwordHash)
  ) {
    return false;
  }

  return bcrypt.compare(password, passwordHash);
}
