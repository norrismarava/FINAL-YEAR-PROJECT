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
  return String(value ?? "").replace(/[^\d]/g, "");
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

export async function sendWhatsAppMessage(notification) {
  if (env.whatsAppProvider === "meta-cloud") {
    return sendViaMetaCloud(notification);
  }

  return sendViaMockProvider(notification);
}
