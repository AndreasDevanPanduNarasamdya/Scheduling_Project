import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { createTimeline, fetchBlockedRanges } from "../../../../api";
import type { TimelineTeam } from "../../../../types";
import BlockedDatePicker from "./CustomDatePicker";

interface AssignScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: TimelineTeam[];
  initialTargetId?: string;
  onSuccess: () => void;
  setGlobalError: (msg: string | null) => void;
  setGlobalSuccess: (msg: string | null) => void;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function AssignScheduleModal({ 
  isOpen, onClose, teams, initialTargetId = "", onSuccess, setGlobalError, setGlobalSuccess 
}: AssignScheduleModalProps) {
  
  const [formData, setFormData] = useState({ targetId: initialTargetId, daysOn: "", daysOff: "", startDate: "", endDate: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingTarget, setIsCheckingTarget] = useState(false);
  const [blockedRanges, setBlockedRanges] = useState<{ startDate: string; endDate: string }[]>([]);
  const [dateOverlapError, setDateOverlapError] = useState<string | null>(null);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    if (initialTargetId) {
      loadBlockedRanges(initialTargetId);
    }
  }, [initialTargetId]);

  if (!isOpen) return null;

  const loadBlockedRanges = async (targetValue: string) => {
    if (!targetValue) {
      setBlockedRanges([]);
      return;
    }
    setIsCheckingTarget(true);
    try {
      const isTeam = targetValue.startsWith("team:");
      const actualId = targetValue.split(":")[1];
      const ranges = await fetchBlockedRanges(isTeam ? actualId : undefined, isTeam ? undefined : actualId);
      setBlockedRanges(ranges);
    } catch {
      setBlockedRanges([]);
    } finally {
      setIsCheckingTarget(false);
    }
  };

  const sortedRanges = [...blockedRanges].sort(
    (a, b) => parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime()
  );

  const validateDatesAgainstBlockedRanges = (start: string, end: string) => {
    if (!start) { setDateOverlapError(null); return; }
    const s = parseLocalDate(start).getTime();

    if (!end) {
      const hit = sortedRanges.find(r => {
        const rs = parseLocalDate(r.startDate).getTime();
        const re = parseLocalDate(r.endDate).getTime();
        return s >= rs && s <= re;
      });
      setDateOverlapError(hit ? `Tanggal mulai bertabrakan dengan jadwal yang sudah ada (${hit.startDate} s/d ${hit.endDate}).` : null);
      return;
    }

    const e = parseLocalDate(end).getTime();
    const hit = sortedRanges.find(r => {
      const rs = parseLocalDate(r.startDate).getTime();
      const re = parseLocalDate(r.endDate).getTime();
      return s <= re && rs <= e;
    });
    setDateOverlapError(hit ? `Tanggal ini bertabrakan dengan jadwal yang sudah ada (${hit.startDate} s/d ${hit.endDate}).` : null);
  };

  const handleSaveSchedule = async () => {
    if (!formData.targetId || !formData.daysOn || !formData.daysOff || !formData.startDate || !formData.endDate) {
      setGlobalError("Harap isi semua kolom wajib! Tanggal berakhir sekarang wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isTeam = formData.targetId.startsWith("team:");
      const actualId = formData.targetId.split(":")[1];

      await createTimeline({
        teamId: isTeam ? actualId : null,
        staffId: !isTeam ? actualId : null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        daysOn: parseInt(formData.daysOn, 10),
        daysOff: parseInt(formData.daysOff, 10),
      });

      setGlobalSuccess("Versi jadwal baru berhasil disimpan dan diberlakukan!");
      setFormData({ targetId: "", daysOn: "", daysOff: "", startDate: "", endDate: "" });
      onSuccess();
      onClose();
    } catch (error: any) {
      setGlobalError(error.message || "Terjadi kesalahan saat menyimpan jadwal.");
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-150">
      <div className="card w-[500px] p-6 text-left shadow-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-brand-outline/40 pb-3">
          <div>
            <h2 className="text-xl font-bold text-brand-dark">Tambah Jadwal baru</h2>
          </div>
          <button onClick={onClose} className="text-black/40 hover:text-black cursor-pointer">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          <label className="form-label">Pilih Target (Staf / Tim)</label>
          <select 
            className="input-field cursor-pointer" 
            value={formData.targetId} 
            onChange={(e) => {
              setFormData({ ...formData, targetId: e.target.value, startDate: "", endDate: "" });
              loadBlockedRanges(e.target.value);
            }}
          >
            <option value="">-- Pilih Tim atau Staf --</option>
            {teams.map((team) => (
              <optgroup key={team.teamId} label={`Tim: ${team.teamName}`}>
                <option value={`team:${team.teamId}`}>Seluruh Tim: {team.teamName}</option>
                {team.members.map((member) => (
                  <option key={member.staffId} value={`staff:${member.staffId}`}>
                    &nbsp;&nbsp;&nbsp;↳ Staf: {member.name} ({member.position})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {dateOverlapError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
              {dateOverlapError}
            </div>
          )}

          <label className="form-label mt-1">Pola Shift (Days On / Days Off)</label>
          <div className="flex gap-2">
            <div className="w-full">
              <input type="number" min="1" placeholder="On (e.g. 5)" className="input-field" value={formData.daysOn} onChange={(e) => setFormData({ ...formData, daysOn: e.target.value })}/>
              <span className="text-[11px] text-black/40 mt-1 block">Hari Kerja Aktif</span>
            </div>
            <div className="w-full">
              <input type="number" min="1" placeholder="Off (e.g. 2)" className="input-field" value={formData.daysOff} onChange={(e) => setFormData({ ...formData, daysOff: e.target.value })}/>
              <span className="text-[11px] text-black/40 mt-1 block">Hari Libur Rotasi</span>
            </div>
          </div>

          <label className="form-label mt-1">Tanggal Mulai Berlaku</label>
          <BlockedDatePicker
            value={formData.startDate}
            blockedRanges={blockedRanges}
            minDate={todayStr}
            onChange={(picked) => {
              const next = { ...formData, startDate: picked, endDate: "" };
              setFormData(next);
              validateDatesAgainstBlockedRanges(next.startDate, next.endDate);
            }}
          />

          <label className="form-label mt-1">Tanggal Berakhir</label>
          <BlockedDatePicker
            value={formData.endDate}
            blockedRanges={blockedRanges}
            minDate={formData.startDate && formData.startDate > todayStr ? formData.startDate : todayStr}
            onChange={(picked) => {
              const next = { ...formData, endDate: picked };
              setFormData(next);
              validateDatesAgainstBlockedRanges(next.startDate, next.endDate);
            }}
          />
          <span className="text-[11px] text-black/40 block">Setiap jadwal wajib memiliki tanggal berakhir.</span>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-brand-outline/40 pt-4">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-black/60 hover:bg-brand-bg rounded-xl text-sm font-medium transition cursor-pointer" 
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            onClick={handleSaveSchedule}
            className="btn-primary text-sm cursor-pointer"
            disabled={isSubmitting || isCheckingTarget || !!dateOverlapError}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Versi Jadwal"}
          </button>
        </div>
      </div>
    </div>
  );
}