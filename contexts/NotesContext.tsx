import React, { createContext, useContext, useCallback } from 'react';
import { Note, NoteColor } from '../types';
import { playSound } from '../services/soundService';
import { usePersistentState } from './PersistentStateContext';

interface NotesContextType {
  notes: Note[];
  addNote: (text?: string) => Note;
  updateNote: (id: number, text: string) => void;
  deleteNote: (id: number) => void;
  changeNoteColor: (id: number, color: NoteColor) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, setField } = usePersistentState();
  const notes = state.notes;
  const setNotes = useCallback((updater: React.SetStateAction<Note[]>) => {
    setField('notes', updater);
  }, [setField]);

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
