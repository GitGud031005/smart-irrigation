"use client";

import { useState, useEffect } from "react";
import { Plus, Settings, Trash2, X, RefreshCw } from "lucide-react";
import { apiCall } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type DeviceStatus = "ACTIVE" | "OFFLINE" | "ERROR";

type Device = {
  id: string;
  deviceType: string | null;
  zoneId: string | null;
  status: DeviceStatus;
  lastActiveAt: string | null;
};

type Zone = {
  id: string;
  name: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const ZONE_TABS = [
  { id: "1",   name: "Z1: Ornamental" },
  { id: "2",   name: "Z2: Lettuce" },
  { id: "3",   name: "Z3: Rose Nursery" },
  { id: "4",   name: "Z4: Orchids" },
];

const STATUS_BADGE: Record<DeviceStatus, string> = {
  ACTIVE:  "bg-emerald-100 text-emerald-700",
  OFFLINE: "bg-gray-100 text-gray-500",
  ERROR:   "bg-red-100 text-red-700",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Settings Modal ───────────────────────────────────────────────────────────

type SettingsModalProps = {
  device: Device;
  zones: Zone[];
  onClose: () => void;
  onSave: (id: string, data: { deviceType: string | null; zoneId: string | null; status: DeviceStatus }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function SettingsModal({ device, zones, onClose, onSave, onDelete }: SettingsModalProps) {
  const [form, setForm] = useState({
    deviceType: device.deviceType ?? "",
    zoneId:     device.zoneId ?? "",
    status:     device.status,
  });
  const [saving,         setSaving]         = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(device.id, {
      deviceType: form.deviceType || null,
      zoneId:     form.zoneId     || null,
      status:     form.status,
    });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    await onDelete(device.id);
    setDeleting(false);
    onClose();
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
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#eee] py-3 px-4">
          <span className="font-medium text-sm text-slate-800">Device Settings</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Read-only ID */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Device ID</label>
            <p className="text-xs font-mono text-gray-500 bg-gray-50 rounded px-2 py-1.5 border border-[#eee] break-all">{device.id}</p>
          </div>
          {/* deviceType */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Device Type</label>
            <input
              className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
              value={form.deviceType}
              onChange={(e) => setForm({ ...form, deviceType: e.target.value })}
              placeholder="e.g. Sensor Node"
            />
          </div>
          {/* zoneId */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Zone</label>
            <select
              className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
              value={form.zoneId}
              onChange={(e) => setForm({ ...form, zoneId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>
          {/* status */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Status</label>
            <select
              className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as DeviceStatus })}
            >
              <option value="ACTIVE">Active</option>
              <option value="OFFLINE">Offline</option>
              <option value="ERROR">Error</option>
            </select>
          </div>
          {/* Read-only lastActiveAt */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Last Active</label>
            <p className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1.5 border border-[#eee]">
              {formatDate(device.lastActiveAt)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#eee] py-3 px-4 flex justify-between items-center">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex items-center gap-1 text-xs font-bold uppercase px-3 py-1.5 rounded transition-colors ${
              confirmDelete
                ? "bg-red-600 text-white hover:bg-red-700"
                : "text-red-500 hover:bg-red-50"
            } disabled:opacity-60`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? "Deleting…" : confirmDelete ? "Confirm Delete" : "Delete"}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded border border-[#ddd] text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
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

// ─── Add Device Modal ─────────────────────────────────────────────────────────

type AddDeviceModalProps = {
  zones: Zone[];
  onClose: () => void;
  onAdd: (data: { deviceType: string | null; zoneId: string | null; status: DeviceStatus }) => Promise<void>;
};

function AddDeviceModal({ zones, onClose, onAdd }: AddDeviceModalProps) {
  const [form, setForm] = useState({ deviceType: "", zoneId: "", status: "ACTIVE" as DeviceStatus });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    setSaving(true);
    await onAdd({
      deviceType: form.deviceType || null,
      zoneId:     form.zoneId     || null,
      status:     form.status,
    });
    setSaving(false);
    onClose();
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
          <span className="font-medium text-sm text-slate-800">Add Device</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Device Type</label>
            <input
              className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
              value={form.deviceType}
              onChange={(e) => setForm({ ...form, deviceType: e.target.value })}
              placeholder="e.g. Sensor Node"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Zone</label>
            <select
              className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
              value={form.zoneId}
              onChange={(e) => setForm({ ...form, zoneId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Status</label>
            <select
              className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as DeviceStatus })}
            >
              <option value="ACTIVE">Active</option>
              <option value="OFFLINE">Offline</option>
              <option value="ERROR">Error</option>
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
            onClick={handleAdd}
            disabled={saving}
            className="text-xs px-3 py-1.5 rounded bg-[#00695c] text-white font-bold uppercase hover:brightness-110 transition-all disabled:opacity-60"
          >
            {saving ? "Adding…" : "Add Device"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EntitiesPage() {
  const [activeZoneIdx,  setActiveZoneIdx]  = useState(0);
  const [devices,        setDevices]        = useState<Device[]>([]);
  const [zones,          setZones]          = useState<Zone[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showAddModal,   setShowAddModal]   = useState(false);

  const loadDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall<Device[]>("/api/devices");
      setDevices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const loadZones = async () => {
    try {
      const data = await apiCall<Zone[]>("/api/zones");
      setZones(data);
    } catch (err) {
      // Zones loading failure should not block devices display
      console.error("Failed to load zones:", err);
    }
  };

  useEffect(() => {
    loadDevices();
    loadZones();
  }, []);

  const handleSave = async (
    id: string,
    data: { deviceType: string | null; zoneId: string | null; status: DeviceStatus }
  ) => {
    await apiCall(`/api/devices/${id}`, { method: "PUT", body: JSON.stringify(data) });
    await loadDevices();
  };

  const handleDelete = async (id: string) => {
    await apiCall(`/api/devices/${id}`, { method: "DELETE" });
    await loadDevices();
  };

  const handleAdd = async (data: { deviceType: string | null; zoneId: string | null; status: DeviceStatus }) => {
    await apiCall("/api/devices", { method: "POST", body: JSON.stringify(data) });
    await loadDevices();
  };

  return (
    <div className="h-full flex flex-col text-[#333] font-sans">

      {/* Header */}
      <div className="mb-4 shrink-0 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-medium text-slate-800">Entities</h2>
          <p className="text-xs text-gray-400 mt-0.5">Registered devices and their current status</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#00695c] text-white border-none px-3.5 py-1.5 text-[11px] font-bold uppercase rounded-sm inline-flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer"
        >
          <Plus className="w-3 h-3" /> Add Device
        </button>
      </div>

      {/* Zone Tabs */}
      <div className="shrink-0 flex border-b border-[#e0e0e0]">
        {ZONE_TABS.map((zone, idx) => (
          <button
            key={zone.id}
            onClick={() => setActiveZoneIdx(idx)}
            className={`flex-1 py-2.5 text-[12px] font-bold uppercase tracking-wide transition-colors border-b-2 ${
              activeZoneIdx === idx
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

        {loading && (
          <div className="flex-1 flex items-center justify-center gap-2 text-gray-400 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading devices…
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Device ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Zone</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Last Active</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {devices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                      No devices registered
                    </td>
                  </tr>
                )}
                {devices.map((device, idx) => (
                  <tr key={device.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-4 py-2.5 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-gray-500 text-[11px]">{device.id.slice(0, 8)}…</td>
                    <td className="px-4 py-2.5">{device.deviceType ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-2.5 text-gray-500">{device.zoneId ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_BADGE[device.status]}`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400">{formatDate(device.lastActiveAt)}</td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => setSelectedDevice(device)}
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
      </div>

      {/* Settings Modal */}
      {selectedDevice && (
        <SettingsModal
          device={selectedDevice}
          zones={zones}
          onClose={() => setSelectedDevice(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {/* Add Device Modal */}
      {showAddModal && (
        <AddDeviceModal
          zones={zones}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
