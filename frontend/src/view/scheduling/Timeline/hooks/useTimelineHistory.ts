import { useState } from "react";
import { fetchTimelineHistory } from "../../../../api";
import type { TimelineTeam } from "../../../../types";

export function useTimelineHistory(teams: TimelineTeam[]) {
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHistory = async (id: string, name: string, type: "team" | "staff") => {
    setIsLoadingHistory(true);
    setErrorMessage(null);
    try {
      let finalRecords: any[] = [];

      if (type === "team") {
        const res = await fetchTimelineHistory(id, undefined);
        finalRecords = res.map((r: any) => ({ ...r, _source: "Jadwal Tim" }));
      } else {
        const staffTeam = teams.find(t => t.members.some(m => m.staffId === id));
        const staffMember = staffTeam?.members.find(m => m.staffId === id);
        
        const [staffSchedules, teamSchedules] = await Promise.all([
          fetchTimelineHistory(undefined, id).catch(() => []),
          staffTeam ? fetchTimelineHistory(staffTeam.teamId, undefined).catch(() => []) : Promise.resolve([])
        ]);

        const mappedTeamSchedules = teamSchedules.map((r: any) => ({ ...r, _source: `Tim: ${staffTeam?.teamName}` }));
        const mappedStaffSchedules = staffSchedules.map((r: any) => ({ ...r, _source: "Personal" }));

        const activeTickets: any[] = [];
        if (staffMember) {
          let currentTicket: any = null;
          const sortedDays = [...staffMember.days].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          sortedDays.forEach(day => {
            if (day.barType === "Leave" || (day.label && day.label.trim() !== "")) {
              const dayReason = day.label || (day.barType === "Leave" ? "Izin / Cuti" : "Manual Override");
              if (!currentTicket || currentTicket.reason !== dayReason) {
                if (currentTicket) activeTickets.push(currentTicket);
                currentTicket = {
                  timelineId: `ticket-${day.date}`,
                  _source: "Tiket / Override",
                  isTicket: true,
                  barType: day.barType,
                  reason: dayReason,
                  startDate: day.date,
                  endDate: day.date,
                };
              } else {
                currentTicket.endDate = day.date; 
              }
            } else {
              if (currentTicket) {
                activeTickets.push(currentTicket);
                currentTicket = null;
              }
            }
          });
          if (currentTicket) activeTickets.push(currentTicket);
        }

        const today = new Date().toISOString().split("T")[0];
        const processedTickets = activeTickets
          .filter(t => t.endDate >= today)
          .map(t => ({
            ...t,
            status: t.startDate > today ? "Future" : "Active"
          }));

        finalRecords = [...processedTickets, ...mappedTeamSchedules, ...mappedStaffSchedules];
      }

      finalRecords = finalRecords.filter(r => r.status === "Active" || r.status === "Future");
      setHistoryRecords(finalRecords);
    } catch (error: any) {
      setErrorMessage(error.message || "Gagal memuat riwayat jadwal.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return { historyRecords, isLoadingHistory, errorMessage, setErrorMessage, loadHistory };
}