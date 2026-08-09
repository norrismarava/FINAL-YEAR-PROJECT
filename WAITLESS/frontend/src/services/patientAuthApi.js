import { apiRequest } from "./api";

export async function registerPatientAccount(payload) {
  return apiRequest("/api/patient/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function loginPatientAccount(credentials) {
  return apiRequest("/api/patient/auth/login", {
    method: "POST",
    body: credentials,
  });
}

export async function fetchCurrentPatient() {
  return apiRequest("/api/patient/auth/me");
}

export async function fetchPatientTickets() {
  const response = await apiRequest("/api/patient/tickets");
  return response.tickets;
}

export async function fetchPatientProfileCard() {
  return apiRequest("/api/patient/profile-card");
}

export async function updatePatientProfile(payload) {
  return apiRequest("/api/patient/profile", {
    method: "PATCH",
    body: payload,
  });
}

export async function changePatientPassword(payload) {
  return apiRequest("/api/patient/password", {
    method: "PATCH",
    body: payload,
  });
}

export async function fetchPatientAppointments(filters = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }
  const suffix = search.size ? `?${search.toString()}` : "";
  const response = await apiRequest(`/api/patient/appointments${suffix}`);
  return response.appointments;
}

export async function fetchPatientAppointmentMeta() {
  return apiRequest("/api/patient/appointments/meta");
}

export async function fetchPatientAvailableSlots(date, serviceCategory) {
  const search = new URLSearchParams({ date, serviceCategory });
  const response = await apiRequest(`/api/patient/appointments/available-slots?${search.toString()}`);
  return response.availableSlots;
}

export async function bookPatientAppointment(payload) {
  const response = await apiRequest("/api/patient/appointments", {
    method: "POST",
    body: payload,
  });
  return response.appointment;
}

export async function cancelPatientAppointment(id) {
  const response = await apiRequest(`/api/patient/appointments/${id}/cancel`, {
    method: "PATCH",
  });
  return response.appointment;
}

export async function submitPatientFeedback(ticketId, payload) {
  const response = await apiRequest(`/api/tickets/${ticketId}/feedback`, {
    method: "POST",
    body: payload,
  });
  return response.feedback;
}
