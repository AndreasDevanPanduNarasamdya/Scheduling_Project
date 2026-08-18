import { useState, useEffect, useMemo } from "react";
import {
  History as HistoryIcon, RefreshCw,
  Filter, X, ChevronDown, User, Users
} from "lucide-react";
import { fetchActivityLogs, fetchTeams } from "../../api";
import type { Team, ActivityLogResponse } from "../../types";

/* ================= HELPERS ================= */

function formatDateHeading(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
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

  const [hiddenDays, setHiddenDays] = useState<Record<string, boolean>>({});
  const [hiddenLogs, setHiddenLogs] = useState<Record<string, boolean>>({});

  const loadTeams = async () => {
    try {
      setTeams(await fetchTeams());
    } catch {
      // non-critical
    }
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

  // Group by date; entries within a day sorted earliest -> latest; days sorted earliest -> latest (left to right)
  const groupedLogs = useMemo(() => {
    const map = new Map<string, ActivityLogResponse[]>();
    const sorted = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    sorted.forEach((log) => {
      const dateKey = log.timestamp.split("T")[0];
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(log);
    });

    return Array.from(map.entries()).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  }, [logs]);

  const activeFilterCount = [appliedFilters.startDate, appliedFilters.endDate, appliedFilters.teamId, appliedFilters.staffId]
    .filter(Boolean).length;

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setIsFilterOpen(false);
    loadLogs(filters);
  };

  const handleResetFilters = () => {
    const empty = { startDate: "", endDate: "", teamId: "", staffId: "" };
    setFilters(empty);
    setAppliedFilters(empty);
    setIsFilterOpen(false);
    loadLogs(empty);
  };

  const toggleDay = (dateKey: string) => {
    setHiddenDays((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  const toggleLog = (logId: string) => {
    setHiddenLogs((prev) => ({ ...prev, [logId]: !prev[logId] }));
  };

  return (
    <div className="min-h-screen w-full bg-brand-bg font-sans overflow-y-auto">
      <div className="max-w-7xl mx-auto px-8 pt-20 pb-16">

        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-semibold text-brand-dark">Activity Log</h1>
          <HistoryIcon size={22} className="text-brand-dark mt-1" strokeWidth={2.2} />
        </div>

        {/* Action / Filter bar */}
        <div className="mb-10 flex items-center justify-between flex-wrap gap-3">
          <div className="action-group">
            <button type="button" onClick={() => setIsFilterOpen(true)} className="action-group-btn relative">
              Filter <Filter size={16} strokeWidth={2.5} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-white text-brand-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-brand-primary/20 shadow-sm">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button type="button" onClick={handleResetFilters} className="action-group-btn">
                Reset <X size={16} strokeWidth={2.5} />
              </button>
            )}
            <button type="button" onClick={() => loadLogs(appliedFilters)} className="action-group-btn">
              <RefreshCw size={16} strokeWidth={2.5} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>

          <span className="text-sm text-black/50 font-medium">
            {isLoading ? "Memuat…" : `${logs.length} rekaman ditemukan`}
          </span>
        </div>

        {/* Content states */}
        {isLoading && (
          <div className="text-center text-sm text-black/50 py-12">Memuat riwayat aktivitas…</div>
        )}

        {!isLoading && error && (
          <div className="text-center text-sm text-state-error py-12">{error}</div>
        )}

        {!isLoading && !error && logs.length === 0 && (
          <div className="text-center text-sm text-black/40 italic py-12">
            Belum ada riwayat aktivitas untuk filter ini.
          </div>
        )}

        {/* ============ OPEN VERTICAL-LINE TIMELINE, NO CARDS/BOXES ============ */}
        {!isLoading && !error && groupedLogs.length > 0 && (
          <div className="flex gap-16 overflow-x-auto pb-8 items-start">
            {groupedLogs.map(([dateKey, dayLogs]) => {
              const isDayHidden = !!hiddenDays[dateKey];

              return (
                <div key={dateKey} className="min-w-[280px] shrink-0">

                  {/* Day heading: orange dot + date + chevron */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <button
                      type="button"
                      onClick={() => toggleDay(dateKey)}
                      className="w-3.5 h-3.5 rounded-full bg-amber-500 hover:scale-110 transition-transform cursor-pointer shrink-0"
                      title="Sembunyikan / tampilkan aktivitas hari ini"
                    />
                    <span className="font-semibold text-black/90 text-[17px]">
                      {formatDateHeading(dateKey)}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleDay(dateKey)}
                      className="text-black/40 hover:text-black/70 transition cursor-pointer"
                    >
                      <ChevronDown size={16} className={`transition-transform ${isDayHidden ? "-rotate-90" : ""}`} />
                    </button>
                  </div>

                  {!isDayHidden && (
                    <div className="relative pl-6">
                      {/* continuous vertical line, earliest (top) to latest (bottom) */}
                      <div className="absolute left-[5px] top-0 bottom-0 w-px bg-black/25" />
                      {/* elbow connecting the day-dot down into the line, matching the mockup */}
                      <div className="absolute left-[5px] -top-[26px] w-4 h-4 border-l border-b border-black/25 rounded-bl-md" />

                      <div className="flex flex-col gap-5">
                        {dayLogs.map((log) => {
                          const isLogHidden = !!hiddenLogs[log.logId];
                          const timeStr = formatTime(log.timestamp);
                          const actor = log.actorName || "System";

                          return (
                            <div key={log.logId} className="relative">
                              {/* Blue dot on the line */}
                              <button
                                type="button"
                                onClick={() => toggleLog(log.logId)}
                                className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-brand-primary hover:scale-125 transition-transform cursor-pointer z-10"
                                title="Sembunyikan / tampilkan detail aktivitas"
                              />

                              {isLogHidden ? (
                                <div className="text-sm font-medium text-black/50">{timeStr}</div>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm font-medium text-black/50">{timeStr}</span>
                                  <span className="text-[15px] font-semibold text-black/90 leading-tight">{actor}</span>
                                  <span className="text-sm text-black/70">{log.description}</span>

                                  {log.staffName && (
                                    <span className="flex items-center gap-1.5 text-sm text-black/80 font-medium mt-0.5">
                                      <User size={14} className="text-black/50" />{log.staffName}
                                    </span>
                                  )}
                                  {log.teamName && (
                                    <span className="flex items-center gap-1.5 text-sm text-black/80 font-medium">
                                      <Users size={14} className="text-black/50" />{log.teamName}
                                    </span>
                                  )}

                                  {log.description && (
                                    <span className="text-sm text-black/40 italic mt-0.5">{log.description}</span>
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

      {/* ================= FILTER MODAL ================= */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-8 shadow-2xl bg-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-black">Filter Riwayat</h2>
              <button onClick={() => setIsFilterOpen(false)} className="text-black/40 hover:text-black cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Dari Tanggal</label>
                  <input
                    type="date"
                    className="input-field cursor-pointer text-black/80"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch {} }}
                  />
                </div>
                <div>
                  <label className="form-label">Sampai Tanggal</label>
                  <input
                    type="date"
                    className="input-field cursor-pointer text-black/80"
                    value={filters.endDate}
                    min={filters.startDate || undefined}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch {} }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Tim</label>
                <select
                  className="input-field cursor-pointer"
                  value={filters.teamId}
                  onChange={(e) => setFilters({ ...filters, teamId: e.target.value, staffId: "" })}
                >
                  <option value="">Semua Tim</option>
                  {teams.map((t) => (
                    <option key={t.teamId} value={t.teamId}>{t.teamName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Staf</label>
                <select
                  className="input-field cursor-pointer"
                  value={filters.staffId}
                  onChange={(e) => setFilters({ ...filters, staffId: e.target.value })}
                >
                  <option value="">Semua Staf</option>
                  {staffOptions.map((s) => (
                    <option key={s.staffId} value={s.staffId}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-brand-outline/40">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2 text-sm font-medium text-black/60 hover:bg-brand-bg rounded-xl transition cursor-pointer"
              >
                Reset
              </button>
              <button type="button" onClick={handleApplyFilters} className="btn-primary text-sm">
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}