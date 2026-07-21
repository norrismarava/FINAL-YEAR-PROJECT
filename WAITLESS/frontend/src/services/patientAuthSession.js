const TOKEN_STORAGE_KEY = "waitless_patient_token";
const USER_STORAGE_KEY = "waitless_patient_user";
const EXPIRES_STORAGE_KEY = "waitless_patient_expires_at";

export function getStoredPatientToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredPatientUser() {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getStoredPatientExpiry() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(EXPIRES_STORAGE_KEY);
}

export function storePatientSession(session) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session.user));
  window.localStorage.setItem(EXPIRES_STORAGE_KEY, session.expiresAt);
}

export function clearPatientSession() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
  window.localStorage.removeItem(EXPIRES_STORAGE_KEY);
}
