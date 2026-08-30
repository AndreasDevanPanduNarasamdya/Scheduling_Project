import { useState } from "react";
import { UserRound, Plus, ArrowLeftRight, Trash2, Pencil } from "lucide-react";
import { useManagement } from "./hooks/useManagement";
import TeamSection from "./components/TeamSection";

import { 
  AddStaffModal, EditStaffModal, AddTeamModal, 
  EditTeamModal, AssignStaffModal, DeleteModal 
} from "./components/ManagementModals"; 

export default function Management() {
  const { teams, unassignedStaff, isLoading, error, isStaff, isAdmin, loadData } = useManagement();

  // Pure UI Toggles (No form data here!)
  const [collapsedTeams, setCollapsedTeams] = useState<Set<string>>(new Set());
  
  // Modal Visibility States
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [isAssignStaffOpen, setIsAssignStaffOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Modals with Targets
  const [editStaffTarget, setEditStaffTarget] = useState<string | null>(null);

  if (isStaff) {
    return (
      <div className="min-h-screen w-full bg-brand-bg flex items-center justify-center">
        <div className="card p-10 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Akses Ditolak</h1>
          <p className="text-black/60">Anda tidak memiliki izin untuk mengelola data ini.</p>
        </div>
      </div>
    );
  }

  const toggleTeam = (teamId: string) => {
    setCollapsedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  return (
    <div className="min-h-screen w-full bg-brand-bg font-sans overflow-y-auto">
      <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10 lg:px-16 pt-10 md:pt-14 pb-16">
        
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-semibold text-brand-dark">Management</h1>
          <UserRound size={22} className="text-brand-dark mt-1" strokeWidth={2.2} />
        </div>

        {isAdmin && (
          <div className="mb-8 flex justify-start">
            <div className="action-group">
              <button type="button" onClick={() => setIsAddStaffOpen(true)} className="action-group-btn">
                Tambah Anggota <Plus size={16} strokeWidth={2.5} />
              </button>
              <button type="button" onClick={() => setIsAddTeamOpen(true)} className="action-group-btn">
                Tambah Tim <Plus size={16} strokeWidth={2.5} />
              </button>
              <button type="button" onClick={() => setIsEditTeamOpen(true)} className="action-group-btn">
                Edit Tim <Pencil size={16} strokeWidth={2.5} />
              </button>
              <button type="button" onClick={() => setIsAssignStaffOpen(true)} className="action-group-btn">
                Ubah Anggota <ArrowLeftRight size={16} strokeWidth={2.5} />
              </button>
              <button type="button" onClick={() => setIsDeleteOpen(true)} className="action-group-btn">
                Hapus <Trash2 size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {isLoading && <div className="text-black/50 text-sm py-12 text-center">Memuat data…</div>}
        {!isLoading && error && <div className="card p-8 text-center text-sm text-state-error">{error}</div>}

        {!isLoading && !error && (
          <div className="flex flex-col gap-8">
            {unassignedStaff.length > 0 && (
              <TeamSection
                key="unassigned"
                team={{ teamId: "unassigned", teamName: "Belum Masuk Tim (Unassigned)", members: unassignedStaff }}
                collapsed={collapsedTeams.has("unassigned")}
                onToggle={() => toggleTeam("unassigned")}
                isUnassigned={true}
                onStaffClick={(staff) => setEditStaffTarget(staff.staffId)} 
              />
            )}

            {teams.length === 0 && unassignedStaff.length === 0 ? (
              <div className="card p-8 text-center text-sm text-black/50">
                Belum ada data. Gunakan tombol diatas untuk menambahkan.
              </div>
            ) : (
              teams.map((team) => (
                <TeamSection
                  key={team.teamId}
                  team={team}
                  collapsed={collapsedTeams.has(team.teamId)}
                  onToggle={() => toggleTeam(team.teamId)}
                  onStaffClick={(staff) => setEditStaffTarget(staff.staffId)} 
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Render Modals (They now manage their own forms!) */}
      <AddStaffModal isOpen={isAddStaffOpen} onClose={() => setIsAddStaffOpen(false)} onSuccess={loadData} />
      <AddTeamModal isOpen={isAddTeamOpen} onClose={() => setIsAddTeamOpen(false)} onSuccess={loadData} />
      
      {/* Passing down the teams data so the modals can populate their dropdowns */}
      <EditTeamModal isOpen={isEditTeamOpen} onClose={() => setIsEditTeamOpen(false)} teams={teams} onSuccess={loadData} />
      <AssignStaffModal isOpen={isAssignStaffOpen} onClose={() => setIsAssignStaffOpen(false)} teams={teams} unassigned={unassignedStaff} onSuccess={loadData} />
      
      {/* These render conditionally based on if a target is selected */}
      <EditStaffModal staffId={editStaffTarget} onClose={() => setEditStaffTarget(null)} onSuccess={loadData} />
      <DeleteModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} teams={teams} unassigned={unassignedStaff} onSuccess={loadData} />
    </div>
  );
}