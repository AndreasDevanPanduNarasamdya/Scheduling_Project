import { useState } from "react";
import Accept from "./Accept";
import Deny from "./Deny";
import { X, Check, XCircle } from "lucide-react";
import type { Ticket } from "../../types";
import { Clearance } from "../../types";
import { getUserClearance } from "../../api"; 

interface TicketDetailPanelProps {
  ticket: Ticket | null;
  onClose: () => void;
  className? : string;
  onActionComplete: () => void;
}

export default function InboxSelected({ ticket, onClose, onActionComplete, className = ""}: TicketDetailPanelProps) {
  const [view, setView] = useState<'detail' | 'accept' | 'deny'>('detail');
  const userClearance = getUserClearance();
  const typeStyles = ticket?.type === 'On'
    ? { bg: "bg-brand-primary text-white", label: "ON" }
    : { bg: "bg-gray-200 text-gray-600", label: "OFF" };

  const handleClose = () => {
    setView('detail');
    onClose();
  };

  return (
    <>
      <div 
        onClick={handleClose} 
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${
          ticket ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`} 
      />

      <div className={`fixed top-0 right-0 h-full w-[460px] bg-brand-bg shadow-2xl z-50 p-6 flex flex-col transition-transform duration-300 ease-in-out transform ${
        ticket ? "translate-x-0" : "translate-x-full"
      } ${className}`}>
        
        {ticket && (
          <div className="card h-full flex flex-col overflow-hidden relative">
            {view === 'detail' && (
              <>
                <div className="p-5 px-6 flex justify-between items-center">
                  <span className={`badge ${typeStyles.bg}`}>
                    {typeStyles.label}
                  </span>
                  <button onClick={handleClose} className="text-black/40 hover:text-black/80 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="px-6 pb-2 flex-1 overflow-y-auto flex flex-col gap-4 scrollbar-thin">
                  <div>
                    <label className="form-label">Nama Lengkap</label>
                    <div className="flex gap-3">
                      <input type="text" value={ticket.firstName} readOnly className="input-locked" />
                      <input type="text" value={ticket.lastName} readOnly className="input-locked" />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Posisi</label>
                    <input type="text" value={ticket.role} readOnly className="input-locked" />
                  </div>
                  <div>
                    <label className="form-label">Tim Shift</label>
                    <input type="text" value={ticket.team} readOnly className="input-locked" />
                  </div>
                  <div>
                    <label className="form-label">Tanggal</label>
                    <input type="text" value={ticket.dateRange} readOnly className="input-locked" />
                  </div>
                  <div>
                    <label className="form-label">Judul</label>
                    <input type="text" value={ticket.title} readOnly className="input-locked" />
                  </div>
                  <div>
                    <label className="form-label">Alasan Pengajuan</label>
                    <textarea rows={2} value={ticket.description} readOnly className="input-locked resize-none" />
                  </div>
                  {ticket.status !== "Pending" && ticket.reason && (
                    <div>
                      <label className="form-label">
                        Catatan
                      </label>
                      <textarea rows={2} value={ticket.reason} readOnly className="input-locked resize-none" />
                    </div>
                  )}
                </div>
                
                {userClearance === Clearance.Admin && ticket.status === 'Pending' && (
                  <div className="p-6 pt-4 flex justify-center gap-4 bg-white">
                    <button 
                      onClick={() => setView('accept')}
                      className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-dark text-white px-6 py-2.5 rounded-[12px] font-bold shadow-sm transition-colors text-[15px]"
                    >
                      Terima <Check size={18} strokeWidth={2.5} />
                    </button>
                    <button 
                      onClick={() => setView('deny')}
                      className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-600 px-6 py-2.5 rounded-[12px] font-bold shadow-sm transition-colors text-[15px]"
                    >
                      Tolak <XCircle size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Sub-views for Accept/Deny stay cleanly inside the card */}
            {view === 'accept' && (
              <Accept 
                ticket={ticket} 
                onBack={() => setView('detail')} 
                onSuccess={() => {
                  onActionComplete();
                  handleClose();
                }} 
              />
            )}

            {view === 'deny' && (
              <Deny 
                ticket={ticket} 
                onBack={() => setView('detail')} 
                onSuccess={() => {
                  onActionComplete();
                  handleClose();
                }} 
              />
            )}

          </div>
        )}
      </div>
    </>
  );
}