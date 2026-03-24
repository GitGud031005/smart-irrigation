"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Settings, Trash2, X, ChevronLeft, ChevronRight, Clock, ChevronDown } from "lucide-react";
import type { Schedule, TimeSlot, DayOfWeek } from "@/models/schedule";
import { ALL_DAYS } from "@/models/schedule";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SCHEDULES: Schedule[] = [
    {
        id: "e7b5c3d6-8f6a-4b1e-8b1c-5f6a7b8c9d05",
        name: "Morning & Evening",
        timeSlots: [
            { id: "1a1b1c1d-0001-4a01-9001-000102030405", startTime: "06:00", days: ["Monday", "Wednesday", "Friday"], duration: 300, scheduleId: "e7b5c3d6-8f6a-4b1e-8b1c-5f6a7b8c9d05" },
            { id: "1a1b1c1d-0002-4a02-9002-000102030406", startTime: "18:00", days: ["Monday", "Wednesday", "Friday"], duration: 180, scheduleId: "e7b5c3d6-8f6a-4b1e-8b1c-5f6a7b8c9d05" },
        ],
    },
    {
        id: "f8c6d4e7-9a7b-4c2f-9c2d-6a7b8c9d0e16",
        name: "Daily Triple",
        timeSlots: [
            { id: "2a2b2c2d-0003-4b03-9003-000203040506", startTime: "07:00", days: ALL_DAYS, duration: 120, scheduleId: "f8c6d4e7-9a7b-4c2f-9c2d-6a7b8c9d0e16" },
            { id: "2a2b2c2d-0004-4b04-9004-000203040507", startTime: "12:00", days: ALL_DAYS, duration: 60, scheduleId: "f8c6d4e7-9a7b-4c2f-9c2d-6a7b8c9d0e16" },
            { id: "2a2b2c2d-0005-4b05-9005-000203040508", startTime: "17:00", days: ALL_DAYS, duration: 120, scheduleId: "f8c6d4e7-9a7b-4c2f-9c2d-6a7b8c9d0e16" },
        ],
    },
    {
        id: "a9d7e5f8-1b8c-4d3a-0d3e-7b8c9d0e1f27",
        name: "Weekend Soak",
        timeSlots: [
            { id: "3a3b3c3d-0006-4c06-9006-000304050607", startTime: "08:00", days: ["Saturday", "Sunday"], duration: 600, scheduleId: "a9d7e5f8-1b8c-4d3a-0d3e-7b8c9d0e1f27" },
        ],
    },
    {
        id: "b0e8f6a9-2c9d-4e4b-1e4f-8c9d0e1f2a38",
        name: "Early Morning Only",
        timeSlots: [
            { id: "4a4b4c4d-0007-4d07-9007-000405060709", startTime: "05:30", days: ALL_DAYS, duration: 180, scheduleId: "b0e8f6a9-2c9d-4e4b-1e4f-8c9d0e1f2a38" },
        ],
    },
];

const PAGE_SIZE = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getVisiblePages(current: number, total: number): (number | string)[] {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, "...", total];
    if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
    return [1, "...", current - 1, current, current + 1, "...", total];
}

/** Generate "HH:MM" options at 15-minute intervals */
function generateTimeOptions(): string[] {
    const opts: string[] = [];
    for (let h = 0; h < 24; h++) {
        for (const m of [0, 15, 30, 45]) {
            opts.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        }
    }
    return opts;
}
const TIME_OPTIONS = generateTimeOptions();

function daysLabel(days: DayOfWeek[]): string {
    if (days.length === 7) return "Every day";
    if (days.length === 0) return "No days";
    if (days.length <= 3) return days.map((d) => d.slice(0, 3)).join(", ");
    return `${days.length} days`;
}

function fmtDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s ? `${m}m ${s}s` : `${m}m`;
}

// ─── Days Dropdown (multi-select with ticks) ──────────────────────────────────

type DaysDropdownProps = {
    selected: DayOfWeek[];
    onChange: (days: DayOfWeek[]) => void;
};

