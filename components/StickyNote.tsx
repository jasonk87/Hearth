

import React from 'react';
import type { Note, NoteColor } from '../types';
import { Trash2Icon } from './icons';
import { MicInputButton } from './MicInputButton';

interface StickyNoteProps {
    note: Note;
    onUpdate: (id: number, text: string) => void;
    onDelete: (id: number) => void;
    onChangeColor: (id: number, color: NoteColor) => void;
    onFocus: (id: number) => void;
    style?: React.CSSProperties;
    activeInputKey?: string;
}

const noteColorClasses: Record<NoteColor, { bg: string; text: string; border: string }> = {
    yellow: { bg: 'bg-yellow-200', text: 'text-yellow-800', border: 'border-yellow-400' },
    pink: { bg: 'bg-pink-200', text: 'text-pink-800', border: 'border-pink-400' },
    blue: { bg: 'bg-blue-200', text: 'text-blue-800', border: 'border-blue-400' },
    green: { bg: 'bg-green-200', text: 'text-green-800', border: 'border-green-400' },
};

const ColorButton: React.FC<{ color: NoteColor, onClick: () => void, isActive: boolean }> = ({ color, onClick, isActive }) => {
    const colorClass = noteColorClasses[color].bg;
    return (
        <button
            onClick={onClick}
            className={`w-5 h-5 rounded-full ${colorClass} transition-transform hover:scale-125 ${isActive ? 'ring-2 ring-offset-2 ring-offset-gray-700 ring-white' : ''}`}
            aria-label={`Change note color to ${color}`}
        />
    )
};


export const StickyNote: React.FC<StickyNoteProps> = ({ note, onUpdate, onDelete, onChangeColor, onFocus, style, activeInputKey }) => {
    const colors = Object.keys(noteColorClasses) as NoteColor[];
    const classes = noteColorClasses[note.color];
    const isFocused = activeInputKey === `note-${note.id}`;
    
    const handleTranscription = (text: string) => {
        onUpdate(note.id, note.text ? `${note.text} ${text}` : text);
    };

    return (
        <div
            className={`p-4 h-64 flex flex-col rounded-lg shadow-lg ${classes.bg} ${classes.text} border-b-4 ${classes.border} transition-transform duration-200 ease-in-out`}
            style={style}
        >
            <textarea
                value={note.text}
                onChange={(e) => onUpdate(note.id, e.target.value)}
                onFocus={() => onFocus(note.id)}
                className={`flex-grow w-full bg-transparent resize-none focus:outline-none placeholder-current/50 font-medium rounded-md transition-shadow ${isFocused ? 'ring-2 ring-cyan-500' : ''}`}
                placeholder="Write something..."
            />
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-current/20">
                <div className="flex items-center gap-2">
                    {colors.map(color => (
                        <ColorButton
                            key={color}
                            color={color}
                            onClick={() => onChangeColor(note.id, color)}
                            isActive={note.color === color}
                        />
                    ))}
                </div>
                <div className="flex items-center gap-4">
                     <MicInputButton 
                        onTranscription={handleTranscription} 
                        className="bg-current/10 hover:bg-current/20 text-current/70 w-8 h-8"
                    />
                    <button onClick={() => onDelete(note.id)} className="text-current/50 hover:text-current transition-colors">
                        <Trash2Icon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
