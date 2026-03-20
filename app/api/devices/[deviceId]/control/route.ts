// POST /api/devices/[deviceId]/control — Control a pump device
// Body: { action: "1" | "0" }
//   "1" → turn ON: set device status to ACTIVE, call Adafruit, open an IrrigationEvent
//   "0" → turn OFF: set device status to OFFLINE, call Adafruit, close the latest open IrrigationEvent

import { NextRequest, NextResponse } from "next/server";
import { getDevice, updateDevice } from "@/services/device-service";
import {
  createIrrigationEvent,
  updateIrrigationEvent,
  getLatestOpenIrrigationEvent,
} from "@/services/irrigation-service";
import { controlPump } from "@/lib/adafruit-io";
import { toJsonSafe } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  const device = await getDevice(deviceId);
  if (!device) {
    return NextResponse.json({ error: "Device not found" }, { status: 404 });
  }

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action } = body;
  if (action !== "1" && action !== "0") {
    return NextResponse.json(
      { error: "action must be '1' (on) or '0' (off)" },
      { status: 400 }
    );
  }

  try {
    // 1. Call Adafruit IO simultaneously
    const adafruitResponse = await controlPump(action);

    // 2. Update device status in DB
    const now = new Date();
    const updatedDevice = await updateDevice(deviceId, {
      status: action === "1" ? "ACTIVE" : "OFFLINE",
      lastActiveAt: now,
    });

    // 3. Log irrigation event
    let event = null;
    if (action === "1") {
      event = await createIrrigationEvent({
        startTime: now,
        zoneId: device.zoneId ?? undefined,
      });
    } else {
      const open = await getLatestOpenIrrigationEvent();
      if (open) {
        const duration = Math.round((now.getTime() - open.startTime.getTime()) / 1000);
        event = await updateIrrigationEvent(open.id, { endTime: now, duration });
      }
    }

    return NextResponse.json({
      success: true,
      pump: action,
      device: toJsonSafe(updatedDevice),
      event: toJsonSafe(event),
      adafruitResponse,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
