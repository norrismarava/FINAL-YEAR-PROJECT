import { getSessionFromRequest, loginStaff } from "../services/authService.js";
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
