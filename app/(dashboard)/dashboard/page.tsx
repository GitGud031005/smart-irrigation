"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Thermometer, Droplets, Sprout, Power, Download } from "lucide-react";
import { apiCall } from "@/lib/api";
import { useZones } from "@/hooks/use-zones";
import { useSSE } from "@/hooks/use-sse";
import type { IrrigationProfile } from "@/models/irrigation-profile";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import dynamic from "next/dynamic";
const Line = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), { ssr: false });

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

type SensorReading = {
  id: string;
  temperature: number | null;
  humidity: number | null;
  soilMoisture: number | null;
  recordedAt: string;
  zoneId: string | null;
};

type SensorSnapshot = { temperature: number | null; humidity: number | null; soilMoisture: number | null; zoneId: string };

type SensorStatuses = { temperature: string | null; humidity: string | null; soilMoisture: string | null };

function SensorStatusDot({ status }: { status: string | null }) {
  if (!status) return <span className="text-[10px] text-gray-300">—</span>;
  const active = status === "ACTIVE";
  return (
    <span className={`flex items-center gap-1 text-[10px] font-medium ${active ? "text-emerald-500" : "text-gray-400"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400 animate-pulse" : "bg-gray-300"}`} />
      {active ? "Active" : "Offline"}
    </span>
  );
}

// Get color classes based on soil moisture value and profile thresholds
function soilColorClasses(val: number | null | undefined, minMoisture: number = 40, maxMoisture: number = 60) {
  if (val == null) return { text: "text-gray-400", bar: "bg-gray-400" };
  if (val >= maxMoisture) return { text: "text-emerald-600", bar: "bg-emerald-500" };
  if (val < minMoisture)  return { text: "text-rose-600", bar: "bg-rose-500" };
  return { text: "text-slate-500", bar: "bg-slate-400" };
}

export default function DashboardPage() {
  const { zones, relayByZone, soilByZone, updateRelayStatus, updateSoilMoisture } = useZones();
  const [timeFilter, setTimeFilter] = useState<"daily" | "weekly">("daily");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [profiles, setProfiles] = useState<IrrigationProfile[]>([]);
  const [currentZoneId, setCurrentZoneId] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<SensorSnapshot | null>(null);
  const [liveData, setLiveData] = useState<SensorSnapshot | null>(null);
  const [historyReadings, setHistoryReadings] = useState<SensorReading[]>([]);
  const [sensorStatuses, setSensorStatuses] = useState<SensorStatuses>({ temperature: null, humidity: null, soilMoisture: null });

  // Relay device for the currently selected zone (from context)
  const currentRelay = currentZoneId ? relayByZone[currentZoneId] ?? null : null;
  const relayDeviceId = currentRelay?.id ?? null;
  const pumpState = currentRelay?.status === "ACTIVE";

  // Displayed snapshot: prefer MQTT live data for current zone, fall back to last DB reading
  const displayData =
    (liveData?.zoneId === currentZoneId ? liveData : null) ??
    (initialData?.zoneId === currentZoneId ? initialData : null);

  const currentZone = useMemo(() => zones.find(z => z.id === currentZoneId) ?? null, [zones, currentZoneId]);

  // Helper to find profile by ID
  const findProfile = (profileId: string | undefined): IrrigationProfile | null => {
    if (!profileId) return null;
    return profiles.find(p => p.id === profileId) ?? null;
  };

  useEffect(() => {
    document.title = `BK-IRRIGATION | Dashboard${currentZone ? ` - ${currentZone.name}` : ""}`;
  }, [currentZone]);

  // Initialize currentZoneId from context zones (once available)
  useEffect(() => {
    if (zones.length > 0 && currentZoneId === null) {
      setCurrentZoneId(zones[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones]);

  // Fetch profiles on mount
  useEffect(() => {
    apiCall<IrrigationProfile[]>("/api/profiles")
      .then(setProfiles)
      .catch(() => {});
  }, []);

  // When zone changes: load last DB reading
  useEffect(() => {
    if (!currentZoneId) return;

    // 1. Last sensor reading from DB for this zone
    apiCall<SensorReading[]>(
      `/api/sensor-readings?zoneId=${encodeURIComponent(currentZoneId)}&take=1`
    ).then((readings) => {
      if (readings.length > 0) {
        const r = readings[0];
        setInitialData({ temperature: r.temperature, humidity: r.humidity, soilMoisture: r.soilMoisture, zoneId: currentZoneId });
      }
    }).catch(() => {});
  }, [currentZoneId]);

  // Fetch historical readings when zone or time-filter changes
  useEffect(() => {
    if (!currentZoneId) return;
    const now = new Date();
    const since = new Date(now.getTime() - (timeFilter === "daily" ? 24 : 7 * 24) * 60 * 60 * 1000);
    const take = timeFilter === "daily" ? 24 : 56;
    apiCall<SensorReading[]>(
      `/api/sensor-readings?zoneId=${encodeURIComponent(currentZoneId)}&since=${since.toISOString()}&take=${take}`
    )
      .then(setHistoryReadings)
      .catch(() => setHistoryReadings([]));
  }, [currentZoneId, timeFilter]);

  // SSE: auto-reconnecting stream (survives Vercel serverless 60-s timeout)
  const sseUrl = currentZoneId
    ? `/api/sensor-readings/stream?zoneId=${encodeURIComponent(currentZoneId)}`
    : null;

  useSSE(sseUrl, (event) => {
    try {
      const data = JSON.parse(event.data as string);
      console.log("[SSE] message received:", data);
      if (data.type === "status") {
        console.log("[SSE] device statuses update:", data);
        setSensorStatuses({
          temperature: data.temperature ?? null,
          humidity: data.humidity ?? null,
          soilMoisture: data.soilMoisture ?? null,
        });
      } else if (data.type === "reading") {
        console.log("[SSE] sensor reading:", data);
        setLiveData({
          temperature: data.temperature ?? null,
          humidity: data.humidity ?? null,
          soilMoisture: data.soilMoisture ?? null,
          zoneId: currentZoneId!,
        });
        if (data.soilMoisture != null) updateSoilMoisture(currentZoneId!, data.soilMoisture);
      } else {
        console.warn("[SSE] unknown message type:", data);
      }
    } catch (e) {
      console.error("[SSE] failed to parse message:", event.data, e);
    }
  });

  // SSE: pump/relay feed — keeps pumpState in sync when the physical device
  // or another client toggles the pump without going through this browser tab.
  const pumpSseUrl = currentZoneId
    ? `/api/devices/relay/stream?zoneId=${encodeURIComponent(currentZoneId)}`
    : null;

  useSSE(pumpSseUrl, (event) => {
    try {
      const data = JSON.parse(event.data as string);
      if (data.type === "pump" && currentZoneId) {
        updateRelayStatus(currentZoneId, data.status);
      }
    } catch (e) {
      console.error("[SSE pump] failed to parse message:", event.data, e);
    }
  });

  // Reset sensor statuses whenever the selected zone changes
  useEffect(() => {
    setSensorStatuses({ temperature: null, humidity: null, soilMoisture: null });
  }, [currentZoneId]);

  // Close export menu on outside click
  useEffect(() => {
    if (!exportMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportMenuOpen]);

  const handleExport = (format: "csv" | "json") => {
    setExportMenuOpen(false);
    const now = new Date();
    const since = new Date(now.getTime() - (timeFilter === "daily" ? 24 : 7 * 24) * 60 * 60 * 1000);
    const params = new URLSearchParams({
      format,
      startDate: since.toISOString(),
      endDate: now.toISOString(),
      ...(currentZoneId ? { zoneId: currentZoneId } : {}),
    });
    window.location.href = `/api/export?${params.toString()}`;
  };

  // Pump handlers
  const togglePump = async () => {
    if (!relayDeviceId || !currentZoneId) return;
    const newStatus = pumpState ? "OFFLINE" : "ACTIVE";
    updateRelayStatus(currentZoneId, newStatus); // optimistic
    try {
      await apiCall(`/api/devices/${encodeURIComponent(relayDeviceId)}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // revert on failure
      updateRelayStatus(currentZoneId, pumpState ? "ACTIVE" : "OFFLINE");
    }
  };

  // Build chart data from real historical readings
  const chartLabels = useMemo(() =>
    historyReadings.map(r => {
      const d = new Date(r.recordedAt);
      return timeFilter === "daily"
        ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    }),
    [historyReadings, timeFilter]
  );

  const tempChartData  = useMemo(() => historyReadings.map(r => r.temperature),   [historyReadings]);
  const humidChartData = useMemo(() => historyReadings.map(r => r.humidity),       [historyReadings]);
  const soilChartData  = useMemo(() => historyReadings.map(r => r.soilMoisture),   [historyReadings]);

  const chartOptions = (unit: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    elements: { line: { tension: 0.3 } },
    scales: {
      y: {
        grid: { color: "#f0f0f0" },
        ticks: {
          font: { size: 9 },
          color: "#999",
          callback: (tickValue: string | number) => `${tickValue}${unit}`,
        },
      },
      x: { grid: { color: "#f0f0f0" }, ticks: { font: { size: 9 }, color: "#999" } },
    },
  });

  return (
    <div className="text-[#333] font-sans h-full flex flex-col">
      {/* Page Header & Time Filter */}
      <div className="mb-4 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-medium text-slate-800">My Dashboard</h2>
        <div className="flex items-center gap-2">
          <div className="flex bg-white rounded-sm shadow-sm border border-[#e0e0e0] overflow-hidden">
            <button 
              onClick={() => setTimeFilter("daily")} 
              className={`px-3 py-1.5 text-[11px] font-bold uppercase border-r border-[#e0e0e0] transition-colors ${timeFilter === "daily" ? "border-b-2 border-b-[#00695c] text-[#00695c]" : "border-b-2 border-b-transparent hover:text-[#00695c]"}`}
            >
              Daily
            </button>
            <button 
              onClick={() => setTimeFilter("weekly")} 
              className={`px-3 py-1.5 text-[11px] font-bold uppercase transition-colors ${timeFilter === "weekly" ? "border-b-2 border-b-[#00695c] text-[#00695c]" : "border-b-2 border-b-transparent hover:text-[#00695c]"}`}
            >
              Weekly
            </button>
          </div>

          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setExportMenuOpen(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase bg-white rounded-sm shadow-sm border transition-colors ${
                exportMenuOpen
                  ? "border-[#00695c] text-[#00695c]"
                  : "border-[#e0e0e0] hover:border-[#00695c] hover:text-[#00695c]"
              }`}
            >
              <Download className="w-3 h-3" />
              Export
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-sm shadow-md border border-[#e0e0e0] z-20 overflow-hidden">
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full text-left px-3 py-2 text-[11px] font-medium hover:bg-[#f5f5f5] transition-colors"
                >
                  Download CSV
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="w-full text-left px-3 py-2 text-[11px] font-medium hover:bg-[#f5f5f5] transition-colors border-t border-[#eee]"
                >
                  Download JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Watering & Zone Status Row */}
      <div className="mb-4 flex flex-row gap-4 shrink-0">
        {/* Manual Watering Control */}
        <div className="flex-1 flex flex-col bg-white rounded-sm shadow-sm border border-[#e0e0e0]">
          <div className="border-b border-[#eee] py-2 px-4 text-sm font-medium text-[#333]">Manual Watering</div>

          <div className="flex-1 flex items-center px-3.5 space-y-2">
            <div className="flex-1 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Power className={`w-4 h-4 mb-px ${pumpState ? "text-blue-500 animate-pulse" : "text-gray-400"}`} />
                <span className={`text-sm font-semibold ${pumpState ? "text-blue-600" : "text-gray-400"}`}>
                  Watering
                </span>
              </div>
              <button
                onClick={() => togglePump()}
                className={`relative w-12 h-6 rounded-full p-1 transition-all duration-300 ease-in-out 
    ${pumpState ? "bg-blue-600 shadow-inner" : "bg-gray-300 shadow-inner"}`}
                aria-label="Toggle Pump"
              >
                <span
                  className={`absolute inset-0 rounded-full transition-opacity duration-300 ${pumpState ? "opacity-20 bg-blue-400 blur-sm" : "opacity-0"}`}
                ></span>

                <span
                  className={`block absolute bottom-[2.5px] w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] 
      ${pumpState ? "translate-x-5.5" : "translate-x-0"}`}
                >
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Zone Operational Status */}
        <div className="flex-4 bg-white rounded-sm shadow-sm border border-[#e0e0e0] min-w-0">
          <div className="border-b border-[#eee] py-2 px-4 text-sm font-medium text-[#333]">Zone Soil Moisture Status</div>
          {zones.length === 0 ? (
            <div className="p-4 text-sm text-gray-400">No zones available.</div>
          ) : (
            <div className="flex overflow-x-auto scrollbar-zone divide-x divide-gray-100">
                {zones.map(zone => {
                  const isActive = zone.id === currentZoneId;
                  const isIrrigating = relayByZone[zone.id]?.status === "ACTIVE";
                  // Active zone: prefer live/initial data; other zones: use context soil
                  const soil = isActive
                    ? (displayData?.soilMoisture ?? soilByZone[zone.id] ?? null)
                    : (soilByZone[zone.id] ?? null);
                  const profile = findProfile(zone.profileId);
                  const minMoisture = profile?.minMoisture ?? 40;
                  const maxMoisture = profile?.maxMoisture ?? 60;
                  const { text, bar } = soilColorClasses(soil, minMoisture, maxMoisture);
                  return (
                    <div
                      key={zone.id}
                      onClick={() => setCurrentZoneId(zone.id)}
                      className={`min-w-[25%] shrink-0 p-3 cursor-pointer transition-colors border-l-4 ${
                        isActive
                          ? "bg-[#f5f5f5] border-l-[#00695c]"
                          : isIrrigating
                          ? "bg-blue-50 border-l-blue-400 hover:bg-blue-100"
                          : "border-l-transparent hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-end mb-2">
                        <span className={`text-sm font-bold truncate mr-1 ${isIrrigating ? "text-blue-700" : "text-slate-700"}`}>{zone.name}</span>
                        <span className={`text-xs font-bold shrink-0 ${isIrrigating ? "text-blue-700" : text}`}>
                          {soil != null ? `${soil.toFixed(0)}%` : "--"}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-300 h-1 rounded-sm overflow-hidden">
                        <div className={`${isIrrigating ? "bg-blue-700" : bar} h-full`} style={{ width: soil != null ? `${Math.min(100, soil)}%` : "0%" }}></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Stats & Charts Grid */}
      <div className="w-full flex flex-row gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Cột trái: Stats */}
        <div className="flex-1 flex flex-col gap-4 space-y-4 overflow-y-auto min-h-0">
          
          {/* Stat Cards */}
          <div className="relative flex-1 bg-white rounded-sm shadow-sm border border-[#e0e0e0] p-4 mb-0">
            <div className="flex items-center gap-2 mb-3">
              <Thermometer className="w-6 h-6 text-orange-500" />
              <span className="text-sm color-[#666] font-medium uppercase">Temperature</span>
            </div>
            <div className="text-[32px] font-normal text-orange-600">
              {displayData?.temperature != null ? displayData.temperature.toFixed(1) : "--"} <span className="text-lg">°C</span>
            </div>
            <div className="absolute bottom-3 right-3">
              <SensorStatusDot status={sensorStatuses.temperature} />
            </div>
          </div>
          
          <div className="relative flex-1 bg-white rounded-sm shadow-sm border border-[#e0e0e0] p-4 mb-0">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="w-6 h-6 text-blue-500" />
              <span className="text-sm color-[#666] font-medium uppercase">Humidity</span>
            </div>
            <div className="text-[32px] font-normal text-blue-600">
              {displayData?.humidity != null ? displayData.humidity.toFixed(0) : "--"} <span className="text-lg">%</span>
            </div>
            <div className="absolute bottom-3 right-3">
              <SensorStatusDot status={sensorStatuses.humidity} />
            </div>
          </div>
          
          <div className="relative flex-1 bg-white rounded-sm shadow-sm border border-[#e0e0e0] p-4 mb-0">
            <div className="flex items-center gap-2 mb-3">
              <Sprout className="w-6 h-6 text-emerald-500" />
              <span className="text-sm color-[#666] font-medium uppercase">Soil Moisture</span>
            </div>
            <div className="text-[32px] font-normal text-emerald-600">
              {displayData?.soilMoisture != null ? displayData.soilMoisture.toFixed(0) : "--"} <span className="text-lg">%</span>
            </div>
            <div className="absolute bottom-3 right-3">
              <SensorStatusDot status={sensorStatuses.soilMoisture} />
            </div>
          </div>
        </div>

        {/* Cột phải: Charts */}
        <div className="flex-4 space-y-4 flex flex-col min-h-0 overflow-y-auto">
          
          {/* Temperature Chart */}
          <div className="bg-white rounded-sm shadow-sm border border-[#e0e0e0] flex flex-col flex-1 min-h-0 max-h-64">
            <div className="border-b border-[#eee] py-2 px-4 flex justify-between items-center bg-white">
              <div>
                <span className="font-medium text-sm">{timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} Temperature</span>
                <div className="text-[10px] text-gray-400 font-normal">Realtime - last 12 hours</div>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Temperature
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col min-h-0">
              <div className="flex-1 relative w-full min-h-0">
                <Line
                  options={chartOptions(" °C")}
                  data={{
                    labels: chartLabels,
                    datasets: [{
                      label: "Temperature",
                      data: tempChartData,
                      borderColor: "#3b82f6",
                      backgroundColor: "rgba(59,130,246,0.08)",
                      fill: true, borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 4,
                    }]
                  }}
                />
              </div>
            </div>
          </div>

          {/* Humidity & Soil Chart */}
          <div className="bg-white rounded-sm shadow-sm border border-[#e0e0e0] flex flex-col flex-1 min-h-0 max-h-64">
            <div className="border-b border-[#eee] py-2 px-4 flex justify-between items-center bg-white">
              <div>
                <span className="font-medium text-sm">{timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} Humidity & Soil Moisture</span>
                <div className="text-[10px] text-gray-400 font-normal">Realtime - last 12 hours</div>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Humidity</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Soil Moisture</span>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col min-h-0">
              <div className="flex-1 relative w-full min-h-0">
                <Line
                  options={chartOptions(" %")}
                  data={{
                    labels: chartLabels,
                    datasets: [
                      {
                        label: "Humidity",
                        data: humidChartData,
                        borderColor: "#10b981",
                        backgroundColor: "rgba(16,185,129,0.08)",
                        fill: true, borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 4,
                      },
                      {
                        label: "Soil Moisture",
                        data: soilChartData,
                        borderColor: "#f59e0b",
                        backgroundColor: "rgba(245,158,11,0.06)",
                        fill: true, borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 4,
                        borderDash: [4, 2],
                      }
                    ]
                  }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
