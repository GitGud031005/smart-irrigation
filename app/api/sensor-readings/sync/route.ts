// POST /api/sensor-readings/sync — Poll all three Adafruit feeds since the last stored timestamp
// and insert only new readings into the DB (deduplicates by recordedAt).

import { NextResponse } from "next/server";
import { getFeedData } from "@/lib/adafruit-io";
import { createSensorReading, getLatestReadingTimestamp } from "@/services/sensor-service";

interface AdafruitDatum {
  value: string;
  created_at: string;
}

export async function POST() {
  try {
    const [lastSoil, lastTemp, lastHum] = await Promise.all([
      getLatestReadingTimestamp("soilMoisture"),
      getLatestReadingTimestamp("temperature"),
      getLatestReadingTimestamp("humidity"),
    ]);

    const [soilData, tempData, humData] = await Promise.all([
      getFeedData(process.env.ADAFRUIT_IO_FEED_SOIL_MOISTURE || "soil-moisture"),
      getFeedData(process.env.ADAFRUIT_IO_FEED_TEMPERATURE || "temperature"),
      getFeedData(process.env.ADAFRUIT_IO_FEED_HUMIDITY || "humidity"),
    ]);

    const filterNew = (data: AdafruitDatum[], since: Date | null) =>
      since ? data.filter((d) => new Date(d.created_at) > since) : data;

    const newSoil = filterNew(soilData as AdafruitDatum[], lastSoil);
    const newTemp = filterNew(tempData as AdafruitDatum[], lastTemp);
    const newHum = filterNew(humData as AdafruitDatum[], lastHum);

    const tsSet = new Set<string>([
      ...newSoil.map((d) => d.created_at),
      ...newTemp.map((d) => d.created_at),
      ...newHum.map((d) => d.created_at),
    ]);

    const soilMap = Object.fromEntries(newSoil.map((d) => [d.created_at, parseFloat(d.value)]));
    const tempMap = Object.fromEntries(newTemp.map((d) => [d.created_at, parseFloat(d.value)]));
    const humMap = Object.fromEntries(newHum.map((d) => [d.created_at, parseFloat(d.value)]));

    const inserts = await Promise.all(
      Array.from(tsSet).map((ts) =>
        createSensorReading({
          soilMoisture: soilMap[ts],
          temperature: tempMap[ts],
          humidity: humMap[ts],
          recordedAt: new Date(ts),
        })
      )
    );

    return NextResponse.json({ inserted: inserts.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
