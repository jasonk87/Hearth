import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { DEFAULT_PERSISTENT_STATE, PersistentAppState } from '../shared/persistentState';
import { loadPersistentState, updatePersistentState } from '../services/persistenceService';

type FieldUpdater<K extends keyof PersistentAppState> =
  | PersistentAppState[K]
  | ((previous: PersistentAppState[K]) => PersistentAppState[K]);

interface PersistentStateContextType {
  state: PersistentAppState;
  setField: <K extends keyof PersistentAppState>(key: K, value: FieldUpdater<K>) => void;
}

const PersistentStateContext = createContext<PersistentStateContextType | undefined>(undefined);

export const PersistentStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistentAppState>(DEFAULT_PERSISTENT_STATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const stateRef = useRef<PersistentAppState>(DEFAULT_PERSISTENT_STATE);

  useEffect(() => {
    let isActive = true;

    loadPersistentState()
      .then((loadedState) => {
        if (!isActive) return;
        stateRef.current = loadedState;
        setState(loadedState);
        setIsHydrated(true);
      })
      .catch((error) => {
        console.error('Failed to initialize persistent Hearth data:', error);
        if (isActive) setIsHydrated(true);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const setField = useCallback(<K extends keyof PersistentAppState>(key: K, value: FieldUpdater<K>) => {
    const currentState = stateRef.current;
    const nextValue = typeof value === 'function'
      ? (value as (current: PersistentAppState[K]) => PersistentAppState[K])(currentState[key])
      : value;
    const nextState = { ...currentState, [key]: nextValue };

    stateRef.current = nextState;
    setState(nextState);
    void updatePersistentState({ [key]: nextValue } as Partial<PersistentAppState>).catch((error) => {
      console.error(`Failed to save persistent Hearth field "${key}":`, error);
    });
  }, []);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-xl font-semibold text-slate-600">
        Loading Hearth…
      </div>
    );
  }

  return (
    <PersistentStateContext.Provider value={{ state, setField }}>
      {children}
    </PersistentStateContext.Provider>
  );
};

export const usePersistentState = () => {
  const context = useContext(PersistentStateContext);
  if (!context) {
    throw new Error('usePersistentState must be used within a PersistentStateProvider');
  }
  return context;
};
