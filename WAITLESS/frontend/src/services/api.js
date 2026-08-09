import axios from "axios";

import { getStoredAuthToken } from "./authSession";

// Prefer same-origin + Vite proxy (`/api` -> http://localhost:4242) to avoid browser Network/CORS issues.
// If you explicitly set VITE_API_BASE_URL, we’ll use it.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const authToken = getStoredAuthToken();

  if (authToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
});

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
