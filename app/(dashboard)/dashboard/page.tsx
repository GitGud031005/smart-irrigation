// Dashboard Screen (Mockup 4.2)
// Left column: parameter cards (temperature, humidity, soil moisture) and manual irrigation control panel
// Right column: temperature chart, moisture chart, and zone status bars
// Controls: time filter (day/week), zone selection, reset
"use client";

import { useState, useEffect, useMemo } from "react";
import { Thermometer, Droplets, Sprout, Power } from "lucide-react";
import { apiCall } from "@/lib/api";
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

// Register required Chart.js modules
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// Deterministic pseudo-random generator (pure function) for mock data.
function pseudoRandom(seed: number) {
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967295;
}

// --- Mock Data ---
const zoneData: Record<number, { name: string; temp: number; humid: number; soil: number }> = {
  0: { name: "Global Average", temp: 28.5, humid: 65, soil: 42 },
  1: { name: "Z1: Ornamental", temp: 26.8, humid: 62, soil: 72 },
  2: { name: "Z2: Lettuce", temp: 30.2, humid: 58, soil: 38 },
  3: { name: "Z3: Rose Nursery", temp: 27.5, humid: 68, soil: 65 },
  4: { name: "Z4: Orchids", temp: 25.4, humid: 75, soil: 85 },
};

