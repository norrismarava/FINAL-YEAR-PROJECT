import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const testDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "waitless-patients-"));
process.env.DB_PROVIDER = "file";
process.env.STATE_FILE_PATH = path.join(testDirectory, "queue-state.json");
process.env.WHATSAPP_PROVIDER = "mock";

const { initializeQueueRepository } = await import(
  "../src/repositories/queueRepository.js"
);
const { registerPatient, searchPatients } = await import(
  "../src/services/queueService.js"
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
    dept: "OPD",
    chiefComplaint: "First visit",
  };

  const firstVisit = await registerPatient(demographics);
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
