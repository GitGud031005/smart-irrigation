// Dashboard Screen (Mockup 4.2)
// Left column: parameter cards (temperature, humidity, soil moisture) and manual irrigation control panel
// Right column: temperature chart, moisture chart, and zone status bars
// Controls: time filter (day/week), zone selection, reset
"use client";

import { useState, useEffect, useMemo } from "react";
import { Thermometer, Droplets, Sprout, Power } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

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
  const [currentZoneId, setCurrentZoneId] = useState<number>(0);
  
  // Pump Control State
  const [pumpState, setPumpState] = useState<Record<number, boolean>>({ 1: false, 2: false, 3: false, 4: false });
  const [pumpTimers, setPumpTimers] = useState<Record<number, number>>({});
  const [now, setNow] = useState<number>(0);

  const currentData = zoneData[currentZoneId];
  useEffect(() =>{
    document.title = `BK-IRRIGATION| Dashboard - ${currentData.name}`;
  })

  // Update pump timers every second
  useEffect(() => {
    const init = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(interval); clearTimeout(init); };
  }, []);

  // Pump handlers
  const togglePump = (zone: number) => {
    setPumpState((prev) => {
      const isCurrentlyOn = prev[zone];
      
      // Update timers
      setPumpTimers((pt) => {
        const newTimers = { ...pt };
        if (!isCurrentlyOn) {
          newTimers[zone] = Date.now();
        } else {
          delete newTimers[zone];
        }
        return newTimers;
      });

      return { ...prev, [zone]: !isCurrentlyOn };
    });
  };

  const stopAllPumps = () => {
    setPumpState({ 1: false, 2: false, 3: false, 4: false });
    setPumpTimers({});
  };

  const activePumpsCount = Object.values(pumpState).filter(Boolean).length;

  // Render timer text
  const renderPumpTimers = () => {
    const activeEntries = Object.entries(pumpTimers);
    if (activeEntries.length === 0) return "";
    return activeEntries.map(([z, t]) => {
      const sec = Math.floor((now - t) / 1000);
      const m = String(Math.floor(sec / 60)).padStart(2, "0");
      const s = String(sec % 60).padStart(2, "0");
      return `Z${z}: ${m}:${s}`;
    }).join("  ·  ");
  };

  // --- Chart configuration ---
  const chartLabels = useMemo(() => 
    timeFilter === "daily"
        ? ["03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00"]
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  [timeFilter]);

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
    <div className="text-[#333] font-sans">
      {/* Page Header & Time Filter */}
      <div className="mb-4 flex justify-between items-center">
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

      <div className="grid grid-cols-12 gap-4">
        {/* Cột trái: Stats & Bơm */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          
          {/* Stat Cards */}
          <div className="bg-white rounded-sm shadow-sm border border-[#e0e0e0] p-4 h-36">
            <div className="flex items-center gap-2 mb-3">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <span className="text-[11px] color-[#666] font-medium uppercase">Temperature <span className="text-[9px] block normal-case font-normal text-gray-400">Last update just now</span></span>
            </div>
            <div className="text-[32px] font-normal text-orange-600">{currentData.temp.toFixed(1)} <span className="text-lg">°C</span></div>
          </div>
          
          <div className="bg-white rounded-sm shadow-sm border border-[#e0e0e0] p-4 h-36">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-[11px] color-[#666] font-medium uppercase">Humidity <span className="text-[9px] block normal-case font-normal text-gray-400">Last update just now</span></span>
            </div>
            <div className="text-[32px] font-normal text-blue-600">{currentData.humid.toFixed(0)} <span className="text-lg">%</span></div>
          </div>
          
          <div className="bg-white rounded-sm shadow-sm border border-[#e0e0e0] p-4 h-36">
            <div className="flex items-center gap-2 mb-3">
              <Sprout className="w-4 h-4 text-emerald-500" />
              <span className="text-[11px] color-[#666] font-medium uppercase">Soil Moisture <span className="text-[9px] block normal-case font-normal text-gray-400">{currentZoneId === 0 ? "Global Average" : `Zone ${currentZoneId} Specific`}</span></span>
            </div>
            <div className="text-[32px] font-normal text-emerald-600">{currentData.soil.toFixed(0)} <span className="text-lg">%</span></div>
          </div>

          {/* Manual Pump Control */}
          <div className="bg-white rounded-sm shadow-sm border border-[#e0e0e0]">
            <div className="border-b border-[#eee] py-2 px-3 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2">
                <Power className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-medium text-xs uppercase">Manual Watering</span>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm ${activePumpsCount > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                {activePumpsCount > 0 ? `${activePumpsCount} ACTIVE` : "ALL OFF"}
              </span>
            </div>
            <div className="p-3 space-y-2">
              {[1, 2, 3, 4].map((z) => (
                <div key={z} className={`flex items-center justify-between py-1.5 px-2 rounded-sm transition-colors ${pumpState[z] ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                  <span className="text-[11px] font-medium text-slate-700">{zoneData[z].name}</span>
                  <button 
                    onClick={() => togglePump(z)} 
                    className={`text-[9px] font-bold uppercase px-3 py-1 rounded-sm border transition-colors ${pumpState[z] ? "bg-red-500 text-white border-red-400" : "bg-white text-gray-500 border-gray-300 hover:border-emerald-500 hover:text-emerald-600"}`}
                  >
                    {pumpState[z] ? "Stop" : "Start"}
                  </button>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 px-3 py-2 flex justify-between items-center border-t border-gray-100">
              <span className="text-[9px] text-gray-400 font-mono">{renderPumpTimers()}</span>
              {activePumpsCount > 0 && (
                <button onClick={stopAllPumps} className="text-[9px] font-bold uppercase text-red-600 hover:underline">Stop All</button>
              )}
            </div>
          </div>
        </div>

        {/* Cột phải: Charts & Zones */}
        <div className="col-span-12 lg:col-span-9 space-y-4 flex flex-col">
          
          {/* Temperature Chart */}
          <div className="bg-white rounded-sm shadow-sm border border-[#e0e0e0] flex flex-col flex-1 min-h-65">
            <div className="border-b border-[#eee] py-2 px-4 flex justify-between items-center bg-white">
              <div>
                <span className="font-medium text-sm">{currentData.name} - {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} Temperature</span>
                <div className="text-[10px] text-gray-400 font-normal">Realtime - last 12 hours</div>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Temperature
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex-1 relative w-full h-full min-h-45">
                <Line
                  options={chartOptions(" °C")}
                  data={{
                    labels: chartLabels,
                    datasets: [{
                      label: "Temperature",
                      data: useMemo(() => chartLabels.map((_, i) => {
                        const seed = Math.floor(currentData.temp * 100) + i + (timeFilter === "daily" ? 1 : 2);
                        return +(currentData.temp + (pseudoRandom(seed) * 4 - 2)).toFixed(2);
                      }), [chartLabels, currentData.temp, timeFilter]),
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
          <div className="bg-white rounded-sm shadow-sm border border-[#e0e0e0] flex flex-col flex-1 min-h-65">
            <div className="border-b border-[#eee] py-2 px-4 flex justify-between items-center bg-white">
              <div>
                <span className="font-medium text-sm">{currentData.name} - {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} Humidity & Soil Moisture</span>
                <div className="text-[10px] text-gray-400 font-normal">Realtime - last 12 hours</div>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Humidity</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Soil Moisture</span>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex-1 relative w-full h-full min-h-45">
                <Line
                  options={chartOptions(" %")}
                  data={{
                    labels: chartLabels,
                    datasets: [
                      {
                        label: "Humidity",
                        data: useMemo(() => chartLabels.map((_, i) => {
                          const seed = Math.floor(currentData.humid * 100) + i + (timeFilter === "daily" ? 3 : 4);
                          return +(currentData.humid + (pseudoRandom(seed) * 6 - 3)).toFixed(2);
                        }), [chartLabels, currentData.humid, timeFilter]),
                        borderColor: "#10b981",
                        backgroundColor: "rgba(16,185,129,0.08)",
                        fill: true, borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 4,
                      },
                      {
                        label: "Soil Moisture",
                        data: useMemo(() => chartLabels.map((_, i) => {
                          const seed = Math.floor(currentData.soil * 100) + i + (timeFilter === "daily" ? 5 : 6);
                          return +(currentData.soil + (pseudoRandom(seed) * 8 - 4)).toFixed(2);
                        }), [chartLabels, currentData.soil, timeFilter]),
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

          {/* Zone Operational Status */}
          <div className="bg-white rounded-sm shadow-sm border border-[#e0e0e0]">
            <div className="border-b border-[#eee] py-2 px-4 text-sm font-medium text-[#333]">Zone Operational Status</div>
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              
              {/* Z1 */}
              <div onClick={() => setCurrentZoneId(1)} className={`p-4 cursor-pointer transition-colors border-l-4 ${currentZoneId === 1 ? "bg-[#f5f5f5] border-l-[#00695c]" : "border-l-transparent hover:bg-gray-50"}`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Z1: Ornamental</span>
                  <span className="text-xs font-bold text-emerald-600">72%</span>
                </div>
                <div className="w-full bg-gray-100 h-1 mt-2 rounded-sm overflow-hidden"><div className="bg-emerald-500 h-full" style={{ width: "72%" }}></div></div>
              </div>

              {/* Z2 */}
              <div onClick={() => setCurrentZoneId(2)} className={`p-4 cursor-pointer transition-colors border-l-4 ${currentZoneId === 2 ? "bg-[#f5f5f5] border-l-[#00695c]" : "border-l-transparent hover:bg-gray-50"}`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Z2: Lettuce</span>
                  <span className="text-xs font-bold text-rose-600">38%</span>
                </div>
                <div className="w-full bg-gray-100 h-1 mt-2 rounded-sm overflow-hidden"><div className="bg-rose-500 h-full" style={{ width: "38%" }}></div></div>
              </div>

              {/* Z3 */}
              <div onClick={() => setCurrentZoneId(3)} className={`p-4 cursor-pointer transition-colors border-l-4 ${currentZoneId === 3 ? "bg-[#f5f5f5] border-l-[#00695c]" : "border-l-transparent hover:bg-gray-50"}`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Z3: Rose Nursery</span>
                  <span className="text-xs font-bold text-slate-400">65%</span>
                </div>
                <div className="w-full bg-gray-100 h-1 mt-2 rounded-sm overflow-hidden"><div className="bg-gray-400 h-full" style={{ width: "65%" }}></div></div>
              </div>

              {/* Z4 */}
              <div onClick={() => setCurrentZoneId(4)} className={`p-4 cursor-pointer transition-colors border-l-4 ${currentZoneId === 4 ? "bg-[#f5f5f5] border-l-[#00695c]" : "border-l-transparent hover:bg-gray-50"}`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-tighter">Z4: Watering</span>
                  <span className="text-xs font-bold text-blue-600">Active</span>
                </div>
                <div className="w-full bg-gray-100 h-1 mt-2 rounded-sm overflow-hidden"><div className="bg-blue-500 h-full animate-pulse" style={{ width: "100%" }}></div></div>
              </div>

            </div>
            <div className="bg-slate-50 p-2 text-center border-t border-gray-100">
              <button onClick={() => setCurrentZoneId(0)} className="text-[10px] font-bold text-[#00695c] uppercase hover:underline">Reset to Global Average</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
