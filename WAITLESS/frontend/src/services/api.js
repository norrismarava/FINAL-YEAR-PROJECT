import axios from "axios";

import { getStoredAuthToken, updateStoredSessionExpiry } from "./authSession";
import { getStoredPatientToken, updateStoredPatientExpiry } from "./patientAuthSession";

// Prefer same-origin + Vite proxy (`/api` -> http://localhost:4242) to avoid browser Network/CORS issues.
// If you explicitly set VITE_API_BASE_URL, we’ll use it.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  // Patient endpoints need the patient token; everything else uses staff.
  // Match "/api/patient/" exactly so staff routes like /api/patients/* don't
  // accidentally carry the patient token.
  const isPatientEndpoint = (config.url ?? "").startsWith("/api/patient/");
  const authToken = isPatientEndpoint
    ? (getStoredPatientToken() ?? getStoredAuthToken())
    : (getStoredAuthToken() ?? getStoredPatientToken());

  if (authToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
});

// The backend slides session expiry on every authenticated request and
// returns the new deadline in `x-session-expires` — keep the stored expiry
// in sync so active users never hit a stale client-side cutoff.
function refreshStoredExpiry(response) {
  const expiresAt = response?.headers?.["x-session-expires"];
  if (!expiresAt) return;
  const sentToken = (response.config?.headers?.Authorization ?? "").replace(/^Bearer\s+/i, "");
  if (sentToken && sentToken === getStoredPatientToken()) {
    updateStoredPatientExpiry(expiresAt);
  } else {
    updateStoredSessionExpiry(expiresAt);
  }
}

// Any 401 on an authenticated endpoint means the stored session is dead —
// broadcast it so auth providers can log out and send the user to /login.
apiClient.interceptors.response.use(
  (response) => {
    refreshStoredExpiry(response);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event("waitless:auth-expired"));
    }
    return Promise.reject(error);
  },
);

export function buildApiUrl(path) {
  // Prefer `/api/...` (same-origin) when API_BASE_URL is not set.
  if (!API_BASE_URL) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function friendlyErrorMessage(error) {
  if (error.code === "ERR_NETWORK" || error.code === "ECONNREFUSED") {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  if (error.code === "ECONNABORTED") {
    return "The request took too long. Please try again.";
  }

  if (error.name === "SyntaxError" || error.message?.includes("JSON")) {
    return "The server returned an unexpected response. Please try again in a moment.";
  }

  if (!error.response) {
    return "Unable to reach the server. Please try again in a moment.";
  }

  const status = error.response.status;
  const serverMessage =
    error.response?.data?.message ??
    error.response?.data?.error ??
    null;

  if (status === 401) {
    return serverMessage ?? "Your session has expired. Please log in again.";
  }

  if (status === 403) {
    return serverMessage ?? "You do not have permission to perform this action.";
  }

  if (status === 404) {
    return serverMessage ?? "The requested information could not be found.";
  }

  if (status === 413) {
    return "The file or data is too large. Please reduce the size and try again.";
  }

  if (status >= 500) {
    return serverMessage ?? "The server is experiencing issues. Please try again in a moment.";
  }

  return serverMessage ?? "Something went wrong. Please try again.";
}

export async function apiRequest(path, options = {}) {
  try {
    const response = await apiClient.request({
      url: path,
      method: options.method ?? "GET",
      data: options.body,
      headers: options.headers,
    });

    return response.data ?? null;
  } catch (error) {
    throw new Error(friendlyErrorMessage(error));
  }
}

export { API_BASE_URL };
