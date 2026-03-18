// Entities Management Screen (Mockup 4.3)
// Top section: device list table (ESP32 sensors, pump relays, gateways)
// Bottom section: asset list organized by zone (zone name, crop type, devices, moisture, health)
import { Plus, Settings } from "lucide-react";
export const metadata = {
  title: "Entities Management",
};

export default function EntitiesPage() {
  return (
    <div className="text-[#333] font-sans">
      
      {/* Page Header & Actions */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-slate-800">Entities Management</h2>
        <button className="bg-[#00695c] text-white border-none px-3.5 py-1.5 text-[11px] font-bold uppercase rounded-sm inline-flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer">
          <Plus className="w-3 h-3" /> Add Entity
        </button>
      </div>

      {/* Devices Table Card */}
      <div className="bg-white rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.12)] border border-[#e0e0e0] mb-4 overflow-hidden">
        {/* Card Header */}
        <div className="border-b border-[#eee] py-2.5 px-4 text-sm flex justify-between items-center">
          <span className="font-medium">Devices</span>
          <span className="text-xs text-gray-400">6 devices registered</span>
        </div>

        {/* Devices Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="bg-[#fafafa] text-left py-2.5 px-4 font-medium text-[#666] uppercase text-[10px] tracking-wide border-b border-[#eee]">Name</th>
                <th className="bg-[#fafafa] text-left py-2.5 px-4 font-medium text-[#666] uppercase text-[10px] tracking-wide border-b border-[#eee]">Type</th>
                <th className="bg-[#fafafa] text-left py-2.5 px-4 font-medium text-[#666] uppercase text-[10px] tracking-wide border-b border-[#eee]">Zone</th>
                <th className="bg-[#fafafa] text-left py-2.5 px-4 font-medium text-[#666] uppercase text-[10px] tracking-wide border-b border-[#eee]">Status</th>
                <th className="bg-[#fafafa] text-left py-2.5 px-4 font-medium text-[#666] uppercase text-[10px] tracking-wide border-b border-[#eee]">Last Activity</th>
                <th className="bg-[#fafafa] text-left py-2.5 px-4 font-medium text-[#666] uppercase text-[10px] tracking-wide border-b border-[#eee]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Device Row 1 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 font-medium">ESP32-Node-01</td>
                <td className="py-2.5 px-4">Sensor Node</td>
                <td className="py-2.5 px-4">Z1: Ornamental</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#e8f5e9] text-[#2e7d32]">Active</span></td>
                <td className="py-2.5 px-4 text-gray-400 text-xs">2 min ago</td>
                <td className="py-2.5 px-4"><Settings className="w-4 h-4 text-gray-400 cursor-pointer inline-block hover:text-gray-600 transition-colors" /></td>
              </tr>
              {/* Device Row 2 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 font-medium">ESP32-Node-02</td>
                <td className="py-2.5 px-4">Sensor Node</td>
                <td className="py-2.5 px-4">Z2: Lettuce</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#e8f5e9] text-[#2e7d32]">Active</span></td>
                <td className="py-2.5 px-4 text-gray-400 text-xs">5 min ago</td>
                <td className="py-2.5 px-4"><Settings className="w-4 h-4 text-gray-400 cursor-pointer inline-block hover:text-gray-600 transition-colors" /></td>
              </tr>
              {/* Device Row 3 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 font-medium">ESP32-Node-03</td>
                <td className="py-2.5 px-4">Sensor Node</td>
                <td className="py-2.5 px-4">Z3: Rose Nursery</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#e8f5e9] text-[#2e7d32]">Active</span></td>
                <td className="py-2.5 px-4 text-gray-400 text-xs">1 min ago</td>
                <td className="py-2.5 px-4"><Settings className="w-4 h-4 text-gray-400 cursor-pointer inline-block hover:text-gray-600 transition-colors" /></td>
              </tr>
              {/* Device Row 4 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 font-medium">Relay-Pump-01</td>
                <td className="py-2.5 px-4">Actuator</td>
                <td className="py-2.5 px-4">Z1: Ornamental</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#e8f5e9] text-[#2e7d32]">Active</span></td>
                <td className="py-2.5 px-4 text-gray-400 text-xs">Just now</td>
                <td className="py-2.5 px-4"><Settings className="w-4 h-4 text-gray-400 cursor-pointer inline-block hover:text-gray-600 transition-colors" /></td>
              </tr>
              {/* Device Row 5 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 font-medium">Relay-Pump-02</td>
                <td className="py-2.5 px-4">Actuator</td>
                <td className="py-2.5 px-4">Z2: Lettuce</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#fce4ec] text-[#c62828]">Inactive</span></td>
                <td className="py-2.5 px-4 text-gray-400 text-xs">3 hours ago</td>
                <td className="py-2.5 px-4"><Settings className="w-4 h-4 text-gray-400 cursor-pointer inline-block hover:text-gray-600 transition-colors" /></td>
              </tr>
              {/* Device Row 6 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 font-medium">Gateway-01</td>
                <td className="py-2.5 px-4">Gateway</td>
                <td className="py-2.5 px-4">—</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#e8f5e9] text-[#2e7d32]">Active</span></td>
                <td className="py-2.5 px-4 text-gray-400 text-xs">Just now</td>
                <td className="py-2.5 px-4"><Settings className="w-4 h-4 text-gray-400 cursor-pointer inline-block hover:text-gray-600 transition-colors" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Assets Table Card */}
      <div className="bg-white rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.12)] border border-[#e0e0e0] overflow-hidden">
        {/* Card Header */}
        <div className="border-b border-[#eee] py-2.5 px-4 text-sm flex justify-between items-center">
          <span className="font-medium">Assets (Zones)</span>
          <span className="text-xs text-gray-400">4 zones configured</span>
        </div>

        {/* Assets Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="bg-[#fafafa] text-left py-2.5 px-4 font-medium text-[#666] uppercase text-[10px] tracking-wide border-b border-[#eee]">Zone</th>
                <th className="bg-[#fafafa] text-left py-2.5 px-4 font-medium text-[#666] uppercase text-[10px] tracking-wide border-b border-[#eee]">Plant Type</th>
                <th className="bg-[#fafafa] text-left py-2.5 px-4 font-medium text-[#666] uppercase text-[10px] tracking-wide border-b border-[#eee]">Devices</th>
                <th className="bg-[#fafafa] text-left py-2.5 px-4 font-medium text-[#666] uppercase text-[10px] tracking-wide border-b border-[#eee]">Soil Moisture</th>
                <th className="bg-[#fafafa] text-left py-2.5 px-4 font-medium text-[#666] uppercase text-[10px] tracking-wide border-b border-[#eee]">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Asset Row 1 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 font-medium">Z1: Ornamental</td>
                <td className="py-2.5 px-4">Ornamental plants</td>
                <td className="py-2.5 px-4">2</td>
                <td className="py-2.5 px-4">72%</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#e8f5e9] text-[#2e7d32]">Healthy</span></td>
              </tr>
              {/* Asset Row 2 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 font-medium">Z2: Lettuce</td>
                <td className="py-2.5 px-4">Lettuce beds</td>
                <td className="py-2.5 px-4">2</td>
                <td className="py-2.5 px-4">38%</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#fce4ec] text-[#c62828]">Needs Water</span></td>
              </tr>
              {/* Asset Row 3 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 font-medium">Z3: Rose Nursery</td>
                <td className="py-2.5 px-4">Rose plants</td>
                <td className="py-2.5 px-4">1</td>
                <td className="py-2.5 px-4">65%</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#e8f5e9] text-[#2e7d32]">Healthy</span></td>
              </tr>
              {/* Asset Row 4 */}
              <tr className="hover:bg-[#f9fafb] transition-colors border-b border-[#f0f0f0]">
                <td className="py-2.5 px-4 font-medium">Z4: Orchids</td>
                <td className="py-2.5 px-4">Orchid section</td>
                <td className="py-2.5 px-4">1</td>
                <td className="py-2.5 px-4">85%</td>
                <td className="py-2.5 px-4"><span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#e8f5e9] text-[#2e7d32]">Healthy</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
