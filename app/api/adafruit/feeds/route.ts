// GET /api/adafruit/feeds — List all Adafruit IO feeds
// GET /api/adafruit/feeds?key=soil-moisture — Get a specific feed

import { NextRequest, NextResponse } from "next/server";
import { getAllFeeds, getFeed } from "@/lib/adafruit-io";

export async function GET(request: NextRequest) {
  const feedKey = request.nextUrl.searchParams.get("key");

  try {
    if (feedKey) {
      const feed = await getFeed(feedKey);
      return NextResponse.json(feed);
    }

    const feeds = await getAllFeeds();
    return NextResponse.json(feeds);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
