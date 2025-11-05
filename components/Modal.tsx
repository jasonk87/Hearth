// FIX: Implemented the missing Modal component to resolve the module import error.
import React from 'react';
import { XIcon } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-50/95 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl animate-slide-up-fast flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-200/80 flex-shrink-0">
          <h3 className="text-xl font-bold text-teal-600">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
            <XIcon className="w-6 h-6 text-slate-500" />
          </button>
        </header>

        <main className="p-6 flex-grow overflow-y-auto">
          {children}
        </main>
      </div>
      <style>{`
        @keyframes slide-up-fast {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up-fast {
          animation: slide-up-fast 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};