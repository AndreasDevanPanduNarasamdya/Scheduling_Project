import { X } from "lucide-react";
import type { Team } from "../../../../types";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: { startDate: string; endDate: string; teamId: string; staffId: string };
  setFilters: (f: any) => void;
  teams: Team[];
  staffOptions: { staffId: string; name: string }[];
  onApply: () => void;
  onReset: () => void;
}

export default function HistoryFilterModal({ isOpen, onClose, filters, setFilters, teams, staffOptions, onApply, onReset }: FilterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md p-8 shadow-2xl bg-white rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Filter Riwayat</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 cursor-pointer transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-col gap-5 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dari Tanggal</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b5998] focus:outline-none" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sampai Tanggal</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b5998] focus:outline-none" value={filters.endDate} min={filters.startDate || undefined} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tim</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b5998] focus:outline-none" value={filters.teamId} onChange={(e) => setFilters({ ...filters, teamId: e.target.value, staffId: "" })}>
              <option value="">Semua Tim</option>
              {teams.map((t) => <option key={t.teamId} value={t.teamId}>{t.teamName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Staf</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b5998] focus:outline-none" value={filters.staffId} onChange={(e) => setFilters({ ...filters, staffId: e.target.value })}>
              <option value="">Semua Staf</option>
              {staffOptions.map((s) => <option key={s.staffId} value={s.staffId}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button type="button" onClick={onReset} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">Reset</button>
          <button type="button" onClick={onApply} className="px-5 py-2.5 bg-[#3b5998] hover:bg-[#2d4373] text-white rounded-lg text-sm font-medium transition-colors">Terapkan Filter</button>
        </div>
      </div>
    </div>
  );
}