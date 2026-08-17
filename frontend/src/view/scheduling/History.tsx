import { useState, useEffect, useMemo } from "react";
import {
  History as HistoryIcon, CheckCircle2, XCircle, RefreshCw,
  Filter, X, Calendar as CalendarIcon
} from "lucide-react";
import { fetchActivityLogs, fetchTeams } from "../../api";
import type { ActivityLogResponse, Team, DutyStatus, LogSourceType } from "../../types";

/* ================= HELPERS ================= */

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-brand-primary", "bg-brand-light", "bg-emerald-500",
  "bg-amber-500", "bg-rose-500", "bg-violet-500"
];

function avatarColor(name?: string | null) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const SOURCE_LABELS: Record<LogSourceType, string> = {
  TeamSchedule: "TEAM SCHEDULE",
  PersonalSchedule: "PERSONAL SCHEDULE",
  FromTicket: "FROM TICKET",
};

const SOURCE_STYLES: Record<LogSourceType, string> = {
  TeamSchedule: "bg-blue-50 text-blue-700",
  PersonalSchedule: "bg-amber-50 text-amber-700",
  FromTicket: "bg-violet-50 text-violet-700",
};

function DutyStatusBadge({ status }: { status: DutyStatus }) {
  const isOn = status === "OnDuty";
  return (
    <span className={`badge ${isOn ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
      {isOn ? "ON DUTY" : "OFF DUTY"}
    </span>
  );
}

function RowIcon({ sourceType, dutyStatus }: { sourceType: LogSourceType; dutyStatus: DutyStatus }) {
  if (sourceType === "FromTicket") {
    return (
      <span className="w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
        <CalendarIcon size={16} className="text-violet-600" />
      </span>
    );
  }
  const isOn = dutyStatus === "OnDuty";
  return (
    <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isOn ? "bg-emerald-50" : "bg-red-50"}`}>
      {isOn
        ? <CheckCircle2 size={18} className="text-emerald-600" />
        : <XCircle size={18} className="text-red-500" />}
    </span>
  );
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

  const loadTeams = async () => {
    try {
      setTeams(await fetchTeams());
    } catch {
      // non-critical for this page, ignore silently
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

  return (
    <div className="min-h-screen w-full bg-brand-bg font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 pt-20 pb-16">

        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-semibold text-brand-dark">Riwayat Aktivitas</h1>
          <HistoryIcon size={22} className="text-brand-dark mt-1" strokeWidth={2.2} />
        </div>

        {/* Action / Filter bar */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="action-group">
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="action-group-btn relative"
            >
              Filter <Filter size={16} strokeWidth={2.5} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-white text-brand-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button type="button" onClick={handleResetFilters} className="action-group-btn">
                Reset <X size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <span className="text-sm text-black/50">
            {isLoading ? "Memuat…" : `${logs.length} rekaman ditemukan`}
          </span>
        </div>

        {/* Content states */}
        {isLoading && (
          <div className="card p-12 text-center text-sm text-black/50">Memuat riwayat aktivitas…</div>
        )}

        {!isLoading && error && (
          <div className="card p-8 text-center text-sm text-state-error">{error}</div>
        )}

        {!isLoading && !error && logs.length === 0 && (
          <div className="card p-12 text-center text-sm text-black/40 italic">
            Belum ada riwayat aktivitas untuk filter ini.
          </div>
        )}

        {!isLoading && !error && logs.length > 0 && (
          <div className="card overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1.4fr_1.6fr_1.1fr_1.1fr_1.8fr_1.3fr_1.3fr] px-6 py-3 text-xs font-bold uppercase tracking-wide text-black/40 border-b border-brand-outline/40 bg-brand-bg/40">
              <span>Waktu</span>
              <span>Staf</span>
              <span>Tim</span>
              <span>Status</span>
              <span>Alasan / Keterangan</span>
              <span>Sumber</span>
              <span>Detail Sumber</span>
            </div>

            {logs.map((log, i) => (
              <div
                key={log.logId}
                className={`grid grid-cols-[1.4fr_1.6fr_1.1fr_1.1fr_1.8fr_1.3fr_1.3fr] items-center px-6 py-4 text-[14px] text-black/90 hover:bg-brand-bg/40 transition-colors ${
                  i !== logs.length - 1 ? "border-b border-brand-outline/30" : ""
                }`}
              >
                {/* Waktu */}
                <div className="flex items-center gap-3">
                  <RowIcon sourceType={log.sourceType} dutyStatus={log.dutyStatus} />
                  <div className="flex flex-col leading-tight">
                    <span className="font-medium">{formatDate(log.timestamp)}</span>
                    <span className="text-xs text-black/40">{formatTime(log.timestamp)}</span>
                  </div>
                </div>

                {/* Staf */}
                <div className="flex items-center gap-2.5">
                  <span className={`w-8 h-8 rounded-full ${avatarColor(log.staffName)} text-white text-[11px] font-bold flex items-center justify-center shrink-0`}>
                    {initials(log.staffName)}
                  </span>
                  <div className="flex flex-col leading-tight min-w-0">
                    <span className="font-medium truncate">{log.staffName || "-"}</span>
                    <span className="text-xs text-black/40 truncate">{log.position || ""}</span>
                  </div>
                </div>

                {/* Tim */}
                <span className="text-black/70 truncate">{log.teamName || "-"}</span>

                {/* Status */}
                <div><DutyStatusBadge status={log.dutyStatus} /></div>

                {/* Alasan / Keterangan */}
                <div className="flex flex-col leading-tight min-w-0 pr-2">
                  <span className="truncate">{log.reason || "-"}</span>
                  {log.description && (
                    <span className="text-xs text-black/40 truncate">{log.description}</span>
                  )}
                </div>

                {/* Sumber */}
                <div>
                  <span className={`badge ${SOURCE_STYLES[log.sourceType]}`}>
                    {SOURCE_LABELS[log.sourceType]}
                  </span>
                </div>

                {/* Detail Sumber */}
                <span className="text-black/50 text-sm truncate">{log.sourceDetail || "-"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= FILTER MODAL ================= */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-8 shadow-2xl">
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
              <button
                type="button"
                onClick={handleApplyFilters}
                className="btn-primary text-sm"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}