import { apiRequest } from "./api";

export async function fetchQueueMeta() {
  return apiRequest("/api/meta");
}

export async function fetchTickets(filters = {}) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }

  const suffix = search.size ? `?${search.toString()}` : "";
  const payload = await apiRequest(`/api/tickets${suffix}`);
  return payload.tickets;
}

export async function registerPatient(payload) {
  const response = await apiRequest("/api/tickets/register", {
    method: "POST",
    body: payload,
  });

  return response.ticket;
}

export async function selfRegisterPatient(payload) {
  const response = await apiRequest("/api/tickets/self-register", {
    method: "POST",
    body: payload,
  });

  return response.ticket;
}

export async function fetchPatientMatches(query) {
  const search = new URLSearchParams({ query });
  const response = await apiRequest(`/api/patients/search?${search.toString()}`);
  return response.patients;
}

export async function assignTicketPriority(id, priority) {
  const response = await apiRequest(`/api/tickets/${id}/priority`, {
    method: "PATCH",
    body: { priority },
  });

  return response.ticket;
}

export async function updateTicketStatus(id, status) {
  const response = await apiRequest(`/api/tickets/${id}/status`, {
    method: "PATCH",
    body: { status },
  });

  return response.ticket;
}

export async function recallTicket(id, options = {}) {
  const response = await apiRequest(`/api/tickets/${id}/recall`, {
    method: "POST",
    body: options,
  });

  return response.ticket;
}

export async function transferTicket(id, department) {
  const response = await apiRequest(`/api/tickets/${id}/transfer`, {
    method: "PATCH",
    body: { department },
  });

  return response.ticket;
}

export async function fetchQueueBoard() {
  return apiRequest("/api/queue/board");
}

export async function fetchStaffQueueBoard() {
  return apiRequest("/api/queue/staff-board");
}

export async function fetchDashboardSummary() {
  return apiRequest("/api/dashboard/summary");
}

export async function fetchAuditEvents(filters = {}) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }

  const suffix = search.size ? `?${search.toString()}` : "";
  return apiRequest(`/api/audit-events${suffix}`);
}

export async function callNextPatient(department) {
  const response = await apiRequest("/api/queue/call-next", {
    method: "POST",
    body: department ? { department } : {},
  });

  return response.ticket;
}

export async function fetchTicketTracking(ticketCode) {
  return apiRequest(`/api/tickets/${encodeURIComponent(ticketCode)}/track`);
}

export async function retryNotificationDelivery(id) {
  const response = await apiRequest(`/api/notifications/${id}/retry`, {
    method: "POST",
  });

  return response.notification;
}

export async function retryNotificationDeliveries(ids) {
  return apiRequest("/api/notifications/retry-bulk", {
    method: "POST",
    body: { ids },
  });
}

export async function kioskLookup(identifier) {
  const response = await apiRequest("/api/kiosk/lookup", {
    method: "POST",
    body: { identifier },
  });
  return response.patient;
}

export async function kioskCheckIn(payload) {
  const response = await apiRequest("/api/kiosk/check-in", {
    method: "POST",
    body: payload,
  });
  return response.ticket;
}

export async function preRegisterPatient(payload) {
  const response = await apiRequest("/api/tickets/pre-register", {
    method: "POST",
    body: payload,
  });
  return response.ticket;
}

export async function confirmArrival(ticketId) {
  const response = await apiRequest(`/api/tickets/${ticketId}/confirm-arrival`, {
    method: "POST",
  });
  return response.ticket;
}

export async function saveTriageAssessment(ticketId, payload) {
  const response = await apiRequest(`/api/tickets/${ticketId}/triage-assessment`, {
    method: "POST",
    body: payload,
  });
  return response.ticket;
}

export async function fetchETAEstimates() {
  return apiRequest("/api/eta/estimates");
}

export async function fetchTicketETA(ticketId) {
  const response = await apiRequest(`/api/tickets/${ticketId}/eta`);
  return response.eta;
}

export async function fetchPrescriptions(filters = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }
  const suffix = search.size ? `?${search.toString()}` : "";
  const response = await apiRequest(`/api/prescriptions${suffix}`);
  return response.prescriptions;
}

export async function fetchPrescriptionsForTicket(ticketId) {
  const response = await apiRequest(`/api/tickets/${ticketId}/prescriptions`);
  return response.prescriptions;
}

export async function fetchPrescriptionSummary() {
  return apiRequest("/api/prescriptions/summary");
}

export async function createPrescription(ticketId, payload) {
  const response = await apiRequest(`/api/tickets/${ticketId}/prescriptions`, {
    method: "POST",
    body: payload,
  });
  return response.prescription;
}

export async function updatePrescriptionState(prescriptionId, state) {
  const response = await apiRequest(`/api/prescriptions/${prescriptionId}/state`, {
    method: "PATCH",
    body: { state },
  });
  return response.prescription;
}

export async function fetchTestOrders(filters = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }
  const suffix = search.size ? `?${search.toString()}` : "";
  const response = await apiRequest(`/api/test-orders${suffix}`);
  return response.testOrders;
}

export async function fetchTestOrdersForTicket(ticketId) {
  const response = await apiRequest(`/api/tickets/${ticketId}/test-orders`);
  return response.testOrders;
}

export async function fetchTestOrderSummary() {
  return apiRequest("/api/test-orders/summary");
}

export async function createTestOrder(ticketId, payload) {
  const response = await apiRequest(`/api/tickets/${ticketId}/test-orders`, {
    method: "POST",
    body: payload,
  });
  return response.testOrder;
}

export async function updateTestOrderState(testOrderId, state) {
  const response = await apiRequest(`/api/test-orders/${testOrderId}/state`, {
    method: "PATCH",
    body: { state },
  });
  return response.testOrder;
}

export async function fetchNextRoute(ticketId) {
  return apiRequest(`/api/tickets/${ticketId}/next-route`);
}

export async function submitFeedback(ticketId, payload) {
  const response = await apiRequest(`/api/tickets/${ticketId}/feedback`, {
    method: "POST",
    body: payload,
  });
  return response.feedback;
}

export async function fetchAverageWaitReport(filters = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }
  const suffix = search.size ? `?${search.toString()}` : "";
  return apiRequest(`/api/reports/average-wait${suffix}`);
}

export async function fetchDepartmentPerformanceReport(filters = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }
  const suffix = search.size ? `?${search.toString()}` : "";
  return apiRequest(`/api/reports/department-performance${suffix}`);
}

export async function fetchNoShowReport(filters = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }
  const suffix = search.size ? `?${search.toString()}` : "";
  return apiRequest(`/api/reports/no-show${suffix}`);
}

export async function fetchTriageReport(filters = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }
  const suffix = search.size ? `?${search.toString()}` : "";
  return apiRequest(`/api/reports/triage${suffix}`);
}

export async function fetchLabTurnaroundReport(filters = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }
  const suffix = search.size ? `?${search.toString()}` : "";
  return apiRequest(`/api/reports/lab-turnaround${suffix}`);
}

export async function fetchStaffWorkloadReport(filters = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }
  const suffix = search.size ? `?${search.toString()}` : "";
  return apiRequest(`/api/reports/staff-workload${suffix}`);
}

export async function fetchOutOfStockReport() {
  return apiRequest("/api/reports/out-of-stock");
}

export async function fetchPeakHoursReport(filters = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }
  const suffix = search.size ? `?${search.toString()}` : "";
  return apiRequest(`/api/reports/peak-hours${suffix}`);
}

export async function fetchCongestionReport(filters = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }
  const suffix = search.size ? `?${search.toString()}` : "";
  return apiRequest(`/api/reports/congestion${suffix}`);
}

export async function fetchResourceAllocationReport(filters = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }
  const suffix = search.size ? `?${search.toString()}` : "";
  return apiRequest(`/api/reports/resource-allocation${suffix}`);
}

export async function markItemOutOfStock(prescriptionId, itemName, outOfStock = true) {
  return apiRequest(`/api/prescriptions/${prescriptionId}/stock`, {
    method: "PATCH",
    body: { itemName, outOfStock },
  });
}

export async function fetchWhatsAppStatus() {
  return apiRequest("/api/whatsapp/status");
}

export async function fetchReassessmentAlerts() {
  return apiRequest("/api/reassessment-alerts");
}

export async function fetchDepartmentBoard(department) {
  const search = new URLSearchParams({ department });
  return apiRequest(`/api/queue/board?${search.toString()}`);
}

export async function fetchRuntimeConfig() {
  return apiRequest("/api/config");
}

export async function updateRuntimeConfig(payload) {
  const response = await apiRequest("/api/config", {
    method: "PATCH",
    body: payload,
  });
  return response.config;
}

export async function resetRuntimeConfig() {
  const response = await apiRequest("/api/config/reset", {
    method: "POST",
  });
  return response.config;
}

export async function fetchSyncStatus() {
  return apiRequest("/api/sync/status");
}

export async function exportSyncData() {
  return apiRequest("/api/sync/export");
}

export async function importSyncData(payload) {
  const response = await apiRequest("/api/sync/import", {
    method: "POST",
    body: payload,
  });
  return response.results;
}

export async function createBackup() {
  return apiRequest("/api/sync/backup", {
    method: "POST",
  });
}

