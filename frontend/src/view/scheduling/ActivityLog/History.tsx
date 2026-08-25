import { useState } from "react";
import { History as HistoryIcon, RefreshCw, Filter } from "lucide-react";
import { useActivityHistory } from "./hooks/useActivityHistory";
import HistoryFilterModal from "./components/HistoryFilterModal";
import TimelineLogEntry from "./components/TimelineLogEntry";

export default function History() {
  const {
    logs, teams, isLoading, error, 
    isFilterOpen, setIsFilterOpen, 
    filters, setFilters, appliedFilters, activeFilterCount, 
    groupedByDay, staffOptions, 
    loadLogs, handleApplyFilters, handleResetFilters
  } = useActivityHistory();

  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [collapsedLogs, setCollapsedLogs] = useState<Set<string>>(new Set());

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

        {/* Seamless Horizontal Timeline */}
        {!isLoading && !error && groupedByDay.length > 0 && (
          <div className="flex gap-12 overflow-x-auto pb-10 items-start">
            {groupedByDay.map((day) => {
              const isDayCollapsed = collapsedDays.has(day.key);

              return (
                <div key={day.key} className="flex flex-col shrink-0 min-w-[340px] max-w-[380px]">
                  
                  {/* Day Header */}
                  <div onClick={() => toggleDay(day.key)} className="flex items-center gap-3 cursor-pointer select-none relative z-10">
                    <div className="w-[16px] h-[16px] rounded-full bg-[#f59e0b] shrink-0 ring-[4px] ring-[#f4f7fc]" />
                    <span className="text-[18px] font-medium text-gray-900">{day.label}</span>
                  </div>

                  {/* Branching Path & Logs */}
                  {!isDayCollapsed && (
                    <div className="relative mt-[-10px]">
                      <div className="absolute left-[7px] top-0 bottom-[-40px] w-[2px] bg-slate-400/80 z-0" />
                      <div className="absolute left-[7px] top-[24px] w-[24px] h-[24px] border-l-[2px] border-b-[2px] border-slate-400/80 rounded-bl-[16px] z-0" />
                      
                      <div className="relative ml-[31px] pt-[41px] pb-2 z-0">
                        {day.entries.map((log, index) => (
                          <TimelineLogEntry
                            key={log.logId}
                            log={log}
                            isLast={index === day.entries.length - 1}
                            isCollapsed={collapsedLogs.has(log.logId)}
                            onToggle={() => toggleLog(log.logId)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <HistoryFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
        teams={teams}
        staffOptions={staffOptions}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </div>
  );
}