import { useState, useEffect, useMemo } from "react";
import TimelineComponent from "./components/TimelineComponent";
import InspectionPanel from "./components/InspectionPanel";
import AssignScheduleModal from "./components/AssignScheduleModal"; // Extracted
import NewTeamModal from "./components/NewTeamModal";             // Extracted
import { Filter, UserPlus, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { useTimelineHistory } from "./hooks/useTimelineHistory";
import { fetchTimeline, getUserClearance } from "../../../api";
import { Clearance } from "../../../types";
import type { TimelineTeam } from "../../../types";
import BarDetailModal from "./components/BarDetailModal";
import type { BarDetail } from "./components/BarDetailModal";
import BlockedDatePicker from "./components/CustomDatePicker";

export default function Timeline() {
  const userClearance = getUserClearance();
  const [teams, setTeams] = useState<TimelineTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentYear = new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear + 1, 11, 31);

  const [timelineStart, setTimelineStart] = useState(new Date(currentYear, 0, 1));
  const [timelineEnd, setTimelineEnd] = useState(new Date(currentYear + 1, 11, 31));
  
  const [selectedTeamFilter, setSelectedTeamFilter] = useState("All");
  const [selectedInspection, setSelectedInspection] = useState<{ id: string; name: string; type: "team" | "staff"; subtitle?: string; } | null>(null);
  
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState("All");
  const [jumpDate, setJumpDate] = useState<Date | null>(null);
  const [jumpDateStr, setJumpDateStr] = useState("");

  // MODAL STATES
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [selectedBarDetail, setSelectedBarDetail] = useState<BarDetail | null>(null);

  // CUSTOM HOOK (The Brains)
  const { historyRecords, isLoadingHistory, errorMessage: historyError, loadHistory } = useTimelineHistory(teams);

  const availableEmployees = useMemo(() => {
    if (selectedTeamFilter === "All") return teams.flatMap(t => t.members);
    return teams.find(t => t.teamId === selectedTeamFilter)?.members || [];
  }, [teams, selectedTeamFilter]);

  const filteredTeams = useMemo(() => {
    let result = teams;

    if (selectedTeamFilter !== "All") {
      result = result.filter(t => t.teamId === selectedTeamFilter);
    }

    if (selectedEmployeeFilter !== "All") {
      result = result.map(t => ({
        ...t,
        members: t.members.filter(m => m.staffId === selectedEmployeeFilter)
      })).filter(t => t.members.length > 0);
    }

    return result;
  }, [teams, selectedTeamFilter, selectedEmployeeFilter]);

  const handleScheduleCreated = async () => {
    await loadData(timelineStart, timelineEnd);
    if (selectedInspection) {
      await handleInspectTarget(
        selectedInspection.id,
        selectedInspection.name,
        selectedInspection.type,
        selectedInspection.subtitle
      );
    }
  };

  const loadData = async (start: Date, end: Date) => {
    setIsLoading(true);
    try {
      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];
      const data = await fetchTimeline(startStr, endStr);
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      setGlobalError("Gagal memuat jadwal lapangan dari server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    loadData(timelineStart, timelineEnd); 
  }, [timelineStart, timelineEnd]);

  const handleInspectTarget = async (id: string, name: string, type: "team" | "staff", subtitle?: string) => {
    setSelectedInspection({ id, name, type, subtitle });
    await loadHistory(id, name, type);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-brand-bg font-sans overflow-hidden min-w-0">
      {/* TOP NAVBAR */}
      <div className="bg-brand-dark text-white p-2.5 flex items-center justify-between shrink-0 shadow-sm z-30 relative w-full">
        <div className="flex items-center gap-4">
          <span className="font-bold tracking-wide text-sm uppercase pl-12">Timeline Jadwal</span>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 mr-2">
          
          {/* <div className="w-[180px]">
            <BlockedDatePicker
              value={jumpDateStr}
              blockedRanges={[]} 
              placeholder="Pilih Tanggal"
              className="bg-white border border-gray-300 text-black px-3 py-1.5 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer shadow-sm"
              onChange={(picked) => {
                setJumpDateStr(picked);
                if (!picked) {
                   setJumpDate(null);
                   return;
                }
                const d = new Date(picked);
                
                if (d.getFullYear() !== timelineStart.getFullYear()) {
                  setTimelineStart(new Date(d.getFullYear(), 0, 1));
                  setTimelineEnd(new Date(d.getFullYear() + 1, 11, 31));
                }
                setJumpDate(d);
              }}
            />
          </div> */}

          <select
            className="bg-white border border-gray-300 text-black px-3 py-1.5 rounded-md text-sm min-w-[140px] focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer shadow-sm"
            value={selectedTeamFilter}
            onChange={(e) => {
              setSelectedTeamFilter(e.target.value);
              setSelectedEmployeeFilter("All"); // Reset employee filter if team changes
            }}
          >
            <option value="All">Semua Tim</option>
            {teams.map((t) => (
              <option key={t.teamId} value={t.teamId}>{t.teamName}</option>
            ))}
          </select>

          <select
            className="bg-white border border-gray-300 text-black px-3 py-1.5 rounded-md text-sm min-w-[140px] focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer shadow-sm"
            value={selectedEmployeeFilter}
            onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
          >
            <option value="All">Semua Staf</option>
            {availableEmployees.map((m) => (
              <option key={m.staffId} value={m.staffId}>{m.name}</option>
            ))}
          </select>
          
        </div>
      </div>
      
      {/* ALERTS */}
      {globalError && <div className="bg-red-50 text-red-700 px-4 py-2">{globalError}</div>}
      {globalSuccess && <div className="bg-green-50 text-green-700 px-4 py-2">{globalSuccess}</div>}

      <div className="flex flex-1 overflow-hidden relative w-full">
        {/* CENTER CALENDAR WRAPPER DELEGATING TO COMPONENT */}
        <div className="flex-1 overflow-auto bg-brand-bg relative flex">
          <TimelineComponent 
            teams={filteredTeams}
            isLoading={isLoading}
            startDate={timelineStart}
            endDate={timelineEnd}
            jumpToDate={jumpDate}
            compact={false}
            onInspectTarget={handleInspectTarget}
            onBarClick={(detail) => setSelectedBarDetail(detail)}
            onRangeChange={(newStart, newEnd) => {
               setTimelineStart(newStart);
               setTimelineEnd(newEnd);
            }}
          />
        </div>

        {/* ISOLATED RIGHT SIDE INSPECTION PANEL */}
        <InspectionPanel 
          selectedInspection={selectedInspection}
          historyRecords={historyRecords}
          isLoadingHistory={isLoadingHistory}
          userClearance={userClearance}
          onClose={() => setSelectedInspection(null)}
          onReloadRequested={handleScheduleCreated}
          onOpenAssignModal={() => setIsAssignModalOpen(true)}
          setGlobalError={setGlobalError}
          setGlobalSuccess={setGlobalSuccess}
        />
      </div>

      {isAssignModalOpen && (
         <AssignScheduleModal 
            isOpen={isAssignModalOpen}
            onClose={() => setIsAssignModalOpen(false)}
            teams={teams}
            initialTargetId={selectedInspection ? `${selectedInspection.type}:${selectedInspection.id}` : ""}
            onSuccess={handleScheduleCreated}
            setGlobalError={setGlobalError}
            setGlobalSuccess={setGlobalSuccess}
         />
      )}

      {isNewTeamModalOpen && (
         <NewTeamModal 
            isOpen={isNewTeamModalOpen}
            onClose={() => setIsNewTeamModalOpen(false)}
            onSuccess={handleScheduleCreated}
            setGlobalError={setGlobalError}
            setGlobalSuccess={setGlobalSuccess}
         />
      )}

      {selectedBarDetail && (
         <BarDetailModal 
            isOpen={!!selectedBarDetail}
            onClose={() => setSelectedBarDetail(null)}
            detail={selectedBarDetail}
         />
      )}
    </div>
  );
}