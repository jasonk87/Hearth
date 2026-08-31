import React, { createContext, useContext, useState, useCallback } from 'react';
import { GroceryItem, Recipe } from '../types';
import { playSound } from '../services/soundService';
import { usePersistentState } from './PersistentStateContext';

interface GroceryContextType {
  groceryList: GroceryItem[];
  addGroceryItem: (name: string, section?: string) => void;
  toggleGroceryItem: (id: number) => void;
  renameGroceryItem: (id: number, name: string) => void;
  removeGroceryItem: (id: number) => void;
  clearCompletedGroceries: () => void;
  addFromRecipe: (recipe: Recipe) => number;
}

const GroceryContext = createContext<GroceryContextType | undefined>(undefined);

export const GroceryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, setField } = usePersistentState();
  const groceryList = state.groceryList;
  const setGroceryList = useCallback((updater: React.SetStateAction<GroceryItem[]>) => {
    setField('groceryList', updater);
  }, [setField]);

  const addGroceryItem = useCallback((name: string, section: string = 'Other') => {
      if (name.trim() === '') return;
      const trimmedName = name.trim();
      const newItem: GroceryItem = {
        id: Date.now(),
        name: trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1),
        completed: false,
        section,
      };
      setGroceryList(prev => [newItem, ...prev]);
  }, []);

  const toggleGroceryItem = useCallback((id: number) => {
    setGroceryList(prev => {
        const item = prev.find(i => i.id === id);
        if (item) {
            playSound(item.completed ? 'toggleOff' : 'toggleOn');
        }
        return prev.map(i => i.id === id ? { ...i, completed: !i.completed } : i)
    });
  }, []);

  const renameGroceryItem = useCallback((id: number, name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setGroceryList(prev => prev.map(item => item.id === id
      ? { ...item, name: trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1) }
      : item));
  }, [setGroceryList]);

  const removeGroceryItem = useCallback((id: number) => {
    playSound('delete');
    setGroceryList(prev => prev.filter(item => item.id !== id));
  }, [setGroceryList]);

  const clearCompletedGroceries = useCallback(() => {
    playSound('delete');
    setGroceryList(prev => prev.filter(item => !item.completed));
  }, []);
  
  const addFromRecipe = useCallback((recipe: Recipe): number => {
      let itemsAddedCount = 0;
      recipe.ingredients.forEach(ingredient => {
          // Take the primary ingredient name before any commas
          const parts = ingredient.split(/\s*,\s*|\s+-\s+/);
          let name = parts[0];
          
          // Try to strip off quantities
          const quantityMatch = name.match(/^([\d/.\s]+(?:cup|oz|tbsp|tsp|pound|lb|g|kg|ml|l|dash|pinch|slice|piece|small|medium|large|can|package|bunch|head|clove|stalk)?\s*)/i);
          if (quantityMatch && quantityMatch[0].length < name.length / 2) {
              name = name.replace(quantityMatch[0], '').trim();
          }
          
          const newItem: GroceryItem = {
            id: Date.now() + Math.random() + itemsAddedCount,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            completed: false,
            section: 'Other',
          };
          setGroceryList(prev => [newItem, ...prev]);
          itemsAddedCount++;
      });
      return itemsAddedCount;
  }, []);

  return (
    <GroceryContext.Provider value={{ 
        groceryList, 
        addGroceryItem, 
        toggleGroceryItem, 
        renameGroceryItem,
        removeGroceryItem,
        clearCompletedGroceries,
        addFromRecipe 
    }}>
      {children}
    </GroceryContext.Provider>
  );
};

export const useGroceries = () => {
  const context = useContext(GroceryContext);
  if (context === undefined) {
    throw new Error('useGroceries must be used within a GroceryProvider');
  }
  return context;
};
