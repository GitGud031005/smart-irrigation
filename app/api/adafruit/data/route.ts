// GET  /api/adafruit/data?feed=soil-moisture&limit=10 — Get feed data
// POST /api/adafruit/data — Send data to a feed { feedKey, value }

import { NextRequest, NextResponse } from "next/server";
import { getFeedData, sendData } from "@/lib/adafruit-io";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const feedKey = searchParams.get("feed");

  if (!feedKey) {
    return NextResponse.json(
      { error: "Missing 'feed' query parameter" },
      { status: 400 }
    );
  }

  const limit = searchParams.get("limit");
  const start_time = searchParams.get("start_time") ?? undefined;
  const end_time = searchParams.get("end_time") ?? undefined;

  try {
    const data = await getFeedData(feedKey, {
      limit: limit ? parseInt(limit, 10) : undefined,
      start_time,
      end_time,
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  let body: { feedKey?: string; value?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { feedKey, value } = body;
  if (!feedKey || value === undefined) {
    return NextResponse.json(
      { error: "Missing 'feedKey' or 'value' in request body" },
      { status: 400 }
    );
  }

  try {
    const result = await sendData(feedKey, String(value));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
