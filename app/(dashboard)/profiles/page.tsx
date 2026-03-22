// Profiles & Configuration Screen (Mockup 4.4, 4.5)
// Three tabs: Zones, Profiles, Schedules
// Zones tab: list of irrigation zones with CRUD
// Profiles tab: irrigation profile cards (min/max moisture, watering duration)
// Schedules tab: cron-based schedules with toggleable active status
"use client";

import { useState, useEffect } from "react";
import { MapPin, Sliders, Clock, Plus, Edit3, Trash2, X } from "lucide-react";
import type { IrrigationProfile as Profile } from "@/models/irrigation-profile";
import { IrrigationMode } from "@/models/irrigation-profile";
import type { Schedule } from "@/models/schedule";
import type { Zone } from "@/models/zone";

// --- Mock Data ---
const initialProfiles: Profile[] = [
  { id: "prof-1", name: "Default — Ornamental", minMoisture: 40, maxMoisture: 80, mode: IrrigationMode.AUTO },
  { id: "prof-2", name: "Leafy Vegetables", minMoisture: 50, maxMoisture: 90, mode: IrrigationMode.AUTO },
  { id: "prof-3", name: "Rose Nursery", minMoisture: 45, maxMoisture: 75, mode: IrrigationMode.AUTO },
  { id: "prof-4", name: "Tropical — Orchids", minMoisture: 60, maxMoisture: 95, mode: IrrigationMode.AUTO },
];

const initialSchedules: Schedule[] = [
  { id: "sched-1", cronExpression: "AI_AUTO", isActive: true },
  { id: "sched-2", cronExpression: "0 6,18 * * *", isActive: true },
  { id: "sched-3", cronExpression: "0 7,12,17 * * *", isActive: true },
  { id: "sched-4", cronExpression: "0 5 * * 1,3,5", isActive: false },
];

const initialZones: Zone[] = [
  { id: "zone-1", name: "Ornamental Garden", profileId: "prof-1", scheduleId: "sched-1", userId: "user-1", currentMoisture: 65, currentHumidity: 55, currentTemperature: 28 },
  { id: "zone-2", name: "Lettuce Beds", profileId: "prof-2", scheduleId: "sched-2", userId: "user-1", currentMoisture: 72, currentHumidity: 60, currentTemperature: 25 },
  { id: "zone-3", name: "Rose Nursery", profileId: "prof-3", scheduleId: "sched-1", userId: "user-1", currentMoisture: 58, currentHumidity: 50, currentTemperature: 26 },
  { id: "zone-4", name: "Orchid House", profileId: "prof-4", scheduleId: "sched-3", userId: "user-1", currentMoisture: 70, currentHumidity: 75, currentTemperature: 22 },
];

const deviceCounts: Record<string, number> = { "zone-1": 3, "zone-2": 2, "zone-3": 2, "zone-4": 3 };
const sensorCounts: Record<string, number> = { "zone-1": 5, "zone-2": 4, "zone-3": 3, "zone-4": 6 };

// --- Helper Functions ---
const cronDesc = (c: string) => {
  if (c === "AI_AUTO") return "AI Auto-schedule";
  const p = c.split(" ");
  if (p.length < 5) return c;
  const hrs = p[1].split(",").map((h) => h.padStart(2, "0") + ":" + p[0].padStart(2, "0")).join(", ");
  const days = p[4] === "*" ? "Every day" : "Days: " + p[4];
  return hrs + " · " + days;
};

