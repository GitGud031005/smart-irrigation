"use client";
// Audit Logs — displays real alerts from /api/alerts
// Filter bar: type, severity, actor, keyword search
// Log table: timestamp, severity badge, type, zone name, message, actor
import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import type { AlertSeverity, AlertType, AlertActor } from "@/models/alert";

interface AlertRow {
  id: string;
  zoneId?: string;
  message: string;
  severity: AlertSeverity;
  type: AlertType;
  actor: AlertActor;
  createdAt: string;
}

interface Zone {
  id: string;
  name: string;
}

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  INFO:     "bg-[#e3f2fd] text-[#1565c0]",
  WARNING:  "bg-[#fff3e0] text-[#e65100]",
  CRITICAL: "bg-[#fce4ec] text-[#c62828]",
};

const TYPE_LABELS: Record<AlertType, string> = {
  DEVICE_STATUS:    "Device Status",
  PLANT_STATUS:     "Plant Status",
  IRRIGATION_EVENT: "Irrigation Event",
};

const ACTOR_LABELS: Record<AlertActor, string> = {
  USER:   "User",
  SYSTEM: "System",
  AI:     "AI",
};

// Format date consistently to avoid hydration mismatch
const formatDatetime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
};

const getVisiblePages = (current: number, total: number): (number | string)[] => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, "...", total];
  if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

const PAGE_SIZE = 15;

const MOCK_ALERTS: AlertRow[] = [
  { id: "1", zoneId: "zone-001-uuid", message: "Soil moisture critically low in zone Front Garden", severity: "CRITICAL", type: "PLANT_STATUS",      actor: "SYSTEM", createdAt: "2026-03-23T13:45:22Z" },
  { id: "2", zoneId: "zone-002-uuid", message: "Irrigation cycle started automatically",            severity: "INFO",     type: "IRRIGATION_EVENT", actor: "AI",     createdAt: "2026-03-23T13:00:00Z" },
  { id: "3", zoneId: "zone-001-uuid", message: "Temperature above threshold (36.2°C)",             severity: "WARNING",  type: "PLANT_STATUS",      actor: "SYSTEM", createdAt: "2026-03-23T12:45:33Z" },
  { id: "4", zoneId: "zone-001-uuid", message: "Pump device went offline",                          severity: "CRITICAL", type: "DEVICE_STATUS",     actor: "SYSTEM", createdAt: "2026-03-23T12:30:01Z" },
  { id: "5", zoneId: "zone-003-uuid", message: "Irrigation cycle completed — 15 min duration",     severity: "INFO",     type: "IRRIGATION_EVENT", actor: "AI",     createdAt: "2026-03-23T12:15:00Z" },
  { id: "6", zoneId: "zone-001-uuid", message: "New sensor device registered",                      severity: "INFO",     type: "DEVICE_STATUS",     actor: "USER",   createdAt: "2026-03-23T11:50:00Z" },
  { id: "7", zoneId: "zone-002-uuid", message: "Humidity dropped below 30% — irrigation recommended recommendedrecommendedrecommendedrecommendedrecommendedrecommendedrecommendedrecommendedrecommendedrecommendedrecommendedrecommendedrecommendedrecommended", severity: "WARNING", type: "PLANT_STATUS",   actor: "SYSTEM", createdAt: "2026-03-23T11:30:00Z" },
  { id: "8", zoneId: "zone-001-uuid", message: "Manual irrigation triggered by user",               severity: "INFO",     type: "IRRIGATION_EVENT", actor: "USER",   createdAt: "2026-03-23T11:00:05Z" },
  { id: "9", zoneId: "zone-001-uuid", message: "ESP32-Node-02 reconnected after offline period",    severity: "INFO",     type: "DEVICE_STATUS",     actor: "SYSTEM", createdAt: "2026-03-23T10:15:22Z" },
  { id: "10", zoneId: "zone-004-uuid", message: "AI adjusted schedule due to weather forecast",    severity: "INFO",     type: "IRRIGATION_EVENT", actor: "AI",     createdAt: "2026-03-23T09:00:00Z" },
  { id: "11", zoneId: "zone-003-uuid", message: "Relay-Pump-03 status changed to ERROR",            severity: "CRITICAL", type: "DEVICE_STATUS",     actor: "SYSTEM", createdAt: "2026-03-23T08:45:10Z" },
  { id: "12", zoneId: "zone-002-uuid", message: "Soil moisture restored to optimal range",          severity: "INFO",     type: "PLANT_STATUS",      actor: "SYSTEM", createdAt: "2026-03-23T08:30:00Z" },
  { id: "13", zoneId: "zone-001-uuid", message: "Night irrigation cycle skipped — rain detected",  severity: "WARNING",  type: "IRRIGATION_EVENT", actor: "AI",     createdAt: "2026-03-22T22:00:00Z" },
  { id: "14", zoneId: "zone-004-uuid", message: "Device firmware update required",                   severity: "WARNING",  type: "DEVICE_STATUS",     actor: "SYSTEM", createdAt: "2026-03-22T18:00:00Z" },
  { id: "15", zoneId: "zone-003-uuid", message: "Temperature sensor reading anomaly detected",      severity: "WARNING",  type: "PLANT_STATUS",      actor: "SYSTEM", createdAt: "2026-03-22T15:30:00Z" },
  { id: "16", zoneId: "zone-004-uuid", message: "Scheduled irrigation started — zone Back Patio",  severity: "INFO",     type: "IRRIGATION_EVENT", actor: "AI",     createdAt: "2026-03-22T06:00:00Z" },
];

