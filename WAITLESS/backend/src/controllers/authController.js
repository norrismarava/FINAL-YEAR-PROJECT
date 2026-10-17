import {
  changeStaffPassword,
  deleteStaffUser,
  getSessionFromRequest,
  listStaffUsers,
  loginStaff,
  registerStaff,
  registerStaffWithAccessCode,
  requestPasswordReset,
  resetPassword,
} from "../services/authService.js";
import {
  createStaffAccessCode,
  listStaffAccessCodes,
} from "../services/staffAccessCodeService.js";
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

export async function staffAccessCodeCreateController({ body, staff }) {
  const result = await createStaffAccessCode({
    role: body?.role,
    department: body?.department,
    note: body?.note,
    createdBy: staff?.id ?? null,
  });

  await recordAuditEventSafely({
    actor: staff,
    action: "staff.access_code.created",
    entityType: "staff_access_code",
    entityId: result.id,
    entityLabel: `${result.role} · ${result.department}`,
  });

  return {
    status: 201,
    body: result,
  };
}

export async function staffAccessCodeListController() {
  return {
    status: 200,
    body: { codes: await listStaffAccessCodes() },
  };
}

export async function staffChangePasswordController({ body, staff }) {
  const result = await changeStaffPassword(staff?.id, {
    currentPassword: body?.currentPassword,
    newPassword: body?.newPassword,
  });

  await recordAuditEventSafely({
    actor: staff,
    action: "staff.password_changed",
    entityType: "staff",
    entityId: staff?.id,
    entityLabel: staff?.username,
  });

  return {
    status: 200,
    body: result,
  };
}

export async function staffUsersListController() {
  return {
    status: 200,
    body: { users: await listStaffUsers() },
  };
}

export async function staffUserDeleteController({ params, staff }) {
  const removed = await deleteStaffUser(params.id, staff?.id);

  await recordAuditEventSafely({
    actor: staff,
    action: "staff.deleted",
    entityType: "staff",
    entityId: removed.id,
    entityLabel: removed.username,
    after: { role: removed.role, department: removed.department },
  });

  return {
    status: 200,
    body: { message: "Staff account deleted.", user: removed },
  };
}

export async function staffSelfRegisterController({ body }) {
  const result = await registerStaffWithAccessCode({
    accessCode: body?.accessCode,
    fullName: body?.fullName,
    username: body?.username,
    email: body?.email,
    phone: body?.phone,
    employeeId: body?.employeeId,
    password: body?.password,
  });

  await recordAuditEventSafely({
    actor: result.user,
    action: "staff.self_registered",
    entityType: "staff",
    entityId: result.user.id,
    entityLabel: result.user.username,
    after: {
      role: result.assignedRole,
      department: result.assignedDepartment,
    },
  });

  return {
    status: 201,
    body: result,
  };
}