export default function ConfigurationPage() {
  useEffect(() => {
    document.title = "Zone & Profile configuration";
  }, []);
  // Navigation State
  const [activeTab, setActiveTab] = useState<"zones" | "profiles" | "schedules">("zones");

  // Data State
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [zones, setZones] = useState<Zone[]>(initialZones);

  // Modal Visibility State
  const [isZoneModalOpen, setZoneModalOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);

  // Form Data State (holds data currently being typed in the modals)
  const [currentZone, setCurrentZone] = useState<Partial<Zone>>({});
  const [currentProfile, setCurrentProfile] = useState<Partial<Profile>>({});
  const [currentSchedule, setCurrentSchedule] = useState<Partial<Schedule>>({});

  // ================= ACTION HANDLERS =================
  
  // --- ZONES ---
  const openZoneModal = (zone?: Zone) => {
    setCurrentZone(zone || { name: "", profileId: profiles[0]?.id || "", scheduleId: schedules[0]?.id || "", userId: "user-1", currentMoisture: 0, currentHumidity: 0, currentTemperature: 0 });
    setZoneModalOpen(true);
  };

  const saveZone = () => {
    if (!currentZone.name) return alert("Name is required!");
    if (currentZone.id) {
      setZones(zones.map(z => z.id === currentZone.id ? { ...z, ...currentZone } as Zone : z));
    } else {
      const newId = `zone-${Date.now()}`;
      setZones([...zones, { ...currentZone, id: newId, userId: "user-1", currentMoisture: 0, currentHumidity: 0, currentTemperature: 0 } as Zone]);
    }
    setZoneModalOpen(false);
  };

  const deleteZone = (id: string) => {
    if (window.confirm("Are you sure you want to delete this zone?")) {
      setZones(zones.filter(z => z.id !== id));
    }
  };

  // --- PROFILES ---
  const openProfileModal = (profile?: Profile) => {
    setCurrentProfile(profile || { name: "", minMoisture: 40, maxMoisture: 80, mode: IrrigationMode.AUTO });
    setProfileModalOpen(true);
  };

  const saveProfile = () => {
    if (!currentProfile.name) return alert("Name is required!");
    if (currentProfile.id) {
      setProfiles(profiles.map(p => p.id === currentProfile.id ? { ...p, ...currentProfile } as Profile : p));
    } else {
      const newId = `prof-${Date.now()}`;
      setProfiles([...profiles, { ...currentProfile, id: newId, mode: currentProfile.mode || IrrigationMode.AUTO } as Profile]);
    }
    setProfileModalOpen(false);
  };

  const deleteProfile = (id: string) => {
    if (zones.some(z => z.profileId === id)) return alert("Cannot delete: Profile is assigned to a zone.");
    if (window.confirm("Are you sure you want to delete this profile?")) {
      setProfiles(profiles.filter(p => p.id !== id));
    }
  };

  // --- SCHEDULES ---
  const openScheduleModal = (schedule?: Schedule) => {
    setCurrentSchedule(schedule || { cronExpression: "", isActive: true });
    setScheduleModalOpen(true);
  };

  const saveSchedule = () => {
    if (!currentSchedule.cronExpression) return alert("Cron expression is required!");
    if (currentSchedule.id) {
      setSchedules(schedules.map(s => s.id === currentSchedule.id ? { ...s, ...currentSchedule } as Schedule : s));
    } else {
      const newId = `sched-${Date.now()}`;
      setSchedules([...schedules, { ...currentSchedule, id: newId, isActive: currentSchedule.isActive !== undefined ? currentSchedule.isActive : true } as Schedule]);
    }
    setScheduleModalOpen(false);
  };

  const deleteSchedule = (id: string) => {
    if (zones.some(z => z.scheduleId === id)) return alert("Cannot delete: Schedule is assigned to a zone.");
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      setSchedules(schedules.filter(s => s.id !== id));
    }
  };

  // ================= RENDER =================

  return (
    <div className="text-[#333] font-sans">
      {/* Tab Navigation */}
      <div className="flex border-b-2 border-[#e0e0e0] mb-4">
        <button onClick={() => setActiveTab("zones")} className={`px-5 py-2.5 text-[13px] font-medium relative transition-colors flex items-center gap-1.5 ${activeTab === "zones" ? "text-[#00695c] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-[#00695c]" : "text-[#666] hover:text-[#00695c]"}`}>
          <MapPin className="w-3.5 h-3.5" /> Zones
        </button>
        <button onClick={() => setActiveTab("profiles")} className={`px-5 py-2.5 text-[13px] font-medium relative transition-colors flex items-center gap-1.5 ${activeTab === "profiles" ? "text-[#00695c] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-[#00695c]" : "text-[#666] hover:text-[#00695c]"}`}>
          <Sliders className="w-3.5 h-3.5" /> Profiles
        </button>
        <button onClick={() => setActiveTab("schedules")} className={`px-5 py-2.5 text-[13px] font-medium relative transition-colors flex items-center gap-1.5 ${activeTab === "schedules" ? "text-[#00695c] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-[#00695c]" : "text-[#666] hover:text-[#00695c]"}`}>
          <Clock className="w-3.5 h-3.5" /> Schedules
        </button>
      </div>

      {/* ================= TAB: ZONES ================= */}
      {activeTab === "zones" && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-base font-medium text-slate-800">Zone Management</h2>
              <p className="text-xs text-gray-400 mt-0.5">Quản lý các vùng tưới — đồng bộ bảng ZONE</p>
            </div>
            <button onClick={() => openZoneModal()} className="bg-[#00695c] text-white border-none px-3.5 py-1.5 text-[11px] font-bold uppercase rounded-sm inline-flex items-center gap-1 hover:brightness-110">
              <Plus className="w-3 h-3" /> Add Zone
            </button>
          </div>
          <div className="bg-white rounded-sm shadow-sm border border-[#e0e0e0] overflow-hidden">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="text-left p-2.5 text-[10px] uppercase tracking-wide text-[#999] font-bold border-b border-[#eee] bg-[#fafafa]">ID</th>
                  <th className="text-left p-2.5 text-[10px] uppercase tracking-wide text-[#999] font-bold border-b border-[#eee] bg-[#fafafa]">Name</th>
                  <th className="text-left p-2.5 text-[10px] uppercase tracking-wide text-[#999] font-bold border-b border-[#eee] bg-[#fafafa]">Tag</th>
                  <th className="text-left p-2.5 text-[10px] uppercase tracking-wide text-[#999] font-bold border-b border-[#eee] bg-[#fafafa]">Profile</th>
                  <th className="text-left p-2.5 text-[10px] uppercase tracking-wide text-[#999] font-bold border-b border-[#eee] bg-[#fafafa]">Schedule</th>
                  <th className="text-left p-2.5 text-[10px] uppercase tracking-wide text-[#999] font-bold border-b border-[#eee] bg-[#fafafa]">Devices</th>
                  <th className="text-left p-2.5 text-[10px] uppercase tracking-wide text-[#999] font-bold border-b border-[#eee] bg-[#fafafa]">Sensors</th>
                  <th className="text-left p-2.5 text-[10px] uppercase tracking-wide text-[#999] font-bold border-b border-[#eee] bg-[#fafafa] w-25">Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id} className="hover:bg-[#f9fbe7] border-b border-[#f0f0f0]">
                    <td className="p-2.5 font-mono text-xs text-gray-400">{z.id.slice(0, 8)}</td>
                    <td className="p-2.5 font-medium">{z.name}</td>
                    <td className="p-2.5"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold bg-[#e3f2fd] text-[#1565c0]">—</span></td>
                    <td className="p-2.5 text-xs">{profiles.find((p) => p.id === z.profileId)?.name || "—"}</td>
                    <td className="p-2.5 text-xs">{cronDesc(schedules.find((s) => s.id === z.scheduleId)?.cronExpression || "")}</td>
                    <td className="p-2.5 text-center">{deviceCounts[z.id] || 0}</td>
                    <td className="p-2.5 text-center">{sensorCounts[z.id] || 0}</td>
                    <td className="p-2.5">
                      <div className="flex gap-1">
                        <button onClick={() => openZoneModal(z)} className="bg-[#00695c] text-white p-1 rounded-sm hover:brightness-110"><Edit3 className="w-3 h-3" /></button>
                        <button onClick={() => deleteZone(z.id)} className="bg-[#c62828] text-white p-1 rounded-sm hover:brightness-110"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB: PROFILES ================= */}
      {activeTab === "profiles" && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-base font-medium text-slate-800">Profile Templates</h2>
              <p className="text-xs text-gray-400 mt-0.5">Cấu hình ngưỡng cảm biến — đồng bộ bảng PROFILE</p>
            </div>
            <button onClick={() => openProfileModal()} className="bg-[#00695c] text-white border-none px-3.5 py-1.5 text-[11px] font-bold uppercase rounded-sm inline-flex items-center gap-1 hover:brightness-110">
              <Plus className="w-3 h-3" /> Add Profile
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profiles.map((p) => {
              const usedBy = zones.filter((z) => z.profileId === p.id).map((z) => z.name);
              return (
                <div key={p.id} className="bg-white rounded-sm shadow-sm border border-[#e0e0e0] overflow-hidden">
                  <div className="border-b border-[#eee] py-2.5 px-4 text-sm flex justify-between items-center bg-[#fafafa]">
                    <span className="font-medium">{p.name}</span>
                    <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold ${usedBy.length ? 'bg-[#e0f2f1] text-[#00695c]' : 'bg-[#f5f5f5] text-[#666]'}`}>
                      {usedBy.length ? `${usedBy.length} zone(s)` : 'Unused'}
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><div className="text-[10px] text-[#999] uppercase font-bold tracking-wide mb-0.5">Moisture</div><div className="text-[13px] font-medium">{p.minMoisture}% — {p.maxMoisture}%</div></div>
                      <div><div className="text-[10px] text-[#999] uppercase font-bold tracking-wide mb-0.5">Mode</div><div className="text-[13px] font-medium">{p.mode}</div></div>
                    </div>
                    {usedBy.length > 0 && <div className="text-[10px] text-gray-400">Used by: {usedBy.join(", ")}</div>}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => openProfileModal(p)} className="bg-[#00695c] text-white px-2 py-1 text-[10px] font-bold uppercase rounded-sm inline-flex items-center gap-1 hover:brightness-110"><Edit3 className="w-3 h-3" /> Edit</button>
                      <button onClick={() => deleteProfile(p.id)} className="bg-[#c62828] text-white px-2 py-1 text-[10px] font-bold uppercase rounded-sm inline-flex items-center gap-1 hover:brightness-110"><Trash2 className="w-3 h-3" /> Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB: SCHEDULES ================= */}
      {activeTab === "schedules" && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-base font-medium text-slate-800">Schedule Configuration</h2>
              <p className="text-xs text-gray-400 mt-0.5">Lập lịch tưới tự động — đồng bộ bảng SCHEDULE</p>
            </div>
            <button onClick={() => openScheduleModal()} className="bg-[#00695c] text-white border-none px-3.5 py-1.5 text-[11px] font-bold uppercase rounded-sm inline-flex items-center gap-1 hover:brightness-110">
              <Plus className="w-3 h-3" /> Add Schedule
            </button>
          </div>
          <div className="bg-white rounded-sm shadow-sm border border-[#e0e0e0] overflow-hidden">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="text-left p-2.5 text-[10px] uppercase tracking-wide text-[#999] font-bold border-b border-[#eee] bg-[#fafafa]">ID</th>
                  <th className="text-left p-2.5 text-[10px] uppercase tracking-wide text-[#999] font-bold border-b border-[#eee] bg-[#fafafa]">Cron Expression</th>
                  <th className="text-left p-2.5 text-[10px] uppercase tracking-wide text-[#999] font-bold border-b border-[#eee] bg-[#fafafa]">Description</th>
                  <th className="text-left p-2.5 text-[10px] uppercase tracking-wide text-[#999] font-bold border-b border-[#eee] bg-[#fafafa]">Active</th>
                  <th className="text-left p-2.5 text-[10px] uppercase tracking-wide text-[#999] font-bold border-b border-[#eee] bg-[#fafafa]">Used By</th>
                  <th className="text-left p-2.5 text-[10px] uppercase tracking-wide text-[#999] font-bold border-b border-[#eee] bg-[#fafafa] w-25">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => {
                  const usedBy = zones.filter((z) => z.scheduleId === s.id).map((z) => z.name);
                  return (
                    <tr key={s.id} className="hover:bg-[#f9fbe7] border-b border-[#f0f0f0]">
                      <td className="p-2.5 font-mono text-xs text-gray-400">{s.id.slice(0, 8)}</td>
                      <td className="p-2.5 font-mono text-sm">{s.cronExpression}</td>
                      <td className="p-2.5 text-xs text-gray-500">{cronDesc(s.cronExpression)}</td>
                      <td className="p-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold ${s.isActive ? 'bg-[#e0f2f1] text-[#00695c]' : 'bg-[#fff3e0] text-[#e65100]'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="p-2.5 text-xs text-gray-500">{usedBy.length ? usedBy.join(", ") : "—"}</td>
                      <td className="p-2.5">
                        <div className="flex gap-1">
                          <button onClick={() => openScheduleModal(s)} className="bg-[#00695c] text-white p-1 rounded-sm hover:brightness-110"><Edit3 className="w-3 h-3" /></button>
                          <button onClick={() => deleteSchedule(s.id)} className="bg-[#c62828] text-white p-1 rounded-sm hover:brightness-110"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}
      
      {/* Zone Modal */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-1000">
          <div className="bg-white rounded-md w-130 max-w-[95vw] shadow-2xl">
            <div className="p-4 border-b border-[#eee] flex justify-between items-center text-[15px] font-medium">
              <span>{currentZone.id ? "Edit Zone" : "Add Zone"}</span>
              <button onClick={() => setZoneModalOpen(false)} className="text-[#999] hover:text-[#333]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-[#666] mb-1">Zone Name</label>
                <input value={currentZone.name || ""} onChange={(e) => setCurrentZone({ ...currentZone, name: e.target.value })} type="text" placeholder="e.g. Ornamental Garden" className="w-full border border-[#ddd] p-2 text-[13px] rounded-sm outline-none focus:border-[#00695c]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-[#666] mb-1">Assign Profile</label>
                  <select value={currentZone.profileId || ""} onChange={(e) => setCurrentZone({ ...currentZone, profileId: e.target.value })} className="w-full border border-[#ddd] p-2 text-[13px] rounded-sm outline-none focus:border-[#00695c] bg-white">
                    <option value="">None</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-[#666] mb-1">Assign Schedule</label>
                  <select value={currentZone.scheduleId || ""} onChange={(e) => setCurrentZone({ ...currentZone, scheduleId: e.target.value })} className="w-full border border-[#ddd] p-2 text-[13px] rounded-sm outline-none focus:border-[#00695c] bg-white">
                    <option value="">None</option>
                    {schedules.map(s => <option key={s.id} value={s.id}>{s.cronExpression}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-[#eee] bg-[#fafafa] flex justify-end gap-2">
              <button onClick={() => setZoneModalOpen(false)} className="border border-[#00695c] text-[#00695c] px-4 py-1.5 text-[11px] font-bold uppercase rounded-sm hover:bg-[#00695c] hover:text-white transition-colors">Cancel</button>
              <button onClick={saveZone} className="bg-[#00695c] text-white border border-[#00695c] px-4 py-1.5 text-[11px] font-bold uppercase rounded-sm hover:brightness-110">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-1000">
          <div className="bg-white rounded-md w-130 max-w-[95vw] shadow-2xl">
            <div className="p-4 border-b border-[#eee] flex justify-between items-center text-[15px] font-medium">
              <span>{currentProfile.id ? "Edit Profile" : "Add Profile"}</span>
              <button onClick={() => setProfileModalOpen(false)} className="text-[#999] hover:text-[#333]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-[#666] mb-1">Profile Name</label>
                <input value={currentProfile.name || ""} onChange={(e) => setCurrentProfile({ ...currentProfile, name: e.target.value })} type="text" placeholder="e.g. Tropical Plants" className="w-full border border-[#ddd] p-2 text-[13px] rounded-sm outline-none focus:border-[#00695c]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-[#666] mb-1">Min Moisture (%)</label>
                  <input value={currentProfile.minMoisture || 0} onChange={(e) => setCurrentProfile({ ...currentProfile, minMoisture: Number(e.target.value) })} type="number" className="w-full border border-[#ddd] p-2 text-[13px] rounded-sm outline-none focus:border-[#00695c]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-[#666] mb-1">Max Moisture (%)</label>
                  <input value={currentProfile.maxMoisture || 0} onChange={(e) => setCurrentProfile({ ...currentProfile, maxMoisture: Number(e.target.value) })} type="number" className="w-full border border-[#ddd] p-2 text-[13px] rounded-sm outline-none focus:border-[#00695c]" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-[#666] mb-1">Mode</label>
                <select value={currentProfile.mode || IrrigationMode.AUTO} onChange={(e) => setCurrentProfile({ ...currentProfile, mode: e.target.value as IrrigationMode })} className="w-full border border-[#ddd] p-2 text-[13px] rounded-sm outline-none focus:border-[#00695c] bg-white">
                  <option value={IrrigationMode.AUTO}>Auto</option>
                  <option value={IrrigationMode.MANUAL}>Manual</option>
                  <option value={IrrigationMode.AI}>AI</option>
                </select>
              </div>
            </div>
            <div className="p-3 border-t border-[#eee] bg-[#fafafa] flex justify-end gap-2">
              <button onClick={() => setProfileModalOpen(false)} className="border border-[#00695c] text-[#00695c] px-4 py-1.5 text-[11px] font-bold uppercase rounded-sm hover:bg-[#00695c] hover:text-white transition-colors">Cancel</button>
              <button onClick={saveProfile} className="bg-[#00695c] text-white border border-[#00695c] px-4 py-1.5 text-[11px] font-bold uppercase rounded-sm hover:brightness-110">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-1000">
          <div className="bg-white rounded-md w-130 max-w-[95vw] shadow-2xl">
            <div className="p-4 border-b border-[#eee] flex justify-between items-center text-[15px] font-medium">
              <span>{currentSchedule.id ? "Edit Schedule" : "Add Schedule"}</span>
              <button onClick={() => setScheduleModalOpen(false)} className="text-[#999] hover:text-[#333]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-[#666] mb-1">Cron Expression</label>
                <input value={currentSchedule.cronExpression || ""} onChange={(e) => setCurrentSchedule({ ...currentSchedule, cronExpression: e.target.value })} type="text" placeholder="e.g. 0 6,18 * * *" className="w-full border border-[#ddd] p-2 text-[13px] rounded-sm outline-none focus:border-[#00695c]" />
                <p className="text-[10px] text-gray-400 mt-1">Format: minute hour day-of-month month day-of-week</p>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input id="active-checkbox" type="checkbox" checked={currentSchedule.isActive ?? true} onChange={(e) => setCurrentSchedule({ ...currentSchedule, isActive: e.target.checked })} className="w-4 h-4 accent-[#00695c]" />
                <label htmlFor="active-checkbox" className="text-[11px] font-bold uppercase tracking-wide text-[#666]">Active</label>
              </div>
            </div>
            <div className="p-3 border-t border-[#eee] bg-[#fafafa] flex justify-end gap-2">
              <button onClick={() => setScheduleModalOpen(false)} className="border border-[#00695c] text-[#00695c] px-4 py-1.5 text-[11px] font-bold uppercase rounded-sm hover:bg-[#00695c] hover:text-white transition-colors">Cancel</button>
              <button onClick={saveSchedule} className="bg-[#00695c] text-white border border-[#00695c] px-4 py-1.5 text-[11px] font-bold uppercase rounded-sm hover:brightness-110">Save</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}