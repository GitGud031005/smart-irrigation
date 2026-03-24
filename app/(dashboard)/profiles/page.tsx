"use client";

import { useState, useMemo } from "react";
import { Plus, Settings, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { IrrigationProfile as Profile } from "@/models/irrigation-profile";
import { IrrigationMode } from "@/models/irrigation-profile";

// --- Mock Data ---

const MOCK_PROFILES: Profile[] = [
  { id: "a3f1c9f2-4b2e-4d7a-9a6d-1b2c3d4e5f61", name: "Default — Ornamental", minMoisture: 40, maxMoisture: 80, mode: IrrigationMode.AUTO },
  { id: "b41f2d0a-5c3f-4e8b-8b7e-2c3d4e5f6a72", name: "Leafy Vegetables",     minMoisture: 50, maxMoisture: 90, mode: IrrigationMode.AUTO },
  { id: "c52e3a1b-6d4f-5f9c-7c8f-3d4e5f6a7b83", name: "Rose Nursery",          minMoisture: 45, maxMoisture: 75, mode: IrrigationMode.AUTO },
  { id: "d6a4b2c5-7e5f-6a0d-9d0a-4e5f6a7b8c94", name: "Tropical — Orchids",   minMoisture: 60, maxMoisture: 95, mode: IrrigationMode.AUTO },
];

const PAGE_SIZE = 10;

const MODE_BADGE: Record<IrrigationMode, string> = {
  [IrrigationMode.AUTO]:   "bg-emerald-100 text-emerald-700",
  [IrrigationMode.MANUAL]: "bg-blue-100 text-blue-700",
  [IrrigationMode.AI]:     "bg-purple-100 text-purple-700",
};

// --- Helpers ---

function getVisiblePages(current: number, total: number): (number | string)[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, "...", total];
  if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

// --- Settings Modal ---

type SettingsModalProps = {
  profile: Profile;
  onClose: () => void;
  onSave: (id: string, data: Partial<Profile>) => void;
  onDelete: (id: string) => void;
};

function SettingsModal({ profile, onClose, onSave, onDelete }: SettingsModalProps) {
  const [form, setForm] = useState({
    name:        profile.name ?? "",
    minMoisture: profile.minMoisture,
    maxMoisture: profile.maxMoisture,
    mode:        profile.mode,
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
        <div className="flex justify-between items-center border-b border-[#eee] py-3 px-4">
          <span className="font-medium text-sm text-slate-800">Profile Settings</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Profile ID</label>
            <p className="text-xs font-mono text-gray-500 bg-gray-50 rounded px-2 py-1.5 border border-[#eee] break-all">{profile.id}</p>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Name</label>
            <input
              className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Profile name"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Min Moisture (%)</label>
              <input
                type="number"
                className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
                value={form.minMoisture}
                onChange={(e) => setForm({ ...form, minMoisture: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Max Moisture (%)</label>
              <input
                type="number"
                className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
                value={form.maxMoisture}
                onChange={(e) => setForm({ ...form, maxMoisture: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Mode</label>
            <select
              className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
              value={form.mode}
              onChange={(e) => setForm({ ...form, mode: e.target.value as IrrigationMode })}
            >
              <option value={IrrigationMode.AUTO}>Auto</option>
              <option value={IrrigationMode.MANUAL}>Manual</option>
              <option value={IrrigationMode.AI}>AI</option>
            </select>
          </div>
        </div>
        <div className="border-t border-[#eee] py-3 px-4 flex justify-between items-center">
          <button
            onClick={() => {
              if (!confirmDelete) { setConfirmDelete(true); return; }
              onDelete(profile.id);
              onClose();
            }}
            className={`flex items-center gap-1 text-xs font-bold uppercase px-3 py-1.5 rounded transition-colors ${
              confirmDelete ? "bg-red-600 text-white hover:bg-red-700" : "text-red-500 hover:bg-red-50"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmDelete ? "Confirm Delete" : "Delete"}
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded border border-[#ddd] text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              onClick={() => {
                onSave(profile.id, { name: form.name || undefined, minMoisture: form.minMoisture, maxMoisture: form.maxMoisture, mode: form.mode });
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

// --- Add Profile Modal ---

type AddProfileModalProps = {
  onClose: () => void;
  onAdd: (data: Omit<Profile, "id">) => void;
};

function AddProfileModal({ onClose, onAdd }: AddProfileModalProps) {
  const [form, setForm] = useState({ name: "", minMoisture: 40, maxMoisture: 80, mode: IrrigationMode.AUTO });

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
          <span className="font-medium text-sm text-slate-800">Add Profile</span>
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
              placeholder="e.g. Tropical Plants"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Min Moisture (%)</label>
              <input type="number" className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]" value={form.minMoisture} onChange={(e) => setForm({ ...form, minMoisture: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Max Moisture (%)</label>
              <input type="number" className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]" value={form.maxMoisture} onChange={(e) => setForm({ ...form, maxMoisture: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Mode</label>
            <select className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as IrrigationMode })}>
              <option value={IrrigationMode.AUTO}>Auto</option>
              <option value={IrrigationMode.MANUAL}>Manual</option>
              <option value={IrrigationMode.AI}>AI</option>
            </select>
          </div>
        </div>
        <div className="border-t border-[#eee] py-3 px-4 flex justify-end gap-2">
          <button onClick={onClose} className="text-xs px-3 py-1.5 rounded border border-[#ddd] text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={() => {
              if (!form.name.trim()) return;
              onAdd({ name: form.name, minMoisture: form.minMoisture, maxMoisture: form.maxMoisture, mode: form.mode });
              onClose();
            }}
            className="text-xs px-3 py-1.5 rounded bg-[#00695c] text-white font-bold uppercase hover:brightness-110 transition-all"
          >
            Add Profile
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Page ---

export default function ProfilesPage() {
  const [profiles,        setProfiles]        = useState<Profile[]>(MOCK_PROFILES);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [page,            setPage]            = useState(1);

  const totalPages = Math.max(1, Math.ceil(profiles.length / PAGE_SIZE));
  const pageData   = useMemo(() => profiles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [profiles, page]);

  const handleSave   = (id: string, data: Partial<Profile>) => setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  const handleDelete = (id: string) => setProfiles((prev) => prev.filter((p) => p.id !== id));
  const handleAdd    = (data: Omit<Profile, "id">) => setProfiles((prev) => [...prev, { ...data, id: `prof-${Date.now()}` }]);

  return (
    <div className="h-full flex flex-col text-[#333] font-sans">

      {/* Header */}
      <div className="mb-4 shrink-0 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-medium text-slate-800">Profiles</h2>
          <p className="text-xs text-gray-400 mt-0.5">Irrigation profile templates and moisture thresholds</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#00695c] text-white border-none px-3.5 py-1.5 text-[11px] font-bold uppercase rounded-sm inline-flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer"
        >
          <Plus className="w-3 h-3" /> Add Profile
        </button>
      </div>

      {/* Table Card */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-sm shadow-sm border border-[#e0e0e0]">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-[#f9f9f9] border-b border-[#e8e8e8] z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Profile ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Min Moisture</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Max Moisture</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Mode</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">No profiles found</td>
                </tr>
              )}
              {pageData.map((profile, idx) => (
                <tr key={profile.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-4 py-2.5 text-gray-400">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500 text-[11px]">{profile.id}</td>
                  <td className="px-4 py-2.5 font-medium">{profile.name ?? <span className="text-gray-300">-</span>}</td>
                  <td className="px-4 py-2.5 text-blue-600 font-medium">{profile.minMoisture}%</td>
                  <td className="px-4 py-2.5 text-emerald-600 font-medium">{profile.maxMoisture}%</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${MODE_BADGE[profile.mode]}`}>
                      {profile.mode}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => setSelectedProfile(profile)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="shrink-0 border-t border-[#e8e8e8] px-4 py-2.5 flex items-center justify-between bg-[#f9f9f9]">
          <span className="text-[11px] text-gray-400">
            {profiles.length > 0
              ? `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, profiles.length)} of ${profiles.length} profiles`
              : "No profiles"}
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
                    p === page ? "bg-[#00695c] border-[#00695c] text-white" : "border-[#e0e0e0] text-gray-500 hover:bg-white"
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

      {selectedProfile && (
        <SettingsModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {showAddModal && (
        <AddProfileModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
