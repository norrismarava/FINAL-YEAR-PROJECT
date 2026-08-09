import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import {
  getPasswordPolicyError,
  hashPassword,
  verifyPassword,
} from "../src/services/passwordSecurity.js";

test("staff passwords are stored as bcrypt hashes", async () => {
  const password = "SecurePass!42";
  const passwordHash = await hashPassword(password);

  assert.notEqual(passwordHash, password);
  assert.match(passwordHash, /^\$2[abxy]\$12\$/);
  assert.equal(await verifyPassword(password, passwordHash), true);
  assert.equal(await verifyPassword("WrongPass!42", passwordHash), false);
});

test("plaintext values are never accepted as password hashes", async () => {
  assert.equal(await verifyPassword("SecurePass!42", "SecurePass!42"), false);
});

test("new staff passwords must meet the server-side policy", () => {
  assert.match(getPasswordPolicyError("short"), /at least 10 characters/i);
  assert.match(
    getPasswordPolicyError("alllowercaseletters"),
    /at least three/i,
  );
  assert.equal(getPasswordPolicyError("SecurePass!42"), null);
});

test("the staff registration endpoint is protected by the admin guard", async () => {
  const source = await fs.readFile(
    new URL("../src/index.js", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /"POST",\s*"\/api\/auth\/staff-register",\s*withStaffAuth\(\["admin"\],\s*staffRegisterController\)/s,
  );
  assert.doesNotMatch(
    source,
    /router\.register\("POST",\s*"\/api\/auth\/staff-register",\s*staffRegisterController\)/s,
  );
});
