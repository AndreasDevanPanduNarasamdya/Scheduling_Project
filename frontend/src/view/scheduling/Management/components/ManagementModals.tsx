// EditStaffModal.tsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Clearance } from "../../../../types";
import {
  editStaff,
  fetchStaffById,
  getUserClearance,
} from "../../../../api";

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

  const [editStaffForm, setEditStaffForm] = useState({
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

  const safeClearance = parseInt(String(editStaffForm.clearance), 10);
  const finalClearance = isNaN(safeClearance) ? 0 : safeClearance;
  const userClearance = getUserClearance();

  useEffect(() => {
    if (!staffId) {
      setIsEditing(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const realData = await fetchStaffById(staffId);
        setEditStaffForm({
          firstName: realData.firstName || "",
          lastName: realData.lastName || "",
          sex: realData.sex === 1 ? "W" : "P",
          position: realData.position || "",
          email: realData.email || "",
          phone: realData.phone || "",
          dob: realData.dob ? realData.dob.split("T")[0] : "",
          joinDate: realData.joinDate ? realData.joinDate.split("T")[0] : "",
          clearance: realData.clearance ?? 0,
        });
      } catch (err) {
        alert("Gagal mengambil data lengkap staff dari database.");
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [staffId, onClose]);

  if (!staffId) return null;

  // ── Called only when user clicks "Simpan Perubahan" ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        firstName: editStaffForm.firstName,
        lastName: editStaffForm.lastName,
        sex: editStaffForm.sex === "P" ? 0 : 1,
        position: editStaffForm.position,
        phone: editStaffForm.phone,
        dob: editStaffForm.dob,
        joinDate: editStaffForm.joinDate,
        email: editStaffForm.email,
        clearance: finalClearance,
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

  // ── Called only when user clicks "Edit Data" ──
  // Does NOT submit anything — just unlocks the fields.
  const handleEnableEdit = () => {
    setIsEditing(true);
  };

  // ── Cancel editing — re-locks fields without saving ──
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const disabledClass =
    "input-field disabled:bg-brand-bg/60 disabled:text-black/60 disabled:border-transparent disabled:cursor-not-allowed";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="card w-full max-w-md shadow-2xl flex flex-col max-h-[95vh] p-8 transition-all">
        {/* ── Header ── */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-black">
            {isEditing ? "Edit Staff" : "Informasi Staff"}
          </h2>
          <button onClick={onClose} className="text-black/40 hover:text-black">
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        {isLoading ? (
          <div className="py-10 text-center text-black/50">Memuat data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
            <div className="overflow-y-auto py-2 space-y-4 text-left scrollbar-thin pr-1">
              {/* Nama */}
              <div>
                <label className="form-label">Nama Lengkap</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    className={disabledClass}
                    value={editStaffForm.firstName}
                    onChange={(e) =>
                      setEditStaffForm({ ...editStaffForm, firstName: e.target.value })
                    }
                    required
                    disabled={!isEditing}
                  />
                  <input
                    type="text"
                    className={disabledClass}
                    value={editStaffForm.lastName}
                    onChange={(e) =>
                      setEditStaffForm({ ...editStaffForm, lastName: e.target.value })
                    }
                    required
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Jenis Kelamin */}
              <div>
                <label className="form-label">Jenis Kelamin</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStaffForm({ ...editStaffForm, sex: "P" })}
                    className={`btn-toggle disabled:opacity-70 disabled:cursor-not-allowed ${
                      editStaffForm.sex === "P" ? "btn-active" : "btn-inactive"
                    }`}
                    disabled={!isEditing}
                  >
                    P
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStaffForm({ ...editStaffForm, sex: "W" })}
                    className={`btn-toggle disabled:opacity-70 disabled:cursor-not-allowed ${
                      editStaffForm.sex === "W" ? "btn-active" : "btn-inactive"
                    }`}
                    disabled={!isEditing}
                  >
                    W
                  </button>
                </div>
              </div>

              {/* Posisi */}
              <div>
                <label className="form-label">Posisi</label>
                <input
                  type="text"
                  className={disabledClass}
                  value={editStaffForm.position}
                  onChange={(e) =>
                    setEditStaffForm({ ...editStaffForm, position: e.target.value })
                  }
                  required
                  disabled={!isEditing}
                />
              </div>

              {/* Email */}
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className={disabledClass}
                  value={editStaffForm.email}
                  onChange={(e) =>
                    setEditStaffForm({ ...editStaffForm, email: e.target.value })
                  }
                  required
                  disabled={!isEditing}
                />
              </div>

              {/* Telepon */}
              <div>
                <label className="form-label">Nomor Telepon</label>
                <input
                  type="tel"
                  className={disabledClass}
                  value={editStaffForm.phone}
                  onChange={(e) =>
                    setEditStaffForm({ ...editStaffForm, phone: e.target.value })
                  }
                  required
                  disabled={!isEditing}
                />
              </div>

              {/* Tanggal Lahir */}
              <div>
                <label className="form-label">Tanggal Lahir</label>
                <input
                  type="date"
                  className={`${disabledClass} ${isEditing ? "cursor-pointer text-black/80" : ""}`}
                  value={editStaffForm.dob}
                  onChange={(e) =>
                    setEditStaffForm({ ...editStaffForm, dob: e.target.value })
                  }
                  required
                  disabled={!isEditing}
                />
              </div>

              {/* Tanggal Bergabung */}
              <div>
                <label className="form-label">Tanggal Bergabung</label>
                <input
                  type="date"
                  className={`${disabledClass} ${isEditing ? "cursor-pointer text-black/80" : ""}`}
                  value={editStaffForm.joinDate}
                  onChange={(e) =>
                    setEditStaffForm({ ...editStaffForm, joinDate: e.target.value })
                  }
                  required
                  disabled={!isEditing}
                />
              </div>

              {/* Clearance */}
              <div>
                <label className="form-label">Tingkat Akses (Clearance)</label>
                <select
                  className={`${disabledClass} ${isEditing ? "cursor-pointer" : ""}`}
                  value={editStaffForm.clearance}
                  onChange={(e) =>
                    setEditStaffForm({
                      ...editStaffForm,
                      clearance: parseInt(e.target.value),
                    })
                  }
                  disabled={!isEditing}
                >
                  <option value={0}>Staff (Level 0)</option>
                  <option value={1}>Supervisor (Level 1)</option>
                  <option value={2}>Admin (Level 2)</option>
                </select>
              </div>
            </div>

            {/* ── Footer buttons ── */}
            <div className="flex justify-end gap-3 pt-6 border-t border-brand-outline/40 mt-4">
              {!isEditing ? (
                // VIEW mode — Tutup + Edit Data (edit button does NOT submit)
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
                      type="button"          // ← important: NOT type="submit"
                      onClick={handleEnableEdit}
                      className="btn-primary text-sm bg-brand-primary cursor-pointer"
                    >
                      Edit Data
                    </button>
                  )}
                </>
              ) : (
                // EDIT mode — Batal + Simpan Perubahan (only this submits)
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-5 py-2 text-sm font-medium text-black/60 hover:bg-brand-bg rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"           // ← the ONE button that actually submits
                    disabled={isSubmitting}
                    className="btn-primary text-sm bg-brand-primary cursor-pointer"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
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