import {
  getSessionFromRequest,
  loginStaff,
  registerStaff,
  requestPasswordReset,
  resetPassword,
} from "../services/authService.js";
import { HttpError } from "../utils/http.js";
import { recordAuditEventSafely } from "../services/auditService.js";

export async function loginController({ body }) {
  const session = await loginStaff({
    username: body?.username,
    password: body?.password,
  });

  await recordAuditEventSafely({
    actor: session.user,
    action: "staff.login",
    entityType: "staff",
    entityId: session.user.id,
    entityLabel: session.user.username,
    metadata: { authentication: "password" },
  });

  return {
    status: 200,
    body: session,
  };
}

export async function meController({ req }) {
  const session = getSessionFromRequest(req);

  if (!session) {
    throw new HttpError(401, "Staff login is required.");
  }

  // Merge persisted profile/avatar details for this user.
  // profileController already implements a richer /api/auth/me, but keep this
  // controller consistent for any existing callers.
  try {
    const { getStoredStaffUsers } =
      await import("../services/profileService.js");
    const users = await getStoredStaffUsers();
    const stored = users.find((u) => u.id === session.user.id) ?? null;

    return {
      status: 200,
      body: {
        ...session,
        user: {
          ...session.user,
          ...(stored?.full_name ? { name: stored.full_name } : {}),
          ...(stored?.phone ? { phone: stored.phone } : {}),
          ...(stored?.department ? { department: stored.department } : {}),
          ...(stored?.email ? { email: stored.email } : {}),
          ...(stored?.role ? { role: stored.role } : {}),
          avatarUrl: stored?.avatar_url ?? null,
        },
      },
    };
  } catch {
    // Fallback to raw session if profile storage isn't available.
    return {
      status: 200,
      body: session,
    };
  }
}

export async function forgotPasswordController({ body }) {
  return {
    status: 200,
    body: await requestPasswordReset({
      email: body?.email,
    }),
  };
}

export async function resetPasswordController({ body }) {
  return {
    status: 200,
    body: await resetPassword({
      token: body?.token,
      password: body?.password,
    }),
  };
}

export async function staffRegisterController({ body, staff }) {
  const result = await registerStaff({
    fullName: body?.fullName,
    username: body?.username,
    email: body?.email,
    phone: body?.phone,
    department: body?.department,
    role: body?.role,
    employeeId: body?.employeeId,
    password: body?.password,
    avatarBase64: body?.avatarBase64,
  });

  await recordAuditEventSafely({
    actor: staff,
    action: "staff.created",
    entityType: "staff",
    entityId: result.user.id,
    entityLabel: result.user.username,
    after: {
      role: result.user.role,
      department: result.user.department,
    },
  });

  return {
    status: 201,
    body: result,
  };
}
