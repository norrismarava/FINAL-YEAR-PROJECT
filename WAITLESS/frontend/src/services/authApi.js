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

export async function staffSelfRegister(payload) {
  return apiRequest("/api/auth/staff-self-register", {
    method: "POST",
    body: payload,
  });
}

export async function createStaffAccessCode(payload) {
  return apiRequest("/api/auth/staff-access-codes", {
    method: "POST",
    body: payload,
  });
}

export async function listStaffAccessCodes() {
  return apiRequest("/api/auth/staff-access-codes");
}

export async function listStaffUsers() {
  return apiRequest("/api/auth/staff");
}

export async function listPatientUsers() {
  return apiRequest("/api/patients");
}

export async function deleteStaffUser(id) {
  return apiRequest(`/api/auth/staff/${id}`, { method: "DELETE" });
}

export async function deletePatientUser(id) {
  return apiRequest(`/api/patients/${id}`, { method: "DELETE" });
}

export async function searchPatientDirectory(search) {
  return apiRequest(`/api/patients/directory?search=${encodeURIComponent(search)}`);
}

export async function changeStaffPassword(payload) {
  return apiRequest("/api/auth/change-password", {
    method: "POST",
    body: payload,
  });
}

export async function fetchPatientHistory(key) {
  return apiRequest(`/api/patients/history?key=${encodeURIComponent(key)}`);
}

export async function uploadStaffAvatar(avatarBase64) {
  return apiRequest("/api/profile/avatar", {
    method: "POST",
    body: { avatarBase64 },
  });
}

export async function removeStaffAvatar() {
  return apiRequest("/api/profile/avatar", { method: "DELETE" });
}

export async function saveStaffProfile(payload) {
  return apiRequest("/api/profile", {
    method: "POST",
    body: payload,
  });
}
