
import React from 'react';
import { XIcon } from './icons';
import { toLocalDateKey } from '../services/dateService';

interface ScheduleDinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeName: string;
  onSchedule: (dateKey: string, recipeName:string) => void;
}

const getNextDays = (count: number) => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }
  return days;
};

export const ScheduleDinnerModal: React.FC<ScheduleDinnerModalProps> = ({ isOpen, onClose, recipeName, onSchedule }) => {
  if (!isOpen) return null;

  const days = getNextDays(7);

  const handleDaySelect = (day: Date) => {
    const dayKey = toLocalDateKey(day);
    onSchedule(dayKey, recipeName);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-50/95 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up-fast flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-200/80">
          <h3 className="text-xl font-bold text-teal-600">Schedule "{recipeName}"</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
            <XIcon className="w-6 h-6 text-slate-500" />
          </button>
        </header>

        <main className="p-6 text-slate-800">
            <p className="text-center text-slate-500 mb-4">Choose a day to plan this for dinner:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {days.map(day => (
                    <button
                        key={day.toISOString()}
                        onClick={() => handleDaySelect(day)}
                        className="p-4 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-left transition-colors"
                    >
                        <p className="font-bold text-lg">{day.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                        <p className="text-sm text-slate-500">{day.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                    </button>
                ))}
            </div>
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
