

import React, { useState, useEffect } from 'react';
import type { CalendarEvent } from '../types';
import { XIcon, UsersIcon } from './icons';

interface EventDetailViewProps {
  event: CalendarEvent;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: CalendarEvent['id']) => void;
  activeInputKey?: string;
  onTitleFocus: () => void;
  onTimeFocus: () => void;
  onParticipantFocus: () => void;
  newParticipant: string;
  setNewParticipant: (name: string) => void;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ 
    event, onClose, onSave, onDelete,
    activeInputKey, onTitleFocus, onTimeFocus, onParticipantFocus,
    newParticipant, setNewParticipant
}) => {
  const [editedEvent, setEditedEvent] = useState<CalendarEvent>(event);
  
  useEffect(() => {
    setEditedEvent(event);
  }, [event]);

  const handleSave = () => {
    onSave(editedEvent);
  };

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newParticipant.trim()) {
      setEditedEvent(prev => ({
        ...prev,
        participants: [...(prev.participants || []), newParticipant.trim()],
      }));
      setNewParticipant('');
    }
  };
  
  const handleRemoveParticipant = (participantToRemove: string) => {
      setEditedEvent(prev => ({
          ...prev,
          participants: (prev.participants || []).filter(p => p !== participantToRemove),
      }));
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-50/95 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up-fast flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-200/80">
            <h3 className="text-xl font-bold text-teal-600">Edit Event</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                <XIcon className="w-6 h-6 text-slate-500" />
            </button>
        </header>

        <main className="p-6 space-y-4 text-slate-800">
          <div>
            <label htmlFor="event-title" className="block text-sm font-medium text-slate-500 mb-1">Title</label>
            <input
              id="event-title"
              type="text"
              value={editedEvent.title}
              onChange={(e) => setEditedEvent(prev => ({ ...prev, title: e.target.value }))}
              onFocus={onTitleFocus}
              className={`w-full bg-white/80 text-slate-800 p-2 rounded-lg focus:outline-none transition-shadow ${activeInputKey === `event-title-${event.id}` ? 'ring-2 ring-teal-500' : 'focus:ring-2 focus:ring-teal-500'}`}
            />
          </div>
           <div>
            <label htmlFor="event-time" className="block text-sm font-medium text-slate-500 mb-1">Time</label>
            <input
              id="event-time"
              type="text"
              value={editedEvent.time}
              onChange={(e) => setEditedEvent(prev => ({ ...prev, time: e.target.value }))}
              onFocus={onTimeFocus}
              className={`w-full bg-white/80 text-slate-800 p-2 rounded-lg focus:outline-none transition-shadow ${activeInputKey === `event-time-${event.id}` ? 'ring-2 ring-teal-500' : 'focus:ring-2 focus:ring-teal-500'}`}
            />
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-1">
                <UsersIcon className="w-4 h-4"/> Participants
            </label>
            <div className="p-2 bg-white/80 rounded-lg min-h-[50px] max-h-24 overflow-y-auto">
                {(editedEvent.participants || []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {(editedEvent.participants || []).map(p => (
                            <div key={p} className="flex items-center gap-2 bg-slate-200 text-slate-700 px-2 py-1 rounded-full text-sm">
                                <span>{p}</span>
                                <button onClick={() => handleRemoveParticipant(p)} className="text-slate-500 hover:text-slate-800">
                                    <XIcon className="w-3 h-3"/>
                                </button>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-slate-500 text-sm italic px-2">No participants added.</p>}
            </div>
                <form onSubmit={handleAddParticipant} className="flex gap-2">
                    <input
                        type="text"
                        value={newParticipant}
                        onChange={(e) => setNewParticipant(e.target.value)}
                        onFocus={onParticipantFocus}
                        placeholder="Add participant..."
                        className={`flex-grow bg-white/80 text-slate-800 p-2 rounded-lg focus:outline-none transition-shadow ${activeInputKey === `event-participant-${event.id}` ? 'ring-2 ring-teal-500' : 'focus:ring-2 focus:ring-teal-500'}`}
                    />
                    <button type="submit" className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-4 rounded-lg transition-colors">Add</button>
                </form>
          </div>
        </main>
        
        <footer className="flex justify-between items-center p-4 border-t border-slate-200/80 bg-slate-100/50 rounded-b-2xl">
            <button
                onClick={() => onDelete(event.id)}
                className="bg-red-600/90 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
                Delete Event
            </button>
            <button
                onClick={handleSave}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
                Save Changes
            </button>
        </footer>
      </div>
    </div>
  );
};
