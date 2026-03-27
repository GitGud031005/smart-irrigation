"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Thermometer, Droplets, Sprout, RefreshCw, Wifi } from "lucide-react";
import { apiCall } from "@/lib/api";
import { useZones } from "@/hooks/use-zones";
import type { IrrigationProfile } from "@/models/irrigation-profile";

// ─── Types ───────────────────────────────────────────────────────────────────

// Shape of a SensorReading row from the API (matches Prisma model fields)
type SensorLog = {
    id: string;
    recordedAt: string;   // ISO string
    temperature: number | null;
    humidity: number | null;
    soilMoisture: number | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

// ─── Status thresholds — derived from the zone's assigned irrigation profile ──

type LogStatus = "normal" | "critical" | "no-profile";

function getStatus(log: SensorLog, profile: IrrigationProfile | null): LogStatus {
    if (!profile || log.soilMoisture === null) return "no-profile";
    const s = log.soilMoisture;
    return s >= profile.minMoisture && s <= profile.maxMoisture ? "normal" : "critical";
}

const STATUS_BADGE: Record<LogStatus, string> = {
    normal: "bg-emerald-100 text-emerald-700",
    critical: "bg-red-100 text-red-700",
    "no-profile": "bg-gray-100 text-gray-400",
};

const STATUS_LABEL: Record<LogStatus, string> = {
    normal: "Normal",
    critical: "Critical",
    "no-profile": "No Profile",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
    return new Date(iso).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
}

function getVisiblePages(current: number, total: number): (number | string)[] {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

    if (current <= 3) return [1, 2, 3, 4, '...', total];
    if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];

    return [1, '...', current - 1, current, current + 1, '...', total];
};

// ─── Page component ──────────────────────────────────────────────────────────

