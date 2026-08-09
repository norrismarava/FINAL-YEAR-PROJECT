import { readFileSync, writeFileSync } from "node:fs";

const file = "c:\\Users\\norri\\Videos\\DIGITAL QUE SYSTEM\\WAITLESS\\backend\\src\\services\\queueService.js";
let content = readFileSync(file, "utf-8");

// Find the import block from queue.constants.js and add PRESCRIPTION_STATES
const oldImport = "  EMERGENCY_VITAL_THRESHOLDS,\n  PATIENT_CATEGORIES,";
const newImport = "  EMERGENCY_VITAL_THRESHOLDS,\n  PATIENT_CATEGORIES,\n  PRESCRIPTION_STATES,\n  canTransitionPrescriptionState,";

if (content.includes(oldImport)) {
  content = content.replace(oldImport, newImport);
  console.log("Import added");
} else {
  const oldCRLF = oldImport.replace(/\n/g, "\r\n");
  const newCRLF = newImport.replace(/\n/g, "\r\n");
  if (content.includes(oldCRLF)) {
    content = content.replace(oldCRLF, newCRLF);
    console.log("Import added (CRLF)");
  } else {
    console.log("Import NOT FOUND");
  }
}

writeFileSync(file, content, "utf-8");
console.log("Done");
