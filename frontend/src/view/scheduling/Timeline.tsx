import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { 
  Menu, 
  X, 
  Clock, 
  AlertCircle, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Users, 
  Filter,
  UserPlus
} from "lucide-react";
import type { 
  TimelineTeam, 
  BarType, 
  TimelineHistoryRecord, 
  CreateTimelinePayload 
} from "../../types";
import { 
  fetchTimeline, 
  createTimeline, 
  fetchTimelineHistory, 
  endActiveTimeline,
  createTeam,
  fetchUnassignedStaff,
  assignStaffToTeam
} from "../../api";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const COLUMN_WIDTH = 40;

const BAR_COLORS: Record<BarType, string> = {
  None: "",
  OffDuty: "bg-blue-500 shadow-sm",
  Leave: "bg-red-500 shadow-sm",
  Transition: "bg-yellow-400",
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

function computeSegments(
  days: { date: Date }[], 
  memberDays: Map<string, { barType: BarType; label?: string }> | undefined
): BarSegment[] {
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

export default function TimelinePage() {
  const [teams, setTeams] = useState<TimelineTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentYear = new Date().getFullYear();
  const [yearRange, setYearRange] = useState({ start: currentYear, end: currentYear });
  const [visibleYear, setVisibleYear] = useState(currentYear);
  
  // Phase F: Functional Team Filter
  const [selectedTeamFilter, setSelectedTeamFilter] = useState("All");

  // Phase A & C: Inspection Panels & Popovers
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<{
    id: string;
    name: string;
    type: "team" | "staff";
    subtitle?: string;
  } | null>(null);
  const [historyRecords, setHistoryRecords] = useState<TimelineHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedBarDetail, setSelectedBarDetail] = useState<{
    barType: BarType;
    label?: string;
    staffName: string;
    startDate: string;
    endDate: string;
  } | null>(null);

  // Phase D: Team Creation & Staff Assignment Modals
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [unassignedStaff, setUnassignedStaff] = useState<any[]>([]);
  const [isUnassignedModalOpen, setIsUnassignedModalOpen] = useState(false);
  const [assigningStaffId, setAssigningStaffId] = useState<string | null>(null);
  const [selectedAssignTeamId, setSelectedAssignTeamId] = useState("");

  // UX Feedback Banner State
const [formData, setFormData] = useState({
    targetId: "",
    daysOn: "",
    daysOff: "",
    startDate: "",
    endDate: "" 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousScrollState = useRef({ width: 0, left: 0 });
  const hasInitialScrolled = useRef(false);
  const isAddingPast = useRef(false);
  const isExpandingRef = useRef(false);

  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [endDateInput, setEndDateInput] = useState("");

  const { days, months } = useMemo(() => {
    return generateTimeline(yearRange.start, yearRange.end);
  }, [yearRange.start, yearRange.end]);

  const totalWidth = days.length * COLUMN_WIDTH;
  const dayLookup = useDayLookup(teams);

  // Apply Phase F Filter
  const filteredTeams = useMemo(() => {
    if (selectedTeamFilter === "All") return teams;
    return teams.filter(t => t.teamId === selectedTeamFilter);
  }, [teams, selectedTeamFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const startDate = `${yearRange.start}-01-01`;
      const endDate = `${yearRange.end}-12-31`;
      const data = await fetchTimeline(startDate, endDate);
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch timeline:", err);
      setErrorMessage("Gagal memuat jadwal lapangan dari server.");
    } finally {
      setIsLoading(false);
      isExpandingRef.current = false;
    }
  };

  useEffect(() => {
    loadData();
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
    if (!container || isAddingPast.current || isExpandingRef.current || isLoading) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    const centerDayIndex = Math.floor((scrollLeft + clientWidth / 2) / COLUMN_WIDTH);
    const centerDate = days[centerDayIndex]?.date;
    if (centerDate && centerDate.getFullYear() !== visibleYear) {
      setVisibleYear(centerDate.getFullYear());
    }

    if (scrollLeft < 300) {
      isAddingPast.current = true;
      isExpandingRef.current = true;
      previousScrollState.current = { width: scrollWidth, left: scrollLeft };
      setYearRange(prev => ({ ...prev, start: prev.start - 1 }));
    } else if (scrollWidth - (scrollLeft + clientWidth) < 300) {
      if (centerDate && centerDate.getFullYear() === yearRange.end) {
        isExpandingRef.current = true;
        setYearRange(prev => ({ ...prev, end: prev.end + 1 }));
      }
    }
  };

  // Phase A: Inspect Target History
  const handleInspectTarget = async (id: string, name: string, type: "team" | "staff", subtitle?: string) => {
    setSelectedInspection({ id, name, type, subtitle });
    setIsLoadingHistory(true);
    setErrorMessage(null);
    setShowEndDatePicker(false);
    try {
      const history = await fetchTimelineHistory(
        type === "team" ? id : undefined,
        type === "staff" ? id : undefined
      );
      setHistoryRecords(history);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Gagal memuat riwayat jadwal.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Phase B: Save New Schedule Version
  const handleSaveSchedule = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.targetId || !formData.daysOn || !formData.daysOff || !formData.startDate) {
      setErrorMessage("Harap isi semua kolom wajib!");
      return;
    }

    const daysOnNum = parseInt(formData.daysOn, 10);
    const daysOffNum = parseInt(formData.daysOff, 10);

    if (isNaN(daysOnNum) || daysOnNum < 1 || isNaN(daysOffNum) || daysOffNum < 1) {
      setErrorMessage("Days On dan Days Off harus bernilai integer minimal 1.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isTeam = formData.targetId.startsWith("team:");
      const actualId = formData.targetId.split(":")[1];

      await createTimeline({
        teamId: isTeam ? actualId : null,
        staffId: !isTeam ? actualId : null,
        startDate: formData.startDate,
        endDate: formData.endDate ? formData.endDate : null, // <-- ADDED THIS
        daysOn: daysOnNum,
        daysOff: daysOffNum,
      });

      setSuccessMessage("Versi jadwal baru berhasil disimpan dan diberlakukan!");
      setIsAssignModalOpen(false);
      setFormData({ targetId: "", daysOn: "", daysOff: "", startDate: "", endDate: "" });
      
      await loadData();
      if (selectedInspection) {
        await handleInspectTarget(
          selectedInspection.id, 
          selectedInspection.name, 
          selectedInspection.type, 
          selectedInspection.subtitle
        );
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Terjadi kesalahan saat menyimpan jadwal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phase B: End Active Schedule
  const handleEndSchedule = async (effectiveDate: string) => {
    if (!selectedInspection) return;
    try {
      await endActiveTimeline({
        teamId: selectedInspection.type === "team" ? selectedInspection.id : null,
        staffId: selectedInspection.type === "staff" ? selectedInspection.id : null,
        effectiveEndDate: effectiveDate
      });
      setSuccessMessage("Jadwal aktif berhasil diakhiri.");
      await loadData();
      await handleInspectTarget(
        selectedInspection.id, 
        selectedInspection.name, 
        selectedInspection.type, 
        selectedInspection.subtitle
      );
    } catch (error: any) {
      alert(error.message || "Gagal mengakhiri jadwal.");
    }
  };

  // Phase D: Team Creation Submit
  const handleCreateTeamSubmit = async () => {
    if (!newTeamName.trim()) {
      setErrorMessage("Nama tim tidak boleh kosong.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createTeam({ teamName: newTeamName });
      setSuccessMessage(`Tim "${newTeamName}" berhasil dibuat!`);
      setIsNewTeamModalOpen(false);
      setNewTeamName("");
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal membuat tim baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phase D: Open Unassigned Staff Modal
  const handleOpenUnassignedModal = async () => {
    setErrorMessage(null);
    try {
      const data = await fetchUnassignedStaff();
      setUnassignedStaff(data);
      setIsUnassignedModalOpen(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memuat staf tanpa tim.");
    }
  };

  // Phase D: Assign Staff Submit
  const handleAssignStaffSubmit = async (staffId: string) => {
    if (!selectedAssignTeamId) {
      setErrorMessage("Pilih tim tujuan.");
      return;
    }
    setIsSubmitting(true);
    try {
      await assignStaffToTeam(staffId, selectedAssignTeamId);
      setSuccessMessage("Staf berhasil ditugaskan ke tim!");
      setAssigningStaffId(null);
      setSelectedAssignTeamId("");
      const unassigned = await fetchUnassignedStaff();
      setUnassignedStaff(unassigned);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menugaskan staf.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-white font-sans overflow-hidden min-w-0">
      
      {/* TOP NAVBAR (HR WORKSTATION NAVIGATION) */}
      <div className="bg-[#244376] text-white p-2.5 flex items-center justify-between shrink-0 shadow-sm z-30 relative w-full">
        <div className="flex items-center gap-4">
          <button className="p-1.5 hover:bg-white/20 rounded transition shrink-0">
            <Menu size={22} />
          </button>
          <span className="font-bold tracking-wide text-sm uppercase">HR Scheduling Workstation</span>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {/* Phase F: Team Filter Dropdown */}
          <div className="flex items-center gap-1 bg-[#1a325b] px-2 py-1 rounded text-xs">
            <Filter size={14} className="text-gray-300" />
            <select
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
            >
              <option value="All" className="text-black">Semua Tim</option>
              {teams.map((t) => (
                <option key={t.teamId} value={t.teamId} className="text-black">
                  {t.teamName}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleOpenUnassignedModal}
            className="bg-[#1a325b] hover:bg-[#142646] text-white px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5"
          >
            <UserPlus size={14} />
            <span>Staf Tanpa Tim</span>
          </button>

          <button 
            onClick={() => {
              setErrorMessage(null);
              setIsAssignModalOpen(true);
            }}
            className="bg-[#356bb3] hover:bg-[#2a5691] text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-sm transition"
          >
            + Atur Jadwal
          </button>

          <button 
            onClick={() => {
              setErrorMessage(null);
              setIsNewTeamModalOpen(true);
            }}
            className="bg-white text-[#244376] hover:bg-gray-100 px-4 py-1.5 rounded-md text-sm font-bold shadow-sm transition"
          >
            + Tim Baru
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {errorMessage && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between text-red-700 text-sm z-30">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="hover:opacity-75 font-bold">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-between text-green-700 text-sm z-30">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="hover:opacity-75 font-bold">✕</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative w-full">
        
        {/* LEFT SIDEBAR (FIXED DIMENSIONS: 41px Header, 42px Row) */}
        <div className="w-56 flex-shrink-0 border-r border-gray-300 flex flex-col bg-white z-20 shadow-[2px_0_10px_-3px_rgba(0,0,0,0.1)] relative">
          
          {/* 88px Tall Header (Matches the right calendar header perfectly) */}
          <div className="h-[88px] bg-[#6f92c9] text-white p-4 flex items-center shrink-0 border-b border-gray-300">
            <h1 className="text-[22px] font-bold leading-tight">Jadwal<br/>Lapangan</h1>
          </div>

          {/* THE "DIRECTOR" BLOCK HAS BEEN DELETED FROM HERE */}

          <div className="overflow-y-auto flex-1 no-scrollbar bg-white">
            {isLoading && filteredTeams.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">Memuat tim...</div>
            ) : (
              filteredTeams.map((team) => (
                <div key={team.teamId}>
                  <div 
                    onClick={() => handleInspectTarget(team.teamId, team.teamName, "team")}
                    className="bg-[#f4f7fb] px-4 h-[41px] flex items-center justify-between font-bold text-[14px] text-[#4a638b] border-b border-gray-200 shrink-0 cursor-pointer hover:bg-[#e8f0fe] transition"
                  >
                    <span>{team.teamName}</span>
                    <span className="text-[10px] bg-[#d2e3fc] px-1.5 py-0.5 rounded text-[#174ea6]">TIM</span>
                  </div>
                  {team.members.length === 0 ? (
                    <div className="px-4 py-2 h-[42px] flex items-center text-xs text-gray-400 italic border-b border-gray-100 shrink-0">Kosong</div>
                  ) : (
                    team.members.map((member) => (
                      <div 
                        key={member.staffId} 
                        onClick={() => handleInspectTarget(member.staffId, member.name, "staff", `${member.position} • Tim: ${team.teamName}`)}
                        className="px-4 py-2 h-[42px] flex items-center justify-between text-[14px] text-gray-700 border-b border-gray-100 shrink-0 cursor-pointer hover:bg-gray-50 transition"
                      >
                        <span className="truncate">{member.name}</span>
                        <span className="text-[11px] text-gray-400">{member.position}</span>
                      </div>
                    ))
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT SIDE (DYNAMIC CALENDAR GRID: 40px Columns) */}
        <div 
          ref={scrollContainerRef} 
          onScroll={handleScroll}
          className="flex-1 flex flex-col overflow-auto relative bg-white"
        >
          <div className="sticky top-0 z-10 bg-white shrink-0 shadow-sm border-b border-gray-300 flex flex-col h-[88px] box-border" style={{ width: `${totalWidth}px` }}>
            {/* Year Row (Exactly 24px) */}
            <div className="h-[24px] flex items-center justify-center border-b border-gray-200 bg-[#f8f9fc] shrink-0 w-full box-border">
              <div className="sticky left-1/2 -translate-x-1/2 w-fit">
                <span className="text-[#3b5982] font-semibold text-[13px] whitespace-nowrap">{visibleYear}</span>
              </div>
            </div>
            
            {/* Month Row (Exactly 31px) */}
            <div className="flex h-[31px] border-b border-gray-200 text-gray-600 text-[15px] bg-[#f8f9fc] shrink-0 w-full box-border">
              {months.map((m, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-center font-medium border-r border-gray-300 text-[#4a638b] shrink-0 h-full box-border" 
                  style={{ width: `${m.span * COLUMN_WIDTH}px` }}
                >
                  <span className="text-sm">{m.name}</span>
                </div>
              ))}
            </div>
            
            {/* Day Row (Exactly 32px) */}
            <div className="flex h-[32px] bg-[#f8f9fc] shrink-0 w-full box-border">
              {days.map((d, i) => (
                <div key={i} className={`w-[40px] shrink-0 h-full flex items-center justify-center text-[14px] border-r border-gray-200 box-border ${d.isToday ? 'bg-[#356bb3] text-white font-bold rounded-sm my-[2px] h-[28px]' : 'text-gray-700'}`}>
                  {d.dayNumber}
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-full" style={{ width: `${totalWidth}px` }}>
            <div className="absolute inset-0 flex pointer-events-none">
              {days.map((d, i) => (
                <div key={i} className={`w-[40px] flex-shrink-0 border-r border-[#e8ecef] h-full relative ${d.isWeekend ? 'bg-[#f8fafd]' : 'bg-white'}`}>
                  {d.isToday && <div className="absolute top-0 bottom-0 w-[2px] bg-[#356bb3] left-1/2 -translate-x-1/2 z-0" />}
                </div>
              ))}
            </div>

            <div className="relative z-10">
              {filteredTeams.map((team) => (
                <div key={`grid-team-${team.teamId}`}>
                  <div className="h-[41px] border-b border-gray-200 shrink-0 bg-[#f4f7fb]/30" />
                  {team.members.length === 0 ? (
                    <div className="h-[42px] border-b border-gray-100 shrink-0" />
                  ) : (
                    team.members.map((member) => {
                      const memberDays = dayLookup.get(member.staffId);
                      const segments = computeSegments(days, memberDays);
                      return (
                        <div
                          key={`grid-staff-${member.staffId}`}
                          className="h-[42px] border-b border-gray-100 relative flex items-center shrink-0"
                        >
                          {segments.map((seg, idx) => {
                            const barStartDate = toDateKey(days[seg.startIndex].date);
                            const barEndDate = toDateKey(days[seg.startIndex + seg.length - 1].date);
                            
                            return seg.barType === "Transition" ? (
                              <div
                                key={idx}
                                onClick={() => setSelectedBarDetail({
                                  barType: seg.barType,
                                  label: seg.label,
                                  staffName: member.name,
                                  startDate: barStartDate,
                                  endDate: barEndDate
                                })}
                                className="absolute h-4 rounded-full bg-yellow-300 z-10 cursor-pointer hover:ring-2 ring-[#356bb3]/50 transition"
                                style={{ left: seg.startIndex * COLUMN_WIDTH + 8, width: COLUMN_WIDTH - 16 }}
                                title={seg.label || "Transition"}
                              />
                            ) : (
                              <div
                                key={idx}
                                onClick={() => setSelectedBarDetail({
                                  barType: seg.barType,
                                  label: seg.label,
                                  staffName: member.name,
                                  startDate: barStartDate,
                                  endDate: barEndDate
                                })}
                                className={`absolute h-4 rounded-md ${BAR_COLORS[seg.barType]} cursor-pointer hover:brightness-95 transition`}
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

        {/* SCHEDULE DETAILS & HISTORY SIDE PANEL (PHASE A & B) */}
        {selectedInspection && (
          <div className="w-96 border-l border-gray-300 bg-white shadow-xl flex flex-col z-30 shrink-0 animate-in slide-in-from-right duration-200">
            <div className="p-4 bg-[#f8f9fc] border-b border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-[#356bb3] uppercase">
                  {selectedInspection.type === "team" ? "Inspeksi Rotasi Tim" : "Inspeksi Staf"}
                </span>
                <h3 className="text-lg font-bold text-gray-800">{selectedInspection.name}</h3>
                {selectedInspection.subtitle && (
                  <p className="text-xs text-gray-500">{selectedInspection.subtitle}</p>
                )}
              </div>
              <button 
                onClick={() => setSelectedInspection(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/50 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
              {isLoadingHistory ? (
                <div className="text-center py-8 text-sm text-gray-500">Memuat riwayat jadwal...</div>
              ) : historyRecords.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400 italic">
                  Belum ada jadwal rotasi yang diatur untuk target ini.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Versi Rotasi</h4>
                    <span className="text-xs text-gray-400">{historyRecords.length} Rekam</span>
                  </div>

                  {historyRecords.map((rec) => {
                    const isActive = rec.status === "Active";
                    const isFuture = rec.status === "Future";
                    return (
                      <div 
                        key={rec.timelineId}
                        className={`p-3 rounded-lg border transition ${
                          isActive 
                            ? "border-[#356bb3] bg-[#f4f7fb]/80 shadow-sm" 
                            : isFuture
                            ? "border-amber-300 bg-amber-50/40"
                            : "border-gray-200 bg-gray-50/50 opacity-75"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isActive 
                              ? "bg-[#356bb3] text-white" 
                              : isFuture
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-200 text-gray-600"
                          }`}>
                            {isActive ? "AKTIF" : isFuture ? "MENDATANG" : "RIWAYAT"}
                          </span>
                          <span className="text-xs font-semibold text-gray-700">
                            {rec.daysOn} ON / {rec.daysOff} OFF
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-2">
                          <CalendarIcon size={14} className="text-gray-400" />
                          <span>Mulai: <strong className="text-gray-800">{rec.startDate}</strong></span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                          <Clock size={14} className="text-gray-400" />
                          <span>Selesai: <strong className="text-gray-800">{rec.endDate || "Sekarang (Tanpa Batas)"}</strong></span>
                        </div>

                        {isActive && !rec.endDate && (
                          <button
                            onClick={() => {
                              const todayStr = new Date().toISOString().split("T")[0];
                              if (confirm("Akhiri siklus rotasi aktif ini mulai hari ini?")) {
                                handleEndSchedule(todayStr);
                              }
                            }}
                            className="mt-3 w-full py-1 text-xs text-red-600 hover:bg-red-50 font-medium rounded border border-red-200 transition"
                          >
                            Akhiri Jadwal Ini
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  const targetPrefix = selectedInspection.type === "team" ? "team:" : "staff:";
                  setFormData(prev => ({ ...prev, targetId: targetPrefix + selectedInspection.id }));
                  setIsAssignModalOpen(true);
                }}
                className="w-full py-2 bg-[#356bb3] hover:bg-[#2a5691] text-white rounded font-bold text-sm transition shadow-sm"
              >
                + Perbarui / Atur Rotasi Baru
              </button>
            </div>
          </div>
        )}

        {/* BAR INSPECTION POPOVER (PHASE C) */}
        {selectedBarDetail && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center animate-in fade-in duration-150">
            <div className="bg-white rounded-lg shadow-xl w-[400px] p-5 text-left border border-gray-200">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Detail Status Lapangan</span>
                  <h4 className="font-bold text-gray-800 text-base">{selectedBarDetail.staffName}</h4>
                </div>
                <button 
                  onClick={() => setSelectedBarDetail(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipe Status:</span>
                  <span className="font-bold text-[#244376]">
                    {selectedBarDetail.barType === "OffDuty" ? "OFF DUTY (Rotasi Siklus)" : 
                     selectedBarDetail.barType === "Leave" ? "LEAVE (Izin / Tiket Disetujui)" : "TRANSITION"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Rentang Waktu:</span>
                  <span className="font-medium text-gray-700">
                    {selectedBarDetail.startDate} → {selectedBarDetail.endDate}
                  </span>
                </div>

                {selectedBarDetail.label && (
                  <div className="mt-1 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
                    <strong className="block mb-0.5">Alasan / Catatan Tiket:</strong>
                    {selectedBarDetail.label}
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setSelectedBarDetail(null)}
                  className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* UPGRADED SCHEDULE MANAGER MODAL (PHASE B) */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-150">
            <div className="bg-white rounded-lg shadow-xl w-[500px] p-6 text-left border border-gray-200">
              <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-[#244376]">Atur Rotasi Baru</h2>
                  <p className="text-xs text-gray-500">Menambahkan versi jadwal baru secara otomatis menutup siklus aktif sebelumnya.</p>
                </div>
                <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-gray-700">Pilih Target (Staf / Tim)</label>
                <select 
                  className="border border-gray-300 rounded p-2 text-black text-sm bg-white"
                  value={formData.targetId}
                  onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                >
                  <option value="">-- Pilih Tim atau Staf --</option>
                  {teams.map((team) => (
                    <optgroup key={team.teamId} label={`Tim: ${team.teamName}`}>
                      <option value={`team:${team.teamId}`}>Seluruh Tim: {team.teamName}</option>
                      {team.members.map((member) => (
                        <option key={member.staffId} value={`staff:${member.staffId}`}>
                          &nbsp;&nbsp;&nbsp;↳ Staf: {member.name} ({member.position})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                
                <label className="text-sm font-medium text-gray-700">Pola Shift (Days On / Days Off)</label>
                <div className="flex gap-2">
                  <div className="w-full">
                    <input 
                      type="number" 
                      min="1"
                      placeholder="On (e.g. 5)" 
                      className="border border-gray-300 rounded p-2 w-full text-black text-sm"
                      value={formData.daysOn}
                      onChange={(e) => setFormData({ ...formData, daysOn: e.target.value })}
                    />
                    <span className="text-[11px] text-gray-400 mt-0.5 block">Hari Kerja Aktif</span>
                  </div>
                  <div className="w-full">
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Off (e.g. 2)" 
                      className="border border-gray-300 rounded p-2 w-full text-black text-sm"
                      value={formData.daysOff}
                      onChange={(e) => setFormData({ ...formData, daysOff: e.target.value })}
                    />
                    <span className="text-[11px] text-gray-400 mt-0.5 block">Hari Libur Rotasi</span>
                  </div>
                </div>
                
                <label className="text-sm font-medium text-gray-700">Tanggal Mulai Berlaku</label>
                <input 
                  type="date" 
                  className="border border-gray-300 rounded p-2 text-black text-sm w-full"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  onClick={(e) => (e.currentTarget as any).showPicker?.()} 
                />

                <label className="text-sm font-medium text-gray-700">Tanggal Berakhir (Opsional)</label>
                  <input 
                    type="date" 
                    className="border border-gray-300 rounded p-2 text-black text-sm w-full mt-1"
                    value={formData.endDate}
                    min={formData.startDate} // Prevents picking an end date before the start date
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    onClick={(e) => (e.currentTarget as any).showPicker?.()} 
                  />
                  <span className="text-[11px] text-gray-400 mt-0.5 block">
                    Kosongkan jika jadwal berulang tanpa batas waktu.
                  </span>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button 
                  onClick={() => {
                    setIsAssignModalOpen(false);
                    setFormData({ targetId: "", daysOn: "", daysOff: "", startDate: "", endDate: "" });
                  }} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-medium transition"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveSchedule}
                  className="px-5 py-2 bg-[#356bb3] hover:bg-[#2a5691] text-white rounded text-sm font-bold transition shadow-sm disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Versi Jadwal"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NEW TEAM MODAL (PHASE D) */}
        {isNewTeamModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-150">
            <div className="bg-white rounded-lg shadow-xl w-[400px] p-6 text-left border border-gray-200">
              <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
                <h3 className="text-lg font-bold text-[#244376]">Buat Tim Lapangan Baru</h3>
                <button onClick={() => setIsNewTeamModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Nama Tim</label>
                <input
                  type="text"
                  placeholder="Contoh: Tim Delta"
                  className="border border-gray-300 rounded p-2 text-sm w-full text-black"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setIsNewTeamModalOpen(false)}
                  className="px-4 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-xs font-bold transition"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  onClick={handleCreateTeamSubmit}
                  className="px-4 py-1.5 bg-[#356bb3] hover:bg-[#2a5691] text-white rounded text-xs font-bold transition shadow-sm disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Menyimpan..." : "Buat Tim"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* UNASSIGNED STAFF ASSIGNMENT MODAL (PHASE D) */}
        {isUnassignedModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-150">
            <div className="bg-white rounded-lg shadow-xl w-[500px] p-6 text-left border border-gray-200 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-[#244376]">Staf Tanpa Tim</h3>
                  <p className="text-xs text-gray-500">Tugaskan staf yang belum memiliki tim ke dalam unit rotasi.</p>
                </div>
                <button onClick={() => setIsUnassignedModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-2 py-1">
                {unassignedStaff.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400 italic">
                    Semua staf saat ini sudah ditugaskan ke dalam tim.
                  </div>
                ) : (
                  unassignedStaff.map((staff) => (
                    <div 
                      key={staff.staffId || staff.StaffId}
                      className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-gray-50/50"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-gray-800">{staff.name || staff.Name}</h4>
                        <span className="text-xs text-gray-500">{staff.position || staff.Position}</span>
                      </div>

                      {assigningStaffId === (staff.staffId || staff.StaffId) ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            className="border border-gray-300 rounded p-1 text-xs bg-white text-black"
                            value={selectedAssignTeamId}
                            onChange={(e) => setSelectedAssignTeamId(e.target.value)}
                          >
                            <option value="">Pilih Tim...</option>
                            {teams.map((t) => (
                              <option key={t.teamId} value={t.teamId}>{t.teamName}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignStaffSubmit(staff.staffId || staff.StaffId)}
                            className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition"
                            disabled={isSubmitting}
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => setAssigningStaffId(null)}
                            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-bold transition"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setAssigningStaffId(staff.staffId || staff.StaffId);
                            setSelectedAssignTeamId("");
                          }}
                          className="px-3 py-1 bg-[#356bb3] hover:bg-[#2a5691] text-white rounded text-xs font-bold transition shadow-sm"
                        >
                          + Tugaskan ke Tim
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 border-t border-gray-100 pt-3 flex justify-end shrink-0">
                <button
                  onClick={() => setIsUnassignedModalOpen(false)}
                  className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}