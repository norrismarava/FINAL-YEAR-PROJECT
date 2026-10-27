import { env } from "../config/env.js";

class DeliveryError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "DeliveryError";
    this.code = options.code ?? "DELIVERY_FAILED";
    this.details = options.details ?? null;
  }
}

function sleep(delayMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function sanitizePhoneNumber(value) {
  // Normalise to E.164 digits for Meta — local "0788686453" becomes
  // "263788686453" using the configured country code.
  let digits = String(value ?? "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  const countryCode = env.whatsAppDefaultCountryCode;
  if (digits.startsWith("0") && countryCode) {
    digits = `${countryCode}${digits.slice(1)}`;
  } else if (countryCode && !digits.startsWith(countryCode) && digits.length <= 10) {
    digits = `${countryCode}${digits}`;
  }
  return digits;
}

function resolveTemplateName(notification) {
  const templateNames = {
    "queue-registered": env.whatsAppTemplateQueueRegistered,
    "queue-ready-soon": env.whatsAppTemplateQueueReadySoon,
    "queue-called": env.whatsAppTemplateQueueCalled,
  };

  return templateNames[notification.type] ?? "";
}

function buildTemplateParameters(notification) {
  return {
    "queue-registered": [
      notification.patientName,
      notification.department,
      notification.ticket,
    ],
    "queue-ready-soon": [
      notification.patientName,
      notification.department,
      notification.ticket,
    ],
    "queue-called": [
      notification.patientName,
      notification.department,
      notification.ticket,
    ],
  }[notification.type] ?? [notification.patientName, notification.ticket];
}

function buildMetaPayload(notification) {
  const templateName = resolveTemplateName(notification);
  const to = sanitizePhoneNumber(notification.destination || notification.recipient);

  if (!to) {
    throw new DeliveryError("Patient phone number is missing or invalid.", {
      code: "INVALID_PHONE",
    });
  }

  if (templateName) {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: env.whatsAppTemplateLanguage,
        },
        components: [
          {
            type: "body",
            parameters: buildTemplateParameters(notification).map((value) => ({
              type: "text",
              text: String(value),
            })),
          },
        ],
      },
    };
  }

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      preview_url: false,
      body: notification.message,
    },
  };
}

async function sendViaMockProvider(notification) {
  await sleep(env.whatsAppMockDelayMs);

  if (Math.random() < env.whatsAppMockFailureRate) {
    throw new DeliveryError("Simulated WhatsApp delivery failure.", {
      code: "MOCK_DELIVERY_FAILED",
    });
  }

  return {
    provider: "mock",
    providerMessageId: `mock-${notification.id}-${Date.now()}`,
    status: "delivered",
  };
}

async function sendViaMetaCloud(notification) {
  if (!env.whatsAppAccessToken || !env.whatsAppPhoneNumberId) {
    throw new DeliveryError(
      "Meta WhatsApp Cloud API is missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID.",
      {
        code: "CONFIG_MISSING",
      },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    env.whatsAppRequestTimeoutMs,
  );

  try {
    const response = await fetch(
      `${env.whatsAppApiBaseUrl}/${env.whatsAppApiVersion}/${env.whatsAppPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.whatsAppAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildMetaPayload(notification)),
        signal: controller.signal,
      },
    );
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new DeliveryError(
        payload?.error?.message || "Meta WhatsApp Cloud API request failed.",
        {
          code: payload?.error?.code
            ? String(payload.error.code)
            : "META_REQUEST_FAILED",
          details: payload,
        },
      );
    }

    return {
      provider: "meta-cloud",
      providerMessageId:
        payload?.messages?.[0]?.id ?? payload?.message_id ?? null,
      status: "sent",
      details: payload,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new DeliveryError("Meta WhatsApp Cloud API request timed out.", {
        code: "REQUEST_TIMEOUT",
      });
    }

    if (error instanceof DeliveryError) {
      throw error;
    }

    throw new DeliveryError(error.message || "WhatsApp delivery failed.", {
      code: "META_DELIVERY_FAILED",
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------- whatsapp-web.js provider (personal/secondary number) ----------
// Runs a headless WhatsApp Web session on the sender's own number. The first
// start prints a QR code in the terminal — scan it once in WhatsApp >
// Linked devices, and LocalAuth persists the session in .wwebjs_auth.

let webClientPromise = null;

async function getWebClient() {
  if (webClientPromise) return webClientPromise;

  webClientPromise = (async () => {
    const wwebjs = await import("whatsapp-web.js");
    const { Client, LocalAuth } = wwebjs.default ?? wwebjs;
    const qrcodeMod = await import("qrcode-terminal");
    const qrcode = qrcodeMod.default ?? qrcodeMod;

    const client = new Client({
      authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    });

    const ready = new Promise((resolve, reject) => {
      client.on("qr", (qr) => {
        console.log("[whatsapp] Scan this QR code in WhatsApp > Linked devices:");
        qrcode.generate(qr, { small: true });
        import("qrcode")
          .then((QRCode) => QRCode.toFile("whatsapp-qr.png", qr, { width: 480, margin: 3 }))
          .then(() => console.log("[whatsapp] QR also saved to backend/whatsapp-qr.png"))
          .catch(() => {});
      });
      client.on("ready", () => {
        console.log("[whatsapp] whatsapp-web.js session ready — sending from your number.");
        resolve();
      });
      client.on("auth_failure", (msg) => {
        webClientPromise = null;
        reject(new DeliveryError(`WhatsApp Web auth failed: ${msg}`, { code: "WWEBJS_AUTH_FAILED" }));
      });
      client.on("disconnected", () => {
        webClientPromise = null;
        console.warn("[whatsapp] Session disconnected — next send will reinitialize.");
      });
    });

    client.initialize();
    await ready;
    return client;
  })();

  return webClientPromise;
}

async function sendViaWhatsAppWeb(notification) {
  const to = sanitizePhoneNumber(notification.destination || notification.recipient);
  if (!to) {
    throw new DeliveryError("Patient phone number is missing or invalid.", {
      code: "INVALID_PHONE",
    });
  }

  const body =
    notification.message ||
    `WaitLess: ticket ${notification.ticket} (${notification.department}).`;

  try {
    const client = await getWebClient();
    const msg = await client.sendMessage(`${to}@c.us`, body);
    return {
      provider: "whatsapp-web",
      providerMessageId: msg?.id?.id ?? null,
      status: "sent",
    };
  } catch (error) {
    if (error instanceof DeliveryError) throw error;
    throw new DeliveryError(error.message || "WhatsApp Web delivery failed.", {
      code: "WWEBJS_DELIVERY_FAILED",
    });
  }
}

export function initWhatsAppSession() {
  if (env.whatsAppProvider !== "whatsapp-web") return;
  getWebClient().catch((error) => {
    console.warn(`[whatsapp] Failed to start session: ${error.message}`);
    webClientPromise = null;
  });
}

export async function sendWhatsAppMessage(notification) {
  if (env.whatsAppProvider === "meta-cloud") {
    return sendViaMetaCloud(notification);
  }

  if (env.whatsAppProvider === "whatsapp-web") {
    return sendViaWhatsAppWeb(notification);
  }

  return sendViaMockProvider(notification);
}
