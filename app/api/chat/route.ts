import { NextResponse } from "next/server";
import { processUserQuery } from "@/lib/metricmind/agent";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const result = processUserQuery(message);

    return NextResponse.json(result);
  } catch (error) {
    console.error("MetricMind API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process request.",
      },
      { status: 500 }
    );
  }
}