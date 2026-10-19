import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APPOINTMENTS_FILE = fileURLToPath(
  new URL("../../data/appointments.json", import.meta.url),
);

export const APPOINTMENT_STATUS = {
  pending: { label: "Pending", color: "amber" },
  confirmed: { label: "Confirmed", color: "blue" },
  "checked-in": { label: "Checked In", color: "teal" },
  cancelled: { label: "Cancelled", color: "red" },
  completed: { label: "Completed", color: "green" },
};

export const SERVICE_CATEGORIES = [
  { id: "opd", label: "Outpatient Consultation", department: "Casualty / Triage", defaultDurationMin: 15 },
  { id: "triage", label: "Triage Assessment", department: "Casualty / Triage", defaultDurationMin: 10 },
  { id: "pharmacy", label: "Pharmacy Refill", department: "Pharmacy", defaultDurationMin: 10 },
  { id: "lab", label: "Laboratory Test", department: "Laboratory", defaultDurationMin: 20 },
  { id: "radiology", label: "Radiology / X-Ray", department: "Radiology", defaultDurationMin: 20 },
  { id: "oi-clinic", label: "OI Clinic Review", department: "OI Clinic", defaultDurationMin: 15 },
];

export const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];

let cachedAppointments = null;

async function loadAppointments() {
  if (cachedAppointments) return cachedAppointments;
  try {
    const raw = await fs.readFile(APPOINTMENTS_FILE, "utf8");
    cachedAppointments = JSON.parse(raw);
  } catch {
    cachedAppointments = [];
  }
  return cachedAppointments;
}

async function saveAppointments(appointments) {
  cachedAppointments = appointments;
  const dir = path.dirname(APPOINTMENTS_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
  await fs.writeFile(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2), "utf8");
}

function validateDate(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

function validateTimeSlot(slot) {
  return TIME_SLOTS.includes(slot);
}

export async function createAppointment(data, staff) {
  if (!data?.patientName?.trim()) {
    return { ok: false, error: "Patient name is required" };
  }
  if (!validateDate(data?.date)) {
    return { ok: false, error: "Valid appointment date is required" };
  }
  if (!validateTimeSlot(data?.timeSlot)) {
    return { ok: false, error: "Valid time slot is required" };
  }

  const service = SERVICE_CATEGORIES.find((s) => s.id === data?.serviceCategory);
  if (!service) {
    return { ok: false, error: "Invalid service category" };
  }

  const appointments = await loadAppointments();

  const existing = appointments.find(
    (a) =>
      a.date === data.date &&
      a.timeSlot === data.timeSlot &&
      a.serviceCategory === service.id &&
      a.status !== "cancelled" &&
      a.status !== "completed",
  );
  if (existing) {
    return { ok: false, error: "That slot is already booked for this service" };
  }

  const appointment = {
    id: crypto.randomUUID(),
    patientName: data.patientName.trim(),
    patientContact: data.patientContact?.trim() ?? "",
    patientAge: data.patientAge ?? null,
    patientGender: data.patientGender ?? "",
    serviceCategory: service.id,
    serviceLabel: service.label,
    department: service.department,
    date: data.date,
    timeSlot: data.timeSlot,
    durationMin: data.durationMin ?? service.defaultDurationMin,
    notes: data.notes?.trim() ?? "",
    status: "pending",
    createdBy: staff ? { id: staff.id, name: staff.name, role: staff.role } : null,
    createdAt: new Date().toISOString(),
    confirmedAt: null,
    confirmedBy: null,
    checkedInAt: null,
    ticketId: null,
    statusHistory: [{ status: "pending", at: new Date().toISOString(), actor: staff ? staff.name : "system" }],
  };

  appointments.push(appointment);
  await saveAppointments(appointments);

  return { ok: true, appointment };
}

export async function getAppointments(filters = {}) {
  let appointments = await loadAppointments();

  if (filters.status) {
    appointments = appointments.filter((a) => a.status === filters.status);
  }
  if (filters.date) {
    appointments = appointments.filter((a) => a.date === filters.date);
  }
  if (filters.department) {
    appointments = appointments.filter((a) => a.department === filters.department);
  }
  if (filters.serviceCategory) {
    appointments = appointments.filter((a) => a.serviceCategory === filters.serviceCategory);
  }

  return appointments.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.timeSlot.localeCompare(b.timeSlot);
  });
}

export async function getAppointmentById(id) {
  const appointments = await loadAppointments();
  return appointments.find((a) => a.id === id) ?? null;
}

export async function updateAppointmentStatus(id, newStatus, options = {}, staff) {
  if (!APPOINTMENT_STATUS[newStatus]) {
    return { ok: false, error: "Invalid appointment status" };
  }

  const appointments = await loadAppointments();
  const appointment = appointments.find((a) => a.id === id);
  if (!appointment) {
    return { ok: false, error: "Appointment not found" };
  }

  if (appointment.status === "cancelled" && newStatus !== "cancelled") {
    return { ok: false, error: "Cannot update a cancelled appointment" };
  }

  appointment.status = newStatus;
  appointment.statusHistory.push({
    status: newStatus,
    at: new Date().toISOString(),
    actor: staff ? staff.name : "system",
  });

  if (newStatus === "confirmed") {
    appointment.confirmedAt = new Date().toISOString();
    appointment.confirmedBy = staff ? { id: staff.id, name: staff.name } : null;
  }
  if (newStatus === "checked-in") {
    appointment.checkedInAt = new Date().toISOString();
    if (options.ticketId) {
      appointment.ticketId = options.ticketId;
    }
  }

  await saveAppointments(appointments);
  return { ok: true, appointment };
}

export async function getAppointmentSummary() {
  const appointments = await loadAppointments();
  const today = new Date().toISOString().slice(0, 10);

  const byStatus = {};
  for (const status of Object.keys(APPOINTMENT_STATUS)) {
    byStatus[status] = 0;
  }
  for (const a of appointments) {
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
  }

  const todayAppointments = appointments.filter((a) => a.date === today);

  return {
    total: appointments.length,
    today: todayAppointments.length,
    byStatus,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function getServiceCategories() {
  return SERVICE_CATEGORIES;
}

export function getTimeSlots() {
  return TIME_SLOTS;
}

export async function getAvailableSlots(date, serviceCategory) {
  const appointments = await loadAppointments();
  const bookedSlots = new Set(
    appointments
      .filter(
        (a) =>
          a.date === date &&
          a.serviceCategory === serviceCategory &&
          a.status !== "cancelled" &&
          a.status !== "completed",
      )
      .map((a) => a.timeSlot),
  );
  return TIME_SLOTS.map((slot) => ({
    slot,
    available: !bookedSlots.has(slot),
  }));
}

export async function createFollowUpAppointment(data, staff) {
  if (!data?.originalTicketId) {
    return { ok: false, error: "Original ticket ID is required for follow-up" };
  }
  if (!data?.patientName?.trim()) {
    return { ok: false, error: "Patient name is required" };
  }
  if (!validateDate(data?.date)) {
    return { ok: false, error: "Valid follow-up date is required" };
  }
  if (!validateTimeSlot(data?.timeSlot)) {
    return { ok: false, error: "Valid time slot is required" };
  }

  const service = SERVICE_CATEGORIES.find((s) => s.id === (data?.serviceCategory ?? "opd"));
  if (!service) {
    return { ok: false, error: "Invalid service category" };
  }

  const appointments = await loadAppointments();

  const existing = appointments.find(
    (a) =>
      a.date === data.date &&
      a.timeSlot === data.timeSlot &&
      a.serviceCategory === service.id &&
      a.status !== "cancelled" &&
      a.status !== "completed",
  );
  if (existing) {
    return { ok: false, error: "That slot is already booked for this service" };
  }

  const appointment = {
    id: crypto.randomUUID(),
    patientName: data.patientName.trim(),
    patientContact: data.patientContact?.trim() ?? "",
    patientAge: data.patientAge ?? null,
    patientGender: data.patientGender ?? "",
    serviceCategory: service.id,
    serviceLabel: service.label,
    department: service.department,
    date: data.date,
    timeSlot: data.timeSlot,
    durationMin: data.durationMin ?? service.defaultDurationMin,
    notes: data.notes?.trim() ?? "",
    status: "pending",
    isFollowUp: true,
    originalTicketId: data.originalTicketId,
    originalDepartment: data.originalDepartment ?? null,
    followUpReason: data.followUpReason?.trim() ?? "Follow-up review",
    createdBy: staff ? { id: staff.id, name: staff.name, role: staff.role } : null,
    createdAt: new Date().toISOString(),
    confirmedAt: null,
    confirmedBy: null,
    checkedInAt: null,
    ticketId: null,
    statusHistory: [{ status: "pending", at: new Date().toISOString(), actor: staff ? staff.name : "system" }],
  };

  appointments.push(appointment);
  await saveAppointments(appointments);

  return { ok: true, appointment };
}

export async function getFollowUpsForTicket(ticketId) {
  const appointments = await loadAppointments();
  return appointments
    .filter((a) => a.isFollowUp && a.originalTicketId === ticketId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getUpcomingReminders(daysAhead = 3) {
  const appointments = await loadAppointments();
  const now = new Date();
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const todayStr = now.toISOString().slice(0, 10);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return appointments
    .filter((a) => {
      if (a.status === "cancelled" || a.status === "completed") return false;
      if (a.reminderSent) return false;
      return a.date >= todayStr && a.date <= cutoffStr;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.timeSlot.localeCompare(b.timeSlot);
    });
}

export async function markReminderSent(appointmentId) {
  const appointments = await loadAppointments();
  const appointment = appointments.find((a) => a.id === appointmentId);
  if (!appointment) return false;
  appointment.reminderSent = true;
  appointment.reminderSentAt = new Date().toISOString();
  await saveAppointments(appointments);
  return true;
}

export async function updateAppointment(id, data, staff) {
  const appointments = await loadAppointments();
  const appointment = appointments.find((a) => a.id === id);
  if (!appointment) {
    return { ok: false, error: "Appointment not found" };
  }
  if (appointment.status === "cancelled") {
    return { ok: false, error: "Cannot edit a cancelled appointment" };
  }
  if (appointment.status === "completed") {
    return { ok: false, error: "Cannot edit a completed appointment" };
  }

  if (data?.patientName !== undefined) {
    if (!data.patientName.trim()) {
      return { ok: false, error: "Patient name is required" };
    }
    appointment.patientName = data.patientName.trim();
  }
  if (data?.patientContact !== undefined) {
    appointment.patientContact = data.patientContact.trim();
  }
  if (data?.patientAge !== undefined) {
    appointment.patientAge = data.patientAge ?? null;
  }
  if (data?.patientGender !== undefined) {
    appointment.patientGender = data.patientGender;
  }
  if (data?.notes !== undefined) {
    appointment.notes = data.notes.trim();
  }

  let serviceChanged = false;
  if (data?.serviceCategory !== undefined && data.serviceCategory !== appointment.serviceCategory) {
    const service = SERVICE_CATEGORIES.find((s) => s.id === data.serviceCategory);
    if (!service) {
      return { ok: false, error: "Invalid service category" };
    }
    appointment.serviceCategory = service.id;
    appointment.serviceLabel = service.label;
    appointment.department = service.department;
    appointment.durationMin = service.defaultDurationMin;
    serviceChanged = true;
  }

  if (data?.date !== undefined && data.date !== appointment.date) {
    if (!validateDate(data.date)) {
      return { ok: false, error: "Valid appointment date is required" };
    }
    appointment.date = data.date;
  }

  if (data?.timeSlot !== undefined && data.timeSlot !== appointment.timeSlot) {
    if (!validateTimeSlot(data.timeSlot)) {
      return { ok: false, error: "Valid time slot is required" };
    }
    appointment.timeSlot = data.timeSlot;
  }

  // Check for slot conflicts if date, time, or service changed
  if (serviceChanged || data?.date !== undefined || data?.timeSlot !== undefined) {
    const conflict = appointments.find(
      (a) =>
        a.id !== id &&
        a.date === appointment.date &&
        a.timeSlot === appointment.timeSlot &&
        a.serviceCategory === appointment.serviceCategory &&
        a.status !== "cancelled" &&
        a.status !== "completed",
    );
    if (conflict) {
      return { ok: false, error: "That slot is already booked for this service" };
    }
  }

  appointment.updatedAt = new Date().toISOString();
  appointment.updatedBy = staff ? { id: staff.id, name: staff.name } : null;

  await saveAppointments(appointments);
  return { ok: true, appointment };
}

export async function deleteAppointment(id) {
  const appointments = await loadAppointments();
  const index = appointments.findIndex((a) => a.id === id);
  if (index === -1) {
    return { ok: false, error: "Appointment not found" };
  }
  const removed = appointments.splice(index, 1)[0];
  await saveAppointments(appointments);
  return { ok: true, appointment: removed };
}
