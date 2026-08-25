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

export default function Timeline() {
  const userClearance = getUserClearance();
  const [teams, setTeams] = useState<TimelineTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentYear = new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear + 1, 11, 31);
  
  const [selectedTeamFilter, setSelectedTeamFilter] = useState("All");
  const [selectedInspection, setSelectedInspection] = useState<{ id: string; name: string; type: "team" | "staff"; subtitle?: string; } | null>(null);
  
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

  // MODAL STATES
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);

  // CUSTOM HOOK (The Brains)
  const { historyRecords, isLoadingHistory, errorMessage: historyError, loadHistory } = useTimelineHistory(teams);

  const filteredTeams = useMemo(() => {
    if (selectedTeamFilter === "All") return teams;
    return teams.filter(t => t.teamId === selectedTeamFilter);
  }, [teams, selectedTeamFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTimeline(`${currentYear}-01-01`, `${currentYear + 1}-12-31`);
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      setGlobalError("Gagal memuat jadwal lapangan dari server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

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
        
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-brand-primary/80 px-2.5 py-1 rounded-lg text-xs">
            <Filter size={14} className="text-white/80" />
            <select
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
            >
              <option value="All" className="text-black">Semua Tim</option>
              {teams.map((t) => (
                <option key={t.teamId} value={t.teamId} className="text-black">{t.teamName}</option>
              ))}
            </select>
          </div>

          {userClearance === Clearance.Admin && (
            <>
              {/* Ensure you have the Unassigned Staff modal logic linked here if you still need it */}
              <button onClick={() => console.log("Unassigned Staff clicked")} className="btn-primary text-xs py-1.5 px-3">
                <UserPlus size={14} /><span>Staf Tanpa Tim</span>
              </button>

              <div className="action-group ml-2">
                <button 
                  type="button" 
                  onClick={() => { setGlobalError(null); setIsAssignModalOpen(true); }} 
                  className="action-group-btn"
                >
                  Atur Jadwal <Plus size={15} strokeWidth={2.5} />
                </button>
                <button 
                  type="button" 
                  onClick={() => { setGlobalError(null); setIsNewTeamModalOpen(true); }} 
                  className="action-group-btn"
                >
                  Tim Baru <Plus size={15} strokeWidth={2.5} />
                </button>
              </div>
            </>
          )}
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
            startDate={startDate}
            endDate={endDate}
            compact={false}
            onInspectTarget={handleInspectTarget}
          />
        </div>

        {/* ISOLATED RIGHT SIDE INSPECTION PANEL */}
        <InspectionPanel 
          selectedInspection={selectedInspection}
          historyRecords={historyRecords}
          isLoadingHistory={isLoadingHistory}
          userClearance={userClearance}
          onClose={() => setSelectedInspection(null)}
          onReloadRequested={() => handleInspectTarget(selectedInspection!.id, selectedInspection!.name, selectedInspection!.type, selectedInspection!.subtitle)}
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
            onSuccess={loadData}
            setGlobalError={setGlobalError}
            setGlobalSuccess={setGlobalSuccess}
         />
      )}

      {isNewTeamModalOpen && (
         <NewTeamModal 
            isOpen={isNewTeamModalOpen}
            onClose={() => setIsNewTeamModalOpen(false)}
            onSuccess={loadData}
            setGlobalError={setGlobalError}
            setGlobalSuccess={setGlobalSuccess}
         />
      )}
    </div>
  );
}