import { useMemo, useRef, useLayoutEffect, useState, useEffect } from "react";
import type { TimelineTeam, BarType } from "../../../../types";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const COLUMN_WIDTH = 40;

const BAR_COLORS: Record<BarType, string> = {
  None: "",
  OffDuty: "bg-brand-primary border-2 border-brand-dark shadow-sm",
  Leave: "bg-red-500 border-2 border-red-700 shadow-sm",
  Transition: "bg-yellow-400 border-2 border-yellow-600",
};

function generateTimelineDays(startDate: Date, endDate: Date) {
  const days = [];
  const months = [];
  let currentMonth = startDate.getMonth();
  let currentYear = startDate.getFullYear();
  let span = 0;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const isToday = new Date().toDateString() === d.toDateString();
    days.push({ date: new Date(d), dayNumber: d.getDate(), isToday, isWeekend: d.getDay() === 0 || d.getDay() === 6 });

    if (d.getMonth() === currentMonth) {
      span++;
    } else {
      months.push({ name: MONTH_NAMES[currentMonth], year: currentYear, span });
      currentMonth = d.getMonth();
      currentYear = d.getFullYear();
      span = 1;
    }
  }
  months.push({ name: MONTH_NAMES[currentMonth], year: currentYear, span });
  return { days, months };
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface DayInfo {
  barType: BarType;
  label?: string;
}

function useDayLookup(teams: TimelineTeam[]) {
  return useMemo(() => {
    const map = new Map<string, Map<string, DayInfo>>();
    for (const team of teams) {
      for (const member of team.members) {
        const dayMap = new Map<string, DayInfo>();
        for (const day of member.days) {
          dayMap.set(day.date, { barType: day.barType, label: day.label });
        }
        map.set(member.staffId, dayMap);
      }
    }
    return map;
  }, [teams]);
}

interface BarSegment {
  startIndex: number;
  length: number;
  barType: BarType;
  label?: string;
}

function computeSegments(days: { date: Date }[], memberDays: Map<string, DayInfo> | undefined): BarSegment[] {
  const segments: BarSegment[] = [];
  let current: BarSegment | null = null;

  days.forEach((d, i) => {
    const entry = memberDays?.get(toDateKey(d.date));
    const barType = entry?.barType ?? "None";

    if (barType === "None") {
      current = null;
      return;
    }

    if (current && current.barType === barType && current.label === entry?.label) {
      current.length++;
    } else {
      current = { startIndex: i, length: 1, barType, label: entry?.label };
      segments.push(current);
    }
  });

  return segments;
}

export interface TimelineComponentProps {
  teams: TimelineTeam[];
  isLoading: boolean;
  startDate: Date;
  endDate: Date;
  compact?: boolean;
  onBarClick?: (detail: { barType: BarType; label?: string; staffName: string; startDate: string; endDate: string }) => void;
  onInspectTarget?: (id: string, name: string, type: "team" | "staff", subtitle?: string) => void;
}

