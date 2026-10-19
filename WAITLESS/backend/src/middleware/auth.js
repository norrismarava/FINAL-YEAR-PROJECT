import { requireStaffSession } from "../services/authService.js";
import { requirePatientSession } from "../services/patientAuthService.js";

const roleMapping = {
  reception: "receptionist",
  triage: "nurse",
  clinician: "doctor",
};

export function withStaffAuth(allowedRoles, handler) {
  return (context) => {
    const expandedRoles = [
      ...allowedRoles,
      ...allowedRoles.map((role) => roleMapping[role]).filter(Boolean),
    ];
    const session = requireStaffSession(context.req, expandedRoles);
    try {
      context.res?.setHeader?.("x-session-expires", session.expiresAt);
    } catch {
      // best-effort header — never fail the request over it
    }
    return handler({
      ...context,
      staff: session.user,
      session,
    });
  };
}

export function withPatientAuth(handler) {
  return (context) => {
    const session = requirePatientSession(context.req);
    try {
      context.res?.setHeader?.("x-session-expires", session.expiresAt);
    } catch {
      // best-effort header — never fail the request over it
    }
    return handler({
      ...context,
      patientUser: session.user,
      patientSession: session,
    });
  };
}
