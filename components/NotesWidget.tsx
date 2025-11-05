
import React from 'react';
import { Widget } from './Widget';
import type { Note, NoteColor } from '../types';
import { PlusIcon } from './icons';

interface NotesWidgetProps {
  notes: Note[];
  onClick?: () => void;
  onAdd: () => void;
}

const noteColorClasses: Record<NoteColor, { bg: string; text: string; border: string }> = {
    yellow: { bg: 'bg-yellow-200/90', text: 'text-yellow-900', border: 'border-yellow-400' },
    pink: { bg: 'bg-pink-200/90', text: 'text-pink-900', border: 'border-pink-400' },
    blue: { bg: 'bg-blue-200/90', text: 'text-blue-900', border: 'border-blue-400' },
    green: { bg: 'bg-green-200/90', text: 'text-green-900', border: 'border-green-400' },
};

export const NotesWidget: React.FC<NotesWidgetProps> = ({ notes, onClick, onAdd }) => {
  // Show the 4 most recent notes
  const notesToShow = notes.slice(-4).reverse();
  const rotations = [-1.5, 2.5, 1, -2];

  return (
    <Widget 
      title="Sticky Notes" 
      onClick={onClick}
      titleAction={
        <button 
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
          className="p-1 rounded-full text-teal-700 hover:bg-teal-100/50 transition-colors"
          aria-label="Add new note"
        >
            <PlusIcon className="w-5 h-5" />
        </button>
      }
    >
        <div className="h-full min-h-[150px] md:min-h-[200px] flex items-center justify-center">
            {notesToShow.length > 0 ? (
                <div className="grid grid-cols-2 grid-rows-2 gap-3 w-full h-full p-2">
                    {notesToShow.map((note, index) => {
                        const noteStyle = noteColorClasses[note.color];
                        return (
                           <div
                                key={note.id}
                                className={`p-2 rounded-lg shadow-lg flex items-start ${noteStyle.bg} ${noteStyle.text} border-b-4 ${noteStyle.border} transition-transform hover:scale-110`}
                                style={{ transform: `rotate(${rotations[index % rotations.length]}deg)` }}
                           >
                                <p className="font-medium text-xs leading-tight" style={{display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                                   {note.text || 'Empty Note'}
                                </p>
                           </div>
                        );
                    })}
                    {/* Fill empty grid cells if less than 4 notes */}
                    {Array(Math.max(0, 4 - notesToShow.length)).fill(0).map((_, i) => (
                         <div key={`empty-${i}`} className="bg-slate-200/40 rounded-md"></div>
                    ))}
                </div>
            ) : (
                <div className="text-center">
                    <p className="text-slate-600">No notes yet.</p>
                    <p className="text-slate-500 text-sm">Click to add one!</p>
                </div>
            )}
        </div>
    </Widget>
  );
};