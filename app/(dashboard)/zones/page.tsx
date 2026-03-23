"use client";

import { useState, useMemo } from "react";
import { Plus, Settings, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Zone } from "@/models/zone";
import type { IrrigationProfile as Profile } from "@/models/irrigation-profile";
import type { Schedule } from "@/models/schedule";
import { IrrigationMode } from "@/models/irrigation-profile";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PROFILES: Profile[] = [
  { id: "prof-1", name: "Default — Ornamental", minMoisture: 40, maxMoisture: 80, mode: IrrigationMode.AUTO },
  { id: "prof-2", name: "Leafy Vegetables",     minMoisture: 50, maxMoisture: 90, mode: IrrigationMode.AUTO },
  { id: "prof-3", name: "Rose Nursery",          minMoisture: 45, maxMoisture: 75, mode: IrrigationMode.AUTO },
  { id: "prof-4", name: "Tropical — Orchids",   minMoisture: 60, maxMoisture: 95, mode: IrrigationMode.AUTO },
];

const MOCK_SCHEDULES: Schedule[] = [
  { id: "sched-1", cronExpression: "AI_AUTO" },
  { id: "sched-2", cronExpression: "0 6,18 * * *" },
  { id: "sched-3", cronExpression: "0 7,12,17 * * *" },
  { id: "sched-4", cronExpression: "0 5 * * 1,3,5" },
];

const MOCK_ZONES: Zone[] = [
  { id: "zone-1", name: "Ornamental Garden", profileId: "prof-1", scheduleId: "sched-1", userId: "user-1" },
  { id: "zone-2", name: "Lettuce Beds",       profileId: "prof-2", scheduleId: "sched-2", userId: "user-1" },
  { id: "zone-3", name: "Rose Nursery",       profileId: "prof-3", scheduleId: "sched-1", userId: "user-1" },
  { id: "zone-4", name: "Orchid House",       profileId: "prof-4", scheduleId: "sched-3", userId: "user-1" },
];

const MOCK_DEVICE_COUNTS: Record<string, number> = {
  "zone-1": 3,
  "zone-2": 2,
  "zone-3": 2,
  "zone-4": 3,
};

const PAGE_SIZE = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cronLabel(cron: string): string {
  if (cron === "AI_AUTO") return "AI Auto";
  const p = cron.split(" ");
  if (p.length < 5) return cron;
  const hrs = p[1].split(",").map((h) => `${h.padStart(2, "0")}:${p[0].padStart(2, "0")}`).join(", ");
  const days = p[4] === "*" ? "Daily" : `Days: ${p[4]}`;
  return `${hrs} · ${days}`;
}

function getVisiblePages(current: number, total: number): (number | string)[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, "...", total];
  if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

// ─── Settings Modal ───────────────────────────────────────────────────────────

type SettingsModalProps = {
  zone: Zone;
  profiles: Profile[];
  schedules: Schedule[];
  onClose: () => void;
  onSave: (id: string, data: Partial<Zone>) => void;
  onDelete: (id: string) => void;
};

