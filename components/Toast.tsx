import React, { useState, createContext, useContext, useCallback, ReactNode, useEffect } from 'react';
import { XIcon } from './icons';
import { playSound } from '../services/soundService';

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, 5000); // Auto-dismiss after 5 seconds

        return () => {
            clearTimeout(timer);
        };
    }, [toast.id, onRemove]);

    const bgColor = toast.type === 'success' ? 'bg-green-600/90 border-green-500' : 'bg-red-600/90 border-red-500';
    
    return (
        <div className={`toast-enter-exit flex items-center justify-between w-full max-w-sm p-4 text-white rounded-lg shadow-lg ${bgColor} border backdrop-blur-sm`}>
            <span>{toast.message}</span>
            <button onClick={() => onRemove(toast.id)} className="ml-4 p-1 rounded-full hover:bg-white/20">
                <XIcon className="w-4 h-4" />
            </button>
        </div>
    );
};


export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const recentToasts = React.useRef<Set<string>>(new Set());

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    // Deduplicate: ignore if the exact same message is already queued
    if (recentToasts.current.has(message)) {
        return;
    }
    recentToasts.current.add(message);

    if (type === 'success') {
      playSound('success');
    }
    const newToast: ToastMessage = {
      id: Date.now() + Math.random(),
      message,
      type,
    };
    setToasts(currentToasts => [newToast, ...currentToasts].slice(0, 3)); // Show max 3 toasts

    // Remove from the recent set after the toast auto-dismisses
    setTimeout(() => {
        recentToasts.current.delete(message);
    }, 5000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-24 right-6 sm:right-8 z-[90] space-y-3">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};