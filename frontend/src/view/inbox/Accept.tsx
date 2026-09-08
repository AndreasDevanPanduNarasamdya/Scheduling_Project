import { useState } from "react";
import { Check, X, ArrowLeft, Loader2 } from "lucide-react";
import { fetchWithToken } from "../../api";
import type { Ticket } from "../../types";
import { useAlert } from '../../view/messagebox/AlertProvider';

interface AcceptProps {
  ticket: Ticket;
  onBack: () => void;
  onSuccess: () => void;
}

export default function Accept({ ticket, onBack, onSuccess }: AcceptProps) {
  const { showAlert } = useAlert();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    showAlert({
      type: 'confirm',
      title: 'Konfirmasi Persetujuan',
      message: 'Apakah Anda yakin ingin menyetujui pengajuan tiket ini?',
      onConfirm: async () => {
        
        setIsSubmitting(true);
        try {
          const response = await fetchWithToken(`http://localhost:5096/api/ticket/${ticket.ticketID}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
          });

          if (response.ok) {
            onSuccess();
            
            showAlert({ 
              type: 'success', 
              title: 'Berhasil', 
              message: 'Tiket berhasil disetujui!'
            });
          } else {
            showAlert({ 
              type: 'error', 
              title: 'Gagal Menyetujui', 
              message: 'Gagal memperbarui status tiket di server.' 
            });
          }
        } catch (error: any) {
          showAlert({ 
            type: 'error', 
            title: 'Kesalahan Jaringan', 
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

      {/* Center Modal Box */}
      <div className="flex-1 flex items-center justify-center">
        <form 
          onSubmit={handleSubmit}
          className="card w-full max-w-lg p-8 flex flex-col gap-6"
        >
          <div>
            <label className="form-label">
              Alasan Diterima
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
              className="flex items-center gap-2 bg-brand-primary hover:bg-brand-dark text-white px-8 py-3 rounded-xl font-semibold shadow-md transition-colors text-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Terima <Check size={18} strokeWidth={2.5} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}