// POST /api/adafruit/pump — Control the pump { action: "1" | "0" }
// GET  /api/adafruit/pump — Get current pump status

import { NextRequest, NextResponse } from "next/server";
import { controlPump, getPumpStatus } from "@/lib/adafruit-io";

export async function GET() {
  try {
    const status = await getPumpStatus();
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
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
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
