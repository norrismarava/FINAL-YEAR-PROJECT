import { HttpError } from "../utils/http.js";

function getClientKey(req) {
  const forwardedFor = req?.headers?.["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req?.headers?.["x-real-ip"] || req?.socket?.remoteAddress || "unknown";
}

export function withRateLimit(
  handler,
  {
    windowMs = 60_000,
    maxRequests = 30,
    message = "Too many requests. Please wait and try again.",
  } = {},
) {
  const clients = new Map();
  const retryAfterSeconds = Math.ceil(windowMs / 1000);

  return async (request) => {
    const now = Date.now();

    for (const [key, entry] of clients) {
      if (now - entry.windowStartedAt >= windowMs) {
        clients.delete(key);
      }
    }

    const key = getClientKey(request.req);
    const existing = clients.get(key);
    const entry = existing && now - existing.windowStartedAt < windowMs
      ? existing
      : { windowStartedAt: now, requestCount: 0 };

    entry.requestCount += 1;
    clients.set(key, entry);

    if (entry.requestCount > maxRequests) {
      request.res?.setHeader("Retry-After", String(retryAfterSeconds));
      throw new HttpError(429, message);
    }

    return handler(request);
  };
}

