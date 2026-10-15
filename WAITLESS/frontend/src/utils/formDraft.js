import { useCallback, useEffect, useRef, useState } from "react";

const DB_NAME = "waitless_drafts";
const DB_VERSION = 1;
const STORE_NAME = "form_drafts";

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
  });
}

/**
 * Save a form draft to IndexedDB.
 * @param {string} key, unique form identifier (e.g. "triage-assessment")
 * @param {object} data, form data to save
 */
export async function saveDraft(key, data) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({
      key,
      data,
      savedAt: new Date().toISOString(),
    });
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Load a form draft from IndexedDB.
 * @param {string} key, unique form identifier
 * @returns {{ data: object, savedAt: string } | null}
 */
export async function loadDraft(key) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    return new Promise((resolve) => {
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Delete a form draft from IndexedDB.
 * @param {string} key, unique form identifier
 */
export async function clearDraft(key) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * React hook for auto-saving form data to IndexedDB with debounced writes.
 *
 * @param {string} key, unique form identifier
 * @param {object} data, form data (must be JSON-serializable)
 * @param {number} [intervalMs=3000], debounce interval
 * @returns {{ draft: { data: object, savedAt: string } | null, hasDraft: boolean, restore: () => void, clear: () => void }}
 */
export function useFormDraft(key, data, intervalMs = 3000) {
  const [draft, setDraft] = useState(null);
  const dataRef = useRef(data);
  const timerRef = useRef(null);

  useEffect(() => {
    dataRef.current = data;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveDraft(key, dataRef.current);
    }, intervalMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key, data, intervalMs]);

  useEffect(() => {
    loadDraft(key).then((result) => setDraft(result));
  }, [key]);

  const restore = useCallback(() => {
    if (draft?.data) {
      return draft.data;
    }
    return null;
  }, [draft]);

  const clear = useCallback(() => {
    clearDraft(key).then(() => setDraft(null));
  }, [key]);

  return {
    draft,
    hasDraft: Boolean(draft?.data && Object.keys(draft.data).some((k) => draft.data[k])),
    restore,
    clear,
  };
}
