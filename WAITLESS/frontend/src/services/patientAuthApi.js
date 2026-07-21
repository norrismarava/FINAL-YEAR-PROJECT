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
