import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type ToastType = 'success' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextState {
  toasts: Toast[];
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextState | undefined>(undefined);

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastContextProvider');
  }
  return context;
};

export const ToastContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const newToast: Toast = { id: uuidv4(), message, type };
    setToasts(prevToasts => [...prevToasts, newToast]);
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== newToast.id));
    }, 4000);
  }, []);

  const value = { toasts, showToast };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};
