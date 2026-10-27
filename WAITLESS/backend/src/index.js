import "dotenv/config";
import http from "node:http";

import { env } from "./config/env.js";
import {
  forgotPasswordController,
  loginController,
  meController,
  resetPasswordController,
  staffAccessCodeCreateController,
  staffAccessCodeListController,
  staffRegisterController,
  staffSelfRegisterController,
  staffUsersListController,
  staffUserDeleteController,
  staffChangePasswordController,
} from "./controllers/authController.js";
import { auditEventsController } from "./controllers/auditController.js";
import {
  patientUsersListController,
  patientUserDeleteController,
  patientDirectoryController,
  patientHistoryController,
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
  etaEstimatesController,
  healthController,
  prescriptionsListController,
  ticketPrescriptionsController,
  createPrescriptionController,
  updatePrescriptionStateController,
  prescriptionSummaryController,
  testOrdersListController,
  ticketTestOrdersController,
  createTestOrderController,
  updateTestOrderStateController,
  testOrderSummaryController,
  suggestNextDepartmentController,
  submitFeedbackController,
  ticketFeedbackController,
  confirmArrivalController,
  kioskCheckInController,
  kioskLookupController,
  metaController,
  notificationsController,
  patientSearchController,
  queueBoardController,
  queueEventsController,
  recallTicketController,
  preRegisterController,
  registerController,
  retryNotificationController,
  selfRegisterController,
  retryNotificationsBulkController,
  ticketETAController,
  ticketTrackingController,
  triageAssessmentController,
  ticketsController,
  transferTicketController,
  updateTicketStatusController,
  whatsAppWebhookEventController,
  whatsAppWebhookVerificationController,
  averageWaitReportController,
  departmentPerformanceReportController,
  noShowReportController,
  triageReportController,
  labTurnaroundReportController,
  staffWorkloadReportController,
  outOfStockReportController,
  markOutOfStockController,
  peakHoursReportController,
  congestionReportController,
  resourceAllocationReportController,
  whatsAppStatusController,
  reassessmentAlertsController,
} from "./controllers/queueController.js";
import {
  hospitalInfoController,
  hospitalListController,
  hospitalDetailController,
  hospitalCreateController,
  hospitalUpdateController,
} from "./controllers/hospitalController.js";
import {
  waitTimePredictionController,
  bottleneckAnalysisController,
  chatbotController,
} from "./controllers/aiController.js";
import {
  getConfigController,
  updateConfigController,
  resetConfigController,
} from "./controllers/configController.js";
import {
  syncExportController,
  syncImportController,
  syncBackupController,
  syncStatusController,
} from "./controllers/syncController.js";
import {
  stockListController,
  stockSummaryController,
  stockFlagController,
  stockAddController,
  stockRemoveController,
  prescriptionsWithStockController,
  flagPrescriptionItemController,
} from "./controllers/pharmacyStockController.js";
import {
  oiStreamsController,
  oiVisitsController,
  oiCreateVisitController,
  oiUpdateVisitController,
  oiSummaryController,
} from "./controllers/oiClinicController.js";
import {
  appointmentListController,
  appointmentCreateController,
  appointmentDetailController,
  appointmentUpdateController,
  appointmentDeleteController,
  appointmentUpdateStatusController,
  appointmentSummaryController,
  appointmentMetaController,
  appointmentAvailableSlotsController,
  followUpCreateController,
  followUpsForTicketController,
  appointmentRemindersController,
  markReminderSentController,
} from "./controllers/appointmentController.js";
import { withStaffAuth } from "./middleware/auth.js";
import { applyCors } from "./middleware/cors.js";
import { withChatbotRateLimit } from "./middleware/chatbotRateLimit.js";
import { withRateLimit } from "./middleware/requestRateLimit.js";
import { initializeQueueRepository } from "./repositories/queueRepository.js";
import { initializeNotificationDeliveryService } from "./services/notificationService.js";
import { initWhatsAppSession } from "./services/whatsAppProvider.js";
import { startAutoMissSweeper } from "./services/autoMissService.js";
import { seedDefaultAdmin } from "./db/seedAdmin.js";
import { HttpError, sendJson } from "./utils/http.js";
import { createRouter } from "./utils/router.js";

