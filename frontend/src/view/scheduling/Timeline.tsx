import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { Menu, Filter } from "lucide-react";
import type { TimelineTeam, BarType } from "../../types";
import { fetchTimeline } from "../../api";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const COLUMN_WIDTH = 40;

const BAR_COLORS: Record<BarType, string> = {
  None: "",
  OffDuty: "bg-gray-300",
  Leave: "bg-amber-400",
  Transition: "bg-sky-400",
};

function generateTimeline(startYear: number, endYear: number) {
  const days = [];
  const months = [];
  
  const startDate = new Date(startYear, 0, 1);
  const endDate = new Date(endYear, 11, 31);
  
  let currentMonth = startDate.getMonth();
  let currentYear = startDate.getFullYear();
  let span = 0;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const isToday = new Date().toDateString() === d.toDateString();
    
    days.push({
      date: new Date(d),
      dayNumber: d.getDate(),
      isToday,
      isWeekend: d.getDay() === 0 || d.getDay() === 6
    });

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
  return date.toISOString().split("T")[0];
}

function useDayLookup(teams: TimelineTeam[]) {
  return useMemo(() => {
    const map = new Map<string, Map<string, BarType>>();
    for (const team of teams) {
      for (const member of team.members) {
        const dayMap = new Map<string, BarType>();
        for (const day of member.days) {
          dayMap.set(day.date, day.barType);
        }
        map.set(member.staffId, dayMap);
      }
    }
    return map;
  }, [teams]);
}

