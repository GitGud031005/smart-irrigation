// POST /api/irrigation/manual - Manual & remote pump control (UC-03, FR3)
// Start/stop irrigation for a specific zone, overrides automatic scheduling

import { NextRequest, NextResponse } from "next/server";
import { controlPump } from "@/lib/adafruit-io";

export async function POST(request: NextRequest) {
  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action } = body;
  if (action !== "1" && action !== "0") {
    return NextResponse.json(
      { error: "action must be 'ON' or 'OFF'" },
      { status: 400 }
    );
  }

  try {
    const result = await controlPump(action);
    return NextResponse.json({
      success: true,
      pump: action,
      adafruitResponse: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
