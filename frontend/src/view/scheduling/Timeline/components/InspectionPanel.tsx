import { useState } from "react";
import { X, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Clearance } from "../../../../types";
import { updateTimeline, deleteTimelineSchedule, fetchBlockedRanges } from "../../../../api";
import BlockedDatePicker from "./CustomDatePicker";

interface InspectionPanelProps {
  selectedInspection: { id: string; name: string; type: "team" | "staff"; subtitle?: string; } | null;
  historyRecords: any[];
  isLoadingHistory: boolean;
  userClearance: Clearance;
  onClose: () => void;
  onReloadRequested: () => void;
  onOpenAssignModal: () => void;
  setGlobalError: (msg: string) => void;
  setGlobalSuccess: (msg: string) => void;
}

export default function InspectionPanel({
  selectedInspection, historyRecords, isLoadingHistory, userClearance, 
  onClose, onReloadRequested, onOpenAssignModal, setGlobalError, setGlobalSuccess
}: InspectionPanelProps) {
  
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [editForm, setEditForm] = useState({ daysOn: "", daysOff: "", startDate: "", endDate: "" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editBlockedRanges, setEditBlockedRanges] = useState<{ startDate: string; endDate: string }[]>([]);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  function formatDateDisplay(dateStr: string) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    
    const year = parts[0];
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    return `${day} ${MONTH_NAMES[month]} ${year}`;
  }

  return (
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
          <button onClick={onClose} className="p-1.5 text-black/40 hover:text-black rounded-full hover:bg-black/5 transition cursor-pointer">
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
                  const isLeave = rec.barType === "Leave";
                  const recordKey = `${rec.timelineId}-${index}`;
                  const isSelected = editingRecordId === recordKey;
                  const canEditThis = !isTicket && userClearance === Clearance.Admin;

                  // 1. CLEAN & SIMPLE COLOR LOGIC
                  let cardBorder = "";
                  let badgeClass = "";
                  let sourceClass = "";

                  if (isTicket) {
                    cardBorder = "border-red-400 bg-red-50/50";
                    badgeClass = "bg-red-500 text-white";
                    sourceClass = "text-red-700 bg-white border-red-200";
                  } else if (!isActive) {
                    cardBorder = "border-yellow-400 bg-yellow-50/40";
                    badgeClass = "bg-yellow-400 text-yellow-950";
                    sourceClass = "text-yellow-800 bg-white border-yellow-300";
                  } else {
                    cardBorder = "border-brand-primary bg-brand-bg/60 shadow-sm";
                    badgeClass = "bg-brand-primary text-white";
                    sourceClass = "text-brand-dark bg-white border-brand-outline/60";
                  }

                  return (
                    <div
                      key={recordKey}
                      onClick={() => {
                        if (!canEditThis) return;
                        setEditingRecordId(isSelected ? null : recordKey);
                        setIsEditingFields(false);
                        setEditForm({
                          daysOn: String(rec.daysOn ?? ""),
                          daysOff: String(rec.daysOff ?? ""),
                          startDate: rec.startDate ?? "",
                          endDate: rec.endDate ?? "",
                        });

                        if (!isSelected) {
                          const isTeamPanel = selectedInspection?.type === "team";
                          const fetchTeamId = isTeamPanel ? selectedInspection!.id : rec._teamId;
                          const fetchStaffId = isTeamPanel ? undefined : rec._staffId;

                          fetchBlockedRanges(fetchTeamId, fetchStaffId)
                          .then(ranges => {
                            const filteredRanges = ranges.filter(r => r.startDate !== rec.startDate);
                            setEditBlockedRanges(filteredRanges);
                          }).catch(() => setEditBlockedRanges([]));
                        }
                      }}
                      className={`p-3 rounded-xl border transition ${cardBorder} ${canEditThis ? "cursor-pointer hover:shadow-md" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`badge text-[10px] py-0.5 px-2 font-bold tracking-wider ${badgeClass}`}>
                            {isActive ? "AKTIF" : "MENDATANG"}
                          </span>
                          {rec._source && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm border ${sourceClass}`}>
                              {rec._source}
                            </span>
                          )}
                        </div>

                        {isTicket ? (
                          <span className={`text-xs font-bold uppercase tracking-wide ${isLeave ? 'text-red-600' : 'text-red-500'}`}>
                            {isLeave ? "LEAVE (OFF)" : "TICKET (OFF)"}
                          </span>
                        ) : !isEditingFields || !isSelected ? (
                          <span className="text-xs font-bold text-black/90">{rec.daysOn} ON / {rec.daysOff} OFF</span>
                        ) : null}
                      </div>

                      {/* 2. DATE FORMATTER APPLIED HERE */}
                      {(!isSelected || !isEditingFields) && (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-black/80 mt-2">
                            <CalendarIcon size={14} className="text-black/40" />
                            <span>Mulai: <strong className="text-black/90 font-semibold">{formatDateDisplay(rec.startDate)}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-black/80 mt-1">
                            <Clock size={14} className="text-black/40" />
                            <span>Selesai: <strong className="text-black/90 font-semibold">{formatDateDisplay(rec.endDate)}</strong></span>
                          </div>

                          {isTicket && rec.reason && (
                            <div className="mt-2.5 p-2 bg-white border border-red-100 rounded-lg text-xs text-red-900 font-medium shadow-sm">
                              <strong className="block text-red-500 mb-0.5 text-[10px] uppercase tracking-wider font-bold">Catatan Tiket:</strong>
                              {rec.reason}
                            </div>
                          )}
                        </>
                      )}

                      {/* 3. EDIT FORM & ACTIONS (Original Logic) */}
                      {canEditThis && isSelected && isEditingFields && (
                        <div className="flex flex-col gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            <input
                              type="number" min="1" className="input-field text-sm py-1.5"
                              value={editForm.daysOn}
                              onChange={(e) => setEditForm({ ...editForm, daysOn: e.target.value })}
                              placeholder="Days On"
                            />
                            <input
                              type="number" min="1" className="input-field text-sm py-1.5"
                              value={editForm.daysOff}
                              onChange={(e) => setEditForm({ ...editForm, daysOff: e.target.value })}
                              placeholder="Days Off"
                            />
                          </div>
                          <BlockedDatePicker
                            value={editForm.startDate}
                            blockedRanges={editBlockedRanges}
                            minDate={todayStr}
                            onChange={(picked) => setEditForm({ ...editForm, startDate: picked, endDate: "" })}
                          />
                          <BlockedDatePicker
                            value={editForm.endDate}
                            blockedRanges={editBlockedRanges}
                            minDate={editForm.startDate && editForm.startDate > todayStr ? editForm.startDate : todayStr}
                            onChange={(picked) => setEditForm({ ...editForm, endDate: picked })}
                          />
                        </div>
                      )}

                      {canEditThis && isSelected && (
                        <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                          {!isEditingFields ? (
                            <>
                              <button
                                onClick={() => setIsEditingFields(true)}
                                className="flex-1 py-1.5 text-xs font-bold rounded-lg border border-brand-primary text-brand-primary hover:bg-brand-bg transition cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={async () => {
                                  if (!window.confirm("Hapus jadwal ini secara permanen?")) return;
                                  try {
                                    await deleteTimelineSchedule(rec.timelineId);
                                    setGlobalSuccess("Jadwal berhasil dihapus.");
                                    setEditingRecordId(null);
                                    onReloadRequested();
                                  } catch (err: any) {
                                    setGlobalError(err.message || "Gagal menghapus jadwal.");
                                  }
                                }}
                                className="flex-1 py-1.5 text-xs font-bold rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition cursor-pointer"
                              >
                                Hapus
                              </button>
                              <button
                                onClick={() => setEditingRecordId(null)}
                                className="px-3 py-1.5 text-xs font-medium text-black/60 hover:bg-black/5 hover:text-black rounded-lg transition cursor-pointer"
                              >
                                Batal
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                disabled={isSavingEdit}
                                onClick={async () => {
                                  if (!editForm.daysOn || !editForm.daysOff || !editForm.startDate || !editForm.endDate) {
                                    setGlobalError("Semua kolom wajib diisi, termasuk tanggal berakhir.");
                                    return;
                                  }
                                  setIsSavingEdit(true);
                                  try {
                                    await updateTimeline(rec.timelineId, {
                                      daysOn: parseInt(editForm.daysOn, 10),
                                      daysOff: parseInt(editForm.daysOff, 10),
                                      startDate: editForm.startDate,
                                      endDate: editForm.endDate,
                                    });
                                    setGlobalSuccess("Jadwal berhasil diperbarui.");
                                    setEditingRecordId(null);
                                    setIsEditingFields(false);
                                    onReloadRequested();
                                  } catch (err: any) {
                                    setGlobalError(err.message || "Gagal memperbarui jadwal.");
                                  } finally {
                                    setIsSavingEdit(false);
                                  }
                                }}
                                className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-dark transition cursor-pointer disabled:opacity-50"
                              >
                                {isSavingEdit ? "Menyimpan..." : "Simpan"}
                              </button>
                              <button
                                onClick={() => setIsEditingFields(false)}
                                className="px-3 py-1.5 text-xs font-medium text-black/60 hover:bg-black/5 hover:text-black rounded-lg transition cursor-pointer"
                              >
                                Batal
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
        </div>

        {userClearance === Clearance.Admin && (
          <div className="p-4 border-t border-brand-outline bg-brand-bg/30 shrink-0">
            <button 
              onClick={onOpenAssignModal} 
              className="btn-primary w-full justify-center py-2 text-sm cursor-pointer"
            >
              + Tambah Jadwal Baru
            </button>
          </div>
        )}
      </div>
    </div>
  );
}