import { env } from "../config/env.js";

export function applyCors(req, res) {
  const requestOrigin = req.headers.origin;
  const allowedOrigins = env.corsOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowAllOrigins = allowedOrigins.includes("*");
  const originAllowed = allowAllOrigins || !requestOrigin || allowedOrigins.includes(requestOrigin);

  if (originAllowed) {
    res.setHeader("Access-Control-Allow-Origin", allowAllOrigins ? "*" : requestOrigin ?? allowedOrigins[0]);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(originAllowed ? 204 : 403);
    res.end();
    return true;
  }

  return false;
}