const router = createRouter();

const loginRateLimit = (handler) =>
  withRateLimit(handler, {
    windowMs: 15 * 60_000,
    maxRequests: 20,
    message: "Too many login attempts. Please wait 15 minutes and try again.",
  });
const registrationRateLimit = (handler) =>
  withRateLimit(handler, {
    windowMs: 15 * 60_000,
    maxRequests: 10,
    message: "Too many registration attempts. Please wait and try again.",
  });
const passwordResetRateLimit = (handler) =>
  withRateLimit(handler, {
    windowMs: 15 * 60_000,
    maxRequests: 5,
    message: "Too many password reset requests. Please wait and try again.",
  });
const publicQueueRateLimit = (handler) =>
  withRateLimit(handler, {
    windowMs: 60_000,
    maxRequests: 60,
    message: "Too many queue requests. Please wait a moment and try again.",
  });

router.register("GET", "/api/health", healthController);
router.register("POST", "/api/auth/login", loginRateLimit(loginController));
router.register("GET", "/api/auth/me", getMeController);
router.register("POST", "/api/profile", saveProfileController);
router.register("POST", "/api/profile/avatar", saveAvatarController);
router.register("GET", "/api/profile/avatar/:userId", getAvatarController);

router.register("POST", "/api/auth/forgot-password", passwordResetRateLimit(forgotPasswordController));
router.register("POST", "/api/auth/reset-password", passwordResetRateLimit(resetPasswordController));
router.register(
  "POST",
  "/api/auth/staff-register",
  withStaffAuth(["admin"], staffRegisterController),
);
router.register(
  "POST",
  "/api/auth/staff-self-register",
  registrationRateLimit(staffSelfRegisterController),
);
router.register(
  "POST",
  "/api/auth/staff-access-codes",
  withStaffAuth(["admin"], staffAccessCodeCreateController),
);
router.register(
  "GET",
  "/api/auth/staff-access-codes",
  withStaffAuth(["admin"], staffAccessCodeListController),
);
router.register(
  "GET",
  "/api/auth/staff",
  withStaffAuth(["admin"], staffUsersListController),
);
router.register(
  "DELETE",
  "/api/auth/staff/:id",
  withStaffAuth(["admin"], staffUserDeleteController),
);
router.register(
  "POST",
  "/api/auth/change-password",
  withStaffAuth([], staffChangePasswordController),
);
router.register(
  "GET",
  "/api/patients",
  withStaffAuth(["admin"], patientUsersListController),
);
router.register(
  "DELETE",
  "/api/patients/:id",
  withStaffAuth(["admin"], patientUserDeleteController),
);
router.register(
  "GET",
  "/api/audit-events",
  withStaffAuth(["admin"], auditEventsController),
);

// Patients no longer hold accounts — all public flows are account-free
// (self-register, kiosk, tracking). The /api/patient/* account endpoints
// are intentionally unmounted.
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
router.register("POST", "/api/tickets/self-register", registrationRateLimit(selfRegisterController));
router.register("POST", "/api/tickets/pre-register", publicQueueRateLimit(preRegisterController));
router.register("POST", "/api/kiosk/lookup", publicQueueRateLimit(kioskLookupController));
router.register("POST", "/api/kiosk/check-in", publicQueueRateLimit(kioskCheckInController));

