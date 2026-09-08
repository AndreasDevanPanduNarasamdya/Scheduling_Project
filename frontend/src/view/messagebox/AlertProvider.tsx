import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import SuccessAlert from './SuccessAlert';
import ErrorAlert from './ErrorAlert';
import WarningAlert from './WarningAlert';
import ConfirmAlert from './ConfirmAlert';

export type AlertType = 'success' | 'error' | 'warning' | 'confirm';

export interface AlertOptions {
  type: AlertType;
  title: string;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertOptions | null>(null);
  const [isVisible, setIsVisible] = useState(false); // Controls the smooth CSS transition

  const closeAlert = () => {
    setIsVisible(false); // 1. Trigger the slide-up animation
    setTimeout(() => {
      setAlert(null); // 2. Delete from DOM after animation finishes
    }, 300); // 300ms matches our Tailwind transition duration
  };

  // Auto-close success, error, and warning modals after 3 seconds
  useEffect(() => {
    if (alert && alert.type !== 'confirm' && isVisible) {
      const timer = setTimeout(() => closeAlert(), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert, isVisible]);

  const showAlert = (options: AlertOptions) => {
    setAlert(options); // Render it in the DOM (hidden)
    setTimeout(() => setIsVisible(true), 10); // Wait 10ms, then trigger the slide down!
  };

  const handleConfirm = () => {
    if (alert?.onConfirm) alert.onConfirm();
    closeAlert();
  };

  const handleCancel = () => {
    if (alert?.onCancel) alert.onCancel();
    closeAlert();
  };

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert }}>
      {children}
      
      {alert?.type === 'success' && <SuccessAlert title={alert.title} message={alert.message} isVisible={isVisible} />}
      {alert?.type === 'error' && <ErrorAlert title={alert.title} message={alert.message} isVisible={isVisible} />}
      {alert?.type === 'warning' && <WarningAlert title={alert.title} message={alert.message} isVisible={isVisible} />}
      
      {alert?.type === 'confirm' && (
        <ConfirmAlert 
          title={alert.title} 
          message={alert.message} 
          onConfirm={handleConfirm} 
          onCancel={handleCancel}
          isVisible={isVisible}
        />
      )}
      
    </AlertContext.Provider>
  );
}

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert must be used within an AlertProvider");
  return context;
};