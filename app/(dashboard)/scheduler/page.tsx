// AI Scheduler Screen (Mockup 4.6)
// Top stats row: water savings %, next irrigation time, AI confidence, total events
// Schedule grid: 7-day calendar view (5:00 AM - 9:00 PM hourly slots)
// Events color-coded by zone, AI recommendations with dashed borders
// "AI Suggest" button for auto-generating irrigation recommendations
"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Sparkles, ChevronLeft, ChevronRight, Check, Trash2, X } from "lucide-react";
import type { IrrigationEvent } from "@/models/irrigation-event";

// --- Types & Constants ---
const HOURS_START = 5;
const HOURS_END = 21;
const zoneNames: Record<number, string> = { 1: "Z1: Ornamental", 2: "Z2: Lettuce", 3: "Z3: Rose Nursery", 4: "Z4: Orchids" };

// Helpers
const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
const pad = (n: number | string) => String(n).padStart(2, "0");
const offsetDay = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return fmtDate(d);
};

// --- Mock Data ---
const initialEvents: IrrigationEvent[] = [
  { id: 1, title: "Watering Z2: Lettuce", zone: 2, date: fmtDate(new Date()), start: "06:00", duration: 15, type: "watering", source: "ai" },
  { id: 2, title: "Mist Z4: Orchids", zone: 4, date: fmtDate(new Date()), start: "07:30", duration: 10, type: "mist", source: "ai" },
  { id: 3, title: "Watering Z1: Ornamental", zone: 1, date: fmtDate(new Date()), start: "10:00", duration: 15, type: "watering", source: "manual" },
  { id: 4, title: "Watering Z2: Lettuce", zone: 2, date: fmtDate(new Date()), start: "14:30", duration: 20, type: "watering", source: "ai" },
  { id: 5, title: "Mist Z4: Orchids", zone: 4, date: fmtDate(new Date()), start: "17:00", duration: 10, type: "mist", source: "ai" },
  { id: 6, title: "Watering Z3: Rose Nursery", zone: 3, date: fmtDate(new Date()), start: "18:30", duration: 15, type: "watering", source: "manual" },
  { id: 7, title: "Watering Z1: Ornamental", zone: 1, date: offsetDay(1), start: "06:30", duration: 15, type: "watering", source: "ai" },
  { id: 8, title: "Watering Z2: Lettuce", zone: 2, date: offsetDay(1), start: "11:00", duration: 20, type: "watering", source: "ai" },
  { id: 9, title: "Fertilize Z3: Rose", zone: 3, date: offsetDay(2), start: "08:00", duration: 30, type: "fertilize", source: "manual" },
  { id: 10, title: "Watering Z4: Orchids", zone: 4, date: offsetDay(3), start: "09:00", duration: 10, type: "watering", source: "ai" },
];

