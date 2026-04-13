"use client";
// Audit Logs — displays real alerts from /api/alerts
// Filter bar: type, severity, actor, keyword search
// Log table: timestamp, severity badge, type, zone name, message, actor
import { useEffect, useState, useCallback, useMemo } from "react";
import { Search, Wifi } from "lucide-react";
import type { AlertSeverity, AlertType, AlertActor } from "@/models/alert";
import { apiCall } from "@/lib/api";
import { useZones } from "@/hooks/use-zones";
import { useSSE } from "@/hooks/use-sse";

interface AlertRow {
  id: string;
  zoneId?: string;
  message: string;
  severity: AlertSeverity;
  type: AlertType;
  actor: AlertActor;
  createdAt: string;
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

export default function AuditLogsPage() {
  const { zones: zonesList } = useZones();
  const zones = useMemo(() => {
    const m = new Map<string, string>();
    zonesList.forEach(z => m.set(z.id, z.name));
    return m;
  }, [zonesList]);

  const [alerts, setAlerts]     = useState<AlertRow[]>([]);
  const [filtered, setFiltered] = useState<AlertRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);

  // Live SSE — subscribes to the audit-log Adafruit feed
  const { connected: liveConnected } = useSSE("/api/alerts/stream", (event) => {
    try {
      const raw = JSON.parse(event.data) as {
        type: string;
        id: string;
        createdAt: string;
        message: string;
        severity: AlertSeverity;
        alertType: AlertType;
        actor: AlertActor;
        zoneId: string | null;
      };
      if (raw.type !== "audit") return;
      const newRow: AlertRow = {
        id:        raw.id,
        createdAt: raw.createdAt,
        message:   raw.message,
        severity:  raw.severity,
        type:      raw.alertType,
        actor:     raw.actor,
        zoneId:    raw.zoneId ?? undefined,
      };
      // Prepend — newest first, matching DB DESC order
      setAlerts((prev) => [newRow, ...prev]);
    } catch {
      // ignore malformed frames
    }
  });

  // Re-apply filters whenever base alert list changes
  useEffect(() => {
    applyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts]);

  // filter state
  const [filterType,     setFilterType]     = useState<string>("");
  const [filterSeverity, setFilterSeverity] = useState<string>("");
  const [filterActor,    setFilterActor]    = useState<string>("");
  const [filterKeyword,  setFilterKeyword]  = useState<string>("");

  useEffect(() => {
    document.title = "BK-IRRIGATION | Audit Logs";
  }, []);

  useEffect(() => {
    // Fetch alerts on mount
    apiCall<AlertRow[]>("/api/alerts?take=200")
      .catch(() => [] as AlertRow[])
      .then((alertsData) => {
        const rows = Array.isArray(alertsData) ? alertsData : [];
        setAlerts(rows);
        setFiltered(rows);
      })
      .finally(() => setLoading(false));
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
      <div className="mb-4 shrink-0 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-medium text-slate-800">Audit Logs</h2>
          <p className="text-xs text-gray-400 mt-0.5">System alerts and events with severity, type, and actor information</p>
        </div>
        <span className={`flex items-center gap-1 text-[11px] font-medium ${liveConnected ? "text-emerald-600" : "text-gray-400"}`}>
          <Wifi className="w-3.5 h-3.5" />
          {liveConnected ? "Live" : "Connecting..."}
        </span>
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