export default function DataLogsPage() {
    const { zones, zonesLoading } = useZones();
    const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [logs, setLogs] = useState<SensorLog[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [liveConnected, setLiveConnected] = useState<boolean>(false);
    const [profiles, setProfiles] = useState<IrrigationProfile[]>([]);

    useEffect(() => {
        document.title = "BK-IRRIGATION | Data Logs";
        apiCall<IrrigationProfile[]>("/api/profiles").then(setProfiles).catch(() => {});
    }, []);

    // Initialize activeZoneId once zones are available from context
    useEffect(() => {
        if (zones.length > 0 && activeZoneId === null) {
            setActiveZoneId(zones[0].id);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zones]);

    // When active zone changes: sync from Adafruit then load history
    useEffect(() => {
        if (!activeZoneId) return;
        let cancelled = false;

        async function loadData() {
            setLoading(true);
            setError(null);
            try {
                // Sync new Adafruit readings into the DB first
                await apiCall("/api/sensor-readings/sync", {
                    method: "POST",
                    body: JSON.stringify({ zoneId: activeZoneId }),
                });

                // Fetch history for this zone
                const data = await apiCall<SensorLog[]>(`/api/sensor-readings?zoneId=${encodeURIComponent(activeZoneId!)}`);
                if (!cancelled) setLogs(data);
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadData();
        return () => { cancelled = true; };
    }, [activeZoneId]);

    // Subscribe to live readings via SSE → MQTT (reconnect when zone changes)
    useEffect(() => {
        if (!activeZoneId) return;
        const source = new EventSource(`/api/sensor-readings/stream?zoneId=${encodeURIComponent(activeZoneId)}`);

        source.onopen = () => setLiveConnected(true);

        source.onmessage = (event) => {
            try {
                const raw = JSON.parse(event.data) as {
                    soilMoisture: number; temperature: number; humidity: number; recordedAt: string;
                };
                const entry: SensorLog = {
                    id: `live-${raw.recordedAt}`,
                    recordedAt: raw.recordedAt,
                    temperature: raw.temperature,
                    humidity: raw.humidity,
                    soilMoisture: raw.soilMoisture,
                };
                // Prepend to list (newest first, matches DESC DB order)
                setLogs((prev) => [entry, ...prev]);
            } catch {
                // ignore malformed SSE frames
            }
        };

        source.onerror = () => setLiveConnected(false);

        return () => {
            source.close();
            setLiveConnected(false);
        };
    }, [activeZoneId]);

    const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
    const pageData = useMemo(
        () => logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [logs, page]
    );

    const handleZoneChange = (zoneId: string) => {
        setActiveZoneId(zoneId);
        setPage(1);
    };

    const activeZone = zones.find(z => z.id === activeZoneId);
    const activeProfile = profiles.find(p => p.id === activeZone?.profileId) ?? null;

    return (
        <div className="h-full flex flex-col text-[#333] font-sans">
            {/* Page Title */}
            <div className="mb-4 shrink-0 flex items-end justify-between">
                <div>
                    <h2 className="text-xl font-medium text-slate-800">Data Logs</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Sensor reading history — synced from Adafruit IO on load</p>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                    {loading && (
                        <span className="flex items-center gap-1 text-gray-400">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing...
                        </span>
                    )}
                    <span className={`flex items-center gap-1 font-medium ${liveConnected ? "text-emerald-600" : "text-gray-400"}`}>
                        <Wifi className="w-3.5 h-3.5" />
                        {liveConnected ? "Live" : "Connecting..."}
                    </span>
                </div>
            </div>

            {/* Zone Tabs */}
            <div className="mb-0 shrink-0 flex overflow-x-auto border-b border-[#e0e0e0] scrollbar-zone">
                {zones.length === 0 ? (
                    <div className="flex-1 py-2.5 text-[12px] text-gray-300 text-center">
                        {zonesLoading ? 'Loading zones…' : 'No zones found'}
                    </div>
                ) : (
                    zones.map((zone) => (
                        <button
                            key={zone.id}
                            onClick={() => handleZoneChange(zone.id)}
                            className={`shrink-0 min-w-[25%] p-2.5 text-[12px] font-bold uppercase tracking-wide truncate transition-colors border-b-2 ${activeZoneId === zone.id
                                    ? "border-[#00695c] text-[#00695c] bg-white"
                                    : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            {zone.name}
                        </button>
                    ))
                )}
            </div>

            {/* Table Card */}
            <div className="flex-1 min-h-0 flex flex-col bg-white rounded-b-sm shadow-sm border border-t-0 border-[#e0e0e0]">

                {/* Loading state */}
                {loading && (
                    <div className="flex-1 flex items-center justify-center gap-2 text-gray-400 text-sm">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Loading data...
                    </div>
                )}

                {/* Error state */}
                {!loading && error && (
                    <div className="flex-1 flex items-center justify-center text-red-500 text-sm">
                        Error: {error}
                    </div>
                )}

                {/* Table */}
                {!loading && !error && (
                    <>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-[12px]">
                                <thead className="sticky top-0 bg-[#f9f9f9] border-b border-[#e8e8e8] z-10">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-48">Timestamp</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-24">
                                            <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-orange-400" /> Temperature</span>
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-24">
                                            <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-blue-400" /> Humidity</span>
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-24">
                                            <span className="flex items-center gap-1"><Sprout className="w-3.5 h-3.5 text-emerald-400" /> Soil Moisture</span>
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-28">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f0f0f0]">
                                    {pageData.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center text-gray-400">No records found</td>
                                        </tr>
                                    )}
                                    {pageData.map((log, idx) => {
                                        const status = getStatus(log, activeProfile);
                                        return (
                                            <tr key={log.id} className="hover:bg-[#fafafa] transition-colors">
                                                <td className="px-4 py-2.5 w-8 text-gray-400">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                                                <td className="px-4 py-2.5 w-48 text-gray-600 font-mono">{formatTimestamp(log.recordedAt)}</td>
                                                <td className="px-4 py-2.5 w-24 text-orange-600 font-medium">
                                                    {log.temperature !== null ? `${log.temperature.toFixed(1)} °C` : "—"}
                                                </td>
                                                <td className="px-4 py-2.5 w-24 text-blue-600 font-medium">
                                                    {log.humidity !== null ? `${log.humidity.toFixed(1)} %` : "—"}
                                                </td>
                                                <td className="px-4 py-2.5 w-24 text-emerald-600 font-medium">
                                                    {log.soilMoisture !== null ? `${log.soilMoisture.toFixed(1)} %` : "—"}
                                                </td>
                                                <td className="px-4 py-2.5 w-28">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_BADGE[status]}`}>
                                                        {STATUS_LABEL[status]}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="shrink-0 border-t border-[#e8e8e8] px-4 py-2.5 flex items-center justify-between bg-[#f9f9f9]">
                            <span className="text-[11px] text-gray-400">
                                {logs.length > 0
                                    ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, logs.length)} of ${logs.length} records`
                                    : "No records"}
                            </span>
                            <div className="flex items-center gap-1">
                                {/* Nút Back */}
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="w-7 h-7 flex items-center justify-center rounded border border-[#e0e0e0] text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>

                                {/* Phần số trang thông minh */}
                                {getVisiblePages(page, totalPages).map((p, idx) => (
                                    p === '...' ? (
                                        <span key={`dots-${idx}`} className="px-1 text-gray-400 text-[11px]">...</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p as number)}
                                            className={`w-7 h-7 flex items-center justify-center rounded border text-[11px] font-medium transition ${p === page
                                                    ? "bg-[#00695c] border-[#00695c] text-white"
                                                    : "border-[#e0e0e0] text-gray-500 hover:bg-white"
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    )
                                ))}

                                {/* Nút Next */}
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="w-7 h-7 flex items-center justify-center rounded border border-[#e0e0e0] text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
