"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Thermometer, Droplets, Sprout } from "lucide-react";

// --- Mock Data ---
type SensorLog = {
  id: number;
  timestamp: string;
  temp: number;
  humid: number;
  soil: number;
  status: "normal" | "warning" | "critical";
};

const ZONES = [
  { id: 1, name: "Z1: Ornamental" },
  { id: 2, name: "Z2: Lettuce" },
  { id: 3, name: "Z3: Rose Nursery" },
  { id: 4, name: "Z4: Orchids" },
];

const BASE = {
  1: { temp: 26.8, humid: 62, soil: 72 },
  2: { temp: 30.2, humid: 58, soil: 38 },
  3: { temp: 27.5, humid: 68, soil: 65 },
  4: { temp: 25.4, humid: 75, soil: 85 },
} as const;

function pseudoRandom(seed: number) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967295;
}

function generateLogs(zoneId: 1 | 2 | 3 | 4, count = 80): SensorLog[] {
  const base = BASE[zoneId];
  const now = new Date("2026-03-22T14:00:00");
  const logs: SensorLog[] = [];

  for (let i = 0; i < count; i++) {
    const t = base.temp + pseudoRandom(zoneId * 1000 + i) * 6 - 3;
    const h = base.humid + pseudoRandom(zoneId * 2000 + i) * 10 - 5;
    const s = base.soil + pseudoRandom(zoneId * 3000 + i) * 12 - 6;

    const ts = new Date(now.getTime() - i * 15 * 60 * 1000);
    const status: SensorLog["status"] =
      s < 30 || t > 35 ? "critical" : s < 45 || t > 32 ? "warning" : "normal";

    logs.push({
      id: i + 1,
      timestamp: ts.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      temp: +t.toFixed(1),
      humid: +h.toFixed(1),
      soil: +s.toFixed(1),
      status,
    });
  }

  return logs;
}

const ALL_LOGS: Record<number, SensorLog[]> = {
  1: generateLogs(1),
  2: generateLogs(2),
  3: generateLogs(3),
  4: generateLogs(4),
};

const PAGE_SIZE = 20;

const STATUS_BADGE: Record<SensorLog["status"], string> = {
  normal: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

export default function DataLogsPage() {
  const [activeZone, setActiveZone] = useState<number>(1);
  const [page, setPage] = useState<number>(1);

  const logs = useMemo(() => ALL_LOGS[activeZone] ?? [], [activeZone]);
  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const pageData = useMemo(
    () => logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [logs, page]
  );

  const handleZoneChange = (zoneId: number) => {
    setActiveZone(zoneId);
    setPage(1);
  };

  return (
    <div className="h-full flex flex-col text-[#333] font-sans">
      {/* Page Title */}
      <div className="mb-4 shrink-0">
        <h2 className="text-xl font-medium text-slate-800">Data Logs</h2>
        <p className="text-xs text-gray-400 mt-0.5">Sensor reading history by zone</p>
      </div>

      {/* Zone Tabs */}
      <div className="mb-0 shrink-0 flex border-b border-[#e0e0e0]">
        {ZONES.map((zone) => (
          <button
            key={zone.id}
            onClick={() => handleZoneChange(zone.id)}
            className={`flex-1 py-2.5 text-[12px] font-bold uppercase tracking-wide transition-colors border-b-2 ${
              activeZone === zone.id
                ? "border-[#00695c] text-[#00695c] bg-white"
                : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            {zone.name}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-b-sm shadow-sm border border-t-0 border-[#e0e0e0]">
        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-[#f9f9f9] border-b border-[#e8e8e8] z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Timestamp</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">
                  <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-orange-400" /> Temperature</span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">
                  <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-blue-400" /> Humidity</span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">
                  <span className="flex items-center gap-1"><Sprout className="w-3.5 h-3.5 text-emerald-400" /> Soil Moisture</span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-40">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {pageData.map((log, idx) => (
                <tr key={log.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-4 py-2.5 text-gray-400">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-4 py-2.5 text-gray-600 font-mono">{log.timestamp}</td>
                  <td className="px-4 py-2.5 text-orange-600 font-medium">{log.temp} °C</td>
                  <td className="px-4 py-2.5 text-blue-600 font-medium">{log.humid} %</td>
                  <td className="px-4 py-2.5 text-emerald-600 font-medium">{log.soil} %</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_BADGE[log.status]}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="shrink-0 border-t border-[#e8e8e8] px-4 py-2.5 flex items-center justify-between bg-[#f9f9f9]">
          <span className="text-[11px] text-gray-400">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, logs.length)} of {logs.length} records
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded border border-[#e0e0e0] text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 flex items-center justify-center rounded border text-[11px] font-medium transition ${
                  p === page
                    ? "bg-[#00695c] border-[#00695c] text-white"
                    : "border-[#e0e0e0] text-gray-500 hover:bg-white"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded border border-[#e0e0e0] text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
