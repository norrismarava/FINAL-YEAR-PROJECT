import {
  assignPriority,
  callNextPatient,
  getDashboardSummary,
  getMeta,
  getNotifications,
  getTicketTracking,
  getQueueBoard,
  getTickets,
  registerPatient,
  updatePatientStatus,
} from "../services/queueService.js";
import { openQueueEventsStream } from "../sockets/queueEvents.js";
import {
  processWhatsAppWebhook,
  retryNotification,
  retryNotificationsBulk,
  verifyWhatsAppWebhook,
} from "../services/notificationService.js";

export async function healthController() {
  return {
    status: 200,
    body: {
      ok: true,
      service: "waitless-backend",
      timestamp: new Date().toISOString(),
    },
  };
}

export async function metaController() {
  return {
    status: 200,
    body: getMeta(),
  };
}

export async function ticketsController({ query }) {
  return {
    status: 200,
    body: {
      tickets: await getTickets({ status: query.get("status") ?? undefined }),
    },
  };
}

export async function registerController({ body }) {
  return {
    status: 201,
    body: {
      ticket: await registerPatient(body ?? {}),
    },
  };
}

export async function assignPriorityController({ params, body }) {
  return {
    status: 200,
    body: {
      ticket: await assignPriority(params.id, body?.priority),
    },
  };
}

export async function updateTicketStatusController({ params, body }) {
  return {
    status: 200,
    body: {
      ticket: await updatePatientStatus(params.id, body?.status),
    },
  };
}

export async function queueBoardController() {
  return {
    status: 200,
    body: await getQueueBoard(),
  };
}

export async function callNextController({ body }) {
  return {
    status: 200,
    body: {
      ticket: await callNextPatient(body?.department),
    },
  };
}

export async function dashboardController() {
  return {
    status: 200,
    body: await getDashboardSummary(),
  };
}

export async function notificationsController() {
  return {
    status: 200,
    body: {
      notifications: await getNotifications(),
    },
  };
}

export async function retryNotificationController({ params }) {
  return {
    status: 202,
    body: {
      notification: await retryNotification(params.id),
    },
  };
}

export async function retryNotificationsBulkController({ body }) {
  return {
    status: 202,
    body: await retryNotificationsBulk(body?.ids),
  };
}

export async function ticketTrackingController({ params }) {
  return {
    status: 200,
    body: await getTicketTracking(params.ticketCode),
  };
}

export async function whatsAppWebhookVerificationController({ query, res }) {
  const challenge = verifyWhatsAppWebhook(query);

  res.writeHead(200, {
    "content-type": "text/plain; charset=utf-8",
  });
  res.end(challenge);

  return {
    handled: true,
  };
}

export async function whatsAppWebhookEventController({
  req,
  body,
  rawBody,
}) {
  return {
    status: 200,
    body: await processWhatsAppWebhook({
      body,
      rawBody,
      signature: req.headers["x-hub-signature-256"],
    }),
  };
}

export async function queueEventsController({ req, res }) {
  openQueueEventsStream(req, res);

  return {
    handled: true,
  };
}
