import { HttpError } from "../utils/http.js";
import {
  findPrescriptionsByTicketId,
  findTestOrdersByTicketId,
  listPatients,
  listTickets,
} from "../repositories/queueRepository.js";
import { listPatientUsers } from "./patientAuthService.js";
import { getAppointments } from "./appointmentService.js";
import { getOIClinicVisits } from "./oiClinicService.js";

const norm = (value) => (value ?? "").toString().trim().toLowerCase();

function normalizePhone(phone) {
  return (phone ?? "").replace(/\D/g, "");
}

export async function searchPatientDirectory(search) {
  const q = norm(search);

  let accounts = [];
  let profiles = [];
  try {
    accounts = await listPatientUsers();
  } catch {
    accounts = [];
  }
  try {
    profiles = await listPatients();
  } catch {
    profiles = [];
  }

  const entries = [];
  for (const user of accounts) {
    entries.push({
      kind: "account",
      id: user.id,
      name: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      nationalId: user.nationalId,
      createdAt: user.createdAt,
    });
  }
  for (const profile of profiles) {
    entries.push({
      kind: "profile",
      id: profile.id,
      patientNumber: profile.patientNumber,
      name: profile.patientName,
      phone: profile.phone,
      nationalId: profile.nationalId,
      dob: profile.dob,
      gender: profile.gender,
      lastVisitAt: profile.lastVisitAt,
    });
  }

  if (!q) {
    return entries.slice(0, 50);
  }

  return entries
    .filter((entry) =>
      [entry.name, entry.username, entry.email, entry.phone, entry.nationalId, entry.patientNumber]
        .some((field) => norm(field).includes(q)),
    )
    .slice(0, 50);
}

export async function getPatientHistory(key) {
  const needle = norm(key);
  if (!needle) {
    throw new HttpError(400, "A patient identifier is required.");
  }

  const is = (value) => norm(value) === needle;
  const phoneIs = (value) => {
    const digits = normalizePhone(value);
    return digits.length > 0 && digits === normalizePhone(needle);
  };

  const [accounts, profiles, tickets, appointments, oiVisits] = await Promise.all([
    listPatientUsers().catch(() => []),
    listPatients().catch(() => []),
    listTickets().catch(() => []),
    getAppointments().catch(() => []),
    getOIClinicVisits().catch(() => []),
  ]);

  const account =
    accounts.find(
      (u) =>
        is(u.id) || is(u.nationalId) || is(u.username) || is(u.email) || phoneIs(u.phone),
    ) ?? null;
  const profile =
    profiles.find(
      (p) =>
        is(p.id) || is(p.nationalId) || is(p.patientNumber) || phoneIs(p.phone) || is(p.patientName),
    ) ?? null;

  if (!account && !profile) {
    // Allow lookup purely by ticket / national-id style keys so direct
    // record links still work even if the person has no profile row.
    const ticketHit = tickets.some(
      (t) => is(t.patientId) || is(t.nationalId) || is(t.phone) || is(t.patientName),
    );
    if (!ticketHit) {
      throw new HttpError(404, "No patient record matches that identifier.");
    }
  }

  const ids = new Set();
  const nationalIds = new Set();
  const phones = new Set();
  const names = new Set();
  for (const source of [account, profile]) {
    if (!source) continue;
    ids.add(source.id);
    const nid = norm(source.nationalId);
    const ph = normalizePhone(source.phone);
    const nm = norm(source.fullName ?? source.patientName);
    if (nid) nationalIds.add(nid);
    if (ph) phones.add(ph);
    if (nm) names.add(nm);
  }
  nationalIds.add(needle);
  phones.add(normalizePhone(needle));
  ids.add(key);

  const patientTickets = tickets.filter(
    (t) =>
      (t.patientId && ids.has(t.patientId)) ||
      (t.nationalId && nationalIds.has(norm(t.nationalId))) ||
      (t.phone && phones.has(normalizePhone(t.phone))) ||
      (t.patientName && names.has(norm(t.patientName))),
  );

  const ticketCodes = new Set(patientTickets.map((t) => t.ticket));
  const ticketIds = new Set(patientTickets.map((t) => t.id));

  const patientAppointments = appointments.filter(
    (a) =>
      (a.ticketId && ticketIds.has(a.ticketId)) ||
      (a.patientContact && phones.has(normalizePhone(a.patientContact))) ||
      (a.patientName && names.has(norm(a.patientName))),
  );

  const patientVisits = oiVisits.filter(
    (v) =>
      (v.ticketCode && ticketCodes.has(v.ticketCode)) ||
      (v.patientName && names.has(norm(v.patientName))),
  );

  for (const ticket of patientTickets) {
    ticket.prescriptions = await findPrescriptionsByTicketId(ticket.id).catch(() => []);
    ticket.testOrders = await findTestOrdersByTicketId(ticket.id).catch(() => []);
  }

  patientTickets.sort(
    (a, b) => new Date(b.registeredAt ?? 0) - new Date(a.registeredAt ?? 0),
  );
  patientAppointments.sort((a, b) => `${b.date}T${b.timeSlot}`.localeCompare(`${a.date}T${a.timeSlot}`));

  return {
    patient: {
      accountId: account?.id ?? null,
      profileId: profile?.id ?? null,
      patientNumber: profile?.patientNumber ?? null,
      name: profile?.patientName ?? account?.fullName ?? null,
      username: account?.username ?? null,
      email: account?.email ?? null,
      phone: account?.phone ?? profile?.phone ?? null,
      nationalId: account?.nationalId || profile?.nationalId || null,
      dob: account?.dob || profile?.dob || null,
      gender: account?.gender || profile?.gender || null,
      hasPortalAccount: Boolean(account),
      registeredAt: account?.createdAt ?? profile?.createdAt ?? null,
      lastVisitAt: profile?.lastVisitAt ?? null,
    },
    summary: {
      visits: patientTickets.length,
      prescriptions: patientTickets.reduce((n, t) => n + (t.prescriptions?.length ?? 0), 0),
      testOrders: patientTickets.reduce((n, t) => n + (t.testOrders?.length ?? 0), 0),
      appointments: patientAppointments.length,
      oiVisits: patientVisits.length,
    },
    tickets: patientTickets,
    appointments: patientAppointments,
    oiVisits: patientVisits,
  };
}
