import { useState, useEffect, useMemo } from "react";
import { fetchActivityLogs, fetchTeams } from "../../../../api";
import type { Team, ActivityLogResponse } from "../../../../types";
import { formatDayHeader } from "../utils/historyUtils";

export function useActivityHistory() {
  const [logs, setLogs] = useState<ActivityLogResponse[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", teamId: "", staffId: "" });
  const [appliedFilters, setAppliedFilters] = useState(filters);

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

  return {
    logs, teams, isLoading, error, 
    isFilterOpen, setIsFilterOpen, 
    filters, setFilters, 
    appliedFilters, activeFilterCount, 
    groupedByDay, staffOptions, 
    loadLogs, handleApplyFilters, handleResetFilters
  };
}