function DaysDropdown({ selected, onChange }: DaysDropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const allSelected = selected.length === ALL_DAYS.length;
    const label = daysLabel(selected);

    function toggleAll() {
        onChange(allSelected ? [] : [...ALL_DAYS]);
    }

    function toggleDay(d: DayOfWeek) {
        onChange(selected.includes(d) ? selected.filter((x) => x !== d) : [...selected, d]);
    }

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm bg-white flex items-center justify-between focus:outline-none focus:border-[#00695c]"
            >
                <span className={selected.length === 0 ? "text-gray-300" : "text-gray-700"}>{label}</span>
                <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-[#ddd] rounded shadow-md text-sm">
                    {/* All days option */}
                    <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-[#f0f0f0] font-medium text-gray-700">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            className="accent-[#00695c]"
                        />
                        All days
                    </label>
                    {ALL_DAYS.map((d) => (
                        <label key={d} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-gray-600">
                            <input
                                type="checkbox"
                                checked={selected.includes(d)}
                                onChange={() => toggleDay(d)}
                                className="accent-[#00695c]"
                            />
                            {d}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Time Slot Editor ─────────────────────────────────────────────────────────

type DraftSlot = {
    id: string;
    startTime: string;
    days: DayOfWeek[];
    duration: number;
};

function SlotRow({
    slot,
    onChange,
    onRemove,
}: {
    slot: DraftSlot;
    onChange: (updated: DraftSlot) => void;
    onRemove: () => void;
}) {
    return (
        <div className="flex flex-col gap-1.5 p-3 bg-gray-50 rounded border border-[#eee]">
            <div className="flex items-start gap-2">
                {/* Start time */}
                <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Start</label>
                    <select
                        className="w-full border border-[#ddd] rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-[#00695c]"
                        value={slot.startTime}
                        onChange={(e) => onChange({ ...slot, startTime: e.target.value })}
                    >
                        {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
                {/* Duration */}
                <div className="w-24">
                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Duration (s)</label>
                    <input
                        type="number"
                        min={1}
                        step={1}
                        className="w-full border border-[#ddd] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#00695c]"
                        value={slot.duration}
                        onChange={(e) => onChange({ ...slot, duration: Math.max(1, Number(e.target.value)) })}
                    />
                </div>
                {/* Remove */}
                <button
                    onClick={onRemove}
                    className="mt-5 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                    title="Remove slot"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
            {/* Days */}
            <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Days</label>
                <DaysDropdown
                    selected={slot.days}
                    onChange={(days) => onChange({ ...slot, days })}
                />
            </div>
        </div>
    );
}

function newDraftSlot(): DraftSlot {
    return { id: `draft-${Date.now()}-${Math.random()}`, startTime: "06:00", days: [...ALL_DAYS], duration: 300 };
}

// ─── Settings Modal ───────────────────────────────────────────────────────────

type SettingsModalProps = {
    schedule: Schedule;
    onClose: () => void;
    onSave: (id: string, data: { name: string; timeSlots: Omit<TimeSlot, "id" | "scheduleId">[] }) => void;
    onDelete: (id: string) => void;
};

function SettingsModal({ schedule, onClose, onSave, onDelete }: SettingsModalProps) {
    const [name, setName] = useState(schedule.name);
    const [slots, setSlots] = useState<DraftSlot[]>(
        (schedule.timeSlots ?? []).map((s) => ({ id: s.id, startTime: s.startTime, days: s.days as DayOfWeek[], duration: s.duration }))
    );
    const [confirmDelete, setConfirmDelete] = useState(false);

    function updateSlot(idx: number, updated: DraftSlot) {
        setSlots((prev) => prev.map((s, i) => (i === idx ? updated : s)));
    }
    function removeSlot(idx: number) {
        setSlots((prev) => prev.filter((_, i) => i !== idx));
    }
    function addSlot() {
        setSlots((prev) => [...prev, newDraftSlot()]);
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded shadow-lg w-104 max-h-[90vh] flex flex-col border border-[#e0e0e0]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-[#eee] py-3 px-4 shrink-0">
                    <span className="font-medium text-sm text-slate-800">Schedule Settings</span>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* ID */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Schedule ID</label>
                        <p className="text-xs font-mono text-gray-500 bg-gray-50 rounded px-2 py-1.5 border border-[#eee] break-all">{schedule.id}</p>
                    </div>
                    {/* Name */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Name</label>
                        <input
                            className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Schedule name"
                        />
                    </div>

                    {/* Time Slots */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] font-bold uppercase text-gray-400">Time Slots</label>
                            <button
                                onClick={addSlot}
                                className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#00695c] hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
                            >
                                <Plus className="w-3 h-3" /> Add Slot
                            </button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                            {slots.length === 0 && (
                                <p className="text-xs text-gray-300 text-center py-4">No time slots &mdash; click &ldquo;Add Slot&rdquo; above</p>
                            )}
                            {slots.map((slot, idx) => (
                                <SlotRow
                                    key={slot.id}
                                    slot={slot}
                                    onChange={(updated) => updateSlot(idx, updated)}
                                    onRemove={() => removeSlot(idx)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-[#eee] py-3 px-4 flex justify-between items-center shrink-0">
                    <button
                        onClick={() => {
                            if (!confirmDelete) { setConfirmDelete(true); return; }
                            onDelete(schedule.id);
                            onClose();
                        }}
                        className={`flex items-center gap-1 text-xs font-bold uppercase px-3 py-1.5 rounded transition-colors ${confirmDelete ? "bg-red-600 text-white hover:bg-red-700" : "text-red-500 hover:bg-red-50"
                            }`}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        {confirmDelete ? "Confirm Delete" : "Delete"}
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="text-xs px-3 py-1.5 rounded border border-[#ddd] text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
                        <button
                            onClick={() => {
                                if (!name.trim()) return;
                                onSave(schedule.id, {
                                    name,
                                    timeSlots: slots.map(({ startTime, days, duration }) => ({ startTime, days, duration })),
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

// ─── Add Schedule Modal ───────────────────────────────────────────────────────

type AddScheduleModalProps = {
    onClose: () => void;
    onAdd: (data: { name: string; timeSlots: Omit<TimeSlot, "id" | "scheduleId">[] }) => void;
};

function AddScheduleModal({ onClose, onAdd }: AddScheduleModalProps) {
    const [name, setName] = useState("");
    const [slots, setSlots] = useState<DraftSlot[]>([newDraftSlot()]);

    function updateSlot(idx: number, updated: DraftSlot) {
        setSlots((prev) => prev.map((s, i) => (i === idx ? updated : s)));
    }
    function removeSlot(idx: number) {
        setSlots((prev) => prev.filter((_, i) => i !== idx));
    }
    function addSlot() {
        setSlots((prev) => [...prev, newDraftSlot()]);
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded shadow-lg w-104 max-h-[90vh] flex flex-col border border-[#e0e0e0]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-[#eee] py-3 px-4 shrink-0">
                    <span className="font-medium text-sm text-slate-800">Add Schedule</span>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div>
                        <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Name</label>
                        <input
                            className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Morning Cycle"
                        />
                    </div>

                    {/* Time Slots */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] font-bold uppercase text-gray-400">Time Slots</label>
                            <button
                                onClick={addSlot}
                                className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#00695c] hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
                            >
                                <Plus className="w-3 h-3" /> Add Slot
                            </button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                            {slots.length === 0 && (
                                <p className="text-xs text-gray-300 text-center py-4">No time slots &mdash; click &ldquo;Add Slot&rdquo; above</p>
                            )}
                            {slots.map((slot, idx) => (
                                <SlotRow
                                    key={slot.id}
                                    slot={slot}
                                    onChange={(updated) => updateSlot(idx, updated)}
                                    onRemove={() => removeSlot(idx)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-[#eee] py-3 px-4 flex justify-end gap-2 shrink-0">
                    <button onClick={onClose} className="text-xs px-3 py-1.5 rounded border border-[#ddd] text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button
                        disabled={!name.trim()}
                        onClick={() => {
                            if (!name.trim()) return;
                            onAdd({
                                name,
                                timeSlots: slots.map(({ startTime, days, duration }) => ({ startTime, days, duration })),
                            });
                            onClose();
                        }}
                        className={`text-xs px-3 py-1.5 rounded bg-[#00695c] text-white font-bold uppercase hover:brightness-110 transition-all ${!name.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        Add Schedule
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchedulesPage() {
    const [schedules, setSchedules] = useState<Schedule[]>(MOCK_SCHEDULES);
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(schedules.length / PAGE_SIZE));
    const pageData = useMemo(
        () => schedules.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [schedules, page],
    );

    function handleSave(id: string, data: { name: string; timeSlots: Omit<TimeSlot, "id" | "scheduleId">[] }) {
        setSchedules((prev) =>
            prev.map((s) =>
                s.id === id
                    ? {
                        ...s,
                        name: data.name,
                        timeSlots: data.timeSlots.map((ts, i) => ({ ...ts, id: `${id}-ts-${i}`, scheduleId: id })),
                    }
                    : s
            )
        );
    }

    function handleDelete(id: string) {
        setSchedules((prev) => prev.filter((s) => s.id !== id));
    }

    function handleAdd(data: { name: string; timeSlots: Omit<TimeSlot, "id" | "scheduleId">[] }) {
        const id = `sched-${Date.now()}`;
        setSchedules((prev) => [
            ...prev,
            {
                id,
                name: data.name,
                timeSlots: data.timeSlots.map((ts, i) => ({ ...ts, id: `${id}-ts-${i}`, scheduleId: id })),
            },
        ]);
    }

    return (
        <div className="h-full flex flex-col text-[#333] font-sans">

            {/* Header */}
            <div className="mb-4 shrink-0 flex items-end justify-between">
                <div>
                    <h2 className="text-xl font-medium text-slate-800">Schedules</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Irrigation schedules and their time slot configurations</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-[#00695c] text-white border-none px-3.5 py-1.5 text-[11px] font-bold uppercase rounded-sm inline-flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer"
                >
                    <Plus className="w-3 h-3" /> Add Schedule
                </button>
            </div>

            {/* Table Card */}
            <div className="flex-1 min-h-0 flex flex-col bg-white rounded-sm shadow-sm border border-[#e0e0e0]">
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-[12px]">
                        <thead className="sticky top-0 bg-[#f9f9f9] border-b border-[#e8e8e8] z-10">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Schedule ID</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Time Slots</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0f0f0]">
                            {pageData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">No schedules found</td>
                                </tr>
                            )}
                            {pageData.map((sched, idx) => (
                                <tr key={sched.id} className="hover:bg-[#fafafa] transition-colors">
                                    <td className="px-4 py-2.5 text-gray-400">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                                    <td className="px-4 py-2.5 font-mono text-gray-500 text-[11px]">{sched.id}</td>
                                    <td className="px-4 py-2.5 font-medium">{sched.name}</td>
                                    <td className="px-4 py-2.5 text-gray-500">
                                        <div className="flex flex-col gap-1">
                                            {(sched.timeSlots ?? []).length === 0 ? (
                                                <span className="text-gray-300">—</span>
                                            ) : (
                                                (sched.timeSlots ?? []).map((ts) => (
                                                    <div key={ts.id} className="flex items-center gap-2 text-[12px] font-mono">
                                                        <span className="font-medium">{ts.startTime}</span>
                                                        <span className="text-gray-400">·</span>
                                                        <span className="text-gray-500">{daysLabel(ts.days as DayOfWeek[])}</span>
                                                        <span className="text-gray-400">·</span>
                                                        <span className="text-gray-500">{fmtDuration(ts.duration)}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <button
                                            onClick={() => setSelectedSchedule(sched)}
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
                        {schedules.length > 0
                            ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, schedules.length)} of ${schedules.length} schedules`
                            : "No schedules"}
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
                                    className={`w-7 h-7 flex items-center justify-center rounded border text-[11px] font-medium transition ${p === page ? "bg-[#00695c] border-[#00695c] text-white" : "border-[#e0e0e0] text-gray-500 hover:bg-white"
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
            {selectedSchedule && (
                <SettingsModal
                    schedule={selectedSchedule}
                    onClose={() => setSelectedSchedule(null)}
                    onSave={handleSave}
                    onDelete={handleDelete}
                />
            )}

            {/* Add Modal */}
            {showAddModal && (
                <AddScheduleModal
                    onClose={() => setShowAddModal(false)}
                    onAdd={handleAdd}
                />
            )}
        </div>
    );
}
