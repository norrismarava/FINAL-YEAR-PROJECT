import { apiRequest } from "./api";

export async function loginStaff(credentials) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: credentials,
  });
}

export async function fetchCurrentStaff() {
  return apiRequest("/api/auth/me");
}
