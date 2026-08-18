import { cookies } from "next/headers";
import { getUserBySessionToken } from "./store";
import type { PublicUser } from "./types";

export const SESSION_COOKIE_NAME = "metricmind_session";

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
    priority: "high" as const,
  };
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = await getSessionToken();
  return token ? getUserBySessionToken(token) : null;
}
