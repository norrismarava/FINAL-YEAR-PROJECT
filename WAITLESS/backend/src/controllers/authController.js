import { getSessionFromRequest, loginStaff, registerStaff, requestPasswordReset, resetPassword } from "../services/authService.js";
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

  return {
    status: 200,
    body: session,
  };
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
      email: body?.email,
      phone: body?.phone,
      department: body?.department,
      role: body?.role,
      employeeId: body?.employeeId,
      password: body?.password,
    }),
  };
}
