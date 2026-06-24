import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultStateFilePath = fileURLToPath(
  new URL("../../data/queue-state.json", import.meta.url),
);

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseNumber(value, fallback) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseCsvIntegers(value, fallback) {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = value
    .split(",")
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((entry) => Number.isFinite(entry) && entry >= 0);

  return parsed.length ? parsed : fallback;
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function parseJson(value, fallback) {
  if (!value?.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("Failed to parse JSON environment value.", error);
    return fallback;
  }
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  stateFilePath: process.env.STATE_FILE_PATH
    ? path.resolve(process.cwd(), process.env.STATE_FILE_PATH)
    : defaultStateFilePath,
  databaseProvider: process.env.DB_PROVIDER?.trim() || "file",
  databaseHost: process.env.DB_HOST?.trim() || "127.0.0.1",
  databasePort: parseInteger(process.env.DB_PORT, 3306),
  databaseName: process.env.DB_NAME?.trim() || "waitless",
  databaseUser: process.env.DB_USER?.trim() || "waitless",
  databasePassword: process.env.DB_PASSWORD ?? "",
  databaseConnectionLimit: parseInteger(process.env.DB_CONNECTION_LIMIT, 10),
  databaseSeedDemoData: parseBoolean(process.env.DB_SEED_DEMO_DATA, true),
  authSessionTtlMs: parseInteger(process.env.AUTH_SESSION_TTL_MS, 8 * 60 * 60 * 1000),
  staffUsers: parseJson(process.env.STAFF_USERS_JSON, [
    {
      id: "admin",
      username: "admin",
      password: "admin123",
      name: "System Administrator",
      role: "admin",
    },
    {
      id: "reception",
      username: "reception",
      password: "reception123",
      name: "Reception Desk",
      role: "reception",
    },
    {
      id: "triage",
      username: "triage",
      password: "triage123",
      name: "Triage Nurse",
      role: "triage",
    },
    {
      id: "clinician",
      username: "clinician",
      password: "clinician123",
      name: "Clinical Desk",
      role: "clinician",
    },
  ]),
  whatsAppProvider: process.env.WHATSAPP_PROVIDER?.trim() || "mock",
  whatsAppApiBaseUrl:
    process.env.WHATSAPP_API_BASE_URL?.trim() || "https://graph.facebook.com",
  whatsAppApiVersion: process.env.WHATSAPP_API_VERSION?.trim() || "v23.0",
  whatsAppPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || "",
  whatsAppAccessToken: process.env.WHATSAPP_ACCESS_TOKEN?.trim() || "",
  whatsAppAppSecret: process.env.WHATSAPP_APP_SECRET?.trim() || "",
  whatsAppWebhookVerifyToken:
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim() || "",
  whatsAppRequestTimeoutMs: parseInteger(
    process.env.WHATSAPP_REQUEST_TIMEOUT_MS,
    10000,
  ),
  whatsAppRetryDelaysMs: parseCsvIntegers(
    process.env.WHATSAPP_RETRY_DELAYS_MS,
    [15000, 60000, 300000],
  ),
  whatsAppMockDelayMs: parseInteger(process.env.WHATSAPP_MOCK_DELAY_MS, 250),
  whatsAppMockFailureRate: parseNumber(
    process.env.WHATSAPP_MOCK_FAILURE_RATE,
    0,
  ),
  whatsAppTemplateLanguage:
    process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || "en_US",
  whatsAppTemplateQueueRegistered:
    process.env.WHATSAPP_TEMPLATE_QUEUE_REGISTERED?.trim() || "",
  whatsAppTemplateQueueReadySoon:
    process.env.WHATSAPP_TEMPLATE_QUEUE_READY_SOON?.trim() || "",
  whatsAppTemplateQueueCalled:
    process.env.WHATSAPP_TEMPLATE_QUEUE_CALLED?.trim() || "",
};
