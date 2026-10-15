import {
  registerPatientAccount,
  loginPatient,
  getPatientSessionFromRequest,
  requirePatientSession,
  updatePatientProfile,
  changePatientPassword,
  requestPatientPasswordReset,
  resetPatientPassword,
} from "../services/patientAuthService.js";
import { getTickets } from "../services/queueService.js";
import {
  findPatientByPhone,
  findPrescriptionsByTicketId,
  findTestOrdersByTicketId,
  findFeedbackByTicketId,
  listNotifications,
} from "../repositories/queueRepository.js";
import { getAppointments } from "../services/appointmentService.js";
import { saveAvatarImage } from "../services/avatarService.js";
import { HttpError } from "../utils/http.js";

export async function patientRegisterController({ body }) {
  const session = await registerPatientAccount({
    fullName: body?.fullName,
    username: body?.username,
    email: body?.email,
    phone: body?.phone,
    nationalId: body?.nationalId,
    dob: body?.dob,
    gender: body?.gender,
    password: body?.password,
  });

  return {
    status: 201,
    body: session,
  };
}

export async function patientLoginController({ body }) {
  const session = await loginPatient({
    identifier: body?.identifier ?? body?.email ?? body?.username,
    password: body?.password,
  });

  return {
    status: 200,
    body: session,
  };
}

export async function patientMeController({ req }) {
  const session = requirePatientSession(req);

  return {
    status: 200,
    body: session,
  };
}

export async function patientTicketsController({ req }) {
  const session = requirePatientSession(req);
  const patient = session.user;

  const allTickets = await getTickets();
  const patientTickets = allTickets.filter((ticket) => {
    const phoneMatch =
      patient.phone &&
      ticket.phone &&
      ticket.phone.trim() === patient.phone.trim();
    const nationalIdMatch =
      patient.nationalId &&
      ticket.nationalId &&
      ticket.nationalId.trim().toLowerCase() ===
        patient.nationalId.trim().toLowerCase();
    const patientIdMatch = ticket.patientId && ticket.patientId === patient.id;
    return phoneMatch || nationalIdMatch || patientIdMatch;
  });

  return {
    status: 200,
    body: {
      tickets: patientTickets,
    },
  };
}

