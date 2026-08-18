import { NextResponse } from "next/server";
import { AUTH_NO_STORE_HEADERS, authError, readJsonBody } from "@/lib/auth/api";
import {
  checkRateLimit,
  getRequestClientKey,
} from "@/lib/auth/rate-limit";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import { registerUser, UsernameTakenError } from "@/lib/auth/store";
import type { AuthSuccessResponse } from "@/lib/auth/types";
import { validateCredentials } from "@/lib/auth/validation";

const REGISTRATION_LIMIT = 10;
const REGISTRATION_WINDOW_MS = 60 * 60 * 1_000;

export async function POST(request: Request) {
  // Keep local development friction-free while retaining abuse protection after
  // deployment. Restarting the dev server should never be required to register.
  if (process.env.NODE_ENV === "production") {
    const rateLimit = checkRateLimit(
      getRequestClientKey(request, "register"),
      REGISTRATION_LIMIT,
      REGISTRATION_WINDOW_MS
    );
    if (!rateLimit.allowed) {
      return authError(
        "Too many registration attempts. Please try again later.",
        429,
        { "Retry-After": String(rateLimit.retryAfterSeconds) }
      );
    }
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const validation = validateCredentials(body.value, {
    requireStrongPassword: true,
  });
  if (!validation.ok) return authError(validation.error, 400);

  try {
    const session = await registerUser(
      validation.credentials.username,
      validation.credentials.password
    );
    const response = NextResponse.json<AuthSuccessResponse>(
      { user: session.user },
      { status: 201, headers: AUTH_NO_STORE_HEADERS }
    );
    response.cookies.set(
      SESSION_COOKIE_NAME,
      session.token,
      sessionCookieOptions(session.expiresAt)
    );
    return response;
  } catch (error) {
    if (error instanceof UsernameTakenError) {
      return authError(error.message, 409);
    }
    console.error("Registration failed:", error);
    return authError("Unable to create the account.", 500);
  }
}
