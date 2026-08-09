import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const testDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "waitless-audit-"));
const auditLogPath = path.join(testDirectory, "audit-events.jsonl");

process.env.DB_PROVIDER = "file";
process.env.AUDIT_LOG_PATH = auditLogPath;

const { listAuditEvents, recordAuditEvent } = await import(
  "../src/services/auditService.js"
);

test.after(async () => {
  await fs.rm(testDirectory, { force: true, recursive: true });
});

test("records attributed events in a verified append-only hash chain", async () => {
  const actor = {
    id: "staff-1",
    name: "Admin",
    role: "admin",
    department: "Hospital operations",
  };

  await Promise.all([
    recordAuditEvent({
      actor,
      action: "ticket.status-changed",
      entityType: "ticket",
      entityId: "ticket-1",
      entityLabel: "OPD-201",
      before: { status: "waiting" },
      after: { status: "called" },
    }),
    recordAuditEvent({
      actor,
      action: "ticket.transferred",
      entityType: "ticket",
      entityId: "ticket-2",
      entityLabel: "OPD-202",
      before: { department: "OPD" },
      after: { department: "Radiology" },
    }),
  ]);

  const result = await listAuditEvents({ entityType: "ticket" });

  assert.equal(result.events.length, 2);
  assert.equal(result.integrity.valid, true);
  assert.equal(result.integrity.checked, 2);
  assert.equal(result.events[0].actor.name, "Admin");
  assert.match(result.events[0].eventHash, /^[a-f0-9]{64}$/);
});

test("redacts secret-bearing fields before they reach storage", async () => {
  await recordAuditEvent({
    action: "security.redaction-tested",
    entityType: "system",
    metadata: {
      password: "PlaintextMustNotSurvive",
      nested: {
        accessToken: "SensitiveToken",
        safeField: "kept",
      },
    },
  });

  const result = await listAuditEvents({ action: "security.redaction-tested" });
  const [event] = result.events;

  assert.equal(event.metadata.password, "[REDACTED]");
  assert.equal(event.metadata.nested.accessToken, "[REDACTED]");
  assert.equal(event.metadata.nested.safeField, "kept");

  const storedText = await fs.readFile(auditLogPath, "utf8");
  assert.doesNotMatch(storedText, /PlaintextMustNotSurvive|SensitiveToken/);
});

test("detects a modified historical event", async () => {
  const contents = await fs.readFile(auditLogPath, "utf8");
  await fs.writeFile(
    auditLogPath,
    contents.replace("ticket.status-changed", "ticket.status-forged"),
    "utf8",
  );

  const result = await listAuditEvents();
  assert.equal(result.integrity.valid, false);
});

test("protects the audit endpoint with the admin guard", async () => {
  const source = await fs.readFile(new URL("../src/index.js", import.meta.url), "utf8");

  assert.match(
    source,
    /"GET",\s*"\/api\/audit-events",\s*withStaffAuth\(\["admin"\],\s*auditEventsController\)/s,
  );
});
