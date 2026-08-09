import {
  getWaitTimePrediction,
  getBottleneckAnalysis,
  processChatbotMessage,
} from "../services/aiService.js";

export async function waitTimePredictionController({ query }) {
  const department = query?.get("department");
  if (!department) {
    return { status: 400, body: { message: "department query parameter is required" } };
  }
  const result = await getWaitTimePrediction(department);
  return { status: 200, body: result };
}

export async function bottleneckAnalysisController() {
  const result = await getBottleneckAnalysis();
  return { status: 200, body: result };
}

export async function chatbotController({ body }) {
  const message = body?.message ?? "";
  const context = {
    department: body?.department,
    ticketCode: body?.ticketCode,
  };
  const result = await processChatbotMessage(message, context);
  return { status: 200, body: result };
}
