

import React from 'react';
import type { Note, NoteColor } from '../types';
import { StickyNote } from './StickyNote';
import { PlusIcon } from './icons';

interface NotesAppProps {
  notes: Note[];
  onAdd: () => void;
  onUpdate: (id: number, text: string) => void;
  onDelete: (id: number) => void;
  onChangeColor: (id: number, color: NoteColor) => void;
  onNoteFocus: (id: number) => void;
  activeInputKey?: string;
}

export const NotesApp: React.FC<NotesAppProps> = ({ notes, onAdd, onUpdate, onDelete, onChangeColor, onNoteFocus, activeInputKey }) => {
  return (
    <div className="relative w-full h-full">
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {notes.map((note, index) => (
                <StickyNote
                    key={note.id}
                    note={note}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onChangeColor={onChangeColor}
                    onFocus={onNoteFocus}
                    style={{ transform: `rotate(${(index % 2 === 0 ? 1.5 : -1.5) * (index % 3 - 1)}deg)` }}
                    activeInputKey={activeInputKey}
                />
            ))}
        </div>
        <button
            onClick={onAdd}
            className="fixed bottom-24 right-8 sm:bottom-12 sm:right-12 w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-teal-400 transition-all duration-300 transform hover:scale-110 z-[51]"
            aria-label="Add new note"
        >
            <PlusIcon className="w-8 h-8" />
        </button>
    </div>
  );
};