export default function SchedulerPage() {
  // Navigation state
  const [weekOffset, setWeekOffset] = useState(0);

  // Data state
  const [events, setEvents] = useState<IrrigationEvent[]>(initialEvents);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentEvent, setCurrentEvent] = useState<Partial<IrrigationEvent>>({});
  const [aiReason, setAiReason] = useState<string | null>(null);

  // Time state (for the red "now" line)
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- Calculations ---
  const todayStr = fmtDate(currentTime);
  
  // Calculate days for the current week view
  const { monday, days } = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const clone = new Date(d);
      clone.setDate(clone.getDate() + i);
      return clone;
    });
    return { monday: d, days: weekDays };
  }, [weekOffset]);

  // Format calendar header title
  const calTitle = useMemo(() => {
    const last = days[6];
    const moLabel = monday.toLocaleDateString("en", { month: "short" });
    const laLabel = last.toLocaleDateString("en", { month: "short", year: "numeric" });
    return moLabel === laLabel.split(" ")[0]
      ? `${monday.getDate()} – ${last.getDate()} ${laLabel}`
      : `${moLabel} ${monday.getDate()} – ${laLabel.replace(",", "")}`;
  }, [monday, days]);

  // Generate hours array (5 to 21)
  const hours = Array.from({ length: HOURS_END - HOURS_START + 1 }, (_, i) => HOURS_START + i);

  // Stats calculation
  const aiCount = events.filter((e) => e.source === "ai").length;
  const todayEvs = events.filter((e) => e.date === todayStr).sort((a, b) => a.start.localeCompare(b.start));
  const nowTimeStr = pad(currentTime.getHours()) + ":" + pad(currentTime.getMinutes());
  const nextEv = todayEvs.find((e) => e.start > nowTimeStr);

  // --- Handlers ---
  const cellClick = (date: string, time: string) => {
    setEditingId(null);
    setAiReason(null);
    setCurrentEvent({
      title: "",
      zone: 1,
      date,
      start: time,
      duration: 15,
      type: "watering",
      source: "manual",
    });
    setIsModalOpen(true);
  };

  const openEventModal = (ev: IrrigationEvent) => {
    setEditingId(ev.id);
    setAiReason(null);
    setCurrentEvent({ ...ev });
    setIsModalOpen(true);
  };

  const saveEvent = () => {
    if (!currentEvent.title || !currentEvent.date || !currentEvent.start) return;
    
    if (editingId !== null) {
      setEvents(events.map(e => e.id === editingId ? { ...e, ...currentEvent } as IrrigationEvent : e));
    } else {
      const newId = Math.max(...events.map(e => e.id), 0) + 1;
      setEvents([...events, { ...currentEvent, id: newId } as IrrigationEvent]);
    }
    setIsModalOpen(false);
  };

  const deleteEvent = () => {
    if (editingId === null) return;
    setEvents(events.filter(e => e.id !== editingId));
    setIsModalOpen(false);
  };

  const triggerAiSuggest = () => {
    const tmrw = offsetDay(1);
    setEditingId(null);
    setCurrentEvent({
      title: "Watering Z2: Lettuce",
      zone: 2,
      date: tmrw,
      start: "14:00",
      duration: 20,
      type: "watering",
      source: "ai",
    });
    setAiReason("Soil moisture in Z2 predicted to drop below 35% by 14:00");
    setIsModalOpen(true);
  };

  // Auto-update title when zone or type changes
  const handleInputChange = (field: keyof IrrigationEvent, value: string | number) => {
    const updated = { ...currentEvent, [field]: value };
    
    if (field === "zone" || field === "type") {
      const type = updated.type || "watering";
      const prefix = type === "mist" ? "Mist" : type === "fertilize" ? "Fertilize" : "Watering";
      updated.title = `${prefix} ${zoneNames[updated.zone as number]}`;
    }
    setCurrentEvent(updated);
  };

  return (
    <div className="text-[#333] font-sans h-full flex flex-col">
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-sm shadow-sm border border-[#e0e0e0] p-4">
          <div className="text-[10px] text-[#999] uppercase font-bold tracking-wide mb-1">Water Saved This Week</div>
          <div className="text-[28px] font-light text-emerald-600">23%</div>
          <div className="text-xs text-gray-400 mt-1">vs manual schedule</div>
        </div>
        <div className="bg-white rounded-sm shadow-sm border border-[#e0e0e0] p-4">
          <div className="text-[10px] text-[#999] uppercase font-bold tracking-wide mb-1">Next Watering</div>
          <div className="text-[28px] font-light text-blue-600">{nextEv ? nextEv.start : "--:--"}</div>
          <div className="text-xs text-gray-400 mt-1">{nextEv ? `${zoneNames[nextEv.zone]} (AI)` : "No more events today"}</div>
        </div>
        <div className="bg-white rounded-sm shadow-sm border border-[#e0e0e0] p-4">
          <div className="text-[10px] text-[#999] uppercase font-bold tracking-wide mb-1">AI Confidence</div>
          <div className="text-[28px] font-light text-purple-600">87%</div>
          <div className="text-xs text-gray-400 mt-1">Model accuracy (7d avg)</div>
        </div>
        <div className="bg-white rounded-sm shadow-sm border border-[#e0e0e0] p-4">
          <div className="text-[10px] text-[#999] uppercase font-bold tracking-wide mb-1">Events This Week</div>
          <div className="text-[28px] font-light text-orange-600">{events.length}</div>
          <div className="text-xs text-gray-400 mt-1">{aiCount} AI · {events.length - aiCount} manual</div>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-sm shadow-sm border border-[#e0e0e0] flex-1 flex flex-col min-h-0">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2.5 px-4 border-b border-[#eee] bg-white">
          <div className="flex items-center gap-3">
            <button onClick={() => cellClick(todayStr, "06:00")} className="bg-[#00695c] text-white border-none px-3.5 py-1.5 text-[11px] font-bold uppercase rounded-sm inline-flex items-center gap-1 hover:brightness-110 transition-all">
              <Plus className="w-3 h-3" /> New Event
            </button>
            <button onClick={triggerAiSuggest} className="bg-white text-[#00695c] border border-[#ccc] px-3 py-1 text-[11px] font-bold uppercase rounded-sm inline-flex items-center gap-1 hover:bg-[#f5f5f5] transition-colors">
              <Sparkles className="w-3 h-3" /> AI Suggest
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-1 border border-[#ddd] rounded-sm hover:bg-[#f0f0f0] text-[#555]"><ChevronLeft className="w-3 h-3" /></button>
            <button onClick={() => setWeekOffset(0)} className="px-2 py-1 border border-[#ddd] rounded-sm hover:bg-[#f0f0f0] text-[#555] text-xs font-bold">Today</button>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-1 border border-[#ddd] rounded-sm hover:bg-[#f0f0f0] text-[#555]"><ChevronRight className="w-3 h-3" /></button>
            <span className="text-[15px] font-medium text-[#333] ml-2 min-w-35 text-center">{calTitle}</span>
          </div>
          <div className="flex">
            <button className="px-3 py-1.5 text-[11px] font-bold uppercase border border-[#00695c] bg-[#00695c] text-white rounded-sm cursor-default">Week</button>
          </div>
        </div>

        {/* Calendar Grid Area */}
        <div className="overflow-auto flex-1 bg-white relative min-w-180">
          <div className="flex">
            
            {/* Times Column */}
            <div className="w-14 shrink-0 border-r border-[#f0f0f0]">
              <div className="h-13.5 border-b-2 border-[#e0e0e0]" /> {/* Header spacer */}
              {hours.map(h => (
                <div key={h} className="h-12 pr-1.5 text-[10px] text-[#999] text-right relative border-b border-transparent">
                  <span className="absolute -top-1.5 right-1.5">{pad(h)}:00</span>
                </div>
              ))}
            </div>

            {/* Days Columns */}
            {days.map((d, di) => {
              const iso = fmtDate(d);
              const isToday = iso === todayStr;
              const dayEvents = events.filter(e => e.date === iso);
              
              return (
                <div key={di} className="flex-1 min-w-0 border-r border-[#f0f0f0] flex flex-col">
                  {/* Column Header */}
                  <div className={`h-13.5 py-2 px-1 text-center border-b-2 ${isToday ? "border-[#00695c]" : "border-[#e0e0e0]"}`}>
                    <span className={`block text-[11px] leading-tight mb-1 uppercase font-medium ${isToday ? "text-[#00695c] font-bold" : "text-[#666]"}`}>
                      {d.toLocaleDateString("en", { weekday: "short" })}
                    </span>
                    {isToday ? (
                      <span className="bg-[#00695c] text-white rounded-full w-7.5 h-7.5 flex items-center justify-center text-[15px] font-medium mx-auto leading-none">
                        {d.getDate()}
                      </span>
                    ) : (
                      <span className="block text-[22px] font-normal leading-none mx-auto text-[#666]">
                        {d.getDate()}
                      </span>
                    )}
                  </div>
                  
                  {/* Column Body (Cells & Events) */}
                  <div className="relative flex-1">
                    {/* Background Slots */}
                    {hours.map(h => (
                      <div key={h} onClick={() => cellClick(iso, `${pad(h)}:00`)} className="h-12 border-b border-[#f5f5f5] cursor-pointer hover:bg-[#f9fffe]" />
                    ))}
                    
                    {/* Render Events inside this day column */}
                    {dayEvents.map(ev => {
                      const [sh, sm] = ev.start.split(":").map(Number);
                      if (sh < HOURS_START || sh > HOURS_END) return null;
                      
                      const topPx = (sh - HOURS_START) * 48 + (sm / 60) * 48;
                      const heightPx = Math.max((ev.duration / 60) * 48, 20);
                      
                      // Style configurations based on zone/source
                      let styleClasses = "";
                      if (ev.source === "ai") styleClasses = "bg-[#ede7f6] text-[#311b92] border-[#7c4dff] border-dashed";
                      else if (ev.zone === 1) styleClasses = "bg-[#e8f5e9] text-[#1b5e20] border-[#43a047] border-solid";
                      else if (ev.zone === 2) styleClasses = "bg-[#e3f2fd] text-[#0d47a1] border-[#1e88e5] border-solid";
                      else if (ev.zone === 3) styleClasses = "bg-[#fce4ec] text-[#880e4f] border-[#e91e63] border-solid";
                      else if (ev.zone === 4) styleClasses = "bg-[#f3e5f5] text-[#4a148c] border-[#8e24aa] border-solid";

                      const typeIcon = ev.type === "mist" ? "💨" : ev.type === "fertilize" ? "🌱" : "💧";

                      return (
                        <div 
                          key={ev.id}
                          onClick={(e) => { e.stopPropagation(); openEventModal(ev); }}
                          style={{ top: topPx, height: heightPx }}
                          className={`absolute left-0.5 right-0.5 rounded-sm py-0.5 px-1 text-[10px] font-medium overflow-hidden cursor-pointer z-2 leading-tight border-l-[3px] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:z-10 ${styleClasses}`}
                        >
                          <div className="font-bold truncate">{typeIcon} {ev.title}</div>
                          {heightPx > 26 && <div className="opacity-70 text-[9px] truncate">{ev.start} · {ev.duration}m {ev.source === 'ai' && '· AI'}</div>}
                        </div>
                      );
                    })}

                    {/* Current Time Line (Red) */}
                    {isToday && currentTime.getHours() >= HOURS_START && currentTime.getHours() <= HOURS_END && (
                      <div 
                        style={{ top: (currentTime.getHours() - HOURS_START) * 48 + (currentTime.getMinutes() / 60) * 48 }}
                        className="absolute left-0 right-0 h-0.5 bg-red-500 z-5 pointer-events-none before:content-[''] before:absolute before:-left-1 before:-top-0.75 before:w-2 before:h-2 before:rounded-full before:bg-red-500"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="py-2 px-4 border-t border-[#eee] flex gap-4 flex-wrap items-center bg-white">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Zones:</span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-[#555]"><span className="w-3 h-2 rounded-sm bg-[#43a047]" /> Z1: Ornamental</span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-[#555]"><span className="w-3 h-2 rounded-sm bg-[#1e88e5]" /> Z2: Lettuce</span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-[#555]"><span className="w-3 h-2 rounded-sm bg-[#e91e63]" /> Z3: Rose Nursery</span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-[#555]"><span className="w-3 h-2 rounded-sm bg-[#8e24aa]" /> Z4: Orchids</span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-[#555]"><span className="w-3 h-2 rounded-sm bg-[#7c4dff] border border-dashed border-[#5e35b1]" /> AI Suggestion</span>
        </div>
      </div>

      {/* --- Modal Overlay --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/35 z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-sm shadow-[0_8px_32px_rgba(0,0,0,0.2)] w-full max-w-110" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-[#eee] flex justify-between items-center">
              <h3 className="text-[15px] font-medium text-[#333] m-0">{editingId ? "Edit Irrigation Event" : aiReason ? "AI Suggested Event" : "New Irrigation Event"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#999] hover:text-[#333] transition-colors"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="p-5 space-y-3.5">
              {/* AI Suggestion Banner */}
              {aiReason && (
                <div className="bg-[#ede7f6] border border-dashed border-[#b39ddb] rounded-sm py-2 px-3 text-[11px] text-[#5e35b1] flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 leading-tight">{aiReason}</span>
                  <button onClick={saveEvent} className="bg-[#00695c] text-white px-2 py-1 rounded-sm text-[9px] font-bold uppercase shrink-0">Accept</button>
                </div>
              )}

              {/* Form Fields */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-[#999] mb-1">Event Title</label>
                <input type="text" value={currentEvent.title || ""} onChange={e => handleInputChange("title", e.target.value)} placeholder="e.g. Watering Z2: Lettuce" className="w-full border border-[#ddd] p-2 text-[13px] rounded-sm outline-none focus:border-[#00695c]" />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-[#999] mb-1">Zone</label>
                <select value={currentEvent.zone || 1} onChange={e => handleInputChange("zone", parseInt(e.target.value))} className="w-full border border-[#ddd] p-2 text-[13px] rounded-sm outline-none focus:border-[#00695c] bg-white">
                  <option value={1}>Z1: Ornamental</option>
                  <option value={2}>Z2: Lettuce</option>
                  <option value={3}>Z3: Rose Nursery</option>
                  <option value={4}>Z4: Orchids</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-[#999] mb-1">Date</label>
                  <input type="date" value={currentEvent.date || ""} onChange={e => handleInputChange("date", e.target.value)} className="w-full border border-[#ddd] p-2 text-[13px] rounded-sm outline-none focus:border-[#00695c]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-[#999] mb-1">Start Time</label>
                  <input type="time" value={currentEvent.start || ""} onChange={e => handleInputChange("start", e.target.value)} className="w-full border border-[#ddd] p-2 text-[13px] rounded-sm outline-none focus:border-[#00695c]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-[#999] mb-1">Duration (min)</label>
                  <input type="number" min="5" max="120" step="5" value={currentEvent.duration || 15} onChange={e => handleInputChange("duration", parseInt(e.target.value))} className="w-full border border-[#ddd] p-2 text-[13px] rounded-sm outline-none focus:border-[#00695c]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-[#999] mb-1">Type</label>
                  <select value={currentEvent.type || "watering"} onChange={e => handleInputChange("type", e.target.value)} className="w-full border border-[#ddd] p-2 text-[13px] rounded-sm outline-none focus:border-[#00695c] bg-white">
                    <option value="watering">Watering</option>
                    <option value="mist">Mist Spray</option>
                    <option value="fertilize">Fertilize</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-[#999] mb-1">Source</label>
                <select value={currentEvent.source || "manual"} onChange={e => handleInputChange("source", e.target.value)} className="w-full border border-[#ddd] p-2 text-[13px] rounded-sm outline-none focus:border-[#00695c] bg-white">
                  <option value="manual">Manual</option>
                  <option value="ai">AI Suggestion</option>
                </select>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#eee] flex items-center justify-end gap-2 bg-[#fafafa]">
              {editingId && (
                <button onClick={deleteEvent} className="bg-white text-[#c62828] border border-[#ccc] px-3 py-1.5 text-[11px] font-bold cursor-pointer rounded-sm inline-flex items-center gap-1 hover:bg-[#f5f5f5] mr-auto">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              )}
              <button onClick={() => setIsModalOpen(false)} className="bg-white text-[#00695c] border border-[#ccc] px-4 py-1.5 text-[11px] font-bold cursor-pointer rounded-sm hover:bg-[#f5f5f5]">
                Cancel
              </button>
              <button onClick={saveEvent} className="bg-[#00695c] text-white border-none px-4 py-1.5 text-[11px] font-bold uppercase cursor-pointer rounded-sm inline-flex items-center gap-1 hover:brightness-110">
                <Check className="w-3 h-3" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}