export default function TimelinePage() {
  const [teams, setTeams] = useState<TimelineTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentYear = new Date().getFullYear();
  const [yearRange, setYearRange] = useState({ start: currentYear, end: currentYear });
  const [visibleYear, setVisibleYear] = useState(currentYear);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState("All");
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousScrollState = useRef({ width: 0, left: 0 });
  const hasInitialScrolled = useRef(false);
  const isAddingPast = useRef(false);

  const { days, months } = useMemo(() => {
    return generateTimeline(yearRange.start, yearRange.end);
  }, [yearRange.start, yearRange.end]);

  const totalWidth = days.length * COLUMN_WIDTH;
  const dayLookup = useDayLookup(teams);

  // Form State for the Modal
  const [formData, setFormData] = useState({
    targetId: "", // Will hold either "team:123" or "staff:456"
    daysOn: "",
    daysOff: "",
    startDate: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
    

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const startDate = `${yearRange.start}-01-01`;
        const endDate = `${yearRange.end}-12-31`;
        const data = await fetchTimeline(startDate, endDate);
        if (isMounted) {
          setTeams(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch timeline:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [yearRange.start, yearRange.end]);

  useLayoutEffect(() => {
    if (!hasInitialScrolled.current && scrollContainerRef.current && days.length > 0) {
      const todayIndex = days.findIndex(d => d.isToday);
      if (todayIndex !== -1) {
        const container = scrollContainerRef.current;
        container.scrollLeft = (todayIndex * COLUMN_WIDTH) - (container.clientWidth / 2);
        hasInitialScrolled.current = true;
      }
    }
  }, [days]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    // If we just appended a year to the past, the width grew on the left side.
    // We must push the scrollbar forward by the exact pixel difference so the UI doesn't jump.
    if (container && previousScrollState.current.width > 0 && isAddingPast.current) {
      const widthDifference = container.scrollWidth - previousScrollState.current.width;
      if (widthDifference > 0) {
        container.scrollLeft = previousScrollState.current.left + widthDifference;
      }
      isAddingPast.current = false;
      previousScrollState.current = { width: 0, left: 0 };
    }
  }, [days.length]);

const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || isAddingPast.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    // Throttle year header updates
    const centerDayIndex = Math.floor((scrollLeft + clientWidth / 2) / COLUMN_WIDTH);
    const centerDate = days[centerDayIndex]?.date;
    if (centerDate && centerDate.getFullYear() !== visibleYear) {
      setVisibleYear(centerDate.getFullYear());
    }

    // Only trigger past year generation if far enough left
    if (scrollLeft < 300) {
      isAddingPast.current = true;
      previousScrollState.current = { width: scrollWidth, left: scrollLeft };
      setYearRange(prev => ({ ...prev, start: prev.start - 1 }));
    }

    // Only trigger future year generation if far enough right
    if (scrollWidth - (scrollLeft + clientWidth) < 300) {
      if (centerDate && centerDate.getFullYear() === yearRange.end) {
        setYearRange(prev => ({ ...prev, end: prev.end + 1 }));
      }
    }
  };

  const handleSaveSchedule = async () => {
    // 1. Validate the input
    if (!formData.targetId || !formData.daysOn || !formData.daysOff || !formData.startDate) {
      alert("Harap isi semua kolom!");
      return;
    }

    setIsSubmitting(true);
    try {
      // 2. Figure out if HR selected a Team or a specific Staff member
      const isTeam = formData.targetId.startsWith("team:");
      const actualId = formData.targetId.split(":")[1];

      // 3. Build the payload exactly as C# expects (CreateTimelineRequest)
      const payload = {
        TeamId: isTeam ? actualId : null,
        StaffId: !isTeam ? actualId : null,
        StartDate: formData.startDate,
        DaysOn: parseInt(formData.daysOn, 10),
        DaysOff: parseInt(formData.daysOff, 10)
      };

      // 4. Send to your C# API (Update the URL to your actual backend port!)
      const response = await fetch("http://localhost:5096/api/timeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan jadwal");
      }

      alert("Jadwal berhasil disimpan!");
      
      // 5. Clean up and close modal
      setIsAssignModalOpen(false);
      setFormData({ targetId: "", daysOn: "", daysOff: "", startDate: "" });
      
      // Note: To see the new bars instantly, you would call your loadData() function here again!

    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan jadwal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-white font-sans overflow-hidden min-w-0">
      
      {/* TOP NAVBAR */}
      <div className="bg-[#244376] text-white p-2.5 flex items-center gap-4 shrink-0 shadow-sm z-30 relative w-full">
        
        {/* Menu Toggle */}
        <button className="p-1.5 hover:bg-white/20 rounded transition shrink-0">
          <Menu size={22} />
        </button>
        
        {/* HR Action Buttons (Now safely on the left) */}
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={() => setIsAssignModalOpen(true)}
            className="bg-[#356bb3] hover:bg-[#2a5691] text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-sm transition"
          >
            + Atur Jadwal
          </button>
          <button className="bg-white text-[#244376] hover:bg-gray-100 px-4 py-1.5 rounded-md text-sm font-bold shadow-sm transition">
            + Tim Baru
          </button>
        </div>

      </div>

      <div className="flex flex-1 overflow-hidden relative w-full">
        
        {/* LEFT SIDEBAR */}
        <div className="w-56 flex-shrink-0 border-r border-gray-300 flex flex-col bg-white z-20 shadow-[2px_0_10px_-3px_rgba(0,0,0,0.1)] relative">
          <div className="h-[88px] bg-[#6f92c9] text-white p-4 flex items-center shrink-0 border-b border-gray-300">
            <h1 className="text-[22px] font-bold leading-tight">Jadwal<br/>Lapangan</h1>
          </div>
          <div className="px-4 py-3 border-b border-gray-200 text-[15px] text-gray-700 shrink-0 font-medium bg-white">
            Director
          </div>

          <div className="overflow-y-auto flex-1 no-scrollbar bg-white">
            {isLoading ? (
              <div className="p-4 text-sm text-gray-500 text-center">Memuat tim...</div>
            ) : (
              teams.map((team) => (
                <div key={team.teamId}>
                  <div className="bg-[#f4f7fb] px-4 h-[41px] flex items-center font-bold text-[14px] text-[#4a638b] border-b border-gray-200">
                    {team.teamName}
                  </div>
                  {team.members.length === 0 ? (
                    <div className="px-4 py-2 h-[42px] flex items-center text-xs text-gray-400 italic border-b border-gray-100">Kosong</div>
                  ) : (
                    team.members.map((member) => (
                      <div key={member.staffId} className="px-4 py-2 h-[42px] flex items-center text-[14px] text-gray-700 border-b border-gray-100">
                        {member.name}
                      </div>
                    ))
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT SIDE (DYNAMIC CALENDAR GRID) */}
        <div 
          ref={scrollContainerRef} 
          onScroll={handleScroll}
          className="flex-1 flex flex-col overflow-auto relative bg-white"
        >
          <div className="sticky top-0 z-10 bg-white shrink-0 shadow-sm border-b border-gray-300" style={{ width: `${totalWidth}px` }}>
            
            {/* Dynamic Centered Year Row */}
            <div className="py-1 border-b border-gray-200 bg-[#f8f9fc]">
              <div className="sticky left-1/2 -translate-x-1/2 w-fit">
                <span className="text-[#3b5982] font-semibold text-[15px] whitespace-nowrap">{visibleYear}</span>
              </div>
            </div>
            
            {/* Months Row (No Year) */}
            <div className="flex border-b border-gray-200 text-gray-600 text-[15px] bg-[#f8f9fc]" style={{ width: `${totalWidth}px` }}>
              {months.map((m, i) => (
                <div 
                  key={i} 
                  className="text-center font-medium border-r border-gray-300 text-[#4a638b] flex-shrink-0 flex items-center justify-center" 
                  style={{ width: `${m.span * COLUMN_WIDTH}px`, height: '32px' }}
                >
                  <span className="text-sm">{m.name}</span>
                </div>
              ))}
            </div>
            
            {/* Days Numbers Row */}
            <div className="flex h-[32px] bg-[#f8f9fc]" style={{ width: `${totalWidth}px` }}>
              {days.map((d, i) => (
                <div key={i} className={`w-[40px] flex-shrink-0 flex items-center justify-center text-[14px] border-r border-gray-200 ${d.isToday ? 'bg-[#356bb3] text-white font-bold rounded-sm my-[3px]' : 'text-gray-700'}`}>
                  {d.dayNumber}
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-full" style={{ width: `${totalWidth}px` }}>
            <div className="absolute inset-0 flex pointer-events-none">
              {days.map((d, i) => (
                <div key={i} className={`w-[40px] flex-shrink-0 border-r border-[#e8ecef] h-full relative ${d.isWeekend ? 'bg-[#f8fafd]' : 'bg-white'}`}>
                  {/* Today Blue Line */}
                  {d.isToday && <div className="absolute top-0 bottom-0 w-[2px] bg-[#356bb3] left-1/2 -translate-x-1/2 z-0" />}
                </div>
              ))}
            </div>

            <div className="relative z-10">
              {!isLoading && teams.map((team) => (
                <div key={`grid-team-${team.teamId}`}>
                  <div className="h-[41px]" />
                  {team.members.length === 0 ? (
                    <div className="h-[42px] border-b border-transparent" />
                  ) : (
                    team.members.map((member) => {
                      const memberDays = dayLookup.get(member.staffId);
                      return (
                        <div
                          key={`grid-staff-${member.staffId}`}
                          className="h-[42px] border-b border-transparent relative flex items-center"
                        >
                          {days.map((d, i) => {
                            const barType = memberDays?.get(toDateKey(d.date)) ?? "None";
                            if (barType === "None") return null;
                            return (
                              <div
                                key={i}
                                className={`absolute h-4 rounded-sm ${BAR_COLORS[barType]}`}
                                style={{ left: i * COLUMN_WIDTH + 4, width: COLUMN_WIDTH - 8 }}
                                title={barType}
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
        {/* ---> NEW MODAL OVERLAY START <--- */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl w-[500px] p-6 text-left">
              <h2 className="text-xl font-bold mb-4 text-[#244376]">Atur Rotasi Staf</h2>
              
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-gray-700">Pilih Staf / Tim</label>
                
                {/* Dynamic Dropdown populated by your C# data */}
                <select 
                  className="border border-gray-300 rounded p-2 text-black"
                  value={formData.targetId}
                  onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                >
                  <option value="">Pilih...</option>
                  {teams.map((team) => (
                    <optgroup key={team.teamId} label={`Tim: ${team.teamName}`}>
                      <option value={`team:${team.teamId}`}>Seluruh {team.teamName}</option>
                      {team.members.map((member) => (
                        <option key={member.staffId} value={`staff:${member.staffId}`}>
                          - {member.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                
                <label className="text-sm font-medium text-gray-700">Pola Shift (Days On / Days Off)</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="On (e.g. 5)" 
                    className="border border-gray-300 rounded p-2 w-full text-black"
                    value={formData.daysOn}
                    onChange={(e) => setFormData({ ...formData, daysOn: e.target.value })}
                  />
                  <input 
                    type="number" 
                    placeholder="Off (e.g. 2)" 
                    className="border border-gray-300 rounded p-2 w-full text-black"
                    value={formData.daysOff}
                    onChange={(e) => setFormData({ ...formData, daysOff: e.target.value })}
                  />
                </div>
                
                <label className="text-sm font-medium text-gray-700">Tanggal Mulai</label>
                <input 
                  type="date" 
                  className="border border-gray-300 rounded p-2 text-black w-full"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  // Add this exact line below:
                  onClick={(e) => e.currentTarget.showPicker()} 
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button 
                  onClick={() => {
                    setIsAssignModalOpen(false);
                    setFormData({ targetId: "", daysOn: "", daysOff: "", startDate: "" });
                  }} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium transition"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveSchedule}
                  className="px-4 py-2 bg-[#356bb3] hover:bg-[#2a5691] text-white rounded font-bold transition disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Jadwal"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ---> NEW MODAL OVERLAY END <--- */}
      </div>
    </div>
  );
}