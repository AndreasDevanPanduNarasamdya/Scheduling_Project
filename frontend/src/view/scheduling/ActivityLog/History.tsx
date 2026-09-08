import { useState, useRef, useCallback } from "react";
import { History as HistoryIcon, Search } from "lucide-react";
import { useActivityHistory } from "./hooks/useActivityHistory";
import TimelineLogEntry from "./components/TimelineLogEntry";
import { useAlert } from '../../messagebox/AlertProvider';

export default function History() {
  const { showAlert } = useAlert();
  const {
    logs, isLoading, error,
    searchQuery, setSearchQuery,
    groupedByDay,
  } = useActivityHistory(showAlert);

  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [collapsedLogs, setCollapsedLogs] = useState<Set<string>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null); // 🟢 Added a ref for the track
  const [scrollProgress, setScrollProgress] = useState(0); 
  const isDraggingThumb = useRef(false);

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

  const handleTimelineScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setScrollProgress(maxScroll > 0 ? el.scrollLeft / maxScroll : 0);
  }, []);

  return (
<div className="min-h-screen w-full bg-brand-bg font-sans overflow-y-auto">
      <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 pt-10 md:pt-14 pb-16">

        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-header-1 tracking-tight">Activity Log</h1>
            <HistoryIcon size={26} className="text-header-1 mt-1" strokeWidth={2.5} />
          </div>

          <div className="relative w-full sm:w-[320px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aktivitas..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b5998] focus:outline-none"
            />
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <span className="text-sm text-gray-500 font-medium">
            {isLoading ? "Memuat…" : `${logs.length} data ditemukan`}
          </span>
        </div>

        {/* 🟢 ROBUST GLOBAL SCROLLBAR */}
        {!isLoading && !error && groupedByDay.length > 0 && (
          <div
            ref={trackRef}
            className="relative h-2 bg-gray-200 rounded-full mb-6 cursor-pointer"
            onMouseDown={(e) => {
              e.preventDefault(); // 🟢 Prevents text highlighting
              isDraggingThumb.current = true;

              // 🟢 Define window-level mouse move
              const handleMouseMove = (moveEvent: MouseEvent) => {
                if (!isDraggingThumb.current) return;
                const el = scrollRef.current;
                const track = trackRef.current;
                if (!el || !track) return;

                const rect = track.getBoundingClientRect();
                const ratio = Math.min(1, Math.max(0, (moveEvent.clientX - rect.left) / rect.width));
                const maxScroll = el.scrollWidth - el.clientWidth;
                el.scrollLeft = ratio * maxScroll;
              };

              // 🟢 Define window-level mouse up
              const handleMouseUp = () => {
                isDraggingThumb.current = false;
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
              };

              // 🟢 Attach listeners to the window so drag persists anywhere on screen
              window.addEventListener('mousemove', handleMouseMove);
              window.addEventListener('mouseup', handleMouseUp);

              // 🟢 Handle the immediate click jump
              handleMouseMove(e.nativeEvent);
            }}
          >
            <div
              className="absolute top-0 h-2 bg-[#3b5998] rounded-full transition-[left] duration-75"
              style={{
                width: "15%",
                left: `${scrollProgress * 85}%`,
              }}
            />
          </div>
        )}

        {/* Error / Empty States */}
        {isLoading && <div className="text-gray-500 text-sm">Memuat riwayat aktivitas…</div>}
        {!isLoading && error && <div className="text-red-500 text-sm font-medium">{error}</div>}
        {!isLoading && !error && groupedByDay.length === 0 && (
          <div className="text-gray-700 bold text-sm">
            {searchQuery ? "Tidak ada hasil yang ditemukan." : "Belum ada riwayat aktivitas."}
          </div>
        )}

        {/* Seamless Horizontal Timeline */}
        {!isLoading && !error && groupedByDay.length > 0 && (
          <div
            ref={scrollRef}
            onScroll={handleTimelineScroll}
            className="flex gap-12 overflow-x-auto pb-10 items-start -mx-6 md:-mx-10 lg:-mx-12 px-6 md:px-10 lg:px-12 scrollbar-thin"
          >
            {groupedByDay.map((day) => {
              const isDayCollapsed = collapsedDays.has(day.key);

              return (
                <div key={day.key} className="flex flex-col shrink-0 min-w-[340px] max-w-[380px]">
                  
                  <div onClick={() => toggleDay(day.key)} className="flex items-center gap-3 cursor-pointer select-none relative z-10">
                    <div className="w-[16px] h-[16px] rounded-full bg-[#f59e0b] shrink-0 ring-[4px] ring-[#f4f7fc]" />
                    <span className="text-[18px] font-medium text-gray-900">{day.label}</span>
                  </div>

                  {!isDayCollapsed && (
                    <div className="relative mt-[-10px]">
                      <div className="absolute left-[7px] top-0 h-[24px] w-[2px] bg-slate-400/80 z-0" />
                      <div className="absolute left-[7px] top-[24px] w-[24px] h-[24px] border-l-[2px] border-b-[2px] border-slate-400/80 rounded-bl-[16px] z-0" />
                      
                      <div className="relative ml-[31px] pt-[41px] pb-2 z-0">
                        {day.entries.map((log, index) => (
                          <TimelineLogEntry
                            key={log.logId}
                            log={log}
                            isFirst={index === 0}
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
    </div>
  );
}