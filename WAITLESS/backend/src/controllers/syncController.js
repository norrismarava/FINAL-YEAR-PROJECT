import {
  exportSyncData,
  importSyncData,
  createBackup,
  getSyncStatus,
} from "../services/syncService.js";

export async function syncExportController() {
  return {
    status: 200,
    body: await exportSyncData(),
  };
}

export async function syncImportController({ body }) {
  const result = await importSyncData(body);
  if (!result.ok) {
    return {
      status: 400,
      body: { message: result.error },
    };
  }
  return {
    status: 200,
    body: { results: result.results },
  };
}

export async function syncBackupController() {
  return {
    status: 201,
    body: await createBackup(),
  };
}

export async function syncStatusController() {
  return {
    status: 200,
    body: await getSyncStatus(),
  };
}
