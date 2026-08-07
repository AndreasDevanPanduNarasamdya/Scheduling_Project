import { useState, useEffect } from "react";
import { ChevronDown, Menu, UserRound, Plus, ArrowLeftRight, Filter } from "lucide-react";
import type { Team, StaffMember } from "../../types"
import { 
  fetchTeams, 
  createNewHire, 
  // TODO: You will need to add these 3 functions to your api.ts file!
  fetchUnassignedStaff, 
  createTeam, 
  assignStaffToTeam 
} from "../../api"; 

export default function ManagementPage() {
  // --- STAFF FORM STATE ---
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    firstName: "", lastName: "", sex: "P", position: "", 
    email: "", phone: "", dob: "", joinDate: ""
  });

  // --- TEAM FORM STATE ---
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState("");

  // --- ASSIGN STAFF STATE ---
  const [isAssignStaffOpen, setIsAssignStaffOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ staffId: "", teamId: "" });

  // --- DATA STATE ---
  const [teams, setTeams] = useState<Team[]>([]);
  const [unassignedStaff, setUnassignedStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedTeams, setCollapsedTeams] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch both teams and unassigned staff in parallel
      const [teamsData, unassignedData] = await Promise.all([
        fetchTeams(),
        fetchUnassignedStaff() // You'll need an endpoint like GET /api/staff/unassigned
      ]);
      setTeams(teamsData);
      setUnassignedStaff(unassignedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load management data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleTeam = (teamId: string) => {
    setCollapsedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  // ================= SUBMIT HANDLERS =================

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        firstName: staffForm.firstName,
        lastName: staffForm.lastName,
        sex: staffForm.sex === "P" ? 0 : 1,
        position: staffForm.position,
        email: staffForm.email,
        phone: staffForm.phone,
        dob: staffForm.dob,
        joinDate: staffForm.joinDate
      };
      const result = await createNewHire(payload);
      alert(`Staff added to staging successfully! Token: ${result.tokenId}`);
      setIsAddStaffOpen(false);
      setStaffForm({ firstName: "", lastName: "", sex: "P", position: "", email: "", phone: "", dob: "", joinDate: "" });
      loadData(); // Refresh lists
    } catch (err: any) {
      alert(err.message || "Failed to add new hire");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createTeam({ teamName });
      alert("Tim berhasil dibuat!");
      setIsAddTeamOpen(false);
      setTeamName("");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create team");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await assignStaffToTeam(assignForm.staffId, assignForm.teamId);
      alert("Staff berhasil dipindahkan!");
      setIsAssignStaffOpen(false);
      setAssignForm({ staffId: "", teamId: "" });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to assign staff");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create a mock team object to render unassigned staff using your existing TeamSection UI
  const unassignedTeamObj: Team = {
    teamId: "unassigned",
    teamName: "Belum Masuk Tim (Unassigned)",
    members: unassignedStaff
  };

  return (
    <div className="min-h-screen bg-[#e8f1fc] font-sans">
      <button
        type="button"
        aria-label="Open menu"
        className="fixed top-0 left-0 m-0 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#4c3fd6] to-[#7b5ff0] text-white rounded-br-2xl shadow-md hover:brightness-110 transition z-40"
      >
        <Menu size={22} />
      </button>

      <div className="max-w-5xl mx-auto px-8 pt-20 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-semibold text-gray-800">Management</h1>
          <UserRound size={22} className="text-gray-800 mt-1" strokeWidth={2.2} />
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <ActionButton icon={<Plus size={15} />} onClick={() => setIsAddStaffOpen(true)}>
            Tambah Anggota
          </ActionButton>
          <ActionButton icon={<Plus size={15} />} onClick={() => setIsAddTeamOpen(true)}>
            Tambah Tim
          </ActionButton>
          <ActionButton icon={<ArrowLeftRight size={15} />} onClick={() => setIsAssignStaffOpen(true)}>
            Ubah Anggota
          </ActionButton>
          <ActionButton icon={<Filter size={14} />} muted>
            Filter
          </ActionButton>
        </div>

        {/* Content states */}
        {isLoading && <div className="text-gray-500 text-sm py-12 text-center">Memuat data…</div>}

        {!isLoading && error && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Render Teams & Unassigned Staff */}
        {!isLoading && !error && (
          <div className="flex flex-col gap-8">
            
            {/* Always show Unassigned Staff at the top if there are any */}
            {unassignedStaff.length > 0 && (
              <TeamSection
                key="unassigned"
                team={unassignedTeamObj}
                collapsed={collapsedTeams.has("unassigned")}
                onToggle={() => toggleTeam("unassigned")}
                isUnassigned={true} // Optional flag for styling
              />
            )}

            {teams.length === 0 && unassignedStaff.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-sm text-gray-500">
                Belum ada data. Gunakan tombol diatas untuk menambahkan.
              </div>
            ) : (
              teams.map((team) => (
                <TeamSection
                  key={team.teamId}
                  team={team}
                  collapsed={collapsedTeams.has(team.teamId)}
                  onToggle={() => toggleTeam(team.teamId)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* ================= MODALS ================= */}

{/* 1. Tambah Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-xl flex flex-col max-h-[95vh]">
            
            {/* Sticky Header */}
            <h2 className="text-xl font-medium text-center text-gray-800 p-6 pb-2 shrink-0">
              Tambah Staff
            </h2>
            
            <form onSubmit={handleAddStaffSubmit} className="flex flex-col min-h-0">
              
              {/* Scrollable Content Area */}
              <div className="overflow-y-auto px-6 py-2 space-y-3 text-left">
                
                {/* Nama Lengkap - Split inputs */}
                <div>
                  <label className="block text-sm mb-1 text-gray-800">Nama Lengkap</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      placeholder="Staf" 
                      className="w-full px-4 py-2 bg-[#f0f4fa] border border-[#d6e0f0] rounded-xl outline-none focus:border-[#6f92c9] text-sm"
                      value={staffForm.firstName}
                      onChange={e => setStaffForm({...staffForm, firstName: e.target.value})}
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="A" 
                      className="w-full px-4 py-2 bg-[#f0f4fa] border border-[#d6e0f0] rounded-xl outline-none focus:border-[#6f92c9] text-sm"
                      value={staffForm.lastName}
                      onChange={e => setStaffForm({...staffForm, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {/* Jenis Kelamin - Toggle Buttons */}
                <div>
                  <label className="block text-sm mb-1 text-gray-800">Jenis Kelamin</label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setStaffForm({...staffForm, sex: "P"})}
                      className={`w-11 h-9 rounded-lg text-sm font-semibold transition-colors
                        ${staffForm.sex === "P" ? "bg-[#3558a8] text-white" : "bg-white text-gray-700 border border-gray-300"}`}
                    >
                      P
                    </button>
                    <button 
                      type="button"
                      onClick={() => setStaffForm({...staffForm, sex: "W"})}
                      className={`w-11 h-9 rounded-lg text-sm font-semibold transition-colors
                        ${staffForm.sex === "W" ? "bg-[#3558a8] text-white" : "bg-white text-gray-700 border border-gray-300"}`}
                    >
                      W
                    </button>
                  </div>
                </div>

                {/* Posisi */}
                <div>
                  <label className="block text-sm mb-1 text-gray-800">Posisi</label>
                  <input 
                    type="text" 
                    placeholder="Senior Engineer" 
                    className="w-full px-4 py-2 bg-[#f0f4fa] border border-[#d6e0f0] rounded-xl outline-none focus:border-[#6f92c9] text-sm"
                    value={staffForm.position}
                    onChange={e => setStaffForm({...staffForm, position: e.target.value})}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm mb-1 text-gray-800">Email</label>
                  <input 
                    type="email" 
                    placeholder="stafa@gmail.com" 
                    className="w-full px-4 py-2 bg-[#f0f4fa] border border-[#d6e0f0] rounded-xl outline-none focus:border-[#6f92c9] text-sm"
                    value={staffForm.email}
                    onChange={e => setStaffForm({...staffForm, email: e.target.value})}
                    required
                  />
                </div>

                {/* Nomor Telepon */}
                <div>
                  <label className="block text-sm mb-1 text-gray-800">Nomor Telepon</label>
                  <input 
                    type="tel" 
                    placeholder="+6281223551" 
                    className="w-full px-4 py-2 bg-[#f0f4fa] border border-[#d6e0f0] rounded-xl outline-none focus:border-[#6f92c9] text-sm"
                    value={staffForm.phone}
                    onChange={e => setStaffForm({...staffForm, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-800">Tanggal Lahir</label>
                  <input 
                    type="date" 
                    onClick={(e) => {
                      try {
                        (e.target as HTMLInputElement).showPicker();
                      } catch (err) {
                      }
                    }}
                    className="w-full px-4 py-2 bg-[#f0f4fa] border border-[#d6e0f0] rounded-xl outline-none focus:border-[#6f92c9] text-sm text-gray-700 cursor-pointer"
                    value={staffForm.dob}
                    onChange={e => setStaffForm({...staffForm, dob: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-800">Tanggal Bergabung</label>
                  <input 
                    type="date" 
                    onClick={(e) => {
                      try {
                        (e.target as HTMLInputElement).showPicker();
                      } catch (err) {}
                    }}
                    className="w-full px-4 py-2 bg-[#f0f4fa] border border-[#d6e0f0] rounded-xl outline-none focus:border-[#6f92c9] text-sm text-gray-700 cursor-pointer"
                    value={staffForm.joinDate}
                    onChange={e => setStaffForm({...staffForm, joinDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Sticky Actions */}
              <div className="flex justify-end gap-3 p-6 pt-4 shrink-0 bg-white rounded-b-[24px] border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-[#6f92c9] hover:bg-[#5a7ab0] text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
                >
                  {isSubmitting ? "Memproses..." : "Tambah Staff"}
                  {!isSubmitting && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  )}
                </button>
              </div>
              
            </form>
          </div>
        </div>
      )}

      {/* 2. Tambah Tim Modal */}
      {isAddTeamOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-xl p-6">
            <h2 className="text-xl font-medium text-center text-gray-800 mb-6">Tambah Tim Baru</h2>
            <form onSubmit={handleAddTeamSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm mb-1 text-gray-800">Nama Tim</label>
                <input 
                  type="text" 
                  placeholder="Mi" 
                  className="w-full px-4 py-2 bg-[#f0f4fa] border border-[#d6e0f0] rounded-xl outline-none focus:border-[#6f92c9] text-sm"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsAddTeamOpen(false)} className="px-5 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-[#6f92c9] hover:bg-[#5a7ab0] text-white rounded-xl text-sm font-medium">
                  {isSubmitting ? "Memproses..." : "Buat Tim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Assign / Ubah Anggota Modal */}
      {isAssignStaffOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-xl p-6">
            <h2 className="text-xl font-medium text-center text-gray-800 mb-6">Pindah / Assign Anggota</h2>
            <form onSubmit={handleAssignStaffSubmit} className="flex flex-col gap-4">
              
              {/* Select Staff */}
              <div>
                <label className="block text-sm mb-1 text-gray-800">Pilih Staff</label>
                <select 
                  className="w-full px-4 py-2 bg-[#f0f4fa] border border-[#d6e0f0] rounded-xl outline-none focus:border-[#6f92c9] text-sm"
                  value={assignForm.staffId}
                  onChange={e => setAssignForm({...assignForm, staffId: e.target.value})}
                  required
                >
                  <option value="" disabled>-- Pilih Staff --</option>
                  
                  {/* Group unassigned staff */}
                  <optgroup label="Belum Ada Tim">
                    {unassignedStaff.map(s => (
                      <option key={s.staffId} value={s.staffId}>{s.name} ({s.position})</option>
                    ))}
                  </optgroup>

                  {/* Group assigned staff so you can move them between teams */}
                  {teams.map(t => (
                    <optgroup key={t.teamId} label={`Tim: ${t.teamName}`}>
                      {t.members.map(s => (
                        <option key={s.staffId} value={s.staffId}>{s.name} ({s.position})</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Select Team */}
              <div>
                <label className="block text-sm mb-1 text-gray-800">Pindah ke Tim</label>
                <select 
                  className="w-full px-4 py-2 bg-[#f0f4fa] border border-[#d6e0f0] rounded-xl outline-none focus:border-[#6f92c9] text-sm"
                  value={assignForm.teamId}
                  onChange={e => setAssignForm({...assignForm, teamId: e.target.value})}
                  required
                >
                  <option value="" disabled>-- Pilih Tim --</option>
                  {teams.map(t => (
                     <option key={t.teamId} value={t.teamId}>{t.teamName}</option>
                  ))}
                  {/* Add option to remove from team completely */}
                  <option value="unassigned">-- Hapus dari Tim (Unassign) --</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsAssignStaffOpen(false)} className="px-5 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-[#6f92c9] hover:bg-[#5a7ab0] text-white rounded-xl text-sm font-medium">
                  {isSubmitting ? "Memproses..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Notice we removed the ": void" at the end and ensured "return" is there
function ActionButton({ 
  children, 
  icon, 
  muted = false, 
  onClick 
}: { 
  children: React.ReactNode; 
  icon: React.ReactNode; 
  muted?: boolean; 
  onClick?: () => void; 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition
        ${
          muted
            ? "bg-[#cfe0f4] text-gray-700 hover:bg-[#c0d6ee]"
            : "bg-[#6f92c9] text-white hover:bg-[#5f80b8]"
        }`}
    >
      {children}
      {icon}
    </button>
  );
}

// Put this at the bottom of your file, outside of the main ManagementPage component

function TeamSection({
  team,
  collapsed,
  onToggle,
  isUnassigned = false, // Added this so TypeScript doesn't yell about the new prop
}: {
  team: Team;
  collapsed: boolean;
  onToggle: () => void;
  isUnassigned?: boolean;
}) {
  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 mb-3 group"
      >
        <h2 className={`text-xl font-bold ${isUnassigned ? "text-gray-500" : "text-gray-800"}`}>
          {team.teamName}
        </h2>
        <ChevronDown
          size={18}
          className={`text-gray-700 transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
      </button>

      {!collapsed && (
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1.2fr_0.8fr_2fr] px-6 pt-4 pb-2 text-sm text-gray-500 font-medium">
            <span>Nama</span>
            <span>Posisi</span>
            <span>Status</span>
            <span>Keterangan</span>
          </div>

          {team.members.length === 0 ? (
            <div className="px-6 py-6 text-sm text-gray-400">No members in this team yet.</div>
          ) : (
            team.members.map((member, i) => (
              <div
                key={member.staffId}
                className={`grid grid-cols-[1.2fr_1.2fr_0.8fr_2fr] items-center px-6 py-3 text-[15px] text-gray-800
                  ${i !== team.members.length - 1 ? "border-b border-[#eef2f8]" : ""}`}
              >
                <span>{member.name}</span>
                <span>{member.position}</span>
                <span>
                  <StatusBadge status={member.status as "ON" | "OFF"} />
                </span>
                <span className="text-sm text-gray-500">{member.note ?? ""}</span>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: "ON" | "OFF" }) {
  const isOn = status === "ON";
  return (
    <span
      className={`inline-flex items-center justify-center w-14 py-1 rounded-md text-xs font-bold tracking-wide
        ${isOn ? "bg-[#2a66b0] text-white" : "bg-gray-200 text-gray-500"}`}
    >
      {status}
    </span>
  );
}