export default function TimelineComponent({
  teams,
  isLoading,
  startDate,
  endDate,
  compact = false,
  onBarClick,
  onInspectTarget
}: TimelineComponentProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasInitialScrolled = useRef(false);
  const isAddingPast = useRef(false);
  const previousScrollState = useRef({ width: 0, left: 0 });

  const [currentRange, setCurrentRange] = useState({ start: startDate, end: endDate });
  const [visibleYear, setVisibleYear] = useState(startDate.getFullYear());

  useEffect(() => {
    setCurrentRange(prev => {
      if (prev.start.getTime() === startDate.getTime() && prev.end.getTime() === endDate.getTime()) {
        return prev;
      }
      return { start: startDate, end: endDate };
    });
  }, [startDate.getTime(), endDate.getTime()]);

  const { days, months } = useMemo(() => generateTimelineDays(currentRange.start, currentRange.end), [currentRange.start, currentRange.end]);
  const totalWidth = days.length * COLUMN_WIDTH;
  const dayLookup = useDayLookup(teams);

  // 🔥 Responsive sidebar classes: shrinks on mobile, expands on desktop
  const nameWidthClasses = compact 
    ? "w-[120px] md:w-[200px] lg:w-[256px]" 
    : "w-[130px] sm:w-[180px] md:w-[240px] lg:w-[288px]";

  const headerHeight = compact ? "h-[80px]" : "h-[88px]";
  const teamRowHeight = compact ? "h-[48px]" : "h-[54px]";
  const staffRowHeight = compact ? "h-[54px]" : "h-[60px]";

  useLayoutEffect(() => {
    if (!hasInitialScrolled.current && scrollContainerRef.current && days.length > 0 && !isLoading) {
      const todayIndex = days.findIndex(d => d.isToday);
      if (todayIndex !== -1) {
        scrollContainerRef.current.scrollLeft = (todayIndex * COLUMN_WIDTH) - (scrollContainerRef.current.clientWidth / 2);
        hasInitialScrolled.current = true;
      }
    }
  }, [days, isLoading]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || isAddingPast.current || isLoading) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    const centerDayIndex = Math.floor((scrollLeft + clientWidth / 2) / COLUMN_WIDTH);
    const centerDate = days[centerDayIndex]?.date;
    if (centerDate && centerDate.getFullYear() !== visibleYear) {
      setVisibleYear(centerDate.getFullYear());
    }

    if (scrollLeft < 500) {
      isAddingPast.current = true;
      previousScrollState.current = { width: scrollWidth, left: scrollLeft };
      
      setCurrentRange(prev => {
        const newStart = new Date(prev.start);
        newStart.setFullYear(newStart.getFullYear() - 1);
        return { ...prev, start: newStart };
      });
    } 
    else if (scrollWidth - (scrollLeft + clientWidth) < 500) {
      setCurrentRange(prev => {
        const newEnd = new Date(prev.end);
        newEnd.setFullYear(newEnd.getFullYear() + 1);
        return { ...prev, end: newEnd };
      });
    }
  };

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (container && previousScrollState.current.width > 0 && isAddingPast.current) {
      const widthDifference = container.scrollWidth - previousScrollState.current.width;
      if (widthDifference > 0) {
        container.scrollLeft = previousScrollState.current.left + widthDifference;
      }
      isAddingPast.current = false;
      previousScrollState.current = { width: 0, left: 0 };
    }
  }, [days.length]);

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      // Added mobile touch scrolling enhancements
      className="w-full h-full overflow-auto relative bg-white scrollbar-thin [-webkit-overflow-scrolling:touch]"
    >
      {/* 🔥 Changed inline minWidth math to Tailwind's min-w-max so the browser handles it responsively! */}
      <div className="flex min-w-max">

        {/* STICKY LEFT NAME COLUMN */}
        <div
          className={`${nameWidthClasses} flex-shrink-0 sticky left-0 z-30 border-r border-brand-outline flex flex-col bg-white shadow-[4px_0_12px_-4px_rgba(0,0,0,0.15)]`}
        >
          <div className={`${headerHeight} sticky top-0 z-40 flex items-center shrink-0 border-b border-brand-outline ${compact ? 'bg-brand-bg/50 px-3 md:px-4' : 'bg-brand-light text-white p-3 md:p-4'}`}>
            <h1 className={`${compact ? 'text-[15px] md:text-[18px] text-brand-dark' : 'text-[16px] md:text-[22px]'} font-bold leading-tight`}>
              Jadwal<br/>Lapangan
            </h1>
          </div>

          {isLoading && teams.length === 0 ? (
            <div className="p-4 text-xs md:text-sm text-black/50 text-center">Memuat jadwal...</div>
          ) : (
            teams.map((team) => (
              <div key={team.teamId}>
                <div 
                  onClick={() => !compact && onInspectTarget?.(team.teamId, team.teamName, "team")}
                  className={`bg-brand-bg px-3 md:px-4 ${teamRowHeight} flex items-center justify-between font-bold ${compact ? 'text-[12px] md:text-[14px]' : 'text-[13px] md:text-[15px]'} text-brand-dark border-b border-brand-outline/50 shrink-0 ${!compact && onInspectTarget ? 'cursor-pointer hover:bg-brand-outline/20 transition' : ''}`}
                >
                  <span className="truncate pr-2">{team.teamName}</span>
                  <span className={`badge bg-brand-primary text-white shrink-0 ${compact ? 'py-0.5 px-1.5 text-[9px] md:text-[11px]' : 'py-1 px-2 text-[10px] md:text-[12px]'}`}>TIM</span>
                </div>
                {team.members.length === 0 ? (
                  <div className={`px-3 md:px-4 flex items-center text-xs text-black/40 italic border-b border-gray-100 shrink-0 ${staffRowHeight}`}>Kosong</div>
                ) : (
                  team.members.map((member) => (
                    <div 
                      key={member.staffId} 
                      onClick={() => !compact && onInspectTarget?.(member.staffId, member.name, "staff", `${member.position} • Tim: ${team.teamName}`)}
                      className={`px-3 md:px-4 flex items-center justify-between text-black/80 border-b border-gray-100 shrink-0 ${staffRowHeight} ${compact ? 'text-[12px] md:text-[14px]' : 'text-[12px] md:text-[15px]'} ${!compact && onInspectTarget ? 'cursor-pointer hover:bg-brand-bg/40 transition' : ''}`}
                    >
                      <span className="truncate max-w-[65%] md:max-w-[75%] pr-2" title={member.name}>{member.name}</span>
                      <span className={`text-black/40 text-right truncate ${compact ? 'text-[10px] md:text-[12px]' : 'text-[10px] md:text-[13px]'}`}>{member.position}</span>
                    </div>
                  ))
                )}
              </div>
            ))
          )}
        </div>

        {/* CALENDAR GRID */}
        <div className="flex flex-col flex-shrink-0" style={{ width: `${totalWidth}px` }}>

          <div className={`sticky top-0 z-20 bg-white shrink-0 shadow-sm border-b border-brand-outline flex flex-col box-border ${headerHeight}`}>
            
            <div className={`${compact ? 'hidden' : 'h-[24px] flex'} items-center justify-center border-b border-brand-outline/40 bg-brand-bg shrink-0 w-full box-border`}>
              <div className="sticky left-1/2 -translate-x-1/2 w-fit">
                <span className="text-brand-dark font-semibold text-[13px] whitespace-nowrap">{visibleYear}</span>
              </div>
            </div>
            
            <div className={`flex ${compact ? 'h-[38px]' : 'h-[31px]'} border-b border-brand-outline/40 text-black/70 bg-brand-bg shrink-0 w-full box-border`}>
              {months.map((m, i) => (
                <div key={i} className={`flex items-center justify-center font-medium border-r border-brand-outline/40 text-brand-dark shrink-0 h-full box-border ${compact ? 'text-[14px]' : 'text-[15px]'}`} style={{ width: `${m.span * COLUMN_WIDTH}px` }}>
                  {m.name} {compact && m.year}
                </div>
              ))}
            </div>
            
            <div className={`flex ${compact ? 'h-[36px]' : 'h-[32px]'} bg-brand-bg shrink-0 w-full box-border`}>
              {days.map((d, i) => (
                <div key={i} className={`w-[40px] shrink-0 h-full flex items-center justify-center ${compact ? 'text-[14px]' : 'text-[15px]'} border-r border-brand-outline/40 box-border ${d.isToday ? 'bg-brand-primary text-white font-bold rounded-md my-[2px] h-[28px]' : 'text-black/70'}`}>
                  {d.dayNumber}
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex-1">
            <div className="absolute inset-0 flex pointer-events-none">
              {days.map((d, i) => (
                <div key={i} className={`w-[40px] flex-shrink-0 border-r border-brand-outline/30 h-full relative ${d.isWeekend ? 'bg-brand-bg/30' : 'bg-white'}`}>
                  {d.isToday && <div className="absolute top-0 bottom-0 w-[2px] bg-brand-primary left-1/2 -translate-x-1/2 z-0" />}
                </div>
              ))}
            </div>

            <div className="relative z-10">
              {teams.map((team) => (
                <div key={`grid-team-${team.teamId}`}>
                  <div className={`${teamRowHeight} border-b border-brand-outline/40 shrink-0 bg-brand-bg/20`} />
                  {team.members.length === 0 ? (
                    <div className={`${staffRowHeight} border-b border-gray-100 shrink-0`} />
                  ) : (
                    team.members.map((member) => {
                      const memberDays = dayLookup.get(member.staffId);
                      const segments = computeSegments(days, memberDays);
                      return (
                        <div key={`grid-staff-${member.staffId}`} className={`${staffRowHeight} border-b border-gray-100 relative flex items-center shrink-0 overflow-hidden`}>
                          {segments.map((seg, idx) => {
                            const barStartDate = toDateKey(days[seg.startIndex].date);
                            const barEndDate = toDateKey(days[seg.startIndex + seg.length - 1].date);
                            
                            return seg.barType === "Transition" ? (
                              <div
                                key={idx}
                                onClick={() => !compact && onBarClick?.({ barType: seg.barType, label: seg.label, staffName: member.name, startDate: barStartDate, endDate: barEndDate })}
                                className={`absolute top-1/2 -translate-y-1/2 ${compact ? 'h-6' : 'h-4'} rounded-full bg-yellow-300 border-2 border-yellow-500 shadow-sm z-10 ${!compact ? 'cursor-pointer hover:ring-2 ring-brand-primary/50 transition' : ''}`}
                                style={{ left: seg.startIndex * COLUMN_WIDTH + 8, width: COLUMN_WIDTH - 16 }}
                                title={seg.label || "Transition"}
                              />
                            ) : (
                              <div
                                key={idx}
                                onClick={() => !compact && onBarClick?.({ barType: seg.barType, label: seg.label, staffName: member.name, startDate: barStartDate, endDate: barEndDate })}
                                className={`absolute top-1/2 -translate-y-1/2 ${compact ? 'h-6' : 'h-4'} rounded-md ${BAR_COLORS[seg.barType]} ${!compact ? 'cursor-pointer hover:brightness-95 transition' : ''}`}
                                style={{ left: seg.startIndex * COLUMN_WIDTH + 4, width: seg.length * COLUMN_WIDTH - 8 }}
                                title={seg.label || seg.barType}
                              />
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}