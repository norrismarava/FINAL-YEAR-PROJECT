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
    const message =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      "Request failed.";
    throw new Error(message);
  }
}

export { API_BASE_URL };