function SettingsModal({ zone, profiles, schedules, onClose, onSave, onDelete }: SettingsModalProps) {
  const [form, setForm] = useState({
    name:       zone.name,
    profileId:  zone.profileId  ?? "",
    scheduleId: zone.scheduleId ?? "",
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-lg w-96 border border-[#e0e0e0]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#eee] py-3 px-4">
          <span className="font-medium text-sm text-slate-800">Zone Settings</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Zone ID</label>
            <p className="text-xs font-mono text-gray-500 bg-gray-50 rounded px-2 py-1.5 border border-[#eee] break-all">
              {zone.id}
            </p>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Name</label>
            <input
              className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Zone name"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Profile</label>
            <select
              className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
              value={form.profileId}
              onChange={(e) => setForm({ ...form, profileId: e.target.value })}
            >
              <option value="">None</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Schedule</label>
            <select
              className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
              value={form.scheduleId}
              onChange={(e) => setForm({ ...form, scheduleId: e.target.value })}
            >
              <option value="">None</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>{cronLabel(s.cronExpression)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#eee] py-3 px-4 flex justify-between items-center">
          <button
            onClick={() => {
              if (!confirmDelete) { setConfirmDelete(true); return; }
              onDelete(zone.id);
              onClose();
            }}
            className={`flex items-center gap-1 text-xs font-bold uppercase px-3 py-1.5 rounded transition-colors ${
              confirmDelete
                ? "bg-red-600 text-white hover:bg-red-700"
                : "text-red-500 hover:bg-red-50"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmDelete ? "Confirm Delete" : "Delete"}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded border border-[#ddd] text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(zone.id, {
                  name:       form.name,
                  profileId:  form.profileId  || undefined,
                  scheduleId: form.scheduleId || undefined,
                });
                onClose();
              }}
              className="text-xs px-3 py-1.5 rounded bg-[#00695c] text-white font-bold uppercase hover:brightness-110 transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Zone Modal ───────────────────────────────────────────────────────────

type AddZoneModalProps = {
  profiles: Profile[];
  schedules: Schedule[];
  onClose: () => void;
  onAdd: (data: Omit<Zone, "id">) => void;
};

function AddZoneModal({ profiles, schedules, onClose, onAdd }: AddZoneModalProps) {
  const [form, setForm] = useState({ name: "", profileId: "", scheduleId: "" });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-lg w-96 border border-[#e0e0e0]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-[#eee] py-3 px-4">
          <span className="font-medium text-sm text-slate-800">Add Zone</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Name</label>
            <input
              className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Herb Garden"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Profile</label>
            <select
              className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
              value={form.profileId}
              onChange={(e) => setForm({ ...form, profileId: e.target.value })}
            >
              <option value="">None</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Schedule</label>
            <select
              className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
              value={form.scheduleId}
              onChange={(e) => setForm({ ...form, scheduleId: e.target.value })}
            >
              <option value="">None</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>{cronLabel(s.cronExpression)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="border-t border-[#eee] py-3 px-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded border border-[#ddd] text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!form.name.trim()) return;
              onAdd({
                name:       form.name,
                profileId:  form.profileId  || undefined,
                scheduleId: form.scheduleId || undefined,
                userId:     "user-1",
              });
              onClose();
            }}
            className="text-xs px-3 py-1.5 rounded bg-[#00695c] text-white font-bold uppercase hover:brightness-110 transition-all"
          >
            Add Zone
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ZonesPage() {
  const [zones,        setZones]        = useState<Zone[]>(MOCK_ZONES);
  const [profiles]                      = useState<Profile[]>(MOCK_PROFILES);
  const [schedules]                     = useState<Schedule[]>(MOCK_SCHEDULES);
  const [deviceCounts]                  = useState<Record<string, number>>(MOCK_DEVICE_COUNTS);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [page,         setPage]         = useState(1);

  const totalPages = Math.max(1, Math.ceil(zones.length / PAGE_SIZE));
  const pageData   = useMemo(
    () => zones.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [zones, page],
  );

  const findProfile  = (id?: string) => profiles.find((p) => p.id === id);
  const findSchedule = (id?: string) => schedules.find((s) => s.id === id);

  const handleSave = (id: string, data: Partial<Zone>) =>
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...data } : z)));

  const handleDelete = (id: string) =>
    setZones((prev) => prev.filter((z) => z.id !== id));

  const handleAdd = (data: Omit<Zone, "id">) =>
    setZones((prev) => [...prev, { ...data, id: `zone-${Date.now()}` }]);

  return (
    <div className="h-full flex flex-col text-[#333] font-sans">

      {/* Header */}
      <div className="mb-4 shrink-0 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-medium text-slate-800">Zones</h2>
          <p className="text-xs text-gray-400 mt-0.5">Irrigation zones and their assigned profiles</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#00695c] text-white border-none px-3.5 py-1.5 text-[11px] font-bold uppercase rounded-sm inline-flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer"
        >
          <Plus className="w-3 h-3" /> Add Zone
        </button>
      </div>

      {/* Table Card */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-sm shadow-sm border border-[#e0e0e0]">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-[#f9f9f9] border-b border-[#e8e8e8] z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Zone ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Profile</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Schedule</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Devices</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    No zones found
                  </td>
                </tr>
              )}
              {pageData.map((zone, idx) => {
                const profile  = findProfile(zone.profileId);
                const schedule = findSchedule(zone.scheduleId);
                return (
                  <tr key={zone.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-4 py-2.5 text-gray-400">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                        <td className="px-4 py-2.5 font-mono text-gray-500 text-[11px]">{zone.id}</td>
                    <td className="px-4 py-2.5 font-medium">{zone.name}</td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {profile?.name ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {schedule ? cronLabel(schedule.cronExpression) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{deviceCounts[zone.id] ?? 0}</td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => setSelectedZone(zone)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
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
            {zones.length > 0
              ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, zones.length)} of ${zones.length} zones`
              : "No zones"}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded border border-[#e0e0e0] text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {getVisiblePages(page, totalPages).map((p, idx) =>
              p === "..." ? (
                <span key={`dots-${idx}`} className="px-1 text-gray-400 text-[11px]">...</span>
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
            )}
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

      {/* Settings Modal */}
      {selectedZone && (
        <SettingsModal
          zone={selectedZone}
          profiles={profiles}
          schedules={schedules}
          onClose={() => setSelectedZone(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {/* Add Zone Modal */}
      {showAddModal && (
        <AddZoneModal
          profiles={profiles}
          schedules={schedules}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