router.register(
  "POST",
  "/api/tickets/:id/confirm-arrival",
  withStaffAuth(["reception"], confirmArrivalController),
);
router.register(
  "GET",
  "/api/patients/search",
  withStaffAuth(["reception"], patientSearchController),
);
router.register(
  "GET",
  "/api/patients/directory",
  withStaffAuth([], patientDirectoryController),
);
router.register(
  "GET",
  "/api/patients/history",
  withStaffAuth([], patientHistoryController),
);
router.register(
  "PATCH",
  "/api/tickets/:id/priority",
  withStaffAuth(["triage", "reception"], assignPriorityController),
);
router.register(
  "POST",
  "/api/tickets/:id/triage-assessment",
  withStaffAuth(["triage", "reception"], triageAssessmentController),
);
router.register(
  "PATCH",
  "/api/tickets/:id/status",
  withStaffAuth(["triage", "clinician", "lab-tech", "pharmacist", "radiologist"], updateTicketStatusController),
);
router.register(
  "POST",
  "/api/tickets/:id/recall",
  withStaffAuth(["triage", "clinician", "lab-tech", "pharmacist", "radiologist"], recallTicketController),
);
router.register(
  "PATCH",
  "/api/tickets/:id/transfer",
  withStaffAuth(["triage", "clinician", "lab-tech", "pharmacist", "radiologist"], transferTicketController),
);
router.register(
  "POST",
  "/api/queue/call-next",
  withStaffAuth(["triage", "clinician", "lab-tech", "pharmacist", "radiologist"], callNextController),
);
router.register("GET", "/api/queue/board", queueBoardController);
router.register("GET", "/api/queue/staff-board", withStaffAuth(["reception", "triage", "clinician", "pharmacist", "lab-tech", "radiologist", "admin"], queueBoardController));
router.register("GET", "/api/eta/estimates", etaEstimatesController);
router.register("GET", "/api/tickets/:id/eta", ticketETAController);
router.register("GET", "/api/prescriptions", withStaffAuth(["clinician", "triage", "pharmacist"], prescriptionsListController));
router.register("GET", "/api/prescriptions/summary", withStaffAuth(["clinician", "triage", "pharmacist"], prescriptionSummaryController));
router.register("GET", "/api/tickets/:id/prescriptions", withStaffAuth(["clinician", "triage", "pharmacist"], ticketPrescriptionsController));
router.register("POST", "/api/tickets/:id/prescriptions", withStaffAuth(["clinician"], createPrescriptionController));
router.register("PATCH", "/api/prescriptions/:id/state", withStaffAuth(["clinician", "triage", "pharmacist"], updatePrescriptionStateController));

router.register("GET", "/api/pharmacy/stock", withStaffAuth(["clinician", "triage", "admin", "pharmacist"], stockListController));
router.register("GET", "/api/pharmacy/stock/summary", withStaffAuth(["clinician", "triage", "admin", "pharmacist"], stockSummaryController));
router.register("PATCH", "/api/pharmacy/stock/flag", withStaffAuth(["clinician", "triage", "admin", "pharmacist"], stockFlagController));
router.register("POST", "/api/pharmacy/stock", withStaffAuth(["admin", "pharmacist"], stockAddController));
router.register("DELETE", "/api/pharmacy/stock/:id", withStaffAuth(["admin", "pharmacist"], stockRemoveController));
router.register("GET", "/api/pharmacy/prescriptions", withStaffAuth(["clinician", "triage", "admin", "pharmacist"], prescriptionsWithStockController));
router.register("PATCH", "/api/prescriptions/:id/stock-flag", withStaffAuth(["clinician", "triage", "admin", "pharmacist"], flagPrescriptionItemController));

