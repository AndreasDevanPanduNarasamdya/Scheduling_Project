import { useState, useEffect, useMemo } from "react";
import {
  History as HistoryIcon, RefreshCw, Filter, X,
  User, Users, ChevronDown, Calendar, Repeat
} from "lucide-react";
import { fetchActivityLogs, fetchTeams } from "../../api";
import type { Team, ActivityLogResponse } from "../../types";

/* ================= HELPERS ================= */

function formatTimeOnly(timeString: string | undefined) {
  if (!timeString) return "";
  return timeString.slice(0, 5); 
}

function formatDayHeader(isoDate: string) {
  const d = new Date(isoDate);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const ACTION_META: Record<string, string> = {
  CreateStaff: "Menambah Akun Baru",
  EditStaff: "Mengedit Staff",
  RemoveStaff: "Menghapus Staff",
  AccountActivation: "Akun Teraktivasi",
  CreateTicket: "Membuat Tiket Baru",
  ApproveTicket: "Tiket Disetujui",
  DeclineTicket: "Tiket Ditolak",
  CreateTeam: "Membuat tim baru",
  EditTeam: "Mengedit Tim",
  RemoveTeam: "Menghapus Tim",
  CreatePersonalSchedule: "Membuat Jadwal Personal Baru",
  EditPersonalSchedule: "Mengedit Jadwal Personal",
  RemovePersonalSchedule: "Menghapus Jadwal Personal",
  CreateTeamSchedule: "Membuat Jadwal Tim Baru",
  EditTeamSchedule: "Mengedit Jadwal Tim",
  RemoveTeamSchedule: "Menghapus Jadwal Tim"
};

function getActionLabel(actionType: string) {
  return ACTION_META[actionType] || actionType;
}

/* ================= MAIN PAGE ================= */

export default function History() {
  const [logs, setLogs] = useState<ActivityLogResponse[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", teamId: "", staffId: "" });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [collapsedLogs, setCollapsedLogs] = useState<Set<string>>(new Set()); 

  const loadTeams = async () => {
    try { setTeams(await fetchTeams()); } catch {}
  };

  const loadLogs = async (f: typeof filters) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchActivityLogs({
        startDate: f.startDate || undefined,
        endDate: f.endDate || undefined,
        teamId: f.teamId || undefined,
        staffId: f.staffId || undefined,
      });
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat riwayat aktivitas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
    loadLogs(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const staffOptions = useMemo(() => {
    const map = new Map<string, { staffId: string; name: string }>();
    teams.forEach((t) => t.members.forEach((m) => map.set(m.staffId, { staffId: m.staffId, name: m.name })));
    return Array.from(map.values());
  }, [teams]);

  const groupedByDay = useMemo(() => {
    const groups = new Map<string, { label: string; entries: ActivityLogResponse[] }>();
    
    for (const log of logs) {
      const key = log.date; 
      if (!groups.has(key)) {
        groups.set(key, { label: formatDayHeader(key), entries: [] });
      }
      groups.get(key)!.entries.push(log);
    }
    
    for (const group of groups.values()) {
      group.entries.sort((a, b) => {
        const timeA = a.time || "";
        const timeB = b.time || "";
        return timeA.localeCompare(timeB);
      });
    }
    
    return Array.from(groups.entries())
      .sort((a, b) => (new Date(a[0]).getTime() < new Date(b[0]).getTime() ? 1 : -1))
      .map(([key, value]) => ({ key, ...value }));
  }, [logs]);

  const activeFilterCount = [appliedFilters.startDate, appliedFilters.endDate, appliedFilters.teamId, appliedFilters.staffId].filter(Boolean).length;

  const handleApplyFilters = () => { setAppliedFilters(filters); setIsFilterOpen(false); loadLogs(filters); };
  const handleResetFilters = () => {
    const empty = { startDate: "", endDate: "", teamId: "", staffId: "" };
    setFilters(empty); setAppliedFilters(empty); setIsFilterOpen(false); loadLogs(empty);
  };

  const toggleDay = (key: string) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleLog = (logId: string) => {
    setCollapsedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId); else next.add(logId);
      return next;
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7fc] font-sans overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-10 pt-20 pb-16">

        {/* Page Header */}
        <div className="flex items-center gap-3 mb-10">
          <h1 className="text-[32px] font-medium text-gray-900 tracking-tight">Activity Log</h1>
          <HistoryIcon size={26} className="text-gray-900 mt-1" strokeWidth={2.5} />
        </div>

        {/* Action / Filter bar */}
        <div className="mb-12 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsFilterOpen(true)} className="px-5 py-2.5 bg-[#3b5998] hover:bg-[#2d4373] text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors relative">
              Filter <Filter size={16} strokeWidth={2.5} />
              {activeFilterCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">{activeFilterCount}</span>}
            </button>
            <button type="button" onClick={() => loadLogs(appliedFilters)} className="p-2.5 bg-[#3b5998] hover:bg-[#2d4373] text-white rounded-lg shadow-sm transition-colors">
              <RefreshCw size={16} strokeWidth={2.5} className={isLoading ? "animate-spin" : ""} />
            </button>
            {activeFilterCount > 0 && (
              <button type="button" onClick={handleResetFilters} className="px-4 py-2.5 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">Reset</button>
            )}
          </div>
          <span className="text-sm text-gray-500 font-medium">
            {isLoading ? "Memuat…" : `${logs.length} rekaman ditemukan`}
          </span>
        </div>

        {/* Error / Empty States */}
        {isLoading && <div className="text-gray-500 text-sm">Memuat riwayat aktivitas…</div>}
        {!isLoading && error && <div className="text-red-500 text-sm font-medium">{error}</div>}
        {!isLoading && !error && groupedByDay.length === 0 && <div className="text-gray-400 italic text-sm">Belum ada riwayat aktivitas untuk filter ini.</div>}

        {/* ================= SEAMLESS HORIZONTAL TIMELINE ================= */}
        {!isLoading && !error && groupedByDay.length > 0 && (
          <div className="flex gap-12 overflow-x-auto pb-10 items-start">
            {groupedByDay.map((day) => {
              const isDayCollapsed = collapsedDays.has(day.key);

              return (
                <div key={day.key} className="flex flex-col shrink-0 min-w-[340px] max-w-[380px]">

                  {/* Day Header (Orange Dot & Text) */}
                  <div onClick={() => toggleDay(day.key)} className="flex items-center gap-3 cursor-pointer select-none relative z-10">
                    <div className="w-[16px] h-[16px] rounded-full bg-[#f59e0b] shrink-0 ring-[4px] ring-[#f4f7fc]" />
                    <span className="text-[18px] font-medium text-gray-900">{day.label}</span>
                  </div>

                  {/* Branching Path & Logs */}
                  {!isDayCollapsed && (
                    <div className="relative mt-[-10px]">

                      {/* 1. MAIN VERTICAL STEM */}
                      <div className="absolute left-[7px] top-0 bottom-[-40px] w-[2px] bg-slate-400/80 z-0" />

                      {/* 2. THE CURVE BRANCH */}
                      <div className="absolute left-[7px] top-[24px] w-[24px] h-[24px] border-l-[2px] border-b-[2px] border-slate-400/80 rounded-bl-[16px] z-0" />

                      {/* 3. LOG ITEMS CONTAINER */}
                      <div className="relative ml-[31px] pt-[41px] pb-2 z-0">

                        {day.entries.map((log, index) => {
                          const isLast = index === day.entries.length - 1;
                          const isCollapsed = collapsedLogs.has(log.logId);
                          const actionLabel = getActionLabel(log.action);

                          return (
                            <div key={log.logId} className={`relative pl-7 w-full ${isCollapsed ? 'pb-5' : 'pb-10'}`}>

                              {/* 4. THE SECONDARY SIBLING LINE */}
                              {!isLast && (
                                <div className="absolute left-[-1px] top-[14px] bottom-[-7px] w-[2px] bg-slate-400/80 z-0" />
                              )}

                              {/* 5. Blue Timeline Dot */}
                              <button
                                type="button"
                                onClick={() => toggleLog(log.logId)}
                                title={isCollapsed ? "Tampilkan detail" : "Sembunyikan detail"}
                                className="absolute left-[-7px] top-[0px] w-[14px] h-[14px] rounded-full bg-[#3b5998] ring-[4px] ring-[#f4f7fc] z-10 hover:scale-[1.15] transition-transform cursor-pointer"
                              />

                              {/* Content Hierarchy */}
                              {isCollapsed ? (
                                // COLLAPSED STATE (Just Time)
                                <div className="flex items-center h-[14px]">
                                  <span className="text-[16px] text-gray-500 font-semibold leading-none select-none cursor-pointer" onClick={() => toggleLog(log.logId)}>
                                    {formatTimeOnly(log.time)}
                                  </span>
                                </div>
                              ) : (
                                // EXPANDED STATE
                                <div className="flex flex-col items-start text-left w-full mt-[-2px]">

                                  {/* Time: bold, medium gray */}
                                  <span className="text-[16px] text-gray-500 font-semibold mb-1 leading-none">
                                    {formatTimeOnly(log.time)}
                                  </span>

                                  {/* Actor: bold, near-black */}
                                  <span className="text-[18px] text-gray-900 font-semibold leading-snug mb-0.5">
                                    {log.actor}
                                  </span>

                                  {/* Action: normal weight, medium gray */}
                                  <span className="text-[18px] text-gray-500 font-normal leading-snug mb-3">
                                    {actionLabel}
                                  </span>

                                  <div className="flex flex-col items-start gap-2 mb-2">
                                    {log.dateRange && (
                                      <div className="flex items-center gap-2 text-[14px] font-normal text-gray-600">
                                        <Calendar size={16} strokeWidth={2} className="text-gray-600" />
                                        {log.dateRange}
                                      </div>
                                    )}

                                    {log.rotation && (
                                      <div className="flex items-center gap-2 text-[14px] font-normal text-gray-600">
                                        <Repeat size={16} strokeWidth={2} className="text-gray-600" />
                                        {log.rotation}
                                      </div>
                                    )}

                                    {/* Target: bold, darker gray */}
                                    <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-700">
                                      {log.target.toLowerCase().includes("tim") ? (
                                        <Users size={16} strokeWidth={2} className="text-gray-700" />
                                      ) : (
                                        <User size={16} strokeWidth={2} className="text-gray-700" />
                                      )}
                                      {log.target}
                                    </div>
                                  </div>

                                  {/* Description: small, normal weight, light gray */}
                                  {log.description && (
                                    <div className="text-[13px] font-normal text-gray-400 mt-1 leading-snug text-left max-w-[280px] break-words">
                                      {log.description}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {isFilterOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md p-8 shadow-2xl bg-white rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Filter Riwayat</h2>
              <button onClick={() => setIsFilterOpen(false)} className="text-gray-400 hover:text-gray-900 cursor-pointer transition-colors"><X size={20} /></button>
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
              <button type="button" onClick={handleResetFilters} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">Reset</button>
              <button type="button" onClick={handleApplyFilters} className="px-5 py-2.5 bg-[#3b5998] hover:bg-[#2d4373] text-white rounded-lg text-sm font-medium transition-colors">Terapkan Filter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}