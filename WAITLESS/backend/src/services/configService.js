import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEPARTMENTS,
  DEPARTMENT_TOKEN_PREFIX,
  EMERGENCY_VITAL_THRESHOLDS,
  DEPARTMENT_ROUTING_RULES,
} from "../modules/queue/queue.constants.js";

const DEFAULT_CONFIG_PATH = fileURLToPath(
  new URL("../../data/runtime-config.json", import.meta.url),
);

const CONFIG_PATH = process.env.RUNTIME_CONFIG_PATH
  ? path.resolve(process.cwd(), process.env.RUNTIME_CONFIG_PATH)
  : DEFAULT_CONFIG_PATH;

const DEFAULT_CONFIG = {
  triageReassessmentThresholdsMinutes: {
    red: 10,
    yellow: 30,
  },
  etaMinutesPerPatientAhead: 7,
  etaBaselineMinutes: 3,
  etaActiveDepartmentBonusMinutes: 4,
  departments: [...DEPARTMENTS],
  departmentTokenPrefixes: { ...DEPARTMENT_TOKEN_PREFIX },
  emergencyVitalThresholds: JSON.parse(JSON.stringify(EMERGENCY_VITAL_THRESHOLDS)),
  departmentRoutingRules: JSON.parse(JSON.stringify(DEPARTMENT_ROUTING_RULES)),
  notificationRetryDelaysMs: [15000, 60000, 300000],
  missedRecallGracePeriodMinutes: 5,
  oiPrivacyMode: true,
  updatedAt: null,
};

let cachedConfig = null;
let lastLoadAttempt = 0;
const LOAD_COOLDOWN_MS = 2000;

async function ensureDataDir() {
  const dir = path.dirname(CONFIG_PATH);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function loadConfig() {
  const now = Date.now();
  if (cachedConfig && now - lastLoadAttempt < LOAD_COOLDOWN_MS) {
    return cachedConfig;
  }
  lastLoadAttempt = now;

  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    cachedConfig = mergeWithDefaults(parsed);
  } catch {
    cachedConfig = structuredClone(DEFAULT_CONFIG);
    cachedConfig.updatedAt = null;
  }
  return cachedConfig;
}

function mergeWithDefaults(partial) {
  return {
    ...structuredClone(DEFAULT_CONFIG),
    ...partial,
    triageReassessmentThresholdsMinutes: {
      ...DEFAULT_CONFIG.triageReassessmentThresholdsMinutes,
      ...(partial.triageReassessmentThresholdsMinutes ?? {}),
    },
    departments: Array.isArray(partial.departments) && partial.departments.length > 0
      ? [...partial.departments]
      : [...DEFAULT_CONFIG.departments],
    departmentTokenPrefixes: {
      ...DEFAULT_CONFIG.departmentTokenPrefixes,
      ...(partial.departmentTokenPrefixes ?? {}),
    },
    emergencyVitalThresholds: {
      ...DEFAULT_CONFIG.emergencyVitalThresholds,
      ...(partial.emergencyVitalThresholds ?? {}),
    },
    departmentRoutingRules: Array.isArray(partial.departmentRoutingRules)
      ? [...partial.departmentRoutingRules]
      : [...DEFAULT_CONFIG.departmentRoutingRules],
    notificationRetryDelaysMs: Array.isArray(partial.notificationRetryDelaysMs) && partial.notificationRetryDelaysMs.length > 0
      ? [...partial.notificationRetryDelaysMs]
      : [...DEFAULT_CONFIG.notificationRetryDelaysMs],
    oiPrivacyMode: typeof partial.oiPrivacyMode === "boolean" ? partial.oiPrivacyMode : DEFAULT_CONFIG.oiPrivacyMode,
  };
}

export async function getRuntimeConfig() {
  return loadConfig();
}

export async function getTriageReassessmentThresholds() {
  const config = await loadConfig();
  return config.triageReassessmentThresholdsMinutes;
}

export async function getEtaParameters() {
  const config = await loadConfig();
  return {
    minutesPerPatientAhead: config.etaMinutesPerPatientAhead,
    baselineMinutes: config.etaBaselineMinutes,
    activeDepartmentBonusMinutes: config.etaActiveDepartmentBonusMinutes,
  };
}

export async function getConfiguredDepartments() {
  const config = await loadConfig();
  return config.departments;
}

export async function getConfiguredEmergencyThresholds() {
  const config = await loadConfig();
  return config.emergencyVitalThresholds;
}

export async function getConfiguredRoutingRules() {
  const config = await loadConfig();
  return config.departmentRoutingRules;
}

export async function getConfiguredTokenPrefixes() {
  const config = await loadConfig();
  return config.departmentTokenPrefixes;
}

export async function getNotificationRetryDelays() {
  const config = await loadConfig();
  return config.notificationRetryDelaysMs;
}

export async function getMissedRecallGracePeriod() {
  const config = await loadConfig();
  return config.missedRecallGracePeriodMinutes;
}

export async function getOIPrivacyMode() {
  const config = await loadConfig();
  return config.oiPrivacyMode !== false;
}

function validateConfigUpdate(partial) {
  const errors = [];

  if (partial.triageReassessmentThresholdsMinutes) {
    const t = partial.triageReassessmentThresholdsMinutes;
    if (t.red != null && (!Number.isFinite(t.red) || t.red < 1)) {
      errors.push("triageReassessmentThresholdsMinutes.red must be a positive number");
    }
    if (t.yellow != null && (!Number.isFinite(t.yellow) || t.yellow < 1)) {
      errors.push("triageReassessmentThresholdsMinutes.yellow must be a positive number");
    }
  }

  if (partial.etaMinutesPerPatientAhead != null && (!Number.isFinite(partial.etaMinutesPerPatientAhead) || partial.etaMinutesPerPatientAhead < 0)) {
    errors.push("etaMinutesPerPatientAhead must be a non-negative number");
  }

  if (partial.departments != null) {
    if (!Array.isArray(partial.departments) || partial.departments.length === 0) {
      errors.push("departments must be a non-empty array");
    }
  }

  if (partial.notificationRetryDelaysMs != null) {
    if (!Array.isArray(partial.notificationRetryDelaysMs) || partial.notificationRetryDelaysMs.some((d) => !Number.isFinite(d) || d < 0)) {
      errors.push("notificationRetryDelaysMs must be an array of non-negative numbers");
    }
  }

  if (partial.missedRecallGracePeriodMinutes != null && (!Number.isFinite(partial.missedRecallGracePeriodMinutes) || partial.missedRecallGracePeriodMinutes < 0)) {
    errors.push("missedRecallGracePeriodMinutes must be a non-negative number");
  }

  return errors;
}

export async function updateRuntimeConfig(partial) {
  const errors = validateConfigUpdate(partial);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const current = await loadConfig();
  const updated = mergeWithDefaults({ ...current, ...partial });
  updated.updatedAt = new Date().toISOString();

  await ensureDataDir();
  await fs.writeFile(CONFIG_PATH, JSON.stringify(updated, null, 2), "utf8");

  cachedConfig = updated;
  return { ok: true, config: updated };
}

export async function resetRuntimeConfig() {
  const reset = structuredClone(DEFAULT_CONFIG);
  reset.updatedAt = new Date().toISOString();

  await ensureDataDir();
  await fs.writeFile(CONFIG_PATH, JSON.stringify(reset, null, 2), "utf8");

  cachedConfig = reset;
  return { ok: true, config: reset };
}