router.register("GET", "/api/oi-clinic/streams", withStaffAuth(["clinician", "triage", "admin"], oiStreamsController));
router.register("GET", "/api/oi-clinic/visits", withStaffAuth(["clinician", "triage", "admin"], oiVisitsController));
router.register("GET", "/api/oi-clinic/summary", withStaffAuth(["clinician", "triage", "admin"], oiSummaryController));
router.register("POST", "/api/tickets/:id/oi-clinic-visit", withStaffAuth(["clinician", "triage"], oiCreateVisitController));
router.register("PATCH", "/api/oi-clinic/visits/:id/state", withStaffAuth(["clinician", "triage"], oiUpdateVisitController));
router.register("GET", "/api/appointments", withStaffAuth(["reception", "triage", "clinician", "admin"], appointmentListController));
router.register("POST", "/api/appointments", withStaffAuth(["reception", "admin"], appointmentCreateController));
router.register("GET", "/api/appointments/meta", withStaffAuth(["reception", "triage", "clinician", "admin"], appointmentMetaController));
router.register("GET", "/api/appointments/summary", withStaffAuth(["reception", "triage", "clinician", "admin"], appointmentSummaryController));
router.register("GET", "/api/appointments/available-slots", withStaffAuth(["reception", "triage", "clinician", "admin"], appointmentAvailableSlotsController));
router.register("GET", "/api/appointments/reminders", withStaffAuth(["reception", "triage", "clinician", "admin"], appointmentRemindersController));
router.register("POST", "/api/appointments/follow-up", withStaffAuth(["clinician", "triage", "admin"], followUpCreateController));
router.register("GET", "/api/appointments/:id", withStaffAuth(["reception", "triage", "clinician", "admin"], appointmentDetailController));
router.register("PATCH", "/api/appointments/:id", withStaffAuth(["reception", "triage", "clinician", "admin"], appointmentUpdateController));
router.register("DELETE", "/api/appointments/:id", withStaffAuth(["reception", "triage", "clinician", "admin"], appointmentDeleteController));
router.register("PATCH", "/api/appointments/:id/status", withStaffAuth(["reception", "triage", "clinician", "admin"], appointmentUpdateStatusController));
router.register("PATCH", "/api/appointments/:id/reminder-sent", withStaffAuth(["reception", "triage", "clinician", "admin"], markReminderSentController));
router.register("GET", "/api/tickets/:ticketId/follow-ups", withStaffAuth(["reception", "triage", "clinician", "admin"], followUpsForTicketController));

