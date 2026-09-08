interface WarningAlertProps {
  title: string;
  message?: string;
  isVisible: boolean;
}

export default function WarningAlert({ title, message, isVisible }: WarningAlertProps) {
  return (
    <div className={`fixed inset-0 z-[100] flex items-start justify-center bg-black/20 p-4 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      <div className={`card p-8 w-full max-w-sm flex flex-col items-center text-center mt-6 transition-all duration-300 transform ${isVisible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-12 opacity-0 scale-95"}`}>
        
        <div className="mb-5 w-14 h-14 bg-[#fbc02d] rounded-full flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-3xl pb-1">!</span>
        </div>

        <h2 className="text-xl font-medium text-black mb-2">{title}</h2>
        {message && <p className="text-sm text-black/60 mb-2">{message}</p>}
        
      </div>
    </div>
  );
}