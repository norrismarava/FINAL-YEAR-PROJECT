export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

const MAX_REQUEST_BODY_BYTES = 3 * 1024 * 1024;

export async function readRequestBody(req) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_REQUEST_BODY_BYTES) {
      throw new HttpError(413, "Request body is too large.");
    }
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return "";
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody;
}

export function parseJsonBody(rawBody) {
  if (!rawBody || !rawBody.trim()) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new HttpError(400, "Invalid JSON request body.");
  }
}

export function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(payload));
}
