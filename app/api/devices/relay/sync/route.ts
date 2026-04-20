// GET /api/devices/relay/sync
// Fetches the latest value for every RELAY_MODULE feed from Adafruit IO and
// writes the current status back to the DB so the app always starts from
// ground truth rather than a potentially stale cached status.
//
// Returns: { id, zoneId, status }[] — only relay devices that have a feedKey.

import { NextRequest, NextResponse } from "next/server";
import { listDevices, updateDevice } from "@/services/device-service";
import { getLastData } from "@/lib/adafruit-io";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { getUserById } from "@/services/auth-service";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload)
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const dbUser = await getUserById(payload.userId);
  if (!dbUser || !dbUser.adafruitUsername || !dbUser.adafruitKey) {
    return NextResponse.json(
      { error: "Adafruit IO credentials not configured" },
      { status: 422 },
    );
  }
  const credentials = {
    username: dbUser.adafruitUsername,
    key: dbUser.adafruitKey,
  };

  // All relay devices that have a feedKey
  const relayDevices = await listDevices({ deviceType: "RELAY_MODULE" });
  const syncable = relayDevices.filter((d) => !!d.feedKey);

  const results = await Promise.allSettled(
    syncable.map(async (device) => {
      const lastPoint = await getLastData(device.feedKey!, credentials);
      const status = lastPoint.value.trim() === "1" ? "ACTIVE" : "OFFLINE";
      if (device.status !== status) {
        await updateDevice(device.id, { status });
      }
      return { id: device.id, zoneId: device.zoneId, status };
    }),
  );

  const synced = results.flatMap((r) =>
    r.status === "fulfilled" ? [r.value] : [],
  );

  return NextResponse.json(synced);
}
