import { useState } from "react";
import { X } from "lucide-react";
import { createTeam } from "../../../../api";

interface NewTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  setGlobalError: (msg: string | null) => void;
  setGlobalSuccess: (msg: string | null) => void;
}

export default function NewTeamModal({ isOpen, onClose, onSuccess, setGlobalError, setGlobalSuccess }: NewTeamModalProps) {
  const [newTeamName, setNewTeamName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreateTeamSubmit = async () => {
    if (!newTeamName.trim()) { 
      setGlobalError("Nama tim tidak boleh kosong."); 
      return; 
    }
    
    setIsSubmitting(true);
    try {
      await createTeam({ teamName: newTeamName });
      setGlobalSuccess(`Tim "${newTeamName}" berhasil dibuat!`);
      setNewTeamName("");
      onSuccess(); // Triggers loadData() in the parent
      onClose();
    } catch (err: any) { 
      setGlobalError(err.message || "Gagal membuat tim baru."); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-150 backdrop-blur-sm">
      <div className="card w-[400px] p-6 text-left shadow-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-brand-outline/40 pb-2">
          <h3 className="text-lg font-bold text-brand-dark">Buat Tim Lapangan Baru</h3>
          <button onClick={onClose} className="text-black/40 hover:text-black cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <label className="form-label">Nama Tim</label>
          <input 
            type="text" 
            placeholder="Contoh: Tim Delta" 
            className="input-field" 
            value={newTeamName} 
            onChange={(e) => setNewTeamName(e.target.value)} 
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button 
            onClick={onClose} 
            className="px-4 py-1.5 text-black/60 hover:bg-brand-bg rounded-xl text-xs font-bold transition cursor-pointer" 
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button 
            onClick={handleCreateTeamSubmit} 
            className="btn-primary text-xs cursor-pointer" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Menyimpan..." : "Buat Tim"}
          </button>
        </div>
      </div>
    </div>
  );
}