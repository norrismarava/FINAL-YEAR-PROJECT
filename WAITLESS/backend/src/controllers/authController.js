import {
  getSessionFromRequest,
  loginStaff,
  registerStaff,
  requestPasswordReset,
  resetPassword,
} from "../services/authService.js";
import { HttpError } from "../utils/http.js";

export async function loginController({ body }) {
  return {
    status: 200,
    body: loginStaff({
      username: body?.username,
      password: body?.password,
    }),
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
    const users = getStoredStaffUsers();
    const stored = users.find((u) => u.id === session.user.id) ?? null;

    return {
      status: 200,
      body: {
        ...session,
        user: {
          ...session.user,
          ...(stored?.name ? { name: stored.name } : {}),
          ...(stored?.phone ? { phone: stored.phone } : {}),
          ...(stored?.department ? { department: stored.department } : {}),
          ...(stored?.email ? { email: stored.email } : {}),
          ...(stored?.role ? { role: stored.role } : {}),
          avatarUrl: stored?.avatarUrl ?? null,
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
    body: requestPasswordReset({
      email: body?.email,
    }),
  };
}

export async function resetPasswordController({ body }) {
  return {
    status: 200,
    body: resetPassword({
      token: body?.token,
      password: body?.password,
    }),
  };
}

export async function staffRegisterController({ body }) {
  return {
    status: 201,
    body: registerStaff({
      fullName: body?.fullName,
      username: body?.username,
      email: body?.email,
      phone: body?.phone,
      department: body?.department,
      role: body?.role,
      employeeId: body?.employeeId,
      password: body?.password,
      avatarBase64: body?.avatarBase64,
    }),
  };
}
