import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  listTickets,
  listPatients,
  listNotifications,
  listPrescriptions,
  listTestOrders,
  listFeedback,
  createTicket,
  createPatient,
  createNotification,
  createPrescription,
  createTestOrder,
  createFeedback,
  updateTicket,
  updateNotification,
  updatePrescription,
  updateTestOrder,
  findTicketById,
  findPatientById,
  findNotificationById,
  findPrescriptionById,
  findTestOrderById,
} from "../repositories/queueRepository.js";

const BACKUP_DIR = fileURLToPath(
  new URL("../../data/backups", import.meta.url),
);

const SYNC_STATUS_FILE = fileURLToPath(
  new URL("../../data/sync-status.json", import.meta.url),
);

let lastSyncAt = null;
let lastSyncSummary = null;

async function ensureBackupDir() {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
}

async function loadSyncStatus() {
  try {
    const raw = await fs.readFile(SYNC_STATUS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    lastSyncAt = parsed.lastSyncAt ?? null;
    lastSyncSummary = parsed.lastSyncSummary ?? null;
  } catch {
    // No status file yet
  }
}

async function saveSyncStatus() {
  const dir = path.dirname(SYNC_STATUS_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
  await fs.writeFile(
    SYNC_STATUS_FILE,
    JSON.stringify({ lastSyncAt, lastSyncSummary }, null, 2),
    "utf8",
  );
}

export async function exportSyncData() {
  const [tickets, patients, notifications, prescriptions, testOrders, feedback] = await Promise.all([
    listTickets(),
    listPatients(),
    listNotifications(),
    listPrescriptions(),
    listTestOrders(),
    listFeedback(),
  ]);

  const snapshot = {
    version: 1,
    exportedAt: new Date().toISOString(),
    counts: {
      tickets: tickets.length,
      patients: patients.length,
      notifications: notifications.length,
      prescriptions: prescriptions.length,
      testOrders: testOrders.length,
      feedback: feedback.length,
    },
    data: {
      tickets,
      patients,
      notifications,
      prescriptions,
      testOrders,
      feedback,
    },
  };

  lastSyncAt = new Date().toISOString();
  lastSyncSummary = { action: "export", ...snapshot.counts, at: lastSyncAt };
  await saveSyncStatus();

  return snapshot;
}

export async function importSyncData(payload) {
  if (!payload || !payload.data) {
    return { ok: false, error: "Invalid sync payload: missing data field" };
  }

  const data = payload.data;
  const results = {
    tickets: { created: 0, updated: 0, skipped: 0 },
    patients: { created: 0, updated: 0, skipped: 0 },
    notifications: { created: 0, updated: 0, skipped: 0 },
    prescriptions: { created: 0, updated: 0, skipped: 0 },
    testOrders: { created: 0, updated: 0, skipped: 0 },
    feedback: { created: 0, updated: 0, skipped: 0 },
  };

  // Import patients first (tickets reference them)
  for (const patient of data.patients ?? []) {
    try {
      const existing = await findPatientById(patient.id);
      if (existing) {
        results.patients.skipped++;
      } else {
        await createPatient(patient);
        results.patients.created++;
      }
    } catch {
      results.patients.skipped++;
    }
  }

  // Import tickets
  for (const ticket of data.tickets ?? []) {
    try {
      const existing = await findTicketById(ticket.id);
      if (existing) {
        await updateTicket(ticket.id, () => ticket);
        results.tickets.updated++;
      } else {
        await createTicket(ticket);
        results.tickets.created++;
      }
    } catch {
      results.tickets.skipped++;
    }
  }

  // Import notifications
  for (const notification of data.notifications ?? []) {
    try {
      const existing = await findNotificationById(notification.id);
      if (existing) {
        await updateNotification(notification.id, () => notification);
        results.notifications.updated++;
      } else {
        await createNotification(notification);
        results.notifications.created++;
      }
    } catch {
      results.notifications.skipped++;
    }
  }

  // Import prescriptions
  for (const prescription of data.prescriptions ?? []) {
    try {
      const existing = await findPrescriptionById(prescription.id);
      if (existing) {
        await updatePrescription(prescription.id, () => prescription);
        results.prescriptions.updated++;
      } else {
        await createPrescription(prescription);
        results.prescriptions.created++;
      }
    } catch {
      results.prescriptions.skipped++;
    }
  }

  // Import test orders
  for (const testOrder of data.testOrders ?? []) {
    try {
      const existing = await findTestOrderById(testOrder.id);
      if (existing) {
        await updateTestOrder(testOrder.id, () => testOrder);
        results.testOrders.updated++;
      } else {
        await createTestOrder(testOrder);
        results.testOrders.created++;
      }
    } catch {
      results.testOrders.skipped++;
    }
  }

  // Import feedback
  for (const fb of data.feedback ?? []) {
    try {
      await createFeedback(fb);
      results.feedback.created++;
    } catch {
      results.feedback.skipped++;
    }
  }

  lastSyncAt = new Date().toISOString();
  lastSyncSummary = { action: "import", results, at: lastSyncAt };
  await saveSyncStatus();

  return { ok: true, results };
}

export async function createBackup() {
  await ensureBackupDir();
  const snapshot = await exportSyncData();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `waitless-backup-${timestamp}.json`;
  const filepath = path.join(BACKUP_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(snapshot, null, 2), "utf8");

  return {
    filename,
    path: filepath,
    exportedAt: snapshot.exportedAt,
    counts: snapshot.counts,
  };
}

export async function getSyncStatus() {
  if (!lastSyncAt) {
    await loadSyncStatus();
  }
  return {
    lastSyncAt,
    lastSyncSummary,
    serverTime: new Date().toISOString(),
  };
}
