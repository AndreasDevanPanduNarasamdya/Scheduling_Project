import { useState } from "react";
import Accept from "./Accept";
import Deny from "./Deny";
import { X, Check, XCircle } from "lucide-react";
import type { Ticket } from "../../types";

interface TicketDetailPanelProps {
  ticket: Ticket | null;
  onClose: () => void;
  className? : string;
  onActionComplete: () => void;
}

export default function InboxSelected({ ticket, onClose, onActionComplete, className = ""}: TicketDetailPanelProps) {
  const lockedInputStyles = "w-full bg-[#e8eff7] border border-[#cbd6e6] rounded-md px-3 py-2 text-gray-700 outline-none text-[14px] select-none";
  const labelStyles = "block text-[13px] font-medium text-gray-700 mb-1 text-left";
  const [view, setView] = useState<'detail' | 'accept' | 'deny'>('detail');
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

const typeStyles =
    ticket?.type === 'On'
      ? { bg: "bg-blue-100 text-blue-700", label: "ON SHIFT" }
      : { bg: "bg-violet-100 text-violet-700", label: "OFF SHIFT" };

    const handleClose = () => {
    setView('detail');
    setReason("");
    onClose();
  };

  return (
    <>
      <div 
        onClick={onClose} 
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${
          ticket ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`} 
      />

        <div className={`fixed top-0 right-0 h-full w-[420px] bg-white rounded-l-3xl shadow-2xl border-l border-gray-200 z-50 flex flex-col transition-transform duration-300 ease-in-out transform ${
        ticket ? "translate-x-0" : "translate-x-full"
      } ${className}`}>
        
        {ticket && (
          <>
            {view === 'detail' && (
              <>
                {/* PASTE YOUR ENTIRE CODE BLOCK HERE */}
              </>
            )}

            {view === 'accept' && (
              <Accept 
                ticket={ticket} 
                onBack={() => setView('detail')} 
                onSuccess={() => {
                  onActionComplete();
                  onClose();
                }} 
              />
            )}

            {view === 'deny' && (
              <Deny 
                ticket={ticket} 
                onBack={() => setView('detail')} 
                onSuccess={() => {
                  onActionComplete();
                  onClose();
                }} 
              />
            )}
            <div className="p-4 px-6 flex justify-between items-center border-b border-gray-100">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeStyles.bg}`}>
                {typeStyles.label}
              </span>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
                <X size={22} />
              </button>
            </div>

            {/* Body fields */}
            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
              <div>
                <label className={labelStyles}>Nama Lengkap</label>
                <div className="flex gap-3">
                  <input type="text" value={ticket.firstName} readOnly className={lockedInputStyles} />
                  <input type="text" value={ticket.lastName} readOnly className={lockedInputStyles} />
                </div>
              </div>
              <div>
                <label className={labelStyles}>Posisi</label>
                <input type="text" value={ticket.role} readOnly className={lockedInputStyles} />
              </div>
              <div>
                <label className={labelStyles}>Tim Shift</label>
                <input type="text" value={ticket.team} readOnly className={lockedInputStyles} />
              </div>
              <div>
                <label className={labelStyles}>Tanggal</label>
                <input type="text" value={ticket.dateRange} readOnly className={lockedInputStyles} />
              </div>
              <div>
                <label className={labelStyles}>Judul</label>
                <input type="text" value={ticket.title} readOnly className={lockedInputStyles} />
              </div>
              <div>
                <label className={labelStyles}>Alasan Pengajuan</label>
                <textarea rows={2} value={ticket.description} readOnly className={`${lockedInputStyles} resize-none`} />
              </div>
            </div>

            <div className="p-4 px-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
              <button 
                onClick={() => { setView('accept'); setReason(""); }}
                className="flex items-center gap-1.5 bg-[#4ade80] hover:bg-[#22c55e] text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-colors text-sm"
              >
                Terima <Check size={18} />
              </button>
              <button 
                onClick={() => { setView('deny'); setReason(""); }}
                className="flex items-center gap-1.5 bg-[#ef4444] hover:bg-[#dc2626] text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-colors text-sm"
              >
                Tolak <XCircle size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}