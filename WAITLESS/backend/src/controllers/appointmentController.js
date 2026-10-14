import {
  createAppointment,
  createFollowUpAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getAppointmentSummary,
  getServiceCategories,
  getTimeSlots,
  getAvailableSlots,
  getFollowUpsForTicket,
  getUpcomingReminders,
  markReminderSent,
} from "../services/appointmentService.js";

export async function appointmentListController({ query }) {
  const filters = {};
  if (query?.get("status")) filters.status = query.get("status");
  if (query?.get("date")) filters.date = query.get("date");
  if (query?.get("department")) filters.department = query.get("department");
  if (query?.get("serviceCategory")) filters.serviceCategory = query.get("serviceCategory");
  return {
    status: 200,
    body: { appointments: await getAppointments(filters) },
  };
}

export async function appointmentCreateController({ body, staff }) {
  const result = await createAppointment(body, staff);
  if (!result.ok) {
    return { status: 400, body: { message: result.error } };
  }
  return { status: 201, body: { appointment: result.appointment } };
}

export async function appointmentDetailController({ params }) {
  const appointment = await getAppointmentById(params.id);
  if (!appointment) {
    return { status: 404, body: { message: "Appointment not found" } };
  }
  return { status: 200, body: { appointment } };
}

export async function appointmentUpdateStatusController({ params, body, staff }) {
  const result = await updateAppointmentStatus(
    params.id,
    body?.status,
    { ticketId: body?.ticketId },
    staff,
  );
  if (!result.ok) {
    return { status: 400, body: { message: result.error } };
  }
  return { status: 200, body: { appointment: result.appointment } };
}

export async function appointmentSummaryController() {
  return {
    status: 200,
    body: await getAppointmentSummary(),
  };
}

export async function appointmentMetaController() {
  return {
    status: 200,
    body: {
      serviceCategories: getServiceCategories(),
      timeSlots: getTimeSlots(),
    },
  };
}

export async function appointmentAvailableSlotsController({ query }) {
  const date = query?.get("date");
  const serviceCategory = query?.get("serviceCategory");
  if (!date || !serviceCategory) {
    return { status: 400, body: { message: "date and serviceCategory are required" } };
  }
  const slots = await getAvailableSlots(date, serviceCategory);
  return { status: 200, body: { availableSlots: slots } };
}

export async function patientAppointmentListController({ query, patientUser }) {
  const filters = {};
  if (query?.get("status")) filters.status = query.get("status");
  if (query?.get("date")) filters.date = query.get("date");
  const all = await getAppointments(filters);
  const mine = all.filter(
    (a) =>
      a.patientName?.toLowerCase() === (patientUser?.fullName ?? "").toLowerCase() ||
      a.patientContact === patientUser?.phone,
  );
  return { status: 200, body: { appointments: mine } };
}

export async function patientAppointmentCreateController({ body, patientUser }) {
  const payload = {
    ...body,
    patientName: patientUser?.fullName ?? body?.patientName,
    patientContact: patientUser?.phone ?? body?.patientContact,
  };
  const result = await createAppointment(payload, null);
  if (!result.ok) {
    return { status: 400, body: { message: result.error } };
  }
  return { status: 200, body: { appointment: result.appointment } };
}

export async function followUpCreateController({ body, staff }) {
  const result = await createFollowUpAppointment(body, staff);
  if (!result.ok) {
    return { status: 400, body: { message: result.error } };
  }
  return { status: 201, body: { appointment: result.appointment } };
}

export async function followUpsForTicketController({ params }) {
  const followUps = await getFollowUpsForTicket(params.ticketId);
  return { status: 200, body: { followUps } };
}

export async function appointmentRemindersController({ query }) {
  const days = parseInt(query?.get("days") ?? "3", 10);
  const reminders = await getUpcomingReminders(days);
  return { status: 200, body: { reminders } };
}

export async function markReminderSentController({ params }) {
  const success = await markReminderSent(params.id);
  if (!success) {
    return { status: 404, body: { message: "Appointment not found" } };
  }
  return { status: 200, body: { ok: true } };
}

export async function patientAppointmentCancelController({ params, patientUser }) {
  const appointment = await getAppointmentById(params.id);
  if (!appointment) {
    return { status: 404, body: { message: "Appointment not found" } };
  }
  const isOwner =
    appointment.patientName?.toLowerCase() === (patientUser?.fullName ?? "").toLowerCase() ||
    appointment.patientContact === patientUser?.phone;
  if (!isOwner) {
    return { status: 403, body: { message: "You can only cancel your own appointments" } };
  }
  const result = await updateAppointmentStatus(params.id, "cancelled", {}, null);
  if (!result.ok) {
    return { status: 400, body: { message: result.error } };
  }
  return { status: 200, body: { appointment: result.appointment } };
}

export async function appointmentUpdateController({ params, body, staff }) {
  const result = await updateAppointment(params.id, body, staff);
  if (!result.ok) {
    return { status: 400, body: { message: result.error } };
  }
  return { status: 200, body: { appointment: result.appointment } };
}

export async function appointmentDeleteController({ params }) {
  const result = await deleteAppointment(params.id);
  if (!result.ok) {
    return { status: 404, body: { message: result.error } };
  }
  return { status: 200, body: { ok: true, appointment: result.appointment } };
}
