// Audit Logs Screen (Mockup 4.7)
// Filter bar: event type, severity level, time range, keyword search
// Log table: timestamp, event type, entity, action detail, severity (color badges)
// Pagination controls at bottom
import { Search } from "lucide-react";

export const metadata = {
  title: "Audit Logs",
};

export default function AuditLogsPage() {
  return (
    <div className="text-[#333] font-sans">
      {/* Page Title */}
      <h2 className="text-lg font-medium text-slate-800 mb-4">Audit Logs</h2>

      {/* Filters Bar */}
      <div className="flex gap-2 items-center mb-4 flex-wrap">
        <select className="border border-[#ddd] px-2.5 py-1.5 text-xs rounded-sm outline-none focus:border-[#00695c] bg-white">
          <option>All Types</option>
          <option>RPC</option>
          <option>Alarm</option>
          <option>Telemetry</option>
          <option>Login</option>
        </select>
        
        <select className="border border-[#ddd] px-2.5 py-1.5 text-xs rounded-sm outline-none focus:border-[#00695c] bg-white">
          <option>All Severity</option>
          <option>Info</option>
          <option>Success</option>
          <option>Warning</option>
          <option>Error</option>
        </select>
        
        <input 
          type="date" 
          defaultValue="2026-03-09" 
          className="border border-[#ddd] px-2.5 py-1.5 text-xs rounded-sm outline-none focus:border-[#00695c] bg-white"
        />
        
        <input 
          type="text" 
          placeholder="Search entity..." 
          className="border border-[#ddd] px-2.5 py-1.5 text-xs rounded-sm outline-none focus:border-[#00695c] bg-white"
        />
        
        <button className="bg-[#00695c] text-white border-none px-3.5 py-1.5 text-[11px] font-bold uppercase rounded-sm inline-flex items-center gap-1 hover:opacity-90 transition-opacity">
          <Search className="w-3 h-3" /> Filter
        </button>
      </div>

      {/* Logs Table Card */}
      <div className="bg-white rounded-sm shadow-sm border border-[#e0e0e0] overflow-hidden">
        
        {/* Card Header */}
        <div className="border-b border-[#eee] py-2.5 px-4 text-sm flex justify-between items-center">
          <span className="font-medium">Event Log</span>
          <span className="text-xs text-gray-400">Showing 15 of 247 entries</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="bg-[#fafafa] text-left py-2.5 px-4 font-medium text-[#666] uppercase text-[10px] tracking-wide border-b border-[#eee]">Timestamp</th>
                <th className="bg-[#fafafa] text-left py-2.5 px-4 font-medium text-[#666] uppercase text-[10px] tracking-wide border-b border-[#eee]">Type</th>
                <th className="bg-[#fafafa] text-left py-2.5 px-4 font-medium text-[#666] uppercase text-[10px] tracking-wide border-b border-[#eee]">Entity</th>
                <th className="bg-[#fafafa] text-left py-2.5 px-4 font-medium text-[#666] uppercase text-[10px] tracking-wide border-b border-[#eee]">Action</th>
                <th className="bg-[#fafafa] text-left py-2.5 px-4 font-medium text-[#666] uppercase text-[10px] tracking-wide border-b border-[#eee]">Severity</th>
                <th className="bg-[#fafafa] text-left py-2.5 px-4 font-medium text-[#666] uppercase text-[10px] tracking-wide border-b border-[#eee]">User</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 text-xs text-gray-500 font-mono">2026-03-09 13:45:22</td>
                <td className="py-2.5 px-4">RPC</td>
                <td className="py-2.5 px-4 font-medium">Relay-Pump-01</td>
                <td className="py-2.5 px-4">Pump ON — Zone 1 (Auto)</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#e8f5e9] text-[#2e7d32]">Success</span></td>
                <td className="py-2.5 px-4">System</td>
              </tr>
              {/* Row 2 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 text-xs text-gray-500 font-mono">2026-03-09 13:44:10</td>
                <td className="py-2.5 px-4">Telemetry</td>
                <td className="py-2.5 px-4 font-medium">ESP32-Node-02</td>
                <td className="py-2.5 px-4">Soil moisture below threshold (38%)</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#fff3e0] text-[#e65100]">Warning</span></td>
                <td className="py-2.5 px-4">System</td>
              </tr>
              {/* Row 3 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 text-xs text-gray-500 font-mono">2026-03-09 13:30:01</td>
                <td className="py-2.5 px-4">Telemetry</td>
                <td className="py-2.5 px-4 font-medium">ESP32-Node-01</td>
                <td className="py-2.5 px-4">Data received: temp=28.5, humid=65</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#e3f2fd] text-[#1565c0]">Info</span></td>
                <td className="py-2.5 px-4">System</td>
              </tr>
              {/* Row 4 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 text-xs text-gray-500 font-mono">2026-03-09 13:15:00</td>
                <td className="py-2.5 px-4">RPC</td>
                <td className="py-2.5 px-4 font-medium">Relay-Pump-01</td>
                <td className="py-2.5 px-4">Pump OFF — Zone 1 (Timeout 15min)</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#e8f5e9] text-[#2e7d32]">Success</span></td>
                <td className="py-2.5 px-4">System</td>
              </tr>
              {/* Row 5 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 text-xs text-gray-500 font-mono">2026-03-09 13:00:00</td>
                <td className="py-2.5 px-4">RPC</td>
                <td className="py-2.5 px-4 font-medium">Relay-Pump-01</td>
                <td className="py-2.5 px-4">Pump ON — Zone 1 (Scheduled)</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#e8f5e9] text-[#2e7d32]">Success</span></td>
                <td className="py-2.5 px-4">AI Scheduler</td>
              </tr>
              {/* Row 6 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 text-xs text-gray-500 font-mono">2026-03-09 12:45:33</td>
                <td className="py-2.5 px-4">Alarm</td>
                <td className="py-2.5 px-4 font-medium">ESP32-Node-03</td>
                <td className="py-2.5 px-4">High temperature alert (36.2°C)</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#fce4ec] text-[#c62828]">Critical</span></td>
                <td className="py-2.5 px-4">System</td>
              </tr>
              {/* Row 7 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 text-xs text-gray-500 font-mono">2026-03-09 12:30:00</td>
                <td className="py-2.5 px-4">Telemetry</td>
                <td className="py-2.5 px-4 font-medium">ESP32-Node-03</td>
                <td className="py-2.5 px-4">Data received: temp=36.2, humid=48</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#e3f2fd] text-[#1565c0]">Info</span></td>
                <td className="py-2.5 px-4">System</td>
              </tr>
              {/* Row 8 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 text-xs text-gray-500 font-mono">2026-03-09 12:00:05</td>
                <td className="py-2.5 px-4">RPC</td>
                <td className="py-2.5 px-4 font-medium">Relay-Pump-02</td>
                <td className="py-2.5 px-4">Pump OFF — Zone 2 (Manual)</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#e8f5e9] text-[#2e7d32]">Success</span></td>
                <td className="py-2.5 px-4">admin@hcmut.edu.vn</td>
              </tr>
              {/* Row 9 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 text-xs text-gray-500 font-mono">2026-03-09 11:30:00</td>
                <td className="py-2.5 px-4">Login</td>
                <td className="py-2.5 px-4 font-medium">User</td>
                <td className="py-2.5 px-4">Login successful</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#e3f2fd] text-[#1565c0]">Info</span></td>
                <td className="py-2.5 px-4">admin@hcmut.edu.vn</td>
              </tr>
              {/* Row 10 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 text-xs text-gray-500 font-mono">2026-03-09 10:15:22</td>
                <td className="py-2.5 px-4">Alarm</td>
                <td className="py-2.5 px-4 font-medium">Gateway-01</td>
                <td className="py-2.5 px-4">Connection restored</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#e8f5e9] text-[#2e7d32]">Resolved</span></td>
                <td className="py-2.5 px-4">System</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex gap-1 items-center justify-end py-3 px-4 text-xs text-[#666]">
          <span>Page:</span>
          <button className="border border-[#00695c] bg-[#00695c] text-white px-2.5 py-1 cursor-pointer rounded-sm text-[11px]">1</button>
          <button className="border border-[#ddd] bg-white px-2.5 py-1 cursor-pointer rounded-sm text-[11px] hover:bg-[#f5f5f5]">2</button>
          <button className="border border-[#ddd] bg-white px-2.5 py-1 cursor-pointer rounded-sm text-[11px] hover:bg-[#f5f5f5]">3</button>
          <button className="border border-[#ddd] bg-white px-2.5 py-1 cursor-pointer rounded-sm text-[11px] hover:bg-[#f5f5f5]">...</button>
          <button className="border border-[#ddd] bg-white px-2.5 py-1 cursor-pointer rounded-sm text-[11px] hover:bg-[#f5f5f5]">17</button>
          <button className="border border-[#ddd] bg-white px-2.5 py-1 cursor-pointer rounded-sm text-[11px] hover:bg-[#f5f5f5]">›</button>
        </div>

      </div>
    </div>
  );
}
