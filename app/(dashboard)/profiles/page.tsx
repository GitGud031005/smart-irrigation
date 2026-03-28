"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Settings, Trash2, X, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import type { IrrigationProfile as Profile } from "@/models/irrigation-profile";
import { IrrigationMode } from "@/models/irrigation-profile";
import { apiCall } from "@/lib/api";

const PAGE_SIZE = 15;

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
  onSave: (id: string, data: Partial<Profile>) => Promise<void>;
  onDelete: (id: string) => void;
};

function SettingsModal({ profile, onClose, onSave, onDelete }: SettingsModalProps) {
  const [form, setForm] = useState({
    name:        profile.name ?? "",
    minMoisture: profile.minMoisture,
    maxMoisture: profile.maxMoisture,
    mode:        profile.mode,
  });
  const [saving,        setSaving]        = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (form.minMoisture > form.maxMoisture) {
      setError("Min Moisture must be less than or equal to Max Moisture.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(profile.id, { name: form.name || undefined, minMoisture: form.minMoisture, maxMoisture: form.maxMoisture, mode: form.mode });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

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
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">{error}</p>
          )}
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
              onClick={handleSave}
              disabled={saving}
              className="text-xs px-3 py-1.5 rounded bg-[#00695c] text-white font-bold uppercase hover:brightness-110 transition-all disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
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
  onAdd: (data: Omit<Profile, "id">) => Promise<void>;
};

function AddProfileModal({ onClose, onAdd }: AddProfileModalProps) {
  const [form, setForm] = useState<{ name: string; minMoisture: number | ""; maxMoisture: number | ""; mode: IrrigationMode | "" }>({
    name: "", minMoisture: "", maxMoisture: "", mode: "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const handleAdd = async () => {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (form.minMoisture === "" || form.maxMoisture === "" || !form.mode) {
      setError("Please fill in Min Moisture, Max Moisture, and Mode.");
      return;
    }
    if ((form.minMoisture as number) > (form.maxMoisture as number)) {
      setError("Min Moisture must be less than or equal to Max Moisture.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onAdd({ name: form.name.trim(), minMoisture: form.minMoisture, maxMoisture: form.maxMoisture, mode: form.mode });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add profile");
    } finally {
      setSaving(false);
    }
  };

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
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">{error}</p>
          )}
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
              <input type="number" className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]" value={form.minMoisture} placeholder="e.g. 30" onChange={(e) => setForm({ ...form, minMoisture: e.target.value === "" ? "" : Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Max Moisture (%)</label>
              <input type="number" className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]" value={form.maxMoisture} placeholder="e.g. 70" onChange={(e) => setForm({ ...form, maxMoisture: e.target.value === "" ? "" : Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Mode</label>
            <select className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as IrrigationMode | "" })}>
              <option value="">— Select mode —</option>
              <option value={IrrigationMode.AUTO}>Auto</option>
              <option value={IrrigationMode.MANUAL}>Manual</option>
              <option value={IrrigationMode.AI}>AI</option>
            </select>
          </div>
        </div>
        <div className="border-t border-[#eee] py-3 px-4 flex justify-end gap-2">
          <button onClick={onClose} className="text-xs px-3 py-1.5 rounded border border-[#ddd] text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={handleAdd}
            disabled={saving || !form.name.trim() || form.minMoisture === "" || form.maxMoisture === "" || !form.mode}
            className={`text-xs px-3 py-1.5 rounded bg-[#00695c] text-white font-bold uppercase hover:brightness-110 transition-all ${saving || !form.name.trim() || form.minMoisture === "" || form.maxMoisture === "" || !form.mode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {saving ? "Adding…" : "Add Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Page ---

export default function ProfilesPage() {
  const [profiles,        setProfiles]        = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [page,            setPage]            = useState(1);

  useEffect(() => {
    document.title = "BK-IRRIGATION | Profiles";
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall<Profile[]>('/api/profiles');
      setProfiles(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfiles(); }, []);

  const totalPages = Math.max(1, Math.ceil(profiles.length / PAGE_SIZE));
  const pageData   = useMemo(() => profiles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [profiles, page]);

  const handleSave = async (id: string, data: Partial<Profile>): Promise<void> => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    try {
      await apiCall(`/api/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch (err) {
      loadProfiles();
      throw err;
    }
  };

  const handleDelete = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    apiCall(`/api/profiles/${id}`, { method: 'DELETE' })
      .catch(() => { loadProfiles(); });
  };

  const handleAdd = async (data: Omit<Profile, 'id'>): Promise<void> => {
    const newProfile = await apiCall<Profile>('/api/profiles', { method: 'POST', body: JSON.stringify(data) });
    setProfiles(prev => [...prev, newProfile]);
  };

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
        {loading && (
          <div className="flex-1 flex items-center justify-center gap-2 text-gray-400 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading profiles…
          </div>
        )}
        {!loading && error && (
          <div className="flex-1 flex items-center justify-center text-red-500 text-sm">
            Error: {error}
          </div>
        )}
        {!loading && !error && (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-[#f9f9f9] border-b border-[#e8e8e8] z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-56">Profile ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-32">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-32">Min Moisture</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-32">Max Moisture</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-12">Mode</th>
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
                  <td className="px-4 py-2.5 w-8 text-gray-400">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-4 py-2.5 w-56 font-mono text-gray-500 text-[11px]">{profile.id}</td>
                  <td className="px-4 py-2.5 w-32 font-medium">{profile.name ?? <span className="text-gray-300">-</span>}</td>
                  <td className="px-4 py-2.5 w-32 text-blue-600 font-medium">{profile.minMoisture}%</td>
                  <td className="px-4 py-2.5 w-32 text-emerald-600 font-medium">{profile.maxMoisture}%</td>
                  <td className="px-4 py-2.5 w-12">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${MODE_BADGE[profile.mode]}`}>
                      {profile.mode}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 w-10 flex flex-col items-center">
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
        )}

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
