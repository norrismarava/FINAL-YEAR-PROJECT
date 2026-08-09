import { DEPARTMENTS } from "../modules/queue/queue.constants.js";
import { listTickets, listPrescriptions, listTestOrders } from "../repositories/queueRepository.js";

function enrichTicket(ticket) {
  const now = Date.now();
  const registeredAt = new Date(ticket.registeredAt).getTime();
  const waitMinutes = ticket.status === "waiting"
    ? Math.max(0, Math.round((now - registeredAt) / 60000))
    : 0;
  return { ...ticket, waitMinutes };
}

async function getLiveTickets() {
  return (await listTickets()).map(enrichTicket);
}

export async function getWaitTimePrediction(department) {
  const tickets = await getLiveTickets();
  const deptTickets = tickets.filter((t) => t.department === department);

  const waiting = deptTickets.filter((t) => t.status === "waiting");
  const inService = deptTickets.filter((t) => t.status === "called" || t.status === "in-service");
  const completed = deptTickets.filter((t) => t.status === "completed" && t.serviceStartedAt && t.completedAt);

  const serviceDurations = completed.map((t) =>
    Math.max(1, Math.round((new Date(t.completedAt).getTime() - new Date(t.serviceStartedAt).getTime()) / 60000)),
  );

  const avgServiceTime = serviceDurations.length
    ? Math.round(serviceDurations.reduce((a, b) => a + b, 0) / serviceDurations.length)
    : 10;

  const patientsAhead = waiting.length + inService.length;

  const predictedWaitMinutes = Math.round(
    avgServiceTime * patientsAhead * 0.8 + avgServiceTime * 0.5,
  );

  const confidence = completed.length >= 10 ? "high" : completed.length >= 3 ? "medium" : "low";

  const byPriority = {};
  for (const t of waiting) {
    const p = t.priority ?? "green";
    if (!byPriority[p]) byPriority[p] = { count: 0, estimatedWait: 0 };
    byPriority[p].count++;
  }

  let cumulativeWait = 0;
  const sortedPriorities = ["red", "yellow", "green"].filter((p) => byPriority[p]);
  for (const p of sortedPriorities) {
    cumulativeWait += byPriority[p].count * avgServiceTime;
    byPriority[p].estimatedWait = cumulativeWait;
  }

  return {
    department,
    patientsAhead,
    avgServiceTimeMinutes: avgServiceTime,
    predictedWaitMinutes: Math.max(1, predictedWaitMinutes),
    confidence,
    byPriority,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function getBottleneckAnalysis() {
  const tickets = await getLiveTickets();
  const prescriptions = await listPrescriptions();
  const testOrders = await listTestOrders();

  const bottlenecks = [];

  for (const dept of DEPARTMENTS) {
    const deptTickets = tickets.filter((t) => t.department === dept);
    const waiting = deptTickets.filter((t) => t.status === "waiting");
    const inService = deptTickets.filter((t) => t.status === "called" || t.status === "in-service");
    const completed = deptTickets.filter((t) => t.status === "completed");
    const missed = deptTickets.filter((t) => t.status === "missed");

    const serviceDurations = completed
      .filter((t) => t.serviceStartedAt && t.completedAt)
      .map((t) => Math.max(1, Math.round((new Date(t.completedAt).getTime() - new Date(t.serviceStartedAt).getTime()) / 60000)));

    const avgService = serviceDurations.length
      ? Math.round(serviceDurations.reduce((a, b) => a + b, 0) / serviceDurations.length)
      : 0;

    const avgWait = waiting.length
      ? Math.round(waiting.reduce((a, t) => a + (t.waitMinutes ?? 0), 0) / waiting.length)
      : 0;

    const missedRate = deptTickets.length
      ? Math.round((missed.length / deptTickets.length) * 100)
      : 0;

    const load = waiting.length + inService.length;
    const efficiency = completed.length > 0 && load > 0
      ? Math.round((completed.length / (completed.length + load)) * 100)
      : 100;

    let bottleneckScore = 0;
    const factors = [];

    if (avgWait > 30) {
      bottleneckScore += 25;
      factors.push(`High average wait time (${avgWait}m)`);
    }
    if (missedRate > 15) {
      bottleneckScore += 20;
      factors.push(`High missed rate (${missedRate}%)`);
    }
    if (waiting.length > 10) {
      bottleneckScore += 20;
      factors.push(`Large waiting queue (${waiting.length} patients)`);
    }
    if (avgService > 20) {
      bottleneckScore += 15;
      factors.push(`Long service time (${avgService}m avg)`);
    }
    if (efficiency < 50) {
      bottleneckScore += 20;
      factors.push(`Low throughput efficiency (${efficiency}%)`);
    }

    let severity = "none";
    if (bottleneckScore >= 60) severity = "critical";
    else if (bottleneckScore >= 40) severity = "high";
    else if (bottleneckScore >= 20) severity = "moderate";
    else if (bottleneckScore > 0) severity = "low";

    bottlenecks.push({
      department: dept,
      bottleneckScore,
      severity,
      factors,
      waiting: waiting.length,
      inService: inService.length,
      completed: completed.length,
      missed: missed.length,
      avgWaitMinutes: avgWait,
      avgServiceMinutes: avgService,
      missedRate,
      efficiency,
      recommendation: severity === "critical" || severity === "high"
        ? "Consider reallocating staff or opening additional service points"
        : severity === "moderate"
          ? "Monitor closely; may need additional resources soon"
          : "Operating normally",
    });
  }

  bottlenecks.sort((a, b) => b.bottleneckScore - a.bottleneckScore);

  const critical = bottlenecks.filter((b) => b.severity === "critical" || b.severity === "high");

  const rxPending = prescriptions.filter((p) => p.state !== "collected" && p.state !== "cancelled").length;
  const labPending = testOrders.filter((o) => o.state !== "result-ready" && o.state !== "cancelled").length;

  return {
    bottlenecks,
    criticalBottlenecks: critical,
    pharmacyBacklog: rxPending,
    labBacklog: labPending,
    summary: critical.length > 0
      ? `${critical.length} department(s) experiencing significant bottlenecks`
      : "No critical bottlenecks detected",
    lastUpdatedAt: new Date().toISOString(),
  };
}

const CHATBOT_RESPONSES = [
  {
    keywords: ["wait", "long", "queue", "eta", "how long"],
    respond: (ctx) => {
      if (ctx.predictedWait !== undefined) {
        return `Based on current queue analysis, the estimated wait time for ${ctx.department ?? "your department"} is approximately ${ctx.predictedWait} minutes. This is calculated from the average service time and number of patients ahead.`;
      }
      return "To check your estimated wait time, please provide your ticket code or select a department. You can also use the Track page to monitor your queue position in real-time.";
    },
  },
  {
    keywords: ["ticket", "code", "track", "status", "where"],
    respond: () => "You can track your ticket status by visiting the Track page and entering your ticket code. The system will show your current position, estimated wait time, and status in real-time.",
  },
  {
    keywords: ["register", "sign up", "new patient", "book"],
    respond: () => "To register as a new patient, visit the Register page. Staff at the reception desk can create your ticket. If you're an existing patient, you can check in at the kiosk using your patient number or phone number.",
  },
  {
    keywords: ["prescription", "pharmacy", "medication", "medicine", "drugs"],
    respond: () => "Prescription status can be tracked through your ticket. Once your prescription is ready, you'll receive a WhatsApp notification. Visit the Pharmacy department to collect your medication with your ticket code.",
  },
  {
    keywords: ["lab", "test", "result", "blood", "sample"],
    respond: () => "Lab test results are updated in real-time. When your results are ready, you'll receive a notification. You can track your test order status on the Track page using your ticket code.",
  },
  {
    keywords: ["appointment", "follow up", "followup", "schedule", "booking"],
    respond: () => "Appointments can be booked through the patient portal. Follow-up appointments are linked to your completed visits. You can view and manage your appointments in the Appointments section.",
  },
  {
    keywords: ["emergency", "urgent", "critical", "casualty"],
    respond: () => "If you have a medical emergency, please proceed to the Casualty/Triage department immediately. Emergency cases are prioritized and seen first. Do not wait in the regular queue.",
  },
  {
    keywords: ["hours", "open", "close", "time", "when"],
    respond: () => "The hospital operates during standard business hours (8:00 AM to 5:00 PM). Emergency services are available 24/7. Please check with reception for specific department hours.",
  },
  {
    keywords: ["contact", "phone", "call", "number"],
    respond: () => "You can contact the hospital through the reception desk. For urgent medical matters, please visit the Casualty department directly.",
  },
  {
    keywords: ["hello", "hi", "hey", "greetings"],
    respond: () => "Hello! I'm the WaitLess assistant. I can help you with information about queue wait times, ticket tracking, prescriptions, lab tests, appointments, and more. How can I assist you today?",
  },
  {
    keywords: ["help", "what can you do", "options"],
    respond: () => "I can help you with:\n• Estimated wait times and queue status\n• Ticket tracking information\n• Prescription and pharmacy details\n• Lab test information\n• Appointment scheduling\n• Emergency guidance\n• Hospital hours and contact info",
  },
];

export async function processChatbotMessage(message, context = {}) {
  const lowerMessage = (message ?? "").toLowerCase().trim();

  if (!lowerMessage) {
    return {
      response: "Please type a message and I'll do my best to help you.",
      intent: "empty",
    };
  }

  for (const entry of CHATBOT_RESPONSES) {
    const matched = entry.keywords.some((kw) => lowerMessage.includes(kw));
    if (matched) {
      const intent = entry.keywords[0];
      return {
        response: entry.respond(context),
        intent,
      };
    }
  }

  return {
    response: "I'm not sure how to help with that specific question. I can assist with wait times, ticket tracking, prescriptions, lab tests, appointments, and emergency guidance. Try asking about one of those topics.",
    intent: "unknown",
  };
}
