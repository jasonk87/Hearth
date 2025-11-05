import React from 'react';
import { XIcon } from './icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[101] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up-fast flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700/50">
          <h3 className="text-xl font-bold text-yellow-300">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
            <XIcon className="w-6 h-6 text-slate-400" />
          </button>
        </header>
        <main className="p-6 text-slate-300">
          <p>{message}</p>
        </main>
        <footer className="p-4 flex justify-end gap-4 bg-slate-800/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Confirm
          </button>
        </footer>
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
