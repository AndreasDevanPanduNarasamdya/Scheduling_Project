// components/ManagementModals.tsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Team, StaffMember } from "../../../../types";
import { Clearance } from "../../../../types";
import {
  createNewHire,
  createTeam,
  assignStaffToTeam,
  deleteStaff,
  deleteTeam,
  editStaff,
  fetchStaffById,
  editTeam,
  getUserClearance,
} from "../../../../api";

// ==========================================
// 1. ADD STAFF MODAL
// ==========================================
export function AddStaffModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffForm, setStaffForm] = useState({
    firstName: "", lastName: "", sex: "P", position: "",
    email: "", phone: "", dob: "", joinDate: ""
  });

  const [originalForm, setOriginalForm] = useState<any>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      firstName: staffForm.firstName,
      lastName: staffForm.lastName,
      sex: staffForm.sex === "P" ? 0 : 1,
      position: staffForm.position,
      email: staffForm.email,
      phone: staffForm.phone,
      dob: staffForm.dob,
      joinDate: staffForm.joinDate,
      clearance: 0 // 🔥 Hardcoded to 0 (Staff). The user never sees this.
    };

    try {
      await createNewHire(payload);
      alert("Staff baru berhasil ditambahkan!");
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Gagal menambahkan staff.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="card w-full max-w-md shadow-2xl flex flex-col max-h-[95vh] p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-black">Tambah Staff</h2>
          <button onClick={onClose} className="text-black/40 hover:text-black"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="overflow-y-auto py-2 space-y-4 text-left scrollbar-thin pr-1">
            <div>
              <label className="form-label">Nama Lengkap</label>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Nama Depan" className="input-field" value={staffForm.firstName} onChange={e => setStaffForm({ ...staffForm, firstName: e.target.value })} required />
                <input type="text" placeholder="Nama Belakang" className="input-field" value={staffForm.lastName} onChange={e => setStaffForm({ ...staffForm, lastName: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="form-label">Jenis Kelamin</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStaffForm({ ...staffForm, sex: "P" })} className={`btn-toggle ${staffForm.sex === "P" ? "btn-active" : "btn-inactive"}`}>P</button>
                <button type="button" onClick={() => setStaffForm({ ...staffForm, sex: "W" })} className={`btn-toggle ${staffForm.sex === "W" ? "btn-active" : "btn-inactive"}`}>W</button>
              </div>
            </div>
            <div>
              <label className="form-label">Posisi</label>
              <input type="text" placeholder="Senior Engineer" className="input-field" value={staffForm.position} onChange={e => setStaffForm({ ...staffForm, position: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" placeholder="email@domain.com" className="input-field" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Nomor Telepon</label>
              <input type="tel" placeholder="+62..." className="input-field" value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Tanggal Lahir</label>
              <input 
                type="date" 
                className="input-field cursor-pointer text-black/80" 
                value={staffForm.dob} 
                onChange={e => setStaffForm({ ...staffForm, dob: e.target.value })} 
                onClick={(e) => e.currentTarget.showPicker()} 
                required 
              />
            </div>
            <div>
              <label className="form-label">Tanggal Bergabung</label>
              <input 
                type="date" 
                className="input-field cursor-pointer text-black/80" 
                value={staffForm.joinDate} 
                onChange={e => setStaffForm({ ...staffForm, joinDate: e.target.value })} 
                onClick={(e) => e.currentTarget.showPicker()} 
                required 
              />
            </div>
            {/* 🛑 CLEARANCE DROPDOWN DELETED FROM HERE */}
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-brand-outline/40 mt-4">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-black/60 hover:bg-brand-bg rounded-xl transition">Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">{isSubmitting ? "Memproses..." : "Tambah Staff"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. STAFF DETAIL / EDIT MODAL
// Flow:
//  - Opens in READ-ONLY "view details" mode (all fields disabled)
//  - "Edit" button ONLY flips fields into editable mode — it never submits/saves anything
//  - Once editing, the same button morphs into "Simpan" (Save) and becomes the form's submit button
//  - Clicking "Simpan" submits the (possibly unchanged) field values and persists them
//  - "Batal" while editing discards edits and returns to read-only view (no save)
//  - "Tutup" while viewing simply closes the modal
// ==========================================
export function EditStaffModal({
  staffId,
  onClose,
  onSuccess,
}: {
  staffId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [staffForm, setStaffForm] = useState({
    firstName: "",
    lastName: "",
    sex: "P",
    position: "",
    email: "",
    phone: "",
    dob: "",
    joinDate: "",
    clearance: 0,
  });

  // 🔥 State for soft prevention comparison
  const [originalForm, setOriginalForm] = useState<any>(null);

  const userClearance = getUserClearance();

  useEffect(() => {
    if (!staffId) {
      setIsEditing(false);
      return;
    }

    setIsEditing(false);

    const loadData = async () => {
      setIsLoading(true);
      try {
        const realData = await fetchStaffById(staffId);

        const formattedData = {
          firstName: realData.firstName || "",
          lastName: realData.lastName || "",
          sex: realData.sex === 1 ? "W" : "P",
          position: realData.position || "",
          email: realData.email || "",
          phone: realData.phone || "",
          dob: realData.dob ? realData.dob.split("T")[0] : "",
          joinDate: realData.joinDate ? realData.joinDate.split("T")[0] : "",
          clearance: realData.clearance ?? 0,
        };

        setStaffForm(formattedData);
        setOriginalForm(formattedData); // 🔥 Snapshot saved here

      } catch (err) {
        alert("Gagal mengambil data lengkap staff dari database.");
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [staffId]);

  if (!staffId) return null;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!isEditing) return;

    // 🔥 Soft prevention check
    const hasChanges = JSON.stringify(staffForm) !== JSON.stringify(originalForm);
    
    if (!hasChanges) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        firstName: staffForm.firstName,
        lastName: staffForm.lastName,
        sex: staffForm.sex === "P" ? 0 : 1,
        position: staffForm.position,
        phone: staffForm.phone,
        dob: staffForm.dob,
        joinDate: staffForm.joinDate,
        email: staffForm.email,
        clearance: staffForm.clearance, 
      };

      await editStaff(staffId, payload);
      alert("Informasi staff berhasil diperbarui!");
      onClose();
      onSuccess();
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui staff");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setStaffForm(originalForm); // Optional: Reset the textboxes back to original if they hit cancel
  };

  const disabledClass =
    "input-field disabled:bg-brand-bg/60 disabled:text-black/60 disabled:border-transparent disabled:cursor-not-allowed";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="card w-full max-w-md shadow-2xl flex flex-col max-h-[95vh] p-8 transition-all">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-black">
            {isEditing ? "Edit Staff" : "Informasi Staff"}
          </h2>
          <button onClick={onClose} className="text-black/40 hover:text-black">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-black/50">Memuat data...</div>
        ) : (
          <form
            onSubmit={(e) => {
              if (!isEditing) {
                e.preventDefault();
                return;
              }
              handleSubmit(e);
            }}
            className="flex flex-col min-h-0"
          >
            <div className="overflow-y-auto py-2 space-y-4 text-left scrollbar-thin pr-1">
              <div>
                <label className="form-label">Nama Lengkap</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    className={disabledClass}
                    value={staffForm.firstName}
                    onChange={(e) => setStaffForm({ ...staffForm, firstName: e.target.value })}
                    required
                    disabled={!isEditing}
                  />
                  <input
                    type="text"
                    className={disabledClass}
                    value={staffForm.lastName}
                    onChange={(e) => setStaffForm({ ...staffForm, lastName: e.target.value })}
                    required
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Jenis Kelamin</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStaffForm({ ...staffForm, sex: "P" })}
                    className={`btn-toggle disabled:opacity-70 disabled:cursor-not-allowed ${staffForm.sex === "P" ? "btn-active" : "btn-inactive"}`}
                    disabled={!isEditing}
                  >
                    P
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffForm({ ...staffForm, sex: "W" })}
                    className={`btn-toggle disabled:opacity-70 disabled:cursor-not-allowed ${staffForm.sex === "W" ? "btn-active" : "btn-inactive"}`}
                    disabled={!isEditing}
                  >
                    W
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Posisi</label>
                <input
                  type="text"
                  className={disabledClass}
                  value={staffForm.position}
                  onChange={(e) => setStaffForm({ ...staffForm, position: e.target.value })}
                  required
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className={disabledClass}
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  required
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="form-label">Nomor Telepon</label>
                <input
                  type="tel"
                  className={disabledClass}
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  required
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="form-label">Tanggal Lahir</label>
                <input
                  type="date"
                  className={`${disabledClass} ${isEditing ? "cursor-pointer text-black/80" : ""}`}
                  value={staffForm.dob}
                  onChange={(e) => setStaffForm({ ...staffForm, dob: e.target.value })}
                  onClick={(e) => isEditing && e.currentTarget.showPicker()}
                  required
                  disabled={!isEditing}
                />
              </div>
              <div>
                <label className="form-label">Tanggal Bergabung</label>
                <input
                  type="date"
                  className={`${disabledClass} ${isEditing ? "cursor-pointer text-black/80" : ""}`}
                  value={staffForm.joinDate}
                  onChange={(e) => setStaffForm({ ...staffForm, joinDate: e.target.value })}
                  onClick={(e) => isEditing && e.currentTarget.showPicker()}
                  required
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="form-label">Tingkat Akses</label>
                <select
                  className="input-field disabled:bg-brand-bg/60 disabled:text-black/60 disabled:border-transparent disabled:cursor-not-allowed"
                  value={staffForm.clearance}
                  onChange={(e) => setStaffForm({ ...staffForm, clearance: parseInt(e.target.value) })}
                  disabled={!isEditing}
                >
                  <option value={0}>Staff</option>
                  <option value={1}>Supervisor</option>
                  <option value={2}>Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-brand-outline/40 mt-4">
              {!isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 text-sm font-medium text-black/60 hover:bg-brand-bg rounded-xl transition cursor-pointer"
                  >
                    Tutup
                  </button>

                  {userClearance === Clearance.Admin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault(); 
                        setIsEditing(true); 
                      }}
                      className="btn-primary text-sm bg-brand-primary cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-5 py-2 text-sm font-medium text-black/60 hover:bg-brand-bg rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary text-sm bg-brand-primary cursor-pointer"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan"}
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. ADD TEAM MODAL
// ==========================================
export function AddTeamModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamName, setTeamName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createTeam({ teamName });
      alert("Tim berhasil dibuat!");
      setTeamName("");
      onClose();
      onSuccess();
    } catch (err: any) {
      alert(err.message || "Failed to create team");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-8 shadow-2xl">
        <h2 className="text-xl font-semibold text-center text-black mb-6">Tambah Tim Baru</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="form-label">Nama Tim</label>
            <input type="text" placeholder="Tim C" className="input-field" value={teamName} onChange={e => setTeamName(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm text-black/60 hover:bg-brand-bg rounded-xl">Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">{isSubmitting ? "Memproses..." : "Buat Tim"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 4. EDIT TEAM MODAL
// ==========================================
export function EditTeamModal({ isOpen, onClose, teams, onSuccess }: { isOpen: boolean; onClose: () => void; teams: Team[]; onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editTeamId, setEditTeamId] = useState("");
  const [editTeamName, setEditTeamName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeamId) return;
    setIsSubmitting(true);
    try {
      await editTeam(editTeamId, { teamName: editTeamName });
      alert("Nama tim berhasil diperbarui!");
      setEditTeamId("");
      setEditTeamName("");
      onClose();
      onSuccess();
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui tim");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-black">Edit Nama Tim</h2>
          <button onClick={onClose} className="text-black/40 hover:text-black"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="form-label">Pilih Tim</label>
            <select className="input-field cursor-pointer" value={editTeamId} onChange={(e) => {
              const id = e.target.value;
              setEditTeamId(id);
              setEditTeamName(teams.find(t => t.teamId === id)?.teamName || "");
            }} required>
              <option value="" disabled>-- Pilih Tim --</option>
              {teams.map(t => <option key={t.teamId} value={t.teamId}>{t.teamName}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Nama Baru</label>
            <input type="text" placeholder="Masukkan nama baru" className="input-field" value={editTeamName} onChange={e => setEditTeamName(e.target.value)} required disabled={!editTeamId} />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm text-black/60 hover:bg-brand-bg rounded-xl">Batal</button>
            <button type="submit" disabled={isSubmitting || !editTeamId} className="btn-primary text-sm">{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 5. ASSIGN STAFF MODAL
// ==========================================
export function AssignStaffModal({ isOpen, onClose, teams, unassigned, onSuccess }: { isOpen: boolean; onClose: () => void; teams: Team[]; unassigned: StaffMember[]; onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignForm, setAssignForm] = useState({ staffId: "", teamId: "" });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await assignStaffToTeam(assignForm.staffId, assignForm.teamId);
      alert("Staff berhasil dipindahkan!");
      setAssignForm({ staffId: "", teamId: "" });
      onClose();
      onSuccess();
    } catch (err: any) {
      alert(err.message || "Failed to assign staff");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-8 shadow-2xl">
        <h2 className="text-xl font-semibold text-center text-black mb-6">Pindah / Assign Anggota</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="form-label">Pilih Staff</label>
            <select className="input-field cursor-pointer" value={assignForm.staffId} onChange={e => setAssignForm({ ...assignForm, staffId: e.target.value })} required>
              <option value="" disabled>-- Pilih Staff --</option>
              <optgroup label="Belum Ada Tim">
                {unassigned.map(s => <option key={s.staffId} value={s.staffId}>{s.name} ({s.position})</option>)}
              </optgroup>
              {teams.map(t => (
                <optgroup key={t.teamId} label={`Tim: ${t.teamName}`}>
                  {t.members.map(s => <option key={s.staffId} value={s.staffId}>{s.name} ({s.position})</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Pindah ke Tim</label>
            <select className="input-field cursor-pointer" value={assignForm.teamId} onChange={e => setAssignForm({ ...assignForm, teamId: e.target.value })} required>
              <option value="" disabled>-- Pilih Tim --</option>
              {teams.map(t => <option key={t.teamId} value={t.teamId}>{t.teamName}</option>)}
              <option value="unassigned">-- Hapus dari Tim (Unassign) --</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm text-black/60 hover:bg-brand-bg rounded-xl">Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">{isSubmitting ? "Memproses..." : "Simpan Perubahan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 6. DELETE MODAL
// ==========================================
export function DeleteModal({ isOpen, onClose, teams, unassigned, onSuccess }: { isOpen: boolean; onClose: () => void; teams: Team[]; unassigned: StaffMember[]; onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "staff" | "team"; id: string; name: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      if (deleteTarget.type === "staff") {
        await deleteStaff(deleteTarget.id);
      } else {
        await deleteTeam(deleteTarget.id);
      }
      setDeleteTarget(null);
      onClose();
      onSuccess();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
                  name = [...unassigned, ...teams.flatMap(t => t.members)].find(m => m.staffId === id)?.name ?? "";
                } else {
                  name = teams.find(t => t.teamId === id)?.teamName ?? "";
                }
                setDeleteTarget({ type: type as "staff" | "team", id, name });
              }}
            >
              <option value="" disabled>-- Pilih Staff atau Tim --</option>
              <optgroup label="Tim">
                {teams.map(t => <option key={t.teamId} value={`team:${t.teamId}`}>{t.teamName}</option>)}
              </optgroup>
              <optgroup label="Belum Ada Tim">
                {unassigned.map(s => <option key={s.staffId} value={`staff:${s.staffId}`}>{s.name} ({s.position})</option>)}
              </optgroup>
              {teams.map(t => (
                <optgroup key={t.teamId} label={`Tim: ${t.teamName}`}>
                  {t.members.map(s => <option key={s.staffId} value={`staff:${s.staffId}`}>{s.name} ({s.position})</option>)}
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
          <button type="button" onClick={() => { setDeleteTarget(null); onClose(); }} className="px-5 py-2 text-sm text-black/60 hover:bg-brand-bg rounded-xl transition">Batal</button>
          <button type="button" onClick={handleSubmit} disabled={!deleteTarget || isSubmitting} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-sm transition disabled:opacity-50 cursor-pointer">
            {isSubmitting ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}