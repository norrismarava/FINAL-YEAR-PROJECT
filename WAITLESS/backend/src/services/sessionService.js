import { requireStaffSession } from "./authService.js";

// Thin wrapper so profileController can be kept clean.
export { requireStaffSession };

export function getCurrentSessionUser(req) {
  const session = requireStaffSession(req);
  return session?.user ?? null;
}

