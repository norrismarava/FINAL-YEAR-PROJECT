import { requireStaffSession } from "../services/authService.js";

export function withStaffAuth(allowedRoles, handler) {
  return (context) => {
    const session = requireStaffSession(context.req, allowedRoles);
    return handler({
      ...context,
      staff: session.user,
      session,
    });
  };
}
