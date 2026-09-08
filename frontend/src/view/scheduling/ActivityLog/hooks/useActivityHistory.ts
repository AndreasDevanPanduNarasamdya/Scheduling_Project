import { useState, useEffect, useMemo } from "react";
import { fetchActivityLogs, fetchTeams } from "../../../../api";
import type { Team, ActivityLogResponse } from "../../../../types";
import { formatDayHeader, getActionLabel, getActualChanges, formatDateRange } from "../utils/historyUtils";

export function useActivityHistory(showAlert?: any) {
  const [logs, setLogs] = useState<ActivityLogResponse[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [filters, setFilters] = useState({ startDate: "", endDate: "", teamId: "", staffId: "" });

  const loadTeams = async () => {
    try { setTeams(await fetchTeams()); } catch {}
  };

  const loadLogs = async (f: typeof filters = filters) => {
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
      const errorMsg = err instanceof Error ? err.message : "Gagal memuat riwayat aktivitas";
      setError(errorMsg);
      if (showAlert) {
        showAlert({ type: 'error', title: 'Kesalahan Jaringan', message: errorMsg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
    loadLogs(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return logs;

    return logs.filter((log) => {
      // 🟢 THE OMNI-SEARCH HAYSTACK: Everything goes in here!
      const haystack = [
        log.actor,
        log.target,
        log.time, // 🟢 Added Time (e.g. "14:30")
        log.date, // 🟢 Added Raw Date (e.g. "2026-09-08")
        formatDayHeader(log.date), // 🟢 Added Natural Date (e.g. "8 September 2026")
        getActionLabel(log.action),
        log.description,
        log.rotation,
        formatDateRange(log.rangeStart, log.rangeEnd),
        ...getActualChanges(log.edit),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [logs, searchQuery]);

  const groupedByDay = useMemo(() => {
    const groups = new Map<string, { label: string; entries: ActivityLogResponse[] }>();

    for (const log of filteredLogs) {
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
  }, [filteredLogs]);

  return {
    logs, teams, isLoading, error,
    searchQuery, setSearchQuery,
    groupedByDay,
    loadLogs,
  };
}