import { useState } from "react";
import { Check, X, ArrowLeft, Loader2 } from "lucide-react";
import { fetchWithToken } from "../../api";
import type { Ticket } from "../../types";

interface AcceptProps {
  ticket: Ticket;
  onBack: () => void;
  onSuccess: () => void;
}

export default function Accept({ ticket, onBack, onSuccess }: AcceptProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetchWithToken(`http://localhost:5096/api/ticket/${ticket.ticketID}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        onSuccess();
      } else {
        console.error("Gagal memperbarui status tiket.");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#f0f4f9] z-50 flex flex-col p-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center mb-12">
        <button onClick={onBack} className="text-gray-700 hover:text-gray-900 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <button onClick={onSuccess} className="text-gray-700 hover:text-gray-900 transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Center Modal Box */}
      <div className="flex-1 flex items-center justify-center">
        <form 
          onSubmit={handleSubmit}
          className="bg-white w-full max-w-lg rounded-[32px] p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col gap-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Alasan Diterima
            </label>
            <textarea 
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masukkan alasan..."
              className="w-full bg-[#e8eff7] border border-[#cbd6e6] rounded-xl px-4 py-3 text-gray-800 outline-none text-sm resize-none focus:ring-2 focus:ring-emerald-400"
              required
            />
          </div>

          <div className="flex justify-center pt-2">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-[#4ade80] hover:bg-[#22c55e] text-white px-8 py-3 rounded-xl font-semibold shadow-md transition-colors text-sm disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Terima <Check size={18} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}