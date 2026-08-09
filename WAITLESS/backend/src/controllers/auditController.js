import { listAuditEvents } from "../services/auditService.js";

export async function auditEventsController({ query }) {
  return {
    status: 200,
    body: await listAuditEvents({
      action: query.get("action"),
      actorId: query.get("actorId"),
      entityType: query.get("entityType"),
      from: query.get("from"),
      to: query.get("to"),
      query: query.get("query"),
      limit: query.get("limit"),
    }),
  };
}
