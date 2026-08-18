import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { processUserQuery } from "@/lib/metricmind/agent";

const MAX_MESSAGE_LENGTH = 500;
const MAX_REQUEST_BYTES = 4_096;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function errorResponse(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: NO_STORE_HEADERS }
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("Authentication required.", 401);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return errorResponse("Request body is too large.", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  try {
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return errorResponse("Message is required.", 400);
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return errorResponse(
        `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
        413
      );
    }

    const result = processUserQuery(message);

    return NextResponse.json(result, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("MetricMind API error:", error);
    return errorResponse("Unable to process the request.", 500);
  }
}
