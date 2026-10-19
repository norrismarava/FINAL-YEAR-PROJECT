import fs from "node:fs";
import path from "node:path";

const SESSIONS_FILE = path.resolve("data/sessions.json");
const WRITE_DEBOUNCE_MS = 500;

// File-backed session persistence — sessions survive backend restarts
// (nodemon in dev, deploys in prod) instead of kicking every user out.
export function createSessionStore(bucket) {
  let cache = null;
  let writeTimer = null;

  function load() {
    if (cache) {
      return cache;
    }

    cache = new Map();
    try {
      const raw = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf8"));
      const entries = raw?.[bucket] ?? [];
      const now = Date.now();
      for (const [token, session] of entries) {
        if (new Date(session?.expiresAt ?? 0).getTime() > now) {
          cache.set(token, session);
        }
      }
    } catch {
      // No file or unreadable — start with an empty session set.
    }
    return cache;
  }

  function persist() {
    if (writeTimer) {
      return;
    }
    writeTimer = setTimeout(() => {
      writeTimer = null;
      try {
        let existing = {};
        try {
          existing = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf8"));
        } catch {
          existing = {};
        }
        existing[bucket] = [...cache.entries()];
        fs.mkdirSync(path.dirname(SESSIONS_FILE), { recursive: true });
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(existing));
      } catch (error) {
        console.warn(`Session persistence failed: ${error.message}`);
      }
    }, WRITE_DEBOUNCE_MS);
  }

  return { load, persist };
}
