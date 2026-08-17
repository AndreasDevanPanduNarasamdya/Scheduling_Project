import { useState, useEffect, useMemo } from "react";
import TimelineComponent from "../components/TimelineComponent";
import { 
  X, Clock, AlertCircle, Calendar as CalendarIcon, 
  CheckCircle2, Filter, UserPlus, Plus
} from "lucide-react";
import type { TimelineTeam, BarType, TimelineHistoryRecord } from "../../types";
import { 
  fetchTimeline, createTimeline, fetchTimelineHistory, 
  endActiveTimeline, createTeam, fetchUnassignedStaff, assignStaffToTeam
} from "../../api";

export default function TimelinePage() {
  const [teams, setTeams] = useState<TimelineTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentYear = new Date().getFullYear();
  // We supply a 2-year wide view automatically, eliminating the need for infinite scroll jumps
  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear + 1, 11, 31);
  
  const [selectedTeamFilter, setSelectedTeamFilter] = useState("All");

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<{ id: string; name: string; type: "team" | "staff"; subtitle?: string; } | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedBarDetail, setSelectedBarDetail] = useState<{ barType: BarType; label?: string; staffName: string; startDate: string; endDate: string; } | null>(null);

  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [unassignedStaff, setUnassignedStaff] = useState<any[]>([]);
  const [isUnassignedModalOpen, setIsUnassignedModalOpen] = useState(false);
  const [assigningStaffId, setAssigningStaffId] = useState<string | null>(null);
  const [selectedAssignTeamId, setSelectedAssignTeamId] = useState("");

  const [formData, setFormData] = useState({ targetId: "", daysOn: "", daysOff: "", startDate: "", endDate: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      console.error("Failed to fetch timeline:", err);
      setErrorMessage("Gagal memuat jadwal lapangan dari server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleInspectTarget = async (id: string, name: string, type: "team" | "staff", subtitle?: string) => {
    setSelectedInspection({ id, name, type, subtitle });
    setIsLoadingHistory(true);
    setErrorMessage(null);
    try {
      let finalRecords: any[] = [];

      if (type === "team") {
        const res = await fetchTimelineHistory(id, undefined);
        finalRecords = res.map((r: any) => ({ ...r, _source: "Jadwal Tim" }));
      } else {
        // 1. Find which team this staff belongs to
        const staffTeam = teams.find(t => t.members.some(m => m.staffId === id));
        const staffMember = staffTeam?.members.find(m => m.staffId === id);
        
        // 2. Fetch BOTH personal schedules and their team's schedule simultaneously
        const [staffSchedules, teamSchedules] = await Promise.all([
          fetchTimelineHistory(undefined, id).catch(() => []),
          staffTeam ? fetchTimelineHistory(staffTeam.teamId, undefined).catch(() => []) : Promise.resolve([])
        ]);

        // 3. Tag them so we know where they came from
        const mappedTeamSchedules = teamSchedules.map((r: any) => ({ ...r, _source: `Tim: ${staffTeam?.teamName}` }));
        const mappedStaffSchedules = staffSchedules.map((r: any) => ({ ...r, _source: "Personal" }));

// 4. 🔥 EXTRACT ACTIVE TICKETS DIRECTLY FROM TIMELINE DATA! 🔥
        const activeTickets: any[] = [];
        if (staffMember) {
          let currentTicket: any = null;
          // Sort days chronologically just in case
          const sortedDays = [...staffMember.days].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          sortedDays.forEach(day => {
            // Catch it if it's a Leave (Red) OR if it has a custom label attached!
            if (day.barType === "Leave" || (day.label && day.label.trim() !== "")) {
              
              const dayReason = day.label || (day.barType === "Leave" ? "Izin / Cuti" : "Manual Override");

              // 🔥 FIX: We removed the strict barType check! 
              // Now, if the text note matches exactly, it merges into ONE ticket.
              if (!currentTicket || currentTicket.reason !== dayReason) {
                if (currentTicket) activeTickets.push(currentTicket);
                currentTicket = {
                  timelineId: `ticket-${day.date}`,
                  _source: "Tiket / Override",
                  isTicket: true,
                  barType: day.barType, // Saves the initial type (e.g. Leave) so it stays RED
                  reason: dayReason,
                  startDate: day.date,
                  endDate: day.date,
                };
              } else {
                currentTicket.endDate = day.date; // Extend the current ticket smoothly!
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

        // Evaluate Ticket status (Active vs Future) based on today's date
        const today = new Date().toISOString().split("T")[0];
        const processedTickets = activeTickets
          .filter(t => t.endDate >= today) // Only keep ongoing or future tickets
          .map(t => ({
            ...t,
            status: t.startDate > today ? "Future" : "Active"
          }));

        // Merge Tickets, Team Schedules, and Personal Schedules together!
        finalRecords = [...processedTickets, ...mappedTeamSchedules, ...mappedStaffSchedules];
      }

      // 5. STRICT FILTER: Only show Ongoing (Active) or Future schedules/tickets!
      finalRecords = finalRecords.filter(r => r.status === "Active" || r.status === "Future");

      setHistoryRecords(finalRecords);
    } catch (error: any) {
      setErrorMessage(error.message || "Gagal memuat riwayat jadwal.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!formData.targetId || !formData.daysOn || !formData.daysOff || !formData.startDate) {
      setErrorMessage("Harap isi semua kolom wajib!"); return;
    }
    setIsSubmitting(true);
    try {
      const isTeam = formData.targetId.startsWith("team:");
      const actualId = formData.targetId.split(":")[1];

      await createTimeline({
        teamId: isTeam ? actualId : null,
        staffId: !isTeam ? actualId : null,
        startDate: formData.startDate,
        endDate: formData.endDate ? formData.endDate : null,
        daysOn: parseInt(formData.daysOn, 10),
        daysOff: parseInt(formData.daysOff, 10),
      });

      setSuccessMessage("Versi jadwal baru berhasil disimpan dan diberlakukan!");
      setIsAssignModalOpen(false);
      setFormData({ targetId: "", daysOn: "", daysOff: "", startDate: "", endDate: "" });
      await loadData();
      if (selectedInspection) handleInspectTarget(selectedInspection.id, selectedInspection.name, selectedInspection.type, selectedInspection.subtitle);
    } catch (error: any) {
      setErrorMessage(error.message || "Terjadi kesalahan saat menyimpan jadwal.");
    } finally { setIsSubmitting(false); }
  };

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
      await handleInspectTarget(selectedInspection.id, selectedInspection.name, selectedInspection.type, selectedInspection.subtitle);
    } catch (error: any) { alert(error.message || "Gagal mengakhiri jadwal."); }
  };

  const handleCreateTeamSubmit = async () => {
    if (!newTeamName.trim()) { setErrorMessage("Nama tim tidak boleh kosong."); return; }
    setIsSubmitting(true);
    try {
      await createTeam({ teamName: newTeamName });
      setSuccessMessage(`Tim "${newTeamName}" berhasil dibuat!`);
      setIsNewTeamModalOpen(false); setNewTeamName(""); await loadData();
    } catch (err: any) { setErrorMessage(err.message || "Gagal membuat tim baru."); } finally { setIsSubmitting(false); }
  };

  const handleOpenUnassignedModal = async () => {
    setErrorMessage(null);
    try {
      const data = await fetchUnassignedStaff();
      setUnassignedStaff(data); setIsUnassignedModalOpen(true);
    } catch (err: any) { setErrorMessage(err.message || "Gagal memuat staf tanpa tim."); }
  };

  const handleAssignStaffSubmit = async (staffId: string) => {
    if (!selectedAssignTeamId) { setErrorMessage("Pilih tim tujuan."); return; }
    setIsSubmitting(true);
    try {
      await assignStaffToTeam(staffId, selectedAssignTeamId);
      setSuccessMessage("Staf berhasil ditugaskan ke tim!");
      setAssigningStaffId(null); setSelectedAssignTeamId("");
      setUnassignedStaff(await fetchUnassignedStaff()); await loadData();
    } catch (err: any) { setErrorMessage(err.message || "Gagal menugaskan staf."); } finally { setIsSubmitting(false); }
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

          <button onClick={handleOpenUnassignedModal} className="bg-brand-primary hover:bg-brand-dark text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer">
            <UserPlus size={14} /><span>Staf Tanpa Tim</span>
          </button>

          <div className="action-group ml-2">
            <button type="button" onClick={() => { setErrorMessage(null); setIsAssignModalOpen(true); }} className="action-group-btn">
              Atur Jadwal <Plus size={15} strokeWidth={2.5} />
            </button>
            <button type="button" onClick={() => { setErrorMessage(null); setIsNewTeamModalOpen(true); }} className="action-group-btn">
              Tim Baru <Plus size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between text-red-700 text-sm z-30">
          <div className="flex items-center gap-2"><AlertCircle size={16} /><span>{errorMessage}</span></div>
          <button onClick={() => setErrorMessage(null)} className="hover:opacity-75 font-bold cursor-pointer">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-between text-green-700 text-sm z-30">
          <div className="flex items-center gap-2"><CheckCircle2 size={16} /><span>{successMessage}</span></div>
          <button onClick={() => setSuccessMessage(null)} className="hover:opacity-75 font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden relative w-full">
        
        {/* CENTER CALENDAR WRAPPER DELEGATING TO COMPONENT */}
        <div className="flex-1 overflow-auto bg-brand-bg relative flex">
          <TimelineComponent 
            teams={filteredTeams}
            isLoading={isLoading}
            startDate={startDate}
            endDate={endDate}
            compact={false}
            onBarClick={(detail) => setSelectedBarDetail(detail)}
            onInspectTarget={handleInspectTarget}
          />
        </div>

        {/* RIGHT SIDE INSPECTION PANEL (SMOOTH SQUASH ANIMATION) */}
        <div 
          className={`shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out flex flex-col bg-white z-30 shadow-xl ${
            selectedInspection ? "w-96 border-l border-brand-outline" : "w-0 border-transparent"
          }`}
        >
          <div className="w-96 h-full flex flex-col">
            <div className="p-4 bg-brand-bg border-b border-brand-outline flex items-center justify-between shrink-0">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-brand-primary uppercase">
                  {selectedInspection?.type === "team" ? "Inspeksi Rotasi Tim" : "Inspeksi Staf"}
                </span>
                <h3 className="text-lg font-bold text-black/90">{selectedInspection?.name}</h3>
                {selectedInspection?.subtitle && <p className="text-xs text-black/50">{selectedInspection.subtitle}</p>}
              </div>
              <button onClick={() => setSelectedInspection(null)} className="p-1.5 text-black/40 hover:text-black rounded-full hover:bg-black/5 transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4 scrollbar-thin">
              {isLoadingHistory ? (
                <div className="text-center py-8 text-sm text-black/50">Memuat riwayat jadwal...</div>
              ) : historyRecords.length === 0 ? (
                <div className="text-center py-8 text-sm text-black/40 italic">Belum ada jadwal rotasi yang diatur untuk target ini.</div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-black/50 tracking-wider">Versi Rotasi</h4>
                    <span className="text-xs text-black/40">{historyRecords.length} Rekam</span>
                  </div>

                  {historyRecords.map((rec, index) => {
                    const isActive = rec.status === "Active";
                    const isTicket = rec.isTicket;
                    const isLeave = rec.barType === "Leave"; // Check if it's an OFF ticket
                    
                    // 🎨 Style adjustments for Tickets (Red for OFF, Green for ON) vs Schedules (Blue)
                    const cardBorder = isTicket 
                      ? (isLeave 
                          ? (isActive ? "border-red-500 bg-red-50/50" : "border-red-300 bg-red-50/30")
                          : (isActive ? "border-emerald-500 bg-emerald-50/50" : "border-emerald-300 bg-emerald-50/30")) 
                      : (isActive ? "border-brand-primary bg-brand-bg/60 shadow-sm" : "border-amber-300 bg-amber-50/40");
                      
                    const badgeClass = isTicket
                      ? (isLeave 
                          ? (isActive ? "bg-red-500 text-white" : "bg-red-100 text-red-800")
                          : (isActive ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-800"))
                      : (isActive ? "bg-brand-primary text-white" : "bg-amber-100 text-amber-800");

                    return (
                      <div key={`${rec.timelineId}-${index}`} className={`p-3 rounded-xl border transition ${cardBorder}`}>
                        
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`badge text-[10px] py-0.5 px-2 ${badgeClass}`}>
                              {isActive ? "AKTIF" : "MENDATANG"}
                            </span>
                            
                            {/* Shows if this schedule belongs to the Team, Person, or is a Ticket */}
                            {rec._source && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm border ${isTicket ? 'text-red-700 bg-white border-red-200' : 'text-brand-dark bg-white border-brand-outline/60'}`}>
                                {rec._source}
                              </span>
                            )}
                          </div>
                          
                          {/* If Ticket, show LEAVE, else show Days ON/OFF */}
                          {isTicket ? (
                            <span className={`text-xs font-bold uppercase tracking-wide ${isLeave ? 'text-red-600' : 'text-emerald-600'}`}>
                              {isLeave ? "LEAVE (OFF)" : "TICKET (OFF)"}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-black/80">{rec.daysOn} ON / {rec.daysOff} OFF</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-black/70 mt-2"><CalendarIcon size={14} className="text-black/40" /><span>Mulai: <strong className="text-black/90">{rec.startDate}</strong></span></div>
                        <div className="flex items-center gap-1.5 text-xs text-black/70 mt-1"><Clock size={14} className="text-black/40" /><span>Selesai: <strong className="text-black/90">{rec.endDate || "Sekarang (Tanpa Batas)"}</strong></span></div>
                        
                        {/* Display ticket reason if it exists */}
                        {isTicket && rec.reason && (
                           <div className="mt-2.5 p-2 bg-white border border-red-100 rounded-lg text-xs text-red-900 font-medium shadow-sm">
                             <strong className="block text-red-400 mb-0.5 text-[10px] uppercase tracking-wider">Catatan Tiket:</strong>
                             {rec.reason}
                           </div>
                        )}

                        {/* Only allow ending the schedule if it is Personal, OR if you are inspecting the Team itself */}
                        {!isTicket && isActive && !rec.endDate && (rec._source === "Personal" || rec._source === "Jadwal Tim") && (
                          <button onClick={() => {
                            const todayStr = new Date().toISOString().split("T")[0];
                            if (confirm("Akhiri siklus rotasi aktif ini mulai hari ini?")) handleEndSchedule(todayStr);
                          }} className="mt-3 w-full py-1 text-xs text-state-error hover:bg-red-50 font-medium rounded-lg border border-red-200 transition cursor-pointer">
                            Akhiri Jadwal Ini
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="p-4 border-t border-brand-outline bg-brand-bg/30 shrink-0">
              <button onClick={() => {
                if (!selectedInspection) return;
                const targetPrefix = selectedInspection.type === "team" ? "team:" : "staff:";
                setFormData(prev => ({ ...prev, targetId: targetPrefix + selectedInspection.id }));
                setIsAssignModalOpen(true);
              }} className="btn-primary w-full justify-center py-2 text-sm cursor-pointer">
                + Perbarui / Atur Rotasi Baru
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ALL MODALS REMAIN UNCHANGED BELOW */}
      
      {/* BAR INSPECTION POPOVER */}
      {selectedBarDetail && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center animate-in fade-in duration-150">
          <div className="card w-[400px] p-6 text-left shadow-2xl">
            <div className="flex items-center justify-between mb-3 border-b border-brand-outline/40 pb-2">
              <div>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-wider">Detail Status Lapangan</span>
                <h4 className="font-bold text-black/90 text-base">{selectedBarDetail.staffName}</h4>
              </div>
              <button onClick={() => setSelectedBarDetail(null)} className="text-black/40 hover:text-black cursor-pointer"><X size={16} /></button>
            </div>
            <div className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between"><span className="text-black/50">Tipe Status:</span><span className="font-bold text-brand-dark">{selectedBarDetail.barType === "OffDuty" ? "OFF DUTY (Rotasi Siklus)" : selectedBarDetail.barType === "Leave" ? "LEAVE (Izin / Tiket Disetujui)" : "TRANSITION"}</span></div>
              <div className="flex justify-between"><span className="text-black/50">Rentang Waktu:</span><span className="font-medium text-black/80">{selectedBarDetail.startDate} → {selectedBarDetail.endDate}</span></div>
              {selectedBarDetail.label && (
                <div className="mt-1 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900"><strong className="block mb-0.5">Alasan / Catatan Tiket:</strong>{selectedBarDetail.label}</div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setSelectedBarDetail(null)} className="px-4 py-1.5 bg-brand-bg hover:bg-brand-outline/40 text-black/80 text-xs font-bold rounded-lg transition cursor-pointer">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* UPGRADED SCHEDULE MANAGER MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-150 backdrop-blur-sm">
          <div className="card w-[500px] p-6 text-left shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-brand-outline/40 pb-3">
              <div><h2 className="text-xl font-bold text-brand-dark">Atur Rotasi Baru</h2><p className="text-xs text-black/50">Menambahkan versi jadwal baru secara otomatis menutup siklus aktif sebelumnya.</p></div>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-black/40 hover:text-black cursor-pointer"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-3">
              <label className="form-label">Pilih Target (Staf / Tim)</label>
              <select className="input-field cursor-pointer" value={formData.targetId} onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}>
                <option value="">-- Pilih Tim atau Staf --</option>
                {teams.map((team) => (
                  <optgroup key={team.teamId} label={`Tim: ${team.teamName}`}>
                    <option value={`team:${team.teamId}`}>Seluruh Tim: {team.teamName}</option>
                    {team.members.map((member) => <option key={member.staffId} value={`staff:${member.staffId}`}>&nbsp;&nbsp;&nbsp;↳ Staf: {member.name} ({member.position})</option>)}
                  </optgroup>
                ))}
              </select>
              <label className="form-label mt-1">Pola Shift (Days On / Days Off)</label>
              <div className="flex gap-2">
                <div className="w-full"><input type="number" min="1" placeholder="On (e.g. 5)" className="input-field" value={formData.daysOn} onChange={(e) => setFormData({ ...formData, daysOn: e.target.value })}/><span className="text-[11px] text-black/40 mt-1 block">Hari Kerja Aktif</span></div>
                <div className="w-full"><input type="number" min="1" placeholder="Off (e.g. 2)" className="input-field" value={formData.daysOff} onChange={(e) => setFormData({ ...formData, daysOff: e.target.value })}/><span className="text-[11px] text-black/40 mt-1 block">Hari Libur Rotasi</span></div>
              </div>
              <label className="form-label mt-1">Tanggal Mulai Berlaku</label>
              <input type="date" className="input-field cursor-pointer text-black/80" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} onClick={(e) => (e.currentTarget as any).showPicker?.()} />
              <label className="form-label mt-1">Tanggal Berakhir (Opsional)</label>
              <input type="date" className="input-field cursor-pointer text-black/80" value={formData.endDate} min={formData.startDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} onClick={(e) => (e.currentTarget as any).showPicker?.()} />
              <span className="text-[11px] text-black/40 block">Kosongkan jika jadwal berulang tanpa batas waktu.</span>
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-brand-outline/40 pt-4">
              <button onClick={() => { setIsAssignModalOpen(false); setFormData({ targetId: "", daysOn: "", daysOff: "", startDate: "", endDate: "" }); }} className="px-4 py-2 text-black/60 hover:bg-brand-bg rounded-xl text-sm font-medium transition cursor-pointer" disabled={isSubmitting}>Batal</button>
              <button onClick={handleSaveSchedule} className="btn-primary text-sm cursor-pointer" disabled={isSubmitting}>{isSubmitting ? "Menyimpan..." : "Simpan Versi Jadwal"}</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW TEAM MODAL */}
      {isNewTeamModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-150 backdrop-blur-sm">
          <div className="card w-[400px] p-6 text-left shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-brand-outline/40 pb-2">
              <h3 className="text-lg font-bold text-brand-dark">Buat Tim Lapangan Baru</h3>
              <button onClick={() => setIsNewTeamModalOpen(false)} className="text-black/40 hover:text-black cursor-pointer"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-2">
              <label className="form-label">Nama Tim</label>
              <input type="text" placeholder="Contoh: Tim Delta" className="input-field" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setIsNewTeamModalOpen(false)} className="px-4 py-1.5 text-black/60 hover:bg-brand-bg rounded-xl text-xs font-bold transition cursor-pointer" disabled={isSubmitting}>Batal</button>
              <button onClick={handleCreateTeamSubmit} className="btn-primary text-xs cursor-pointer" disabled={isSubmitting}>{isSubmitting ? "Menyimpan..." : "Buat Tim"}</button>
            </div>
          </div>
        </div>
      )}

      {/* UNASSIGNED STAFF ASSIGNMENT MODAL */}
      {isUnassignedModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-150 backdrop-blur-sm">
          <div className="card w-[500px] p-6 text-left shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-brand-outline/40 pb-3 shrink-0">
              <div><h3 className="text-lg font-bold text-brand-dark">Staf Tanpa Tim</h3><p className="text-xs text-black/50">Tugaskan staf yang belum memiliki tim ke dalam unit rotasi.</p></div>
              <button onClick={() => setIsUnassignedModalOpen(false)} className="text-black/40 hover:text-black cursor-pointer"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 py-1 scrollbar-thin">
              {unassignedStaff.length === 0 ? (
                <div className="text-center py-8 text-sm text-black/40 italic">Semua staf saat ini sudah ditugaskan ke dalam tim.</div>
              ) : (
                unassignedStaff.map((staff) => (
                  <div key={staff.staffId || staff.StaffId} className="p-3 border border-brand-outline/40 rounded-xl flex items-center justify-between bg-brand-bg/40">
                    <div><h4 className="font-bold text-sm text-black/90">{staff.name || staff.Name}</h4><span className="text-xs text-black/50">{staff.position || staff.Position}</span></div>
                    {assigningStaffId === (staff.staffId || staff.StaffId) ? (
                      <div className="flex items-center gap-1.5">
                        <select className="input-field text-xs py-1 px-2 cursor-pointer" value={selectedAssignTeamId} onChange={(e) => setSelectedAssignTeamId(e.target.value)}>
                          <option value="">Pilih Tim...</option>
                          {teams.map((t) => <option key={t.teamId} value={t.teamId}>{t.teamName}</option>)}
                        </select>
                        <button onClick={() => handleAssignStaffSubmit(staff.staffId || staff.StaffId)} className="px-2.5 py-1 bg-state-success hover:brightness-95 text-white rounded-lg text-xs font-bold transition cursor-pointer" disabled={isSubmitting}>Simpan</button>
                        <button onClick={() => setAssigningStaffId(null)} className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => { setAssigningStaffId(staff.staffId || staff.StaffId); setSelectedAssignTeamId(""); }} className="btn-primary text-xs py-1.5 px-3 cursor-pointer">+ Tugaskan ke Tim</button>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 border-t border-brand-outline/40 pt-3 flex justify-end shrink-0">
              <button onClick={() => setIsUnassignedModalOpen(false)} className="px-4 py-1.5 bg-brand-bg hover:bg-brand-outline/40 text-black/80 text-xs font-bold rounded-lg transition cursor-pointer">Tutup</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}