export async function patientProfileCardController({ req }) {
  const session = requirePatientSession(req);
  const patient = session.user;

  const profile = await findPatientByPhone(patient.phone);

  if (!profile) {
    return {
      status: 200,
      body: {
        profile: null,
        account: {
          fullName: patient.fullName,
          email: patient.email,
          phone: patient.phone,
          nationalId: patient.nationalId,
          dob: patient.dob,
          gender: patient.gender,
          username: patient.username,
          createdAt: patient.createdAt,
          lastLoginAt: patient.lastLoginAt,
        },
      },
    };
  }

  const allTickets = await getTickets();
  const patientTickets = allTickets.filter((ticket) => {
    const phoneMatch =
      patient.phone &&
      ticket.phone &&
      ticket.phone.trim() === patient.phone.trim();
    const nationalIdMatch =
      patient.nationalId &&
      ticket.nationalId &&
      ticket.nationalId.trim().toLowerCase() ===
        patient.nationalId.trim().toLowerCase();
    const patientIdMatch = ticket.patientId && ticket.patientId === profile.id;
    return phoneMatch || nationalIdMatch || patientIdMatch;
  });

  const completedTickets = patientTickets.filter((t) => t.status === "completed");
  const activeTickets = patientTickets.filter(
    (t) => t.status === "waiting" || t.status === "in-service" || t.status === "recalled",
  );

  const recentTickets = patientTickets
    .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
    .slice(0, 10);

  const prescriptions = [];
  const testOrders = [];
  const feedback = [];
  const triageHistory = [];
  const healthTimeline = [];

  for (const ticket of recentTickets) {
    const ticketPrescriptions = await findPrescriptionsByTicketId(ticket.id);
    for (const p of ticketPrescriptions) {
      prescriptions.push({
        id: p.id,
        ticketCode: ticket.ticket,
        department: ticket.department,
        state: p.state,
        items: p.items,
        createdAt: p.createdAt,
      });
      healthTimeline.push({
        type: "prescription",
        date: p.createdAt,
        title: `Prescription — ${ticket.ticket}`,
        description: `${p.items?.length ?? 0} item(s) prescribed`,
        department: ticket.department,
        status: p.state,
      });
    }

    const ticketTestOrders = await findTestOrdersByTicketId(ticket.id);
    for (const o of ticketTestOrders) {
      testOrders.push({
        id: o.id,
        ticketCode: ticket.ticket,
        department: ticket.department,
        testType: o.testType,
        state: o.state,
        notes: o.notes,
        createdAt: o.createdAt,
      });
      healthTimeline.push({
        type: "test-order",
        date: o.createdAt,
        title: `Lab Test — ${o.testType}`,
        description: ticket.ticket,
        department: ticket.department,
        status: o.state,
      });
    }

    const ticketFeedback = await findFeedbackByTicketId(ticket.id);
    for (const f of ticketFeedback) {
      feedback.push({
        id: f.id,
        ticketCode: ticket.ticket,
        rating: f.rating,
        categories: f.categories,
        comment: f.comment,
        submittedAt: f.submittedAt,
      });
    }

    if (ticket.priority && ticket.priority !== "green") {
      triageHistory.push({
        ticketCode: ticket.ticket,
        department: ticket.department,
        priority: ticket.priority,
        chiefComplaint: ticket.chiefComplaint,
        triagedAt: ticket.triagedAt,
        registeredAt: ticket.registeredAt,
        status: ticket.status,
      });
    }

    healthTimeline.push({
      type: "visit",
      date: ticket.registeredAt,
      title: `Visit — ${ticket.ticket}`,
      description: ticket.chiefComplaint || ticket.department,
      department: ticket.department,
      status: ticket.status,
      priority: ticket.priority,
    });
  }

  healthTimeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const allNotifications = await listNotifications();
  const patientNotifications = allNotifications
    .filter((n) => {
      const ticket = patientTickets.find((t) => t.id === n.ticketId);
      return ticket != null;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map((n) => ({
      id: n.id,
      ticket: n.ticket,
      type: n.type,
      channel: n.channel,
      status: n.status,
      createdAt: n.createdAt,
      nextRetryAt: n.nextRetryAt,
    }));

  let upcomingAppointments = [];
  try {
    const allAppointments = await getAppointments();
    upcomingAppointments = allAppointments
      .filter(
        (a) =>
          (a.patientPhone === patient.phone ||
            (patient.nationalId && a.patientNationalId === patient.nationalId)) &&
          a.status !== "cancelled" &&
          a.status !== "completed",
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  } catch {
    // appointments may not be available
  }

  const departmentBreakdown = {};
  for (const t of patientTickets) {
    departmentBreakdown[t.department] = (departmentBreakdown[t.department] ?? 0) + 1;
  }

  const priorityBreakdown = { red: 0, yellow: 0, green: 0, black: 0 };
  for (const t of patientTickets) {
    if (priorityBreakdown[t.priority] !== undefined) {
      priorityBreakdown[t.priority]++;
    }
  }

  return {
    status: 200,
    body: {
      profile: {
        id: profile.id,
        patientNumber: profile.patientNumber,
        patientName: profile.patientName,
        phone: profile.phone,
        dob: profile.dob,
        gender: profile.gender,
        patientCategory: profile.patientCategory,
      },
      account: {
        fullName: patient.fullName,
        email: patient.email,
        phone: patient.phone,
        nationalId: patient.nationalId,
        dob: patient.dob,
        gender: patient.gender,
        username: patient.username,
        createdAt: patient.createdAt,
        lastLoginAt: patient.lastLoginAt,
      },
      stats: {
        totalVisits: patientTickets.length,
        activeTickets: activeTickets.length,
        completedVisits: completedTickets.length,
        prescriptionsCount: prescriptions.length,
        testOrdersCount: testOrders.length,
        feedbackCount: feedback.length,
        upcomingAppointments: upcomingAppointments.length,
        triageEvents: triageHistory.length,
      },
      prescriptions: prescriptions.slice(0, 10),
      testOrders: testOrders.slice(0, 10),
      feedback: feedback.slice(0, 10),
      triageHistory: triageHistory.slice(0, 10),
      healthTimeline: healthTimeline.slice(0, 20),
      notifications: patientNotifications,
      upcomingAppointments,
      departmentBreakdown,
      priorityBreakdown,
    },
  };
}

export async function patientUpdateProfileController({ req, body }) {
  const session = await updatePatientProfile(req, {
    fullName: body?.fullName,
    email: body?.email,
    phone: body?.phone,
    nationalId: body?.nationalId,
    dob: body?.dob,
    gender: body?.gender,
  });

  return {
    status: 200,
    body: session,
  };
}

export async function patientAvatarController({ req, body }) {
  const session = requirePatientSession(req);

  const { avatarBase64 } = body ?? {};
  if (!avatarBase64) {
    return { status: 400, body: { message: "avatarBase64 is required" } };
  }

  const avatarUrl = saveAvatarImage(`patient-${session.user.id}`, avatarBase64);

  const updated = await updatePatientProfile(req, { avatarUrl });

  return {
    status: 200,
    body: { message: "Avatar updated", avatarUrl, user: updated?.user ?? session.user },
  };
}

export async function patientForgotPasswordController({ body }) {
  const result = await requestPatientPasswordReset({
    identifier: body?.identifier ?? body?.email ?? body?.username,
  });

  return {
    status: 200,
    body: result,
  };
}

export async function patientResetPasswordController({ body }) {
  const result = await resetPatientPassword({
    token: body?.token,
    password: body?.password,
  });

  return {
    status: 200,
    body: result,
  };
}

export async function patientChangePasswordController({ req, body }) {
  await changePatientPassword(
    req,
    body?.currentPassword,
    body?.newPassword,
  );

  return {
    status: 200,
    body: { success: true },
  };
}
