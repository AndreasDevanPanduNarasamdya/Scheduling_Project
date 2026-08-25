import { useState } from "react";
import { X, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Clearance } from "../../../../types";
import { updateTimeline, deleteTimelineSchedule } from "../../../../api";

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

  // Helper functions for updating/deleting records go here to keep this panel self-contained
  // They call onReloadRequested() when successful to tell the main page to refresh data.

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

                  const canEditThis = !isTicket && userClearance === Clearance.Admin;

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
                      }}
                      className={`p-3 rounded-xl border transition ${cardBorder} ${canEditThis ? "cursor-pointer hover:shadow-md" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`badge text-[10px] py-0.5 px-2 ${badgeClass}`}>
                            {isActive ? "AKTIF" : "MENDATANG"}
                          </span>
                          {rec._source && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm border ${isTicket ? 'text-red-700 bg-white border-red-200' : 'text-brand-dark bg-white border-brand-outline/60'}`}>
                              {rec._source}
                            </span>
                          )}
                        </div>

                        {isTicket ? (
                          <span className={`text-xs font-bold uppercase tracking-wide ${isLeave ? 'text-red-600' : 'text-emerald-600'}`}>
                            {isLeave ? "LEAVE (OFF)" : "TICKET (OFF)"}
                          </span>
                        ) : !isEditingFields || !isSelected ? (
                          <span className="text-xs font-semibold text-black/80">{rec.daysOn} ON / {rec.daysOff} OFF</span>
                        ) : null}
                      </div>

                      {/* View mode */}
                      {(!isSelected || !isEditingFields) && (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-black/70 mt-2">
                            <CalendarIcon size={14} className="text-black/40" />
                            <span>Mulai: <strong className="text-black/90">{rec.startDate}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-black/70 mt-1">
                            <Clock size={14} className="text-black/40" />
                            <span>Selesai: <strong className="text-black/90">{rec.endDate || "Sekarang (Tanpa Batas)"}</strong></span>
                          </div>

                          {isTicket && rec.reason && (
                            <div className="mt-2.5 p-2 bg-white border border-red-100 rounded-lg text-xs text-red-900 font-medium shadow-sm">
                              <strong className="block text-red-400 mb-0.5 text-[10px] uppercase tracking-wider">Catatan Tiket:</strong>
                              {rec.reason}
                            </div>
                          )}
                        </>
                      )}

                      {/* Edit mode form */}
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
                          
                          <input
                            type="date" 
                            className="input-field text-sm py-1.5 cursor-pointer text-black/80"
                            value={editForm.startDate}
                            onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch (err) {} }}
                            onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                          />
                          <input
                            type="date" 
                            className="input-field text-sm py-1.5 cursor-pointer text-black/80"
                            value={editForm.endDate}
                            min={editForm.startDate}
                            onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch (err) {} }}
                            onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                          />
                        </div>
                      )}

                      {/* Action row */}
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
                                    onReloadRequested(); // Refreshes the data
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
                                className="px-3 py-1.5 text-xs font-medium text-black/50 hover:bg-black/5 rounded-lg transition cursor-pointer"
                              >
                                Batal
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                disabled={isSavingEdit}
                                onClick={async () => {
                                  setIsSavingEdit(true);
                                  try {
                                    await updateTimeline(rec.timelineId, {
                                      daysOn: parseInt(editForm.daysOn, 10),
                                      daysOff: parseInt(editForm.daysOff, 10),
                                      startDate: editForm.startDate,
                                      endDate: editForm.endDate || null,
                                    });
                                    setGlobalSuccess("Jadwal berhasil diperbarui.");
                                    setEditingRecordId(null);
                                    setIsEditingFields(false);
                                    onReloadRequested(); // Refreshes the data
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
                                className="px-3 py-1.5 text-xs font-medium text-black/50 hover:bg-black/5 rounded-lg transition cursor-pointer"
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

        {/* NEW: LOCKED TO ADMINS ONLY */}
        {userClearance === Clearance.Admin && (
          <div className="p-4 border-t border-brand-outline bg-brand-bg/30 shrink-0">
            {(() => {
              // 🔥 Check if the target already has a blocking active schedule
              const disableNewSchedule = historyRecords.some(rec => 
                rec.status === "Active" && 
                (selectedInspection?.type === "team" || rec._source === "Personal")
              );

              return (
                <button 
                  disabled={disableNewSchedule}
                  onClick={onOpenAssignModal} 
                  className={`btn-primary w-full justify-center py-2 text-sm transition-all ${
                    disableNewSchedule ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer"
                  }`}
                >
                  {disableNewSchedule ? "Jadwal Aktif Sudah Ada" : "+ Perbarui / Atur Rotasi Baru"}
                </button>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}