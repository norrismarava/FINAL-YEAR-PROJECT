import { readFileSync, writeFileSync } from "node:fs";

// Add prescription controllers
const ctrlFile = "c:\\Users\\norri\\Videos\\DIGITAL QUE SYSTEM\\WAITLESS\\backend\\src\\controllers\\queueController.js";
let ctrl = readFileSync(ctrlFile, "utf-8");

// Add imports
if (!ctrl.includes("createPrescriptionRecord")) {
  ctrl = ctrl.replace(
    "  getETAEstimates,\n  getQueueBoard,\n  getTicketETA,\n  getTickets,",
    "  createPrescriptionRecord,\n  getETAEstimates,\n  getPrescriptions,\n  getPrescriptionsForTicket,\n  getPrescriptionSummary,\n  getQueueBoard,\n  getTicketETA,\n  getTickets,",
  );

  ctrl = ctrl.replace(
    "  updatePatientStatus,\n} from \"../services/queueService.js\";",
    "  updatePatientStatus,\n  updatePrescriptionState,\n} from \"../services/queueService.js\";",
  );

  // Add prescription controllers at end of file
  const controllers = `
export async function prescriptionsListController({ query, staff }) {
  const filters = {};
  if (query?.get("ticketId")) filters.ticketId = query.get("ticketId");
  if (query?.get("state")) filters.state = query.get("state");
  return {
    status: 200,
    body: { prescriptions: await getPrescriptions(filters) },
  };
}

export async function ticketPrescriptionsController({ params }) {
  return {
    status: 200,
    body: { prescriptions: await getPrescriptionsForTicket(params.id) },
  };
}

export async function createPrescriptionController({ params, body, staff }) {
  return {
    status: 201,
    body: {
      prescription: await createPrescriptionRecord({
        ticketId: params.id,
        items: body?.items,
        notes: body?.notes,
      }, staff),
    },
  };
}

export async function updatePrescriptionStateController({ params, body, staff }) {
  return {
    status: 200,
    body: {
      prescription: await updatePrescriptionState(params.id, body?.state, staff),
    },
  };
}

export async function prescriptionSummaryController() {
  return {
    status: 200,
    body: await getPrescriptionSummary(),
  };
}
`;

  ctrl += controllers;
  writeFileSync(ctrlFile, ctrl, "utf-8");
  console.log("Prescription controllers added");
} else {
  console.log("Prescription controllers already exist");
}

// Add routes to index.js
const indexFile = "c:\\Users\\norri\\Videos\\DIGITAL QUE SYSTEM\\WAITLESS\\backend\\src\\index.js";
let index = readFileSync(indexFile, "utf-8");

if (!index.includes("prescriptionsListController")) {
  // Add imports
  index = index.replace(
    "  etaEstimatesController,\n  healthController,",
    "  etaEstimatesController,\n  healthController,\n  prescriptionsListController,\n  ticketPrescriptionsController,\n  createPrescriptionController,\n  updatePrescriptionStateController,\n  prescriptionSummaryController,",
  );

  // Add routes after ETA routes
  index = index.replace(
    'router.register("GET", "/api/tickets/:id/eta", ticketETAController);',
    `router.register("GET", "/api/tickets/:id/eta", ticketETAController);
router.register("GET", "/api/prescriptions", withStaffAuth(["clinician", "triage"], prescriptionsListController));
router.register("GET", "/api/prescriptions/summary", withStaffAuth(["clinician", "triage"], prescriptionSummaryController));
router.register("GET", "/api/tickets/:id/prescriptions", withStaffAuth(["clinician", "triage"], ticketPrescriptionsController));
router.register("POST", "/api/tickets/:id/prescriptions", withStaffAuth(["clinician"], createPrescriptionController));
router.register("PATCH", "/api/prescriptions/:id/state", withStaffAuth(["clinician", "triage"], updatePrescriptionStateController));`,
  );

  writeFileSync(indexFile, index, "utf-8");
  console.log("Prescription routes added");
} else {
  console.log("Prescription routes already exist");
}

console.log("Done");
