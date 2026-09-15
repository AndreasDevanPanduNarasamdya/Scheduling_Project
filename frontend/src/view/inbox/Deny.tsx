import { useState } from "react";
import { XCircle, X, ArrowLeft, Loader2 } from "lucide-react";
import { rejectTicket } from "../../api";
import type { Ticket } from "../../types";
import { useAlert } from '../../view/messagebox/AlertProvider';

interface DenyProps {
  ticket: Ticket;
  onBack: () => void;
  onSuccess: () => void;
}

export default function Deny({ ticket, onBack, onSuccess }: DenyProps) {
  const { showAlert } = useAlert();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    showAlert({
      type: 'confirm',
      title: 'Konfirmasi Penolakan',
      message: 'Apakah Anda yakin ingin menolak pengajuan tiket ini?',
      onConfirm: async () => {
        
        setIsSubmitting(true);
        try {
          await rejectTicket(ticket.ticketID, reason);

          onSuccess();
          showAlert({ 
            type: 'success', 
            title: 'Berhasil', 
            message: 'Tiket berhasil ditolak!'
          });
        } catch (error: any) {
          showAlert({ 
            type: 'error', 
            title: 'Gagal Menolak', 
            message: error.message || 'Terjadi kesalahan saat menghubungi server.' 
          });
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-brand-bg z-50 flex flex-col p-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center mb-12">
        <button onClick={onBack} className="text-black/60 hover:text-black/90 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <button onClick={onSuccess} className="text-black/60 hover:text-black/90 transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <form 
          onSubmit={handleSubmit}
          className="card w-full max-w-lg p-8 flex flex-col gap-6"
        >
          <div>
            <label className="form-label">
              Alasan Penolakan
            </label>
            <textarea 
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masukkan alasan..."
              className="input-field resize-none"
              required
            />
          </div>

          <div className="flex justify-center pt-2">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold shadow-md transition-colors text-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Tolak <XCircle size={18} strokeWidth={2.5} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}