const clients = new Map();
let nextClientId = 1;

const RETRY_INTERVAL_MS = 3000;
const HEARTBEAT_INTERVAL_MS = 25000;

function writeEvent(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function closeClient(clientId) {
  const client = clients.get(clientId);
  if (!client) {
    return;
  }

  clearInterval(client.heartbeatId);
  clients.delete(clientId);

  if (!client.res.writableEnded) {
    client.res.end();
  }
}

export function openQueueEventsStream(req, res) {
  const clientId = nextClientId;
  nextClientId += 1;

  res.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "x-accel-buffering": "no",
  });

  res.write(`retry: ${RETRY_INTERVAL_MS}\n\n`);
  writeEvent(res, {
    type: "connected",
    timestamp: new Date().toISOString(),
  });

  const heartbeatId = setInterval(() => {
    if (!res.writableEnded) {
      res.write(": keep-alive\n\n");
    }
  }, HEARTBEAT_INTERVAL_MS);

  clients.set(clientId, {
    res,
    heartbeatId,
  });

  req.on("close", () => closeClient(clientId));
  req.on("aborted", () => closeClient(clientId));
}

export function broadcastQueueEvent(type, payload = {}) {
  const message = {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };

  for (const [clientId, client] of clients.entries()) {
    try {
      writeEvent(client.res, message);
    } catch (error) {
      console.error("Failed to push queue event to a client.", error);
      closeClient(clientId);
    }
  }
}