export async function fetchStockItems() {
  const response = await apiRequest("/api/pharmacy/stock");
  return response.items;
}

export async function fetchStockSummary() {
  return apiRequest("/api/pharmacy/stock/summary");
}

export async function flagStockItem(drugName, inStock, notes = "") {
  const response = await apiRequest("/api/pharmacy/stock/flag", {
    method: "PATCH",
    body: { drugName, inStock, notes },
  });
  return response.item;
}

export async function addStockItem(drugName, inStock = true, notes = "") {
  const response = await apiRequest("/api/pharmacy/stock", {
    method: "POST",
    body: { drugName, inStock, notes },
  });
  return response.item;
}

export async function removeStockItem(id) {
  return apiRequest(`/api/pharmacy/stock/${id}`, {
    method: "DELETE",
  });
}

export async function fetchPrescriptionsWithStock() {
  const response = await apiRequest("/api/pharmacy/prescriptions");
  return response.prescriptions;
}

export async function flagPrescriptionItem(prescriptionId, itemId, inStock, notes = "") {
  const response = await apiRequest(`/api/prescriptions/${prescriptionId}/stock-flag`, {
    method: "PATCH",
    body: { itemId, inStock, notes },
  });
  return response.prescription;
}

export async function fetchOIClinicStreams() {
  return apiRequest("/api/oi-clinic/streams");
}

export async function fetchOIClinicVisits(filters = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }
  const suffix = search.size ? `?${search.toString()}` : "";
  const response = await apiRequest(`/api/oi-clinic/visits${suffix}`);
  return response.visits;
}

export async function fetchOIClinicSummary() {
  return apiRequest("/api/oi-clinic/summary");
}

export async function createOIClinicVisit(ticketId, streamId, notes = "") {
  const response = await apiRequest(`/api/tickets/${ticketId}/oi-clinic-visit`, {
    method: "POST",
    body: { streamId, notes },
  });
  return response.visit;
}

export async function updateOIClinicVisitState(visitId, state, referredTo) {
  const response = await apiRequest(`/api/oi-clinic/visits/${visitId}/state`, {
    method: "PATCH",
    body: { state, referredTo },
  });
  return response.visit;
}

export async function fetchAppointments(filters = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }
  const suffix = search.size ? `?${search.toString()}` : "";
  const response = await apiRequest(`/api/appointments${suffix}`);
  return response.appointments;
}

export async function createAppointment(payload) {
  const response = await apiRequest("/api/appointments", {
    method: "POST",
    body: payload,
  });
  return response.appointment;
}

export async function fetchAppointmentMeta() {
  return apiRequest("/api/appointments/meta");
}

export async function fetchAppointmentSummary() {
  return apiRequest("/api/appointments/summary");
}

export async function updateAppointmentStatus(id, status, options = {}) {
  const response = await apiRequest(`/api/appointments/${id}/status`, {
    method: "PATCH",
    body: { status, ...options },
  });
  return response.appointment;
}

export async function createFollowUpAppointment(payload) {
  const response = await apiRequest("/api/appointments/follow-up", {
    method: "POST",
    body: payload,
  });
  return response.appointment;
}

export async function fetchFollowUpsForTicket(ticketId) {
  const response = await apiRequest(`/api/tickets/${ticketId}/follow-ups`);
  return response.followUps;
}

export async function fetchAppointmentReminders(daysAhead = 3) {
  const response = await apiRequest(`/api/appointments/reminders?days=${daysAhead}`);
  return response.reminders;
}

export async function markAppointmentReminderSent(id) {
  return apiRequest(`/api/appointments/${id}/reminder-sent`, { method: "PATCH" });
}

export async function fetchHospitalInfo() {
  return apiRequest("/api/hospital/info");
}

export async function fetchHospitals() {
  const response = await apiRequest("/api/hospitals");
  return response.hospitals;
}

export async function createHospital(payload) {
  const response = await apiRequest("/api/hospitals", {
    method: "POST",
    body: payload,
  });
  return response.hospital;
}

export async function updateHospital(id, payload) {
  const response = await apiRequest(`/api/hospitals/${id}`, {
    method: "PATCH",
    body: payload,
  });
  return response.hospital;
}

export async function fetchWaitTimePrediction(department) {
  return apiRequest(`/api/ai/predict-wait?department=${encodeURIComponent(department)}`);
}

export async function fetchBottleneckAnalysis() {
  return apiRequest("/api/ai/bottlenecks");
}

export async function sendChatbotMessage(message, context = {}) {
  return apiRequest("/api/ai/chatbot", {
    method: "POST",
    body: { message, ...context },
  });
}
