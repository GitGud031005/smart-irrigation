import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

// Constants - change these to simulate different scenarios or zones
const ZONE_ID = "37baab23-5fa9-44a2-90bf-ee5616bcd882";

const MIN_MOISTURE = 40;
const SCHEDULE_TIME_HOUR = 6;
const SCHEDULE_TIME_MINUTE = 0;
const WATERING_DURATION_SECONDS = 300;
const DATE = new Date("2026-03-28T05:00:00Z");
const MIN_RAIN_COUNT = 2;

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const OUTPUT_DIR = join(import.meta.dirname, "fake_data");
const SENSOR_READINGS_FILE = join(OUTPUT_DIR, "sensor_readings.json");
const IRRIGATION_EVENTS_FILE = join(OUTPUT_DIR, "irrigation_events.json");

mkdirSync(OUTPUT_DIR, { recursive: true });

// ------------------------------
// Deterministic pseudo-random generator
// ------------------------------
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seedString = DATE.toISOString().slice(0, 10);
const seed = xmur3(seedString)();
const rand = mulberry32(seed);

function randFloat(min, max) {
  return rand() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(randFloat(min, max + 1));
}

const maxTemp = 31 + randInt(0, 4); // 31-35
const minTemp = 22 + randInt(0, 4); // 22-26
const maxTempTime = 13 + randInt(0, 2); // 13-15

const meanHumidity = 75 + randInt(0, 5); // 75-80
const amplitude = 7 + randInt(0, 4); // 7-11
const maxHumidityTime = 4 + randInt(0, 2); // 4-6

function randTemperature(hour, soilMoisture, rainState) {
  const baseTemp =
    (maxTemp + minTemp) / 2 +
    ((maxTemp - minTemp) / 2) * Math.cos(((hour - maxTempTime) / 12) * Math.PI);

  const soilEffect = (50 - soilMoisture) * 0.03; // drier soil -> slightly hotter
  const rainEffect = rainState.active ? -1.5 : rainState.recent ? -0.5 : 0;

  return baseTemp + soilEffect + rainEffect + randFloat(-0.6, 0.6);
}

function randHumidity(hour, soilMoisture, rainState) {
  const baseHumidity =
    meanHumidity +
    amplitude * Math.cos(((hour - maxHumidityTime) / 12) * Math.PI);

  const soilEffect = (soilMoisture - 50) * 0.12; // wetter soil -> higher local humidity
  const rainEffect = rainState.active
    ? randFloat(12, 22)
    : rainState.recent
      ? randFloat(4, 8)
      : 0;

  return Math.min(
    100,
    baseHumidity + soilEffect + rainEffect + randFloat(-1.8, 1.8),
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function addSeconds(date, seconds) {
  return new Date(date.getTime() + seconds * 1000);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function formatDateKey(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ------------------------------
// Rain simulation
// ------------------------------
function generateRainPeriods(start, end, minRainCount = 2) {
  const periods = [];
  const count = minRainCount + randInt(0, 2);

  let cursor = addHours(start, 10 + randInt(0, 12));

  for (let i = 0; i < count; i++) {
    cursor = addHours(cursor, randInt(18, 36));
    if (cursor >= end) break;

    const durationMinutes = randInt(45, 180);
    const intensity = randFloat(0.15, 0.55);

    const rainStart = new Date(cursor);
    const rainEnd = addMinutes(rainStart, durationMinutes);

    if (rainEnd > end) break;

    periods.push({
      start: rainStart,
      end: rainEnd,
      intensity,
    });

    cursor = addHours(rainEnd, randInt(12, 24));
  }

  return periods.sort((a, b) => a.start - b.start);
}

function getRainStateAt(time, rainPeriods) {
  for (const period of rainPeriods) {
    if (time >= period.start && time <= period.end) {
      return { active: true, recent: false, period };
    }
  }

  // residual effect after rain ends
  for (const period of rainPeriods) {
    const tailEnd = addMinutes(period.end, 90);
    if (time > period.end && time <= tailEnd) {
      return { active: false, recent: true, period };
    }
  }

  return { active: false, recent: false, period: null };
}

// ------------------------------
// Simulation setup
// ------------------------------
const endTime = new Date(DATE);
const startTime = new Date(endTime.getTime() - ONE_WEEK_MS);
startTime.setUTCSeconds(0, 0);

const rainPeriods = generateRainPeriods(startTime, endTime, MIN_RAIN_COUNT);
for (const period of rainPeriods) {
  console.log(
    `Rain from ${period.start.toISOString()} to ${period.end.toISOString()} (intensity: ${period.intensity.toFixed(2)})`,
  );
}

let soilMoisture = randFloat(48, 66);
let lastIrrigationAt = null;

const sensorReadings = [];
const irrigationEvents = [];

const scheduleDone = new Set();
let currentTime = new Date(startTime.getTime());

// ------------------------------
// Helper: irrigation event creation
// ------------------------------
function createIrrigationEvent(start, durationSeconds) {
  const event = {
    id: randomUUID(),
    zoneId: ZONE_ID,
    startTime: start.toISOString(),
    endTime: addSeconds(start, durationSeconds).toISOString(),
    duration: durationSeconds,
  };

  irrigationEvents.push(event);

  // Watering raises soil moisture immediately, then natural decay continues later.
  const boost = durationSeconds * randFloat(0.0815, 0.0955);
  soilMoisture = clamp(soilMoisture + boost, 0, 100);

  lastIrrigationAt = start;
}

// ------------------------------
// Main simulation loop
// ------------------------------
while (currentTime <= endTime) {
  const hour = currentTime.getUTCHours() + currentTime.getUTCMinutes() / 60;
  const rainState = getRainStateAt(currentTime, rainPeriods);

  // Temperature and humidity respond to both time of day and current soil condition.
  let temperature = randTemperature(hour, soilMoisture, rainState);
  let humidity = randHumidity(hour, soilMoisture, rainState);

  if (rainState.active) {
    // Rain directly increases soil moisture.
    const rainBoost = rainState.period.intensity * randFloat(0.35, 0.9);
    soilMoisture += rainBoost;
  }

  // Natural evaporation: faster in warm / dry / daytime conditions.
  const daylightFactor = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
  const heatFactor = Math.max(0, temperature - 25) * 0.011;
  const drynessFactor = Math.max(0, 80 - humidity) * 0.004;
  const soilDrynessFactor = Math.max(0, 60 - soilMoisture) * 0.006;
  const evap =
    0.025 +
    daylightFactor * 0.07 +
    heatFactor +
    drynessFactor +
    soilDrynessFactor;

  let evapMultiplier = 1;
  if (rainState.recent) evapMultiplier = 0.6;
  if (rainState.active) evapMultiplier = 0.35;

  soilMoisture -= evap * evapMultiplier;
  soilMoisture += randFloat(-0.06, 0.06);

  soilMoisture = clamp(soilMoisture, 0, 100);
  temperature = clamp(temperature, 18, 38);
  humidity = clamp(humidity, 35, 100);

  sensorReadings.push({
    id: randomUUID(),
    zoneId: ZONE_ID,
    soilMoisture: Math.round(soilMoisture),
    temperature: round1(temperature),
    humidity: round1(humidity),
    recordedAt: currentTime.toISOString(),
  });

  // Daily scheduled irrigation
  const scheduleTime = new Date(currentTime.getTime());
  scheduleTime.setUTCHours(SCHEDULE_TIME_HOUR, SCHEDULE_TIME_MINUTE, 0, 0);

  const dayKey = formatDateKey(currentTime);

  if (!scheduleDone.has(dayKey) && currentTime >= scheduleTime) {
    const duration =
      soilMoisture < MIN_MOISTURE
        ? WATERING_DURATION_SECONDS * 2
        : WATERING_DURATION_SECONDS;

    createIrrigationEvent(currentTime, duration);
    scheduleDone.add(dayKey);
  } else {
    // Automatic irrigation outside schedule if moisture is below minimum.
    const cooldownOk =
      !lastIrrigationAt ||
      currentTime.getTime() - lastIrrigationAt.getTime() > 25 * 60 * 1000;

    if (soilMoisture < MIN_MOISTURE && cooldownOk) {
      createIrrigationEvent(currentTime, WATERING_DURATION_SECONDS);
    }
  }

  // Next reading occurs about 1 minute later, but not exactly.
  const stepSeconds = randInt(55, 70);
  currentTime = addSeconds(currentTime, stepSeconds);
}

// ------------------------------
// Write JSON files
// ------------------------------
writeFileSync(
  SENSOR_READINGS_FILE,
  JSON.stringify(sensorReadings, null, 2),
  "utf8",
);
writeFileSync(
  IRRIGATION_EVENTS_FILE,
  JSON.stringify(irrigationEvents, null, 2),
  "utf8",
);

console.log(`Generated ${sensorReadings.length} sensor readings.`);
console.log(`Generated ${irrigationEvents.length} irrigation events.`);
console.log(`Saved to: ${OUTPUT_DIR}`);
