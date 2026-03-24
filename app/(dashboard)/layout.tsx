// Dashboard layout - includes sidebar navigation and header
// Shared across all authenticated pages: dashboard, entities, profiles, scheduler, audit-logs
"use client"; // needed for the live clock hook

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutGrid,
  LayoutDashboard,
  Package,
  ChevronRight,
  FileText,
  Calendar,
  ClipboardList,
  Database,
  Home,
  Bell,
  ChevronDown,
  MapPin,
  Sliders,
  Clock,
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // handle live clock state
  const [time, setTime] = useState<string | null>(null);
  const pathname = usePathname();

  const currentPage = useMemo(() => {
    if (!pathname) return "Dashboard";
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    if (pathname.startsWith("/entities")) return "Entities";
    if (pathname.startsWith("/zones")) return "Zones";
    if (pathname.startsWith("/profiles")) return "Profiles";
    if (pathname.startsWith("/schedules")) return "Schedules";
    if (pathname.startsWith("/scheduler")) return "AI Scheduler";
    if (pathname.startsWith("/audit-logs")) return "Audit Logs";
    if (pathname.startsWith("/data-logs")) return "Data Logs";
    return "Dashboard";
  }, [pathname]);

  useEffect(() => {
    // update clock every second
    const updateClock = () => {
      setTime(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateClock(); // initial call
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer); // cleanup on unmount
  }, []);

  return (
    // main container: full screen, flex row
    <div className="flex h-screen w-full bg-[#f4f7f6]">
      
      {/* SIDEBAR */}
      <aside className="w-60 shrink-0 bg-[#084b36] flex flex-col text-white shadow-lg z-20">
        {/* brand logo */}
        <div className="p-4 flex items-center gap-3 h-14 shrink-0">
          <LayoutGrid className="w-5 h-5 text-white" />
          <span className="font-bold text-sm text-white tracking-tight uppercase">
            ThingsBoard <span className="text-[10px] font-light opacity-60 italic">Professional</span>
          </span>
        </div>

        {/* nav links */}
        <nav className="flex-1 py-2 overflow-y-auto text-[13px] flex flex-col gap-1">
          <Link href="/dashboard" className={`w-full flex items-center justify-between px-5 py-2.5 group ${currentPage === "Dashboard" ? "bg-white/10 border-l-4 border-green-400" : "hover:bg-white/5"} transition-colors`}>
            <div className="flex items-center gap-4">
              <LayoutDashboard className="w-4 h-4" /> Dashboards
            </div>
            <ChevronRight className="w-3 h-3 opacity-50 hidden group-hover:inline-flex transition-opacity" />
          </Link>
          
          <Link href="/entities" className={`w-full flex items-center justify-between px-5 py-2.5 group ${currentPage === "Entities" ? "bg-white/10 border-l-4 border-green-400" : "hover:bg-white/5"} transition-colors`}>
            <div className="flex items-center gap-4">
              <Package className="w-4 h-4" /> Entities
            </div>
            <ChevronRight className="w-3 h-3 opacity-50 hidden group-hover:inline-flex transition-opacity" />
          </Link>
          
          <Link href="/zones" className={`w-full flex items-center justify-between px-5 py-2.5 group ${currentPage === "Zones" ? "bg-white/10 border-l-4 border-green-400" : "hover:bg-white/5"} transition-colors`}>
            <div className="flex items-center gap-4">
              <MapPin className="w-4 h-4" /> Zones
            </div>
            <ChevronRight className="w-3 h-3 opacity-50 hidden group-hover:inline-flex transition-opacity" />
          </Link>

          <Link href="/profiles" className={`w-full flex items-center justify-between px-5 py-2.5 group ${currentPage === "Profiles" ? "bg-white/10 border-l-4 border-green-400" : "hover:bg-white/5"} transition-colors`}>
            <div className="flex items-center gap-4">
              <Sliders className="w-4 h-4" /> Profiles
            </div>
            <ChevronRight className="w-3 h-3 opacity-50 hidden group-hover:inline-flex transition-opacity" />
          </Link>

          <Link href="/schedules" className={`w-full flex items-center justify-between px-5 py-2.5 group ${currentPage === "Schedules" ? "bg-white/10 border-l-4 border-green-400" : "hover:bg-white/5"} transition-colors`}>
            <div className="flex items-center gap-4">
              <Clock className="w-4 h-4" /> Schedules
            </div>
            <ChevronRight className="w-3 h-3 opacity-50 hidden group-hover:inline-flex transition-opacity" />
          </Link>
          
          <Link href="/scheduler" className={`w-full flex items-center justify-between px-5 py-2.5 group ${currentPage === "AI Scheduler" ? "bg-white/10 border-l-4 border-green-400" : "hover:bg-white/5"} transition-colors`}>
            <div className="flex items-center gap-4">
              <Calendar className="w-4 h-4" /> AI Scheduler
            </div>
            <ChevronRight className="w-3 h-3 opacity-50 hidden group-hover:inline-flex transition-opacity" />
          </Link>
          
          <Link href="/audit-logs" className={`w-full flex items-center justify-between px-5 py-2.5 group ${currentPage === "Audit Logs" ? "bg-white/10 border-l-4 border-green-400" : "hover:bg-white/5"} transition-colors`}>
            <div className="flex items-center gap-4">
              <ClipboardList className="w-4 h-4" /> Audit Logs
            </div>
            <ChevronRight className="w-3 h-3 opacity-50 hidden group-hover:inline-flex transition-opacity" />
          </Link>

          <Link href="/data-logs" className={`w-full flex items-center justify-between px-5 py-2.5 group ${currentPage === "Data Logs" ? "bg-white/10 border-l-4 border-green-400" : "hover:bg-white/5"} transition-colors`}>
            <div className="flex items-center gap-4">
              <Database className="w-4 h-4" /> Data Logs
            </div>
            <ChevronRight className="w-3 h-3 opacity-50 hidden group-hover:inline-flex transition-opacity" />
          </Link>
        </nav>

        {/* footer */}
        <div className="p-3 text-[9px] text-white/50 uppercase font-bold tracking-tighter">
          © 2026 BK-GROUP 08
        </div>
      </aside>

      {/* RIGHT CONTENT AREA */}
      <div className="flex flex-col flex-1 min-w-0">
        
        {/* NAVBAR */}
        <header className="h-14 bg-[#084b36] shadow-md flex items-center justify-between px-4 text-white shrink-0 z-10 border-b border-white/10">
          
          {/* left: breadcrumb */}
          <div className="flex items-center gap-3">
            <div className="flex items-center text-[11px] font-medium gap-2 uppercase tracking-wide">
              <Home className="w-3.5 h-3.5 opacity-70" />
              <span>Dashboards</span>
              <ChevronRight className="w-2.5 h-2.5 opacity-40" />
              <span className="font-bold">{currentPage}</span>
            </div>
          </div>

          {/* right: status + actions + user */}
          <div className="flex items-center gap-5">
            {/* system status */}
            <div className="flex items-center gap-1.5 text-[10px] font-medium opacity-80">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse"></span>
              <span>System Online</span>
            </div>

            {/* live clock */}
            <div className="text-[11px] font-mono opacity-80 w-15 text-right" suppressHydrationWarning>
              {time ?? ""}
            </div>

            {/* notifications */}
            <button className="relative opacity-80 hover:opacity-100 transition" title="Notifications">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold flex items-center justify-center">
                3
              </span>
            </button>

            {/* user profile */}
            <div className="flex items-center gap-2 border-l border-white/20 pl-4 text-[11px] cursor-pointer hover:opacity-80">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                AD
              </div>
              <span className="font-medium">Admin</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </div>
          </div>
        </header>

        {/* PAGE RENDER AREA */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

      </div>
    </div>
  );
}