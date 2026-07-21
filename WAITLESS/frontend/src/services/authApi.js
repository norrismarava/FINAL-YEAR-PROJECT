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

export async function registerStaffAccount(payload) {
  return apiRequest("/api/auth/staff-register", {
    method: "POST",
    body: payload,
  });
}

export async function uploadStaffAvatar(avatarBase64) {
  return apiRequest("/api/profile/avatar", {
    method: "POST",
    body: { avatarBase64 },
  });
}
