import { NextResponse } from "next/server";
import { AUTH_NO_STORE_HEADERS, authError, readJsonBody } from "@/lib/auth/api";
import {
  checkRateLimit,
  getRequestClientKey,
} from "@/lib/auth/rate-limit";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import { loginUser } from "@/lib/auth/store";
import type { AuthSuccessResponse } from "@/lib/auth/types";
import { validateCredentials } from "@/lib/auth/validation";

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 10 * 60 * 1_000;

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(
    getRequestClientKey(request, "login"),
    LOGIN_LIMIT,
    LOGIN_WINDOW_MS
  );
  if (!rateLimit.allowed) {
    return authError("Too many login attempts. Please try again later.", 429, {
      "Retry-After": String(rateLimit.retryAfterSeconds),
    });
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const validation = validateCredentials(body.value, {
    requireStrongPassword: false,
  });
  if (!validation.ok) return authError("Invalid username or password.", 401);

  try {
    const session = await loginUser(
      validation.credentials.username,
      validation.credentials.password
    );
    if (!session) return authError("Invalid username or password.", 401);

    const response = NextResponse.json<AuthSuccessResponse>(
      { user: session.user },
      { headers: AUTH_NO_STORE_HEADERS }
    );
    response.cookies.set(
      SESSION_COOKIE_NAME,
      session.token,
      sessionCookieOptions(session.expiresAt)
    );
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return authError("Unable to sign in.", 500);
  }
}
