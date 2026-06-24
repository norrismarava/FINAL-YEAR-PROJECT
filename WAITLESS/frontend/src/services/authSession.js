const TOKEN_STORAGE_KEY = "waitless_staff_token";
const STAFF_STORAGE_KEY = "waitless_staff_user";
const EXPIRES_STORAGE_KEY = "waitless_staff_expires_at";

export function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredStaffUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STAFF_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getStoredSessionExpiry() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(EXPIRES_STORAGE_KEY);
}

export function storeAuthSession(session) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
  window.localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(session.user));
  window.localStorage.setItem(EXPIRES_STORAGE_KEY, session.expiresAt);
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(STAFF_STORAGE_KEY);
  window.localStorage.removeItem(EXPIRES_STORAGE_KEY);
}
