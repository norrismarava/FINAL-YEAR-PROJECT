import {
  registerPatientAccount,
  loginPatient,
  getPatientSessionFromRequest,
  requirePatientSession,
} from "../services/patientAuthService.js";
import { getTickets } from "../services/queueService.js";
import { HttpError } from "../utils/http.js";

export async function patientRegisterController({ body }) {
  const session = registerPatientAccount({
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
  const session = loginPatient({
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
