import { useState, useEffect } from "react";
import { ChevronDown, Menu, UserRound, Plus, ArrowLeftRight, Filter, X } from "lucide-react";
import type { Team, StaffMember } from "../../types";
import { 
  fetchTeams, 
  createNewHire, 
  fetchUnassignedStaff, 
  createTeam, 
  assignStaffToTeam,
  deleteStaff,
  deleteTeam
} from "../../api"; 
import { Trash2 } from "lucide-react";

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

  // --- DELETE STATE ---
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "staff" | "team"; id: string; name: string } | null>(null);

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
      const [teamsData, unassignedData] = await Promise.all([
        fetchTeams(),
        fetchUnassignedStaff()
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
      loadData();
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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      if (deleteTarget.type === "staff") {
        await deleteStaff(deleteTarget.id);
      } else {
        await deleteTeam(deleteTarget.id);
      }
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus");
    } finally {
      setIsSubmitting(false);
    }
  };

  const unassignedTeamObj: Team = {
    teamId: "unassigned",
    teamName: "Belum Masuk Tim (Unassigned)",
    members: unassignedStaff
  };

  return (
    <div className="min-h-screen w-full bg-brand-bg font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 pt-20 pb-16">

        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-semibold text-brand-dark">Management</h1>
          <UserRound size={22} className="text-brand-dark mt-1" strokeWidth={2.2} />
        </div>

        {/* Fused Action Bar Group - all actions grouped together at the top */}
        <div className="mb-8 flex justify-start">
          <div className="action-group">
            <button type="button" onClick={() => setIsAddStaffOpen(true)} className="action-group-btn">
              Tambah Anggota <Plus size={16} strokeWidth={2.5} />
            </button>
            <button type="button" onClick={() => setIsAddTeamOpen(true)} className="action-group-btn">
              Tambah Tim <Plus size={16} strokeWidth={2.5} />
            </button>
            <button type="button" onClick={() => setIsAssignStaffOpen(true)} className="action-group-btn">
              Ubah Anggota <ArrowLeftRight size={16} strokeWidth={2.5} />
            </button>
            <button type="button" onClick={() => setIsDeleteOpen(true)} className="action-group-btn">
              Hapus <Trash2 size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Content states */}
        {isLoading && <div className="text-black/50 text-sm py-12 text-center">Memuat data…</div>}

        {!isLoading && error && (
          <div className="card p-8 text-center text-sm text-state-error">
            {error}
          </div>
        )}

        {/* Render Teams & Unassigned Staff */}
        {!isLoading && !error && (
          <div className="flex flex-col gap-8">

            {unassignedStaff.length > 0 && (
              <TeamSection
                key="unassigned"
                team={unassignedTeamObj}
                collapsed={collapsedTeams.has("unassigned")}
                onToggle={() => toggleTeam("unassigned")}
                isUnassigned={true}
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
          <div className="card w-full max-w-md shadow-2xl flex flex-col max-h-[95vh] p-8">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-black">Tambah Staff</h2>
              <button onClick={() => setIsAddStaffOpen(false)} className="text-black/40 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="flex flex-col min-h-0">
              <div className="overflow-y-auto py-2 space-y-4 text-left scrollbar-thin">

                <div>
                  <label className="form-label">Nama Lengkap</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Staf"
                      className="input-field"
                      value={staffForm.firstName}
                      onChange={e => setStaffForm({ ...staffForm, firstName: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      placeholder="A"
                      className="input-field"
                      value={staffForm.lastName}
                      onChange={e => setStaffForm({ ...staffForm, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Jenis Kelamin</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStaffForm({ ...staffForm, sex: "P" })}
                      className={`btn-toggle ${staffForm.sex === "P" ? "btn-active" : "btn-inactive"}`}
                    >
                      P
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffForm({ ...staffForm, sex: "W" })}
                      className={`btn-toggle ${staffForm.sex === "W" ? "btn-active" : "btn-inactive"}`}
                    >
                      W
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">Posisi</label>
                  <input
                    type="text"
                    placeholder="Senior Engineer"
                    className="input-field"
                    value={staffForm.position}
                    onChange={e => setStaffForm({ ...staffForm, position: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    placeholder="stafa@gmail.com"
                    className="input-field"
                    value={staffForm.email}
                    onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Nomor Telepon</label>
                  <input
                    type="tel"
                    placeholder="+6281223551"
                    className="input-field"
                    value={staffForm.phone}
                    onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Tanggal Lahir</label>
                  <input
                    type="date"
                    onClick={(e) => {
                      try { (e.target as HTMLInputElement).showPicker(); } catch (err) {}
                    }}
                    className="input-field cursor-pointer text-black/80"
                    value={staffForm.dob}
                    onChange={e => setStaffForm({ ...staffForm, dob: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Tanggal Bergabung</label>
                  <input
                    type="date"
                    onClick={(e) => {
                      try { (e.target as HTMLInputElement).showPicker(); } catch (err) {}
                    }}
                    className="input-field cursor-pointer text-black/80"
                    value={staffForm.joinDate}
                    onChange={e => setStaffForm({ ...staffForm, joinDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-brand-outline/40 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-5 py-2 text-sm font-medium text-black/60 hover:bg-brand-bg rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-sm"
                >
                  {isSubmitting ? "Memproses..." : "Tambah Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Tambah Tim Modal */}
      {isAddTeamOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-center text-black mb-6">Tambah Tim Baru</h2>
            <form onSubmit={handleAddTeamSubmit} className="flex flex-col gap-4">
              <div>
                <label className="form-label">Nama Tim</label>
                <input
                  type="text"
                  placeholder="Tim C"
                  className="input-field"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsAddTeamOpen(false)} className="px-5 py-2 text-sm text-black/60 hover:bg-brand-bg rounded-xl">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">
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
          <div className="card w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-center text-black mb-6">Pindah / Assign Anggota</h2>
            <form onSubmit={handleAssignStaffSubmit} className="flex flex-col gap-4">

              <div>
                <label className="form-label">Pilih Staff</label>
                <select
                  className="input-field cursor-pointer"
                  value={assignForm.staffId}
                  onChange={e => setAssignForm({ ...assignForm, staffId: e.target.value })}
                  required
                >
                  <option value="" disabled>-- Pilih Staff --</option>
                  <optgroup label="Belum Ada Tim">
                    {unassignedStaff.map(s => (
                      <option key={s.staffId} value={s.staffId}>{s.name} ({s.position})</option>
                    ))}
                  </optgroup>
                  {teams.map(t => (
                    <optgroup key={t.teamId} label={`Tim: ${t.teamName}`}>
                      {t.members.map(s => (
                        <option key={s.staffId} value={s.staffId}>{s.name} ({s.position})</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Pindah ke Tim</label>
                <select
                  className="input-field cursor-pointer"
                  value={assignForm.teamId}
                  onChange={e => setAssignForm({ ...assignForm, teamId: e.target.value })}
                  required
                >
                  <option value="" disabled>-- Pilih Tim --</option>
                  {teams.map(t => (
                    <option key={t.teamId} value={t.teamId}>{t.teamName}</option>
                  ))}
                  <option value="unassigned">-- Hapus dari Tim (Unassign) --</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsAssignStaffOpen(false)} className="px-5 py-2 text-sm text-black/60 hover:bg-brand-bg rounded-xl">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">
                  {isSubmitting ? "Memproses..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Hapus Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-center text-black mb-6">Hapus Staff / Tim</h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="form-label">Pilih yang ingin dihapus</label>
                <select
                  className="input-field cursor-pointer"
                  value={deleteTarget ? `${deleteTarget.type}:${deleteTarget.id}` : ""}
                  onChange={(e) => {
                    const [type, id] = e.target.value.split(":");
                    let name = "";
                    if (type === "staff") {
                      name = [...unassignedStaff, ...teams.flatMap(t => t.members)].find(m => m.staffId === id)?.name ?? "";
                    } else {
                      name = teams.find(t => t.teamId === id)?.teamName ?? "";
                    }
                    setDeleteTarget({ type: type as "staff" | "team", id, name });
                  }}
                >
                  <option value="" disabled>-- Pilih Staff atau Tim --</option>
                  <optgroup label="Tim">
                    {teams.map(t => (
                      <option key={t.teamId} value={`team:${t.teamId}`}>{t.teamName}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Belum Ada Tim">
                    {unassignedStaff.map(s => (
                      <option key={s.staffId} value={`staff:${s.staffId}`}>{s.name} ({s.position})</option>
                    ))}
                  </optgroup>
                  {teams.map(t => (
                    <optgroup key={t.teamId} label={`Tim: ${t.teamName}`}>
                      {t.members.map(s => (
                        <option key={s.staffId} value={`staff:${s.staffId}`}>{s.name} ({s.position})</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {deleteTarget && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                  {deleteTarget.type === "staff"
                    ? `Semua tiket dan jadwal pribadi "${deleteTarget.name}" akan terhapus permanen.`
                    : `Anggota tim "${deleteTarget.name}" akan menjadi unassigned. Jadwal tim akan terhapus.`}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setIsDeleteOpen(false); setDeleteTarget(null); }}
                className="px-5 py-2 text-sm text-black/60 hover:bg-brand-bg rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={!deleteTarget || isSubmitting}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function TeamSection({
  team,
  collapsed,
  onToggle,
  isUnassigned = false,
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
        className="flex items-center gap-2 mb-3 group cursor-pointer"
      >
        <h2 className={`text-xl font-bold ${isUnassigned ? "text-black/50" : "text-brand-dark"}`}>
          {team.teamName}
        </h2>
        <ChevronDown
          size={18}
          className={`text-black/70 transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-3">
          {/* Table Header */}
          <div className="grid grid-cols-[1.2fr_1.2fr_0.8fr_2fr] px-6 pt-2 pb-1 text-sm text-black/50 font-medium">
            <span>Nama</span>
            <span>Posisi</span>
            <span>Status</span>
            <span>Keterangan</span>
          </div>

          {team.members.length === 0 ? (
            <div className="card px-6 py-6 text-sm text-black/40">No members in this team yet.</div>
          ) : (
            <div className="card overflow-hidden">
              {team.members.map((member, i) => (
                <div
                  key={member.staffId}
                  className={`grid grid-cols-[1.2fr_1.2fr_0.8fr_2fr] items-center px-6 py-4 text-[15px] text-black/90 hover:bg-brand-bg/50 transition-colors ${
                    i !== team.members.length - 1 ? "border-b border-brand-outline/40" : ""
                  }`}
                >
                  <span className="font-medium">{member.name}</span>
                  <span className="text-black/70">{member.position}</span>
                  <span><StatusBadge status={member.status as "ON" | "OFF"} /></span>
                  <span className="text-sm text-black/50">{member.note ?? ""}</span>
                </div>
              ))}
            </div>
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
      className={`badge ${isOn ? "bg-brand-primary text-white" : "bg-gray-200 text-gray-600"}`}
    >
      {status}
    </span>
  );
}