export default function DashboardPage() {
  // State
  const [timeFilter, setTimeFilter] = useState<"daily" | "weekly">("daily");
  const [currentZoneId, setCurrentZoneId] = useState<number>(1);
  
  // Pump Control State (only for current zone)
  const [pumpState, setPumpState] = useState<boolean>(false);

  // Live sensor data from MQTT via SSE stream
  const [liveData, setLiveData] = useState<{ temperature: number | null; humidity: number | null; soilMoisture: number | null } | null>(null);

  const currentData = zoneData[currentZoneId];
  useEffect(() =>{
    document.title = `BK-IRRIGATION| Dashboard - ${currentData.name}`;
  })

  // Subscribe to live MQTT sensor stream via SSE
  useEffect(() => {
    const source = new EventSource("/api/sensor-readings/stream");
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        setLiveData({
          temperature: data.temperature ?? null,
          humidity: data.humidity ?? null,
          soilMoisture: data.soilMoisture ?? null,
        });
      } catch {
        // ignore malformed frames
      }
    };
    return () => source.close();
  }, []);

  // Pump handlers
  const togglePump = async () => {
    const newState = !pumpState;
    setPumpState(newState);
    try {
      await apiCall("/api/pump", {
        method: "POST",
        body: JSON.stringify({ action: newState ? "start" : "stop" }),
      });
    } catch {
      // revert on failure
      setPumpState(!newState);
    }
  };

  // --- Chart configuration ---
  const chartLabels = useMemo(() => 
    timeFilter === "daily"
        ? ["03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00"]
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  [timeFilter]);

  const tempChartData = useMemo(() => chartLabels.map((_, i) => {
    const seed = Math.floor(currentData.temp * 100) + i + (timeFilter === "daily" ? 1 : 2);
    return +(currentData.temp + (pseudoRandom(seed) * 4 - 2)).toFixed(2);
  }), [chartLabels, currentData.temp, timeFilter]);

  const humidChartData = useMemo(() => chartLabels.map((_, i) => {
    const seed = Math.floor(currentData.humid * 100) + i + (timeFilter === "daily" ? 3 : 4);
    return +(currentData.humid + (pseudoRandom(seed) * 6 - 3)).toFixed(2);
  }), [chartLabels, currentData.humid, timeFilter]);

  const soilChartData = useMemo(() => chartLabels.map((_, i) => {
    const seed = Math.floor(currentData.soil * 100) + i + (timeFilter === "daily" ? 5 : 6);
    return +(currentData.soil + (pseudoRandom(seed) * 8 - 4)).toFixed(2);
  }), [chartLabels, currentData.soil, timeFilter]);

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
        <div className="flex-4 bg-white rounded-sm shadow-sm border border-[#e0e0e0]">
          <div className="border-b border-[#eee] py-2 px-4 text-sm font-medium text-[#333]">Zone Soil Moisture Status</div>
          <div className="grid grid-cols-4 divide-x divide-gray-100">
            
            {/* Z1 */}
            <div onClick={() => setCurrentZoneId(1)} className={`p-3 cursor-pointer transition-colors border-l-4 ${currentZoneId === 1 ? "bg-[#f5f5f5] border-l-[#00695c]" : "border-l-transparent hover:bg-gray-50"}`}>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-slate-700">Z1: Ornamental</span>
                <span className="text-xs font-bold text-emerald-600">72%</span>
              </div>
              <div className="w-full bg-gray-100 h-1 rounded-sm overflow-hidden"><div className="bg-emerald-500 h-full" style={{ width: "72%" }}></div></div>
            </div>

            {/* Z2 */}
            <div onClick={() => setCurrentZoneId(2)} className={`p-3 cursor-pointer transition-colors border-l-4 ${currentZoneId === 2 ? "bg-[#f5f5f5] border-l-[#00695c]" : "border-l-transparent hover:bg-gray-50"}`}>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-slate-700">Z2: Lettuce</span>
                <span className="text-xs font-bold text-rose-600">38%</span>
              </div>
              <div className="w-full bg-gray-100 h-1 rounded-sm overflow-hidden"><div className="bg-rose-500 h-full" style={{ width: "38%" }}></div></div>
            </div>

            {/* Z3 */}
            <div onClick={() => setCurrentZoneId(3)} className={`p-3 cursor-pointer transition-colors border-l-4 ${currentZoneId === 3 ? "bg-[#f5f5f5] border-l-[#00695c]" : "border-l-transparent hover:bg-gray-50"}`}>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-slate-700">Z3: Rose Nursery</span>
                <span className="text-xs font-bold text-slate-400">65%</span>
              </div>
              <div className="w-full bg-gray-100 h-1 rounded-sm overflow-hidden"><div className="bg-gray-400 h-full" style={{ width: "65%" }}></div></div>
            </div>

            {/* Z4 */}
            <div onClick={() => setCurrentZoneId(4)} className={`p-3 cursor-pointer transition-colors border-l-4 ${currentZoneId === 4 ? "bg-[#f5f5f5] border-l-[#00695c]" : "border-l-transparent hover:bg-gray-50"}`}>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-slate-700">Z4: Rose Nursery</span>
                <span className="text-xs font-bold text-slate-400">65%</span>
              </div>
              <div className="w-full bg-gray-100 h-1 rounded-sm overflow-hidden"><div className="bg-gray-400 h-full" style={{ width: "65%" }}></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats & Charts Grid */}
      <div className="w-full flex flex-row gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Cột trái: Stats */}
        <div className="flex-1 flex flex-col gap-4 space-y-4 overflow-y-auto min-h-0">
          
          {/* Stat Cards */}
          <div className="flex-1 bg-white rounded-sm shadow-sm border border-[#e0e0e0] p-4 mb-0">
            <div className="flex items-center gap-2 mb-3">
              <Thermometer className="w-6 h-6 text-orange-500" />
              <span className="text-sm color-[#666] font-medium uppercase">Temperature <span className="text-xs block normal-case font-normal text-gray-400">Last update just now</span></span>
            </div>
            <div className="text-[32px] font-normal text-orange-600">{(liveData?.temperature ?? currentData.temp).toFixed(1)} <span className="text-lg">°C</span></div>
          </div>
          
          <div className="flex-1 bg-white rounded-sm shadow-sm border border-[#e0e0e0] p-4 mb-0">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="w-6 h-6 text-blue-500" />
              <span className="text-sm color-[#666] font-medium uppercase">Humidity <span className="text-xs block normal-case font-normal text-gray-400">Last update just now</span></span>
            </div>
            <div className="text-[32px] font-normal text-blue-600">{(liveData?.humidity ?? currentData.humid).toFixed(0)} <span className="text-lg">%</span></div>
          </div>
          
          <div className="flex-1 bg-white rounded-sm shadow-sm border border-[#e0e0e0] p-4 mb-0">
            <div className="flex items-center gap-2 mb-3">
              <Sprout className="w-6 h-6 text-emerald-500" />
              <span className="text-sm color-[#666] font-medium uppercase">Soil Moisture <span className="text-xs block normal-case font-normal text-gray-400">Last update just now</span></span>
            </div>
            <div className="text-[32px] font-normal text-emerald-600">{(liveData?.soilMoisture ?? currentData.soil).toFixed(0)} <span className="text-lg">%</span></div>
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
