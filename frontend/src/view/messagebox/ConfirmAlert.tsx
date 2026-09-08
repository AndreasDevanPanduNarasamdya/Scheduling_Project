interface ConfirmAlertProps {
  title: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isVisible: boolean;
}

export default function ConfirmAlert({ title, message, onConfirm, onCancel, isVisible }: ConfirmAlertProps) {
  return (
    <div className={`fixed inset-0 z-[100] flex items-start justify-center bg-black/20 p-4 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      <div className={`card p-8 w-full max-w-sm flex flex-col items-center text-center mt-6 transition-all duration-300 transform ${isVisible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-12 opacity-0 scale-95"}`}>
        
        <div className="mb-5 w-14 h-14 bg-[#fbc02d] rounded-full flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-3xl pb-1">!</span>
        </div>

        <h2 className="text-xl font-medium text-black mb-2">{title}</h2>
        {message && <p className="text-sm text-black/60 mb-6">{message}</p>}

        <div className="flex gap-4 mt-2 w-full justify-center">
          <button 
            onClick={onCancel}
            className="px-6 py-2.5 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#475569] font-medium rounded-xl transition-colors cursor-pointer shadow-sm border border-[#cbd5e1]"
          >
            Tidak
          </button>
          <button 
            onClick={onConfirm}
            className="btn-primary px-8"
          >
            Ya
          </button>
        </div>
        
      </div>
    </div>
  );
}