import {
  assignPriority,
  callNextPatient,
  createPrescriptionRecord,
  createTestOrderRecord,
  getDashboardSummary,
  getMeta,
  getNotifications,
  getPrescriptions,
  getPrescriptionsForTicket,
  getPrescriptionSummary,
  getTestOrders,
  getTestOrdersForTicket,
  getTestOrderSummary,
  getTicketTracking,
  getETAEstimates,
  getQueueBoard,
  getTicketETA,
  getTickets,
  confirmArrival,
  kioskCheckIn,
  kioskLookup,
  preRegisterPatient,
  searchPatients,
  recallMissedPatient,
  saveTriageAssessment,
  registerPatient,
  transferPatient,
  updatePatientStatus,
  updatePrescriptionState,
  updateTestOrderState,
  suggestNextDepartment,
  submitFeedback,
  getFeedbackForTicket,
  getAverageWaitTimeReport,
  getDepartmentPerformanceReport,
  getNoShowReport,
  getTriageReport,
  getLabTurnaroundReport,
  getStaffWorkloadReport,
  getOutOfStockReport,
  markPrescriptionItemOutOfStock,
  getPeakHoursReport,
  getCongestionReport,
  getResourceAllocationReport,
  getWhatsAppStatus,
  getReassessmentAlerts,
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

export async function labTurnaroundReportController(req) {
  const result = await getLabTurnaroundReport(req.query);
  return { status: 200, body: result };
}

export async function staffWorkloadReportController(req) {
  const result = await getStaffWorkloadReport(req.query);
  return { status: 200, body: result };
}

export async function outOfStockReportController(req) {
  const result = await getOutOfStockReport();
  return { status: 200, body: result };
}

export async function markOutOfStockController(req) {
  const { prescriptionId } = req.params;
  const { itemName, outOfStock } = req.body;
  if (!itemName) return { status: 400, body: { error: "itemName is required" } };
  const result = await markPrescriptionItemOutOfStock(
    prescriptionId,
    itemName,
    outOfStock !== false,
    req.staff,
  );
  return { status: 200, body: result };
}

export async function peakHoursReportController(req) {
  const result = await getPeakHoursReport(req.query);
  return { status: 200, body: result };
}

export async function congestionReportController(req) {
  const result = await getCongestionReport(req.query);
  return { status: 200, body: result };
}

export async function resourceAllocationReportController(req) {
  const result = await getResourceAllocationReport(req.query);
  return { status: 200, body: result };
}

export async function metaController() {
  return {
    status: 200,
    body: getMeta(),
  };
}

export async function ticketsController({ query, staff }) {
  const dept = staff && staff.role !== "admin" ? staff.department : undefined;
  return {
    status: 200,
    body: {
      tickets: await getTickets({ status: query.get("status") ?? undefined, department: dept }),
    },
  };
}

export async function registerController({ body, staff }) {
  return {
    status: 201,
    body: {
      ticket: await registerPatient({ ...body, _actor: staff }),
    },
  };
}

export async function selfRegisterController({ body }) {
  const payload = body ?? {};
  const patientName = payload.fullName?.trim();
  const phone = payload.phone?.trim();

  if (!patientName) {
    return {
      status: 400,
      body: { message: "Full name is required." },
    };
  }

  if (!phone) {
    return {
      status: 400,
      body: { message: "Phone number is required for queue notifications." },
    };
  }

  return {
    status: 201,
    body: {
      ticket: await registerPatient({
        ...payload,
        patientCategory: "walk-in",
      }),
    },
  };
}

export async function patientSearchController({ query }) {
  return {
    status: 200,
    body: {
      patients: await searchPatients(query.get("query") ?? ""),
    },
  };
}

export async function assignPriorityController({ params, body, staff }) {
  return {
    status: 200,
    body: {
      ticket: await assignPriority(params.id, body?.priority, staff),
    },
  };
}

export async function updateTicketStatusController({ params, body, staff }) {
  return {
    status: 200,
    body: {
      ticket: await updatePatientStatus(params.id, body?.status, staff, body?.room),
    },
  };
}

export async function recallTicketController({ params, body, staff }) {
  const options = {};
  if (body?.reinsertionPosition) {
    options.reinsertionPosition = body.reinsertionPosition;
  }
  if (body?.offsetMinutes) {
    options.offsetMinutes = Number(body.offsetMinutes);
  }
  if (body?.places) {
    options.places = Number(body.places);
  }
  return {
    status: 200,
    body: {
      ticket: await recallMissedPatient(params.id, options, staff),
    },
  };
}

export async function transferTicketController({ params, body, staff }) {
  return {
    status: 200,
    body: {
      ticket: await transferPatient(params.id, body?.department, staff),
    },
  };
}

export async function queueBoardController({ staff, query }) {
  const deptParam = query?.get("department");
  const dept = deptParam || (staff && staff.role !== "admin" ? staff.department : undefined);
  return {
    status: 200,
    body: await getQueueBoard(dept),
  };
}

export async function callNextController({ body, staff }) {
  return {
    status: 200,
    body: {
      ticket: await callNextPatient(body?.department, staff, body?.room),
    },
  };
}

export async function dashboardController({ staff }) {
  const dept = staff && staff.role !== "admin" ? staff.department : undefined;
  return {
    status: 200,
    body: await getDashboardSummary(dept),
  };
}

export async function notificationsController({ staff }) {
  const dept = staff && staff.role !== "admin" ? staff.department : undefined;
  return {
    status: 200,
    body: {
      notifications: await getNotifications(dept),
    },
  };
}

export async function retryNotificationController({ params, staff }) {
  return {
    status: 202,
    body: {
      notification: await retryNotification(params.id, staff),
    },
  };
}

export async function retryNotificationsBulkController({ body, staff }) {
  return {
    status: 202,
    body: await retryNotificationsBulk(body?.ids, staff),
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

export async function kioskLookupController({ body }) {
  const payload = body ?? {};
  const identifier = payload.identifier?.trim();

  if (!identifier) {
    return {
      status: 400,
      body: { message: "Please provide a phone number or patient number." },
    };
  }

  const patient = await kioskLookup(identifier);
  return {
    status: 200,
    body: { patient },
  };
}

export async function kioskCheckInController({ body }) {
  const payload = body ?? {};

  if (!payload.patientId?.trim()) {
    return {
      status: 400,
      body: { message: "Patient ID is required." },
    };
  }

  const ticket = await kioskCheckIn(payload);
  return {
    status: 201,
    body: { ticket },
  };
}

export async function preRegisterController({ body }) {
  return {
    status: 201,
    body: { ticket: await preRegisterPatient(body ?? {}) },
  };
}

export async function confirmArrivalController({ params, staff, body }) {
  const ticketId = params?.id;
  if (!ticketId) {
    return {
      status: 400,
      body: { message: "Ticket ID is required." },
    };
  }
  const ticket = await confirmArrival(ticketId, staff, body?.department);
  return {
    status: 200,
    body: { ticket },
  };
}

export async function triageAssessmentController({ params, body, staff }) {
  const ticketId = params?.id;
  if (!ticketId) {
    return {
      status: 400,
      body: { message: "Ticket ID is required." },
    };
  }

  const payload = body ?? {};
  if (!payload.priority) {
    return {
      status: 400,
      body: { message: "Priority is required." },
    };
  }

  const ticket = await saveTriageAssessment(ticketId, payload, staff);
  return {
    status: 200,
    body: { ticket },
  };
}

export async function etaEstimatesController() {
  return {
    status: 200,
    body: await getETAEstimates(),
  };
}

export async function ticketETAController({ params }) {
  return {
    status: 200,
    body: { eta: await getTicketETA(params.id) },
  };
}

export async function prescriptionsListController({ query, staff }) {
  const filters = {};
  if (query?.get("ticketId")) filters.ticketId = query.get("ticketId");
  if (query?.get("state")) filters.state = query.get("state");
  return {
    status: 200,
    body: { prescriptions: await getPrescriptions(filters) },
  };
}

export async function ticketPrescriptionsController({ params }) {
  return {
    status: 200,
    body: { prescriptions: await getPrescriptionsForTicket(params.id) },
  };
}

export async function createPrescriptionController({ params, body, staff }) {
  return {
    status: 201,
    body: {
      prescription: await createPrescriptionRecord({
        ticketId: params.id,
        items: body?.items,
        notes: body?.notes,
      }, staff),
    },
  };
}

export async function updatePrescriptionStateController({ params, body, staff }) {
  return {
    status: 200,
    body: {
      prescription: await updatePrescriptionState(params.id, body?.state, staff),
    },
  };
}

export async function prescriptionSummaryController() {
  return {
    status: 200,
    body: await getPrescriptionSummary(),
  };
}

export async function testOrdersListController({ query }) {
  const filters = {};
  if (query.get("state")) filters.state = query.get("state");
  if (query.get("testType")) filters.testType = query.get("testType");
  return {
    status: 200,
    body: { testOrders: await getTestOrders(filters) },
  };
}

export async function ticketTestOrdersController({ params }) {
  return {
    status: 200,
    body: { testOrders: await getTestOrdersForTicket(params.id) },
  };
}

export async function createTestOrderController({ params, body, staff }) {
  return {
    status: 201,
    body: {
      testOrder: await createTestOrderRecord({
        ticketId: params.id,
        testType: body?.testType,
        priority: body?.priority,
        notes: body?.notes,
      }, staff),
    },
  };
}

export async function updateTestOrderStateController({ params, body, staff }) {
  return {
    status: 200,
    body: {
      testOrder: await updateTestOrderState(params.id, body?.state, staff),
    },
  };
}

export async function testOrderSummaryController() {
  return {
    status: 200,
    body: await getTestOrderSummary(),
  };
}

export async function suggestNextDepartmentController({ params }) {
  return {
    status: 200,
    body: await suggestNextDepartment(params.id),
  };
}

export async function submitFeedbackController({ params, body }) {
  return {
    status: 201,
    body: {
      feedback: await submitFeedback(params.id, {
        rating: body?.rating,
        categories: body?.categories,
        comment: body?.comment,
      }),
    },
  };
}

export async function ticketFeedbackController({ params }) {
  return {
    status: 200,
    body: { feedback: await getFeedbackForTicket(params.id) },
  };
}

export async function averageWaitReportController({ query }) {
  return {
    status: 200,
    body: await getAverageWaitTimeReport(query),
  };
}

export async function departmentPerformanceReportController({ query }) {
  return {
    status: 200,
    body: await getDepartmentPerformanceReport(query),
  };
}

export async function noShowReportController({ query }) {
  return {
    status: 200,
    body: await getNoShowReport(query),
  };
}

export async function triageReportController({ query }) {
  return {
    status: 200,
    body: await getTriageReport(query),
  };
}

export async function whatsAppStatusController() {
  return {
    status: 200,
    body: await getWhatsAppStatus(),
  };
}

export async function reassessmentAlertsController() {
  return {
    status: 200,
    body: await getReassessmentAlerts(),
  };
}
