// Dashboard layout - includes sidebar navigation and header
// Shared across all authenticated pages: dashboard, entities, profiles, scheduler, audit-logs
"use client"; // needed for the live clock hook

import { useState, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { ZoneProvider } from "@/context/zone-context";
import {
  LayoutGrid,
  LayoutDashboard,
  Package,
  ChevronRight,
  ClipboardList,
  Database,
  Home,
  ChevronDown,
  MapPin,
  Sliders,
  Clock,
  X,
  LogOut,
  KeyRound,
  Wifi,
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, setUser } = useAuth();
  const router = useRouter();
  
  // handle live clock state
  const [time, setTime] = useState<string | null>(null);
  const pathname = usePathname();

  // user / header state
  const userEmail = user?.email || '';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  // Adafruit config modal state
  const [showAdafruitModal, setShowAdafruitModal] = useState(false);
  const [aioForm, setAioForm] = useState({ username: '', key: '' });
  const [aioLoading, setAioLoading] = useState(false);
  const [aioError, setAioError] = useState<string | null>(null);
  const [aioSuccess, setAioSuccess] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentPage = useMemo(() => {
    if (!pathname) return "Dashboard";
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    if (pathname.startsWith("/entities")) return "Entities";
    if (pathname.startsWith("/zones")) return "Zones";
    if (pathname.startsWith("/profiles")) return "Profiles";
    if (pathname.startsWith("/schedules")) return "Schedules";
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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const avatarInitials = useMemo(() => {
    const local = (userEmail || 'AD').split('@')[0];
    return local.slice(0, 2).toUpperCase();
  }, [userEmail]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleOpenAdafruitModal = () => {
    setAioForm({ username: user?.adafruitUsername || '', key: user?.adafruitKey || '' });
    setAioError(null);
    setAioSuccess(false);
    setDropdownOpen(false);
    setShowAdafruitModal(true);
  };

  const handleSaveAdafruitConfig = async () => {
    setAioLoading(true);
    setAioError(null);
    try {
      const updated = await apiCall<{ userId: string; email: string; adafruitUsername: string; adafruitKey: string }>('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ adafruitUsername: aioForm.username, adafruitKey: aioForm.key }),
      });
      setUser({ ...user!, adafruitUsername: updated.adafruitUsername, adafruitKey: updated.adafruitKey });
      setAioSuccess(true);
      setTimeout(() => {
        setShowAdafruitModal(false);
        setAioSuccess(false);
      }, 1500);
    } catch (err) {
      setAioError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAioLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    setPwLoading(true);
    setPwError(null);
    try {
      await apiCall('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      setPwSuccess(true);
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPwSuccess(false);
      }, 1500);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPwLoading(false);
    }
  };

  return ( <>
    {/* main container: full screen, flex row */}
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
            {/* <button className="relative opacity-80 hover:opacity-100 transition" title="Notifications">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold flex items-center justify-center">
                3
              </span>
            </button> */}

            {/* user profile */}
            <div ref={dropdownRef} className="relative flex items-center border-l border-white/20 pl-4">
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="flex items-center gap-2 text-[11px] cursor-pointer hover:opacity-80 transition"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                  {avatarInitials}
                </div>
                <span className="font-medium">{userEmail ? userEmail.split('@')[0] : 'Admin'}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white text-[#333] rounded shadow-lg border border-[#e0e0e0] min-w-43 py-1 z-50">
                  <button
                    onClick={() => { setDropdownOpen(false); setShowPasswordModal(true); }}
                    className="w-full px-4 py-2 text-left text-[12px] flex items-center gap-2 hover:bg-gray-50 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-gray-400" />
                    Change Password
                  </button>
                  <button
                    onClick={handleOpenAdafruitModal}
                    className="w-full px-4 py-2 text-left text-[12px] flex items-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Wifi className="w-3.5 h-3.5 text-gray-400" />
                    Adafruit Config
                  </button>
                  <div className="border-t border-[#f0f0f0]" />
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-[12px] flex items-center gap-2 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE RENDER AREA */}
        <main className="flex-1 overflow-y-auto p-6">
          <ZoneProvider>{children}</ZoneProvider>
        </main>

      </div>
    </div>

    {/* Adafruit Config Modal */}
    {showAdafruitModal && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        onClick={() => { setShowAdafruitModal(false); setAioError(null); }}
      >
        <div
          className="bg-white rounded shadow-lg w-96 border border-[#e0e0e0]"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center border-b border-[#eee] py-3 px-4">
            <span className="font-medium text-sm text-slate-800">Adafruit IO Config</span>
            <button
              onClick={() => { setShowAdafruitModal(false); setAioError(null); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {aioSuccess ? (
              <p className="text-emerald-600 text-sm text-center py-4 font-medium">Adafruit credentials saved!</p>
            ) : (
              <>
                {aioError && (
                  <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded border border-red-100">{aioError}</p>
                )}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Adafruit IO Username</label>
                  <input
                    type="text"
                    className="w-full border border-[#ddd] rounded px-2 py-1.5 text-black text-sm focus:outline-none focus:border-[#00695c]"
                    value={aioForm.username}
                    onChange={e => setAioForm(f => ({ ...f, username: e.target.value }))}
                    autoComplete="off"
                    placeholder="your-adafruit-username"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Adafruit IO Key</label>
                  <input
                    type="password"
                    className="w-full border border-[#ddd] rounded px-2 py-1.5 text-black text-sm focus:outline-none focus:border-[#00695c]"
                    value={aioForm.key}
                    onChange={e => setAioForm(f => ({ ...f, key: e.target.value }))}
                    autoComplete="new-password"
                    placeholder="aio_xxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
              </>
            )}
          </div>

          {!aioSuccess && (
            <div className="border-t border-[#eee] py-3 px-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowAdafruitModal(false); setAioError(null); }}
                className="text-xs px-3 py-1.5 rounded border border-[#ddd] text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdafruitConfig}
                disabled={aioLoading || !aioForm.username || !aioForm.key}
                className="text-xs px-3 py-1.5 rounded bg-[#00695c] text-white font-bold uppercase hover:brightness-110 transition-all disabled:opacity-60"
              >
                {aioLoading ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Change Password Modal */}
    {showPasswordModal && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        onClick={() => { setShowPasswordModal(false); setPwError(null); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
      >
        <div
          className="bg-white rounded shadow-lg w-96 border border-[#e0e0e0]"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center border-b border-[#eee] py-3 px-4">
            <span className="font-medium text-sm text-slate-800">Change Password</span>
            <button
              onClick={() => { setShowPasswordModal(false); setPwError(null); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {pwSuccess ? (
              <p className="text-emerald-600 text-sm text-center py-4 font-medium">Password changed successfully!</p>
            ) : (
              <>
                {pwError && (
                  <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded border border-red-100">{pwError}</p>
                )}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    className="w-full border border-[#ddd] rounded px-2 py-1.5 text-black text-sm focus:outline-none focus:border-[#00695c]"
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">New Password</label>
                  <input
                    type="password"
                    className="w-full border border-[#ddd] rounded px-2 py-1.5 text-black text-sm focus:outline-none focus:border-[#00695c]"
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full border border-[#ddd] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#00695c]"
                    value={pwForm.confirmPassword}
                    onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}
          </div>

          {!pwSuccess && (
            <div className="border-t border-[#eee] py-3 px-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowPasswordModal(false); setPwError(null); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                className="text-xs px-3 py-1.5 rounded border border-[#ddd] text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={pwLoading || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
                className="text-xs px-3 py-1.5 rounded bg-[#00695c] text-white font-bold uppercase hover:brightness-110 transition-all disabled:opacity-60"
              >
                {pwLoading ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}