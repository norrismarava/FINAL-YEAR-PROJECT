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
  patientLoginController,
  patientMeController,
  patientRegisterController,
  patientTicketsController,
} from "./controllers/patientAuthController.js";

import {
  getAvatarController,
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
  patientSearchController,
  queueBoardController,
  queueEventsController,
  recallTicketController,
  registerController,
  retryNotificationController,
  selfRegisterController,
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
router.register("GET", "/api/profile/avatar/:userId", getAvatarController);

router.register("POST", "/api/auth/forgot-password", forgotPasswordController);
router.register("POST", "/api/auth/reset-password", resetPasswordController);
router.register("POST", "/api/auth/staff-register", staffRegisterController);

router.register(
  "POST",
  "/api/patient/auth/register",
  patientRegisterController,
);
router.register("POST", "/api/patient/auth/login", patientLoginController);
router.register("GET", "/api/patient/auth/me", patientMeController);
router.register("GET", "/api/patient/tickets", patientTicketsController);
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
router.register("POST", "/api/tickets/self-register", selfRegisterController);
router.register(
  "GET",
  "/api/patients/search",
  withStaffAuth(["reception"], patientSearchController),
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
router.register(
  "GET",
  "/api/tickets/:ticketCode/track",
  ticketTrackingController,
);
router.register(
  "GET",
  "/api/integrations/whatsapp/webhook",
  whatsAppWebhookVerificationController,
);
router.register(
  "POST",
  "/api/integrations/whatsapp/webhook",
  whatsAppWebhookEventController,
);
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

async function verifyPortAvailable(port) {
  const probe = http.createServer();

  await new Promise((resolve, reject) => {
    function handleError(error) {
      reject(error);
    }

    probe.once("error", handleError);
    probe.listen(port, () => {
      probe.off("error", handleError);
      probe.close(resolve);
    });
  });
}

async function startServer() {
  await verifyPortAvailable(env.port);
  await initializeQueueRepository();
  await initializeNotificationDeliveryService();

  await new Promise((resolve, reject) => {
    function handleError(error) {
      server.off("listening", handleListening);
      reject(error);
    }

    function handleListening() {
      server.off("error", handleError);
      resolve();
    }

    server.once("error", handleError);
    server.once("listening", handleListening);
    server.listen(env.port);
  });

  console.log(`WaitLess backend listening on http://localhost:${env.port}`);
}

startServer().catch((error) => {
  if (error?.code === "EADDRINUSE") {
    console.error(
      `Failed to start WaitLess backend. Port ${env.port} is already in use. ` +
        "Stop the existing API process or choose another API PORT (not DB_PORT).",
    );
    process.exitCode = 1;
    return;
  }

  console.error("Failed to start WaitLess backend.", error);
  process.exitCode = 1;
});
