import { NextResponse } from "next/server";
import type { AuthErrorResponse } from "./types";

const MAX_AUTH_REQUEST_BYTES = 4_096;
export const AUTH_NO_STORE_HEADERS = { "Cache-Control": "no-store" };

type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; response: NextResponse<AuthErrorResponse> };

export function authError(
  error: string,
  status: number,
  extraHeaders?: Record<string, string>
): NextResponse<AuthErrorResponse> {
  return NextResponse.json(
    { error },
    {
      status,
      headers: { ...AUTH_NO_STORE_HEADERS, ...extraHeaders },
    }
  );
}

export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  const contentLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_AUTH_REQUEST_BYTES
  ) {
    return { ok: false, response: authError("Request body is too large.", 413) };
  }

  try {
    return { ok: true, value: await request.json() };
  } catch {
    return {
      ok: false,
      response: authError("Request body must be valid JSON.", 400),
    };
  }
}
