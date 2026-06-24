import { getStoredAuthToken } from "./authSession";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000"
).replace(/\/$/, "");

export function buildApiUrl(path) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  const hasBody = options.body !== undefined;
  const isJsonBody = hasBody && !(options.body instanceof FormData);

  if (isJsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const authToken = getStoredAuthToken();
  if (authToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
    body: isJsonBody ? JSON.stringify(options.body) : options.body,
  });

  const raw = await response.text();
  const payload = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    throw new Error(payload?.message ?? "Request failed.");
  }

  return payload;
}

export { API_BASE_URL };
