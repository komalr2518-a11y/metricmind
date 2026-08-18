import { NextResponse } from "next/server";
import { AUTH_NO_STORE_HEADERS } from "@/lib/auth/api";
import { getSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { deleteSession } from "@/lib/auth/store";

export async function POST() {
  const token = await getSessionToken();

  try {
    if (token) await deleteSession(token);
  } catch (error) {
    console.error("Logout session cleanup failed:", error);
  }

  const response = NextResponse.json(
    { success: true },
    { headers: AUTH_NO_STORE_HEADERS }
  );
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
