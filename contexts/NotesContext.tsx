import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Note, NoteColor } from '../types';
import { playSound } from '../services/soundService';

interface NotesContextType {
  notes: Note[];
  addNote: (text?: string) => Note;
  updateNote: (id: number, text: string) => void;
  deleteNote: (id: number) => void;
  changeNoteColor: (id: number, color: NoteColor) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const initialNotes: Note[] = [
    { id: 1, text: 'Grocery List:\n- Milk\n- Bread\n- Eggs', color: 'yellow' },
    { id: 2, text: 'Call plumber about leaky faucet in the kitchen.', color: 'pink' },
    { id: 3, text: 'Soccer practice for Jamie is at 6 PM on Friday.', color: 'blue' },
];

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const savedNotes = localStorage.getItem('hearth-notes');
    try {
        return savedNotes ? JSON.parse(savedNotes) : initialNotes;
    } catch {
        return initialNotes;
    }
  });

  useEffect(() => {
    localStorage.setItem('hearth-notes', JSON.stringify(notes));
  }, [notes]);

  const updateNote = useCallback((id: number, text: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n));
  }, []);

  const addNote = useCallback((text: string = '') => {
    const newNote: Note = {
      id: Date.now(),
      text: text,
      color: 'yellow',
    };
    setNotes(prev => [...prev, newNote]);
    return newNote;
  }, []);

  const deleteNote = useCallback((id: number) => {
    playSound('delete');
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const changeNoteColor = useCallback((id: number, color: NoteColor) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, color } : n));
  }, []);

  return (
    <NotesContext.Provider value={{ notes, addNote, updateNote, deleteNote, changeNoteColor }}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};
