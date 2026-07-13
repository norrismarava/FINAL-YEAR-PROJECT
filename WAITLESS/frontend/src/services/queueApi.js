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

export async function recallTicket(id) {
  const response = await apiRequest(`/api/tickets/${id}/recall`, {
    method: "POST",
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

export async function fetchDashboardSummary() {
  return apiRequest("/api/dashboard/summary");
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