// Mock zone names for fallback during development
const MOCK_ZONE_MAP = new Map<string, string>([
  ["zone-001-uuid", "Front Garden"],
  ["zone-002-uuid", "Back Patio"],
  ["zone-003-uuid", "Vegetable Bed"],
  ["zone-004-uuid", "Lawn Area"],
]);

export default function AuditLogsPage() {
  const [alerts, setAlerts]     = useState<AlertRow[]>(MOCK_ALERTS);
  const [filtered, setFiltered] = useState<AlertRow[]>(MOCK_ALERTS);
  const [zones, setZones]       = useState<Map<string, string>>(new Map(MOCK_ZONE_MAP));
  const [loading, setLoading]   = useState(false);
  const [page, setPage]         = useState(1);

  // filter state
  const [filterType,     setFilterType]     = useState<string>("");
  const [filterSeverity, setFilterSeverity] = useState<string>("");
  const [filterActor,    setFilterActor]    = useState<string>("");
  const [filterKeyword,  setFilterKeyword]  = useState<string>("");

  useEffect(() => {
    // Fetch zones and alerts in parallel
    Promise.all([
      fetch("/api/zones").then((r) => r.json()).catch(() => []),
      fetch("/api/alerts?take=200").then((r) => r.json()).catch(() => []),
    ]).then(([zonesData, alertsData]) => {
      // Map zoneId to zone name — use API data, fallback to mock
      const zoneMap = new Map<string, string>(MOCK_ZONE_MAP);
      if (Array.isArray(zonesData) && zonesData.length > 0) {
        zonesData.forEach((z: Zone) => zoneMap.set(z.id, z.name));
      }
      setZones(zoneMap);
      // Use API alerts if available, otherwise keep mock data
      if (Array.isArray(alertsData) && alertsData.length > 0) {
        setAlerts(alertsData);
        setFiltered(alertsData);
      }
    }).finally(() => setLoading(false));
  }, []);

  const applyFilters = useCallback(() => {
    let result = alerts;
    if (filterType)     result = result.filter((a) => a.type     === filterType);
    if (filterSeverity) result = result.filter((a) => a.severity === filterSeverity);
    if (filterActor)    result = result.filter((a) => a.actor    === filterActor);
    if (filterKeyword)  result = result.filter((a) =>
      a.message.toLowerCase().includes(filterKeyword.toLowerCase()) ||
      (zones.get(a.zoneId ?? "")?.toLowerCase() ?? "").includes(filterKeyword.toLowerCase())
    );
    setFiltered(result);
    setPage(1);
  }, [alerts, filterType, filterSeverity, filterActor, filterKeyword, zones]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="h-full flex flex-col text-[#333] font-sans">
      {/* Page Title */}
      <div className="mb-4 shrink-0">
        <h2 className="text-xl font-medium text-slate-800">Audit Logs</h2>
        <p className="text-xs text-gray-400 mt-0.5">System alerts and events with severity, type, and actor information</p>
      </div>

      {/* Filters Bar */}
      <div className="mb-4 shrink-0 flex gap-2 items-center flex-wrap">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-[#ddd] px-2.5 py-1.5 text-xs rounded-sm outline-none focus:border-[#00695c] bg-white"
        >
          <option value="">All Types</option>
          <option value="DEVICE_STATUS">Device Status</option>
          <option value="PLANT_STATUS">Plant Status</option>
          <option value="IRRIGATION_EVENT">Irrigation Event</option>
        </select>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="border border-[#ddd] px-2.5 py-1.5 text-xs rounded-sm outline-none focus:border-[#00695c] bg-white"
        >
          <option value="">All Severity</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="CRITICAL">Critical</option>
        </select>

        <select
          value={filterActor}
          onChange={(e) => setFilterActor(e.target.value)}
          className="border border-[#ddd] px-2.5 py-1.5 text-xs rounded-sm outline-none focus:border-[#00695c] bg-white"
        >
          <option value="">All Actors</option>
          <option value="USER">User</option>
          <option value="SYSTEM">System</option>
          <option value="AI">AI</option>
        </select>

        <input
          type="text"
          placeholder="Search message or zone..."
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          className="border border-[#ddd] px-2.5 py-1.5 text-xs rounded-sm outline-none focus:border-[#00695c] bg-white"
        />

        <button
          onClick={applyFilters}
          className="bg-[#00695c] text-white border-none px-3.5 py-1.5 text-[11px] font-bold uppercase rounded-sm inline-flex items-center gap-1 hover:opacity-90 transition-opacity"
        >
          <Search className="w-3 h-3" /> Filter
        </button>
      </div>

      {/* Table Card */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-sm shadow-sm border border-[#e0e0e0]">

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-[#f9f9f9] border-b border-[#e8e8e8] z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-48">Timestamp</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-20">Severity</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-32">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-32">Zone</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide flex-1 min-w-48">Message</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-24">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">Loading…</td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">No alerts found</td>
                </tr>
              ) : (
                pageItems.map((a, idx) => (
                  <tr key={a.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-4 py-2.5 w-8 text-gray-400">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-2.5 w-48 text-gray-600 font-mono whitespace-nowrap">{formatDatetime(a.createdAt)}</td>
                    <td className="px-4 py-2.5 w-20">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${SEVERITY_STYLES[a.severity]}`}>
                        {a.severity}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 w-32 text-gray-600">{TYPE_LABELS[a.type]}</td>
                    <td className="px-4 py-2.5 w-32 text-gray-600">{a.zoneId ? zones.get(a.zoneId) || "Unknown" : "—"}</td>
                    <td className="px-4 py-2.5 flex-1 min-w-48 text-gray-600 break-all">{a.message}</td>
                    <td className="px-4 py-2.5 w-24 text-gray-600">{ACTOR_LABELS[a.actor]}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="shrink-0 border-t border-[#e8e8e8] px-4 py-2.5 flex items-center justify-between bg-[#f9f9f9]">
          <span className="text-[11px] text-gray-400">
            {filtered.length > 0
              ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} records`
              : "No records"}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded border border-[#e0e0e0] text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ‹
            </button>

            {getVisiblePages(page, totalPages).map((p, idx) => (
              p === "..." ? (
                <span key={`dots-${idx}`} className="px-1 text-gray-400 text-[11px]">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`w-7 h-7 flex items-center justify-center rounded border text-[11px] font-medium transition ${
                    p === page
                      ? "bg-[#00695c] border-[#00695c] text-white"
                      : "border-[#e0e0e0] text-gray-500 hover:bg-white"
                  }`}
                >
                  {p}
                </button>
              )
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded border border-[#e0e0e0] text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


