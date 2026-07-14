import "dotenv/config";
import http from "node:http";

import { env } from "./config/env.js";
import {
  forgotPasswordController,
  loginController,
  meController,
  resetPasswordController,
  staffRegisterController,
} from "./controllers/authController.js";

import {
  getMeController,
  saveAvatarController,
  saveProfileController,
} from "./controllers/profileController.js";

import {
  assignPriorityController,
  callNextController,
  dashboardController,
  healthController,
  metaController,
  notificationsController,
  queueBoardController,
  queueEventsController,
  recallTicketController,
  registerController,
  retryNotificationController,
  retryNotificationsBulkController,
  ticketTrackingController,
  ticketsController,
  transferTicketController,
  updateTicketStatusController,
  whatsAppWebhookEventController,
  whatsAppWebhookVerificationController,
} from "./controllers/queueController.js";
import { withStaffAuth } from "./middleware/auth.js";
import { applyCors } from "./middleware/cors.js";
import { initializeQueueRepository } from "./repositories/queueRepository.js";
import { initializeNotificationDeliveryService } from "./services/notificationService.js";
import { HttpError, sendJson } from "./utils/http.js";
import { createRouter } from "./utils/router.js";

const router = createRouter();

router.register("GET", "/api/health", healthController);
router.register("POST", "/api/auth/login", loginController);
router.register("GET", "/api/auth/me", getMeController);
router.register("POST", "/api/profile", saveProfileController);
router.register("POST", "/api/profile/avatar", saveAvatarController);

router.register("POST", "/api/auth/forgot-password", forgotPasswordController);
router.register("POST", "/api/auth/reset-password", resetPasswordController);
router.register("POST", "/api/auth/staff-register", staffRegisterController);
router.register("GET", "/api/meta", metaController);
router.register(
  "GET",
  "/api/tickets",
  withStaffAuth(["reception", "triage", "clinician"], ticketsController),
);
router.register(
  "POST",
  "/api/tickets/register",
  withStaffAuth(["reception"], registerController),
);
router.register(
  "PATCH",
  "/api/tickets/:id/priority",
  withStaffAuth(["triage"], assignPriorityController),
);
router.register(
  "PATCH",
  "/api/tickets/:id/status",
  withStaffAuth(["triage", "clinician"], updateTicketStatusController),
);
router.register(
  "POST",
  "/api/tickets/:id/recall",
  withStaffAuth(["triage", "clinician"], recallTicketController),
);
router.register(
  "PATCH",
  "/api/tickets/:id/transfer",
  withStaffAuth(["triage", "clinician"], transferTicketController),
);
router.register(
  "POST",
  "/api/queue/call-next",
  withStaffAuth(["triage", "clinician"], callNextController),
);
router.register("GET", "/api/queue/board", queueBoardController);
router.register(
  "GET",
  "/api/dashboard/summary",
  withStaffAuth(["triage", "clinician"], dashboardController),
);
router.register(
  "GET",
  "/api/notifications",
  withStaffAuth(["triage", "clinician"], notificationsController),
);
router.register(
  "POST",
  "/api/notifications/retry-bulk",
  withStaffAuth(["clinician"], retryNotificationsBulkController),
);
router.register(
  "POST",
  "/api/notifications/:id/retry",
  withStaffAuth(["clinician"], retryNotificationController),
);
router.register("GET", "/api/tickets/:ticketCode/track", ticketTrackingController);
router.register("GET", "/api/integrations/whatsapp/webhook", whatsAppWebhookVerificationController);
router.register("POST", "/api/integrations/whatsapp/webhook", whatsAppWebhookEventController);
router.register("GET", "/api/events", queueEventsController);

const server = http.createServer(async (req, res) => {
  try {
    if (applyCors(req, res)) {
      return;
    }

    const result = await router.handle(req, res);
    if (!result.matched) {
      sendJson(res, 404, { message: "Route not found." });
      return;
    }

    if (result.response?.handled) {
      return;
    }

    sendJson(res, result.response.status ?? 200, result.response.body ?? {});
  } catch (error) {
    console.error(error);

    if (error instanceof HttpError) {
      sendJson(res, error.status, { message: error.message });
      return;
    }

    sendJson(res, 500, { message: "Internal server error." });
  }
});

async function startServer() {
  await initializeQueueRepository();
  await initializeNotificationDeliveryService();

  server.listen(env.port, () => {
    console.log(`WaitLess backend listening on http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start WaitLess backend.", error);
  process.exitCode = 1;
});