router.register("GET", "/api/test-orders", withStaffAuth(["clinician", "triage", "lab-tech", "radiologist"], testOrdersListController));
router.register("GET", "/api/test-orders/summary", withStaffAuth(["clinician", "triage", "lab-tech", "radiologist"], testOrderSummaryController));
router.register("GET", "/api/tickets/:id/test-orders", withStaffAuth(["clinician", "triage", "lab-tech", "radiologist"], ticketTestOrdersController));
router.register("POST", "/api/tickets/:id/test-orders", withStaffAuth(["clinician"], createTestOrderController));
router.register("PATCH", "/api/test-orders/:id/state", withStaffAuth(["clinician", "triage", "lab-tech", "radiologist"], updateTestOrderStateController));
router.register("GET", "/api/tickets/:id/next-route", withStaffAuth(["clinician", "triage"], suggestNextDepartmentController));
router.register("POST", "/api/tickets/:id/feedback", publicQueueRateLimit(submitFeedbackController));
router.register("GET", "/api/tickets/:id/feedback", publicQueueRateLimit(ticketFeedbackController));
router.register(
  "GET",
  "/api/dashboard/summary",
  withStaffAuth([], dashboardController),
);
router.register(
  "GET",
  "/api/notifications",
  withStaffAuth([], notificationsController),
);
router.register(
  "POST",
  "/api/notifications/retry-bulk",
  withStaffAuth([], retryNotificationsBulkController),
);
router.register(
  "POST",
  "/api/notifications/:id/retry",
  withStaffAuth([], retryNotificationController),
);
router.register(
  "GET",
  "/api/tickets/:ticketCode/track",
  publicQueueRateLimit(ticketTrackingController),
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

router.register(
  "GET",
  "/api/reports/average-wait",
  withStaffAuth(["triage", "clinician", "admin"], averageWaitReportController),
);
router.register(
  "GET",
  "/api/reports/department-performance",
  withStaffAuth(["triage", "clinician", "admin"], departmentPerformanceReportController),
);
router.register(
  "GET",
  "/api/reports/no-show",
  withStaffAuth(["triage", "clinician", "admin"], noShowReportController),
);
router.register(
  "GET",
  "/api/reports/triage",
  withStaffAuth(["triage", "clinician", "admin"], triageReportController),
);
router.register(
  "GET",
  "/api/reports/lab-turnaround",
  withStaffAuth(["triage", "clinician", "admin"], labTurnaroundReportController),
);
router.register(
  "GET",
  "/api/reports/staff-workload",
  withStaffAuth(["triage", "clinician", "admin"], staffWorkloadReportController),
);
router.register(
  "GET",
  "/api/reports/out-of-stock",
  withStaffAuth(["triage", "clinician", "admin"], outOfStockReportController),
);
router.register(
  "GET",
  "/api/reports/peak-hours",
  withStaffAuth(["triage", "clinician", "admin"], peakHoursReportController),
);
router.register(
  "GET",
  "/api/reports/congestion",
  withStaffAuth(["triage", "clinician", "admin"], congestionReportController),
);
router.register(
  "GET",
  "/api/reports/resource-allocation",
  withStaffAuth(["triage", "clinician", "admin"], resourceAllocationReportController),
);
router.register(
  "PATCH",
  "/api/prescriptions/:prescriptionId/stock",
  withStaffAuth(["clinician", "triage", "admin", "pharmacist"], markOutOfStockController),
);
router.register(
  "GET",
  "/api/whatsapp/status",
  withStaffAuth(["triage", "clinician", "admin"], whatsAppStatusController),
);

router.register(
  "GET",
  "/api/reassessment-alerts",
  withStaffAuth(["triage", "clinician", "admin"], reassessmentAlertsController),
);

router.register(
  "GET",
  "/api/config",
  withStaffAuth(["admin"], getConfigController),
);
router.register(
  "PATCH",
  "/api/config",
  withStaffAuth(["admin"], updateConfigController),
);
router.register(
  "POST",
  "/api/config/reset",
  withStaffAuth(["admin"], resetConfigController),
);

router.register("GET", "/api/hospital/info", hospitalInfoController);
router.register(
  "GET",
  "/api/hospitals",
  withStaffAuth(["admin"], hospitalListController),
);
router.register(
  "GET",
  "/api/hospitals/:id",
  withStaffAuth(["admin"], hospitalDetailController),
);
router.register(
  "POST",
  "/api/hospitals",
  withStaffAuth(["admin"], hospitalCreateController),
);
router.register(
  "PATCH",
  "/api/hospitals/:id",
  withStaffAuth(["admin"], hospitalUpdateController),
);

router.register(
  "GET",
  "/api/ai/predict-wait",
  withStaffAuth(["triage", "clinician", "admin"], waitTimePredictionController),
);
router.register(
  "GET",
  "/api/ai/bottlenecks",
  withStaffAuth(["triage", "clinician", "admin"], bottleneckAnalysisController),
);
router.register("POST", "/api/ai/chatbot", withChatbotRateLimit(chatbotController));

router.register(
  "GET",
  "/api/sync/export",
  withStaffAuth(["admin"], syncExportController),
);
router.register(
  "POST",
  "/api/sync/import",
  withStaffAuth(["admin"], syncImportController),
);
router.register(
  "POST",
  "/api/sync/backup",
  withStaffAuth(["admin"], syncBackupController),
);
router.register(
  "GET",
  "/api/sync/status",
  withStaffAuth(["admin"], syncStatusController),
);

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

// TiDB Serverless clusters sleep when idle — the first connection can hang
// for 10-30s while the cluster wakes, which previously crashed nodemon.
async function initializeWithRetry(attempts = 5) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await initializeQueueRepository();
      return;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const delayMs = 3000 * attempt;
      console.warn(
        `Database init attempt ${attempt}/${attempts} failed (${error.code ?? error.message}) — retrying in ${delayMs / 1000}s...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

async function startServer() {
  await verifyPortAvailable(env.port);
  await initializeWithRetry();
  await initializeNotificationDeliveryService();
  startAutoMissSweeper();
  if (env.databaseProvider === "mysql") {
    await seedDefaultAdmin();
  }

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
  initWhatsAppSession();
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
