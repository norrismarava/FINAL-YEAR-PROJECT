import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const testDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "waitless-patients-"));
process.env.DB_PROVIDER = "file";
process.env.STATE_FILE_PATH = path.join(testDirectory, "queue-state.json");
process.env.WHATSAPP_PROVIDER = "mock";
process.env.PUBLIC_APP_URL = "http://waitless.test";

const { initializeQueueRepository } = await import(
  "../src/repositories/queueRepository.js"
);
const {
  assignPriority,
  getTicketTracking,
  registerPatient,
  searchPatients,
  updatePatientStatus,
} = await import("../src/services/queueService.js");
const { dispatchRegistrationNotification } = await import(
  "../src/services/notificationService.js"
);

await initializeQueueRepository();

test.after(async () => {
  await fs.rm(testDirectory, { force: true, recursive: true });
});

test("reuses one patient master record across multiple visits", async () => {
  const demographics = {
    fullName: "Audit Test Patient",
    nationalId: "63-TEST-0001",
    dob: "1994-03-12",
    gender: "female",
    phone: "+263 77 900 0001",
    address: "Chinhoyi",
    patientCategory: "walk-in",
    nextOfKinName: "Test Contact",
    nextOfKinPhone: "+263 77 900 0002",
    notificationConsent: false,
    whatsApp: false,
    dept: "Casualty / Triage",
    chiefComplaint: "First visit",
  };

  const firstVisit = await registerPatient(demographics);

  // A patient may hold only one open ticket — close the first visit before
  // the second registration.
  await updatePatientStatus(firstVisit.id, "called");
  await updatePatientStatus(firstVisit.id, "in-service");
  await updatePatientStatus(firstVisit.id, "completed");

  const secondVisit = await registerPatient({
    ...demographics,
    dept: "Laboratory",
    chiefComplaint: "Follow-up visit",
  });

  assert.equal(secondVisit.patientId, firstVisit.patientId);
  assert.equal(secondVisit.patientNumber, firstVisit.patientNumber);

  const [profile] = await searchPatients(firstVisit.patientNumber);
  assert.equal(profile.id, firstVisit.patientId);
  assert.equal(profile.totalVisits, 2);
  assert.equal(profile.lastDepartment, "Laboratory");
});

test("finds a returning patient from the QR payload", async () => {
  const [profile] = await searchPatients("63-TEST-0001");
  const [qrMatch] = await searchPatients(profile.qrLookupValue);

  assert.equal(qrMatch.id, profile.id);
  assert.equal(qrMatch.patientNumber, profile.patientNumber);
  assert.match(qrMatch.patientNumber, /^WL-P\d{6}$/);
});

test("issues one immutable department token across the registration handoff", async () => {
  const visit = await registerPatient({
    fullName: "Token Test Patient",
    nationalId: "63-TEST-0002",
    dob: "1991-09-08",
    gender: "male",
    phone: "+263 77 900 0003",
    address: "Harare",
    patientCategory: "walk-in",
    nextOfKinName: "",
    nextOfKinPhone: "",
    notificationConsent: false,
    whatsApp: false,
    dept: "Radiology",
    chiefComplaint: "Imaging review",
  });

  assert.match(visit.ticket, /^[A-Z]\d{3}$/);
  assert.equal(visit.handoff.token, visit.ticket);
  assert.equal(visit.handoff.trackingPath, `/track?ticket=${visit.ticket}`);
  assert.equal(visit.handoff.channels.print.status, "ready");
  assert.equal(visit.handoff.channels.phone.status, "ready");
  assert.equal(visit.handoff.channels.whatsapp.status, "disabled");
  assert.equal(visit.handoff.channels.displayBoard.status, "synced");

  const triaged = await assignPriority(visit.id, "red");
  assert.equal(triaged.ticket, visit.ticket);

  const tracking = await getTicketTracking(visit.ticket);
  assert.equal(tracking.ticket.id, visit.id);
});

test("includes the same token and tracking link in WhatsApp registration text", async () => {
  const visit = await registerPatient({
    fullName: "WhatsApp Token Patient",
    nationalId: "63-TEST-0003",
    dob: "1988-01-20",
    gender: "female",
    phone: "+263 77 900 0004",
    address: "Harare",
    patientCategory: "walk-in",
    nextOfKinName: "",
    nextOfKinPhone: "",
    notificationConsent: false,
    whatsApp: false,
    dept: "Pharmacy",
    chiefComplaint: "Medication collection",
  });
  const notification = await dispatchRegistrationNotification({
    ...visit,
    notificationConsent: true,
    whatsApp: true,
  });

  assert.equal(notification.ticket, visit.ticket);
  assert.match(notification.message, new RegExp(visit.ticket));
  assert.match(
    notification.message,
    new RegExp(
      `http://waitless\\.test/track\\?ticket=${encodeURIComponent(visit.ticket)}`,
    ),
  );
});
