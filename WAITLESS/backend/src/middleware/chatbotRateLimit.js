import { withRateLimit } from "./requestRateLimit.js";

export function withChatbotRateLimit(handler) {
  return withRateLimit(handler, {
    windowMs: 60_000,
    maxRequests: 30,
    message: "The assistant is receiving too many requests. Please wait a minute and try again.",
  });
}
