import {
  getRuntimeConfig,
  updateRuntimeConfig,
  resetRuntimeConfig,
} from "../services/configService.js";

export async function getConfigController() {
  return {
    status: 200,
    body: await getRuntimeConfig(),
  };
}

export async function updateConfigController({ body }) {
  const result = await updateRuntimeConfig(body ?? {});
  if (!result.ok) {
    return {
      status: 400,
      body: { message: "Invalid configuration", errors: result.errors },
    };
  }
  return {
    status: 200,
    body: { config: result.config },
  };
}

export async function resetConfigController() {
  const result = await resetRuntimeConfig();
  return {
    status: 200,
    body: { config: result.config },
  };
}
