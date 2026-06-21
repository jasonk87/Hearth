import React from 'react';
import type { LocalEvent } from '../types';
import { XIcon, MapPinIcon, ClockIcon, CalendarPlusIcon } from './icons';

interface EventDetailModalProps {
  event: LocalEvent;
  onClose: () => void;
  onAddEvent: (event: LocalEvent) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose, onAddEvent }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative h-64 sm:h-80 shrink-0 bg-slate-100">
            {event.imageUrl && (
                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition-colors"
            >
                <XIcon className="w-5 h-5" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h2 className="text-3xl font-extrabold drop-shadow-md leading-tight mb-2">{event.title}</h2>
            </div>
        </div>
        
        <div className="p-6 sm:p-8 flex flex-col flex-grow">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="bg-teal-100 p-2 rounded-xl text-teal-600 mt-1 shrink-0">
                        <ClockIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Date & Time</p>
                        <p className="text-slate-800 font-medium">{event.date}</p>
                        <p className="text-slate-600">{event.time}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 mt-1 shrink-0">
                        <MapPinIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Location</p>
                        <p className="text-slate-800 font-medium">{event.location}</p>
                    </div>
                </div>
            </div>

            {event.description && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-3">About this Event</h3>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                </div>
            )}

            <div className="mt-auto pt-6 border-t border-slate-100">
                <button
                    onClick={() => {
                        onAddEvent(event);
                        onClose();
                    }}
                    className="w-full bg-slate-900 hover:bg-teal-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg shadow-md hover:shadow-xl active:scale-[0.98]"
                >
                    <CalendarPlusIcon className="w-6 h-6" />
                    Schedule Event
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
