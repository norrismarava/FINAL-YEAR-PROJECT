import {
  getServiceStreams,
  getStreamStates,
  createOIClinicVisit,
  getOIClinicVisits,
  updateOIClinicVisitState,
  getOIClinicSummary,
} from "../services/oiClinicService.js";

export async function oiStreamsController() {
  return {
    status: 200,
    body: { streams: getServiceStreams(), states: getStreamStates() },
  };
}

export async function oiVisitsController({ query }) {
  const filters = {};
  if (query?.get("streamId")) filters.streamId = query.get("streamId");
  if (query?.get("state")) filters.state = query.get("state");
  if (query?.get("ticketId")) filters.ticketId = query.get("ticketId");
  return {
    status: 200,
    body: { visits: await getOIClinicVisits(filters) },
  };
}

export async function oiCreateVisitController({ params, body, staff }) {
  const result = await createOIClinicVisit(
    { ticketId: params.id, streamId: body?.streamId, notes: body?.notes },
    staff,
  );
  if (!result.ok) {
    return { status: 400, body: { message: result.error } };
  }
  return { status: 201, body: { visit: result.visit } };
}

export async function oiUpdateVisitController({ params, body, staff }) {
  const result = await updateOIClinicVisitState(
    params.id,
    body?.state,
    { referredTo: body?.referredTo },
    staff,
  );
  if (!result.ok) {
    return { status: 400, body: { message: result.error } };
  }
  return { status: 200, body: { visit: result.visit } };
}

export async function oiSummaryController() {
  return {
    status: 200,
    body: await getOIClinicSummary(),
  };
}
