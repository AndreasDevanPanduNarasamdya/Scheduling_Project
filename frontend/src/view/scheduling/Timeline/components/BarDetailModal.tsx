import { X, Calendar as CalendarIcon, Clock, Info } from "lucide-react";
import type { BarType } from "../../../../types"; // adjust this path to your types file

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function formatDateDisplay(dateStr?: string) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  
  const year = parts[0];
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  return `${day} ${MONTH_NAMES[month]} ${year}`;
}

export interface BarDetail {
  barType: BarType;
  label?: string;
  staffName: string;
  teamName: string;
  startDate: string;
  endDate: string;
  scheduleType?: string;
  schedulePattern?: string;
  scheduleStart?: string;
  scheduleEnd?: string;
}

interface BarDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: BarDetail | null;
}

export default function BarDetailModal({ isOpen, onClose, detail }: BarDetailModalProps) {
  if (!isOpen || !detail) return null;

  const isLeave = detail.barType === "Leave";
  const isTransition = detail.barType === "Transition";

  const cardBorder = isLeave ? "border-red-400 bg-red-50/50" :
                     isTransition ? "border-yellow-400 bg-yellow-50/40" :
                     "border-brand-primary bg-brand-bg/60 shadow-sm";

  const badgeClass = isLeave ? "bg-red-500 text-white" :
                     isTransition ? "bg-yellow-400 text-yellow-950" :
                     "bg-brand-primary text-white";

  const title = isLeave ? "LEAVE (IZIN / TIKET)" :
                  isTransition ? "TRANSISI" :
                  "OFF DUTY";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-150">
      <div className="card w-[420px] p-0 text-left shadow-2xl overflow-hidden bg-white">
        
        <div className="p-4 border-b border-brand-outline/40 flex items-center justify-between bg-brand-bg">
          <h3 className="text-lg font-bold text-brand-dark">Detail Segmen Jadwal</h3>
          <button onClick={onClose} className="text-black/40 hover:text-black transition cursor-pointer">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-5">
          {/* TARGET INFO */}
          <div>
            <div className="text-base font-bold text-black/90">{detail.staffName}</div>
            <div className="text-xs font-medium text-black/50">Tim: {detail.teamName}</div>
          </div>

          {/* PARENT SCHEDULE (JADWAL INDUK) */}
          {detail.scheduleType && !isLeave && (
            <div className="p-3.5 bg-brand-bg/50 border border-brand-outline/50 rounded-xl flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-brand-dark">{detail.schedulePattern}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                 <span className={`text-[10px] font-bold px-2 py-1 rounded-md shadow-sm border bg-white border-brand-outline/60 text-brand-dark`}>
                    {detail.scheduleType}
                 </span>
                 <span className="text-[13px] font-medium text-black/60">
                    {formatDateDisplay(detail.scheduleStart)} - {formatDateDisplay(detail.scheduleEnd)}
                  </span>
              </div>
            </div>
          )}

          {/* SPECIFIC BAR SEGMENT */}
          <div className={`p-4 rounded-xl border ${cardBorder}`}>
            <div className="flex items-center gap-2 mb-3 border-b border-black/5 pb-3">
              <span className={`badge text-[10px] py-1 px-2.5 font-bold uppercase tracking-wider ${badgeClass}`}>
                {title}
              </span>
            </div>

            <div className="flex flex-col gap-2.5 pl-0.5">
              <div className="flex items-center gap-2.5 text-xs text-black/80">
                <CalendarIcon size={15} className="text-black/40" />
                <span>Mulai: <strong className="text-black/90 font-semibold">{formatDateDisplay(detail.startDate)}</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-black/80">
                <Clock size={15} className="text-black/40" />
                <span>Selesai: <strong className="text-black/90 font-semibold">{formatDateDisplay(detail.endDate)}</strong></span>
              </div>
            </div>

            {/* LABEL / NOTES */}
            {detail.label && (
              <div className="mt-4 pt-3 border-t border-black/10 pl-0.5">
                 <div className="flex items-start gap-2.5">
                    <Info size={16} className={`mt-0.5 ${isLeave ? 'text-red-400' : 'text-black/40'}`} />
                    <div>
                       <span className="block text-[10px] font-bold text-black/50 uppercase tracking-wider mb-1">Catatan / Keterangan:</span>
                       <span className="text-sm font-medium text-black/90">{detail.label}</span>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}