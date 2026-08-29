import { createContext, useContext, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, XCircle, X } from "lucide-react";

type AlertType = "success" | "error" | "confirm";

interface AlertState {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  onConfirm?: () => void;
}

interface AlertContextType {
  showAlert: (type: "success" | "error", title: string, message?: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

    const showAlert = (type: "success" | "error", title: string, message: string = "") => {
    setAlert({ isOpen: true, type, title, message });
    // Auto-close success/error alerts after 4 seconds
    setTimeout(() => setAlert((prev) => ({ ...prev, isOpen: false })), 4000);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setAlert({ isOpen: true, type: "confirm", title, message, onConfirm });
  };

  const closeAlert = () => setAlert((prev) => ({ ...prev, isOpen: false }));

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, closeAlert }}>
      {children}

      {/* THE UNIVERSAL FLOATING CARD */}
      {alert.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pointer-events-none pt-12 sm:pt-16">
          {/* Backdrop for confirm only */}
          {alert.type === "confirm" && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={closeAlert} />
          )}

          <div className="relative pointer-events-auto w-[90%] max-w-[400px] bg-white rounded-2xl shadow-2xl border border-black/5 flex flex-col overflow-hidden animate-in slide-in-from-top-8 fade-in duration-200">
            
            {/* Dynamic Header */}
            <div className={`p-4 flex items-start gap-3 border-b border-black/5 ${
              alert.type === "success" ? "bg-emerald-50/50" :
              alert.type === "error" ? "bg-red-50/50" : "bg-amber-50/50"
            }`}>
              <div className="mt-0.5 shrink-0">
                {alert.type === "success" && <CheckCircle2 size={20} className="text-emerald-500" />}
                {alert.type === "error" && <XCircle size={20} className="text-red-500" />}
                {alert.type === "confirm" && <AlertTriangle size={20} className="text-amber-500" />}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-black/90 leading-tight">{alert.title}</h3>
                {alert.message && <p className="text-xs text-black/60 mt-1">{alert.message}</p>}
              </div>
              
              {/* Close Button */}
              {alert.type !== "confirm" && (
                <button onClick={closeAlert} className="text-black/40 hover:text-black transition">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Confirm Actions */}
            {alert.type === "confirm" && (
              <div className="p-3 bg-gray-50 flex justify-end gap-2">
                <button 
                  onClick={closeAlert}
                  className="px-4 py-1.5 text-xs font-bold text-black/60 hover:bg-black/5 rounded-lg transition"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    if (alert.onConfirm) alert.onConfirm();
                    closeAlert();
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition"
                >
                  Ya, Lanjutkan
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert must be used within an AlertProvider");
  return context;
};