

import React, { useMemo } from 'react';
import type { GroceryItem } from '../types';

interface GroceryAppProps {
  items: GroceryItem[];
  onToggle: (id: number) => void;
  onAdd: (name: string, section: string) => void;
  onClearCompleted: () => void;
  newItemName: string;
  setNewItemName: (name: string) => void;
  onNewItemNameFocus: () => void;
  activeInputKey?: string;
}

const GroceryItemView: React.FC<{ item: GroceryItem; onToggle: (id: number) => void }> = ({ item, onToggle }) => (
  <div className="flex items-center p-3 bg-slate-100/70 rounded-lg">
    <input
      type="checkbox"
      id={`grocery-app-${item.id}`}
      checked={item.completed}
      onChange={() => onToggle(item.id)}
      className="h-6 w-6 rounded border-slate-400 bg-slate-200 text-teal-500 focus:ring-teal-600 cursor-pointer flex-shrink-0"
    />
    <label
      htmlFor={`grocery-app-${item.id}`}
      className={`ml-4 text-lg transition-colors cursor-pointer ${
        item.completed ? 'text-slate-500 line-through' : 'text-slate-800'
      }`}
    >
      {item.name}
    </label>
  </div>
);

export const GroceryApp: React.FC<GroceryAppProps> = ({ 
    items, onToggle, onAdd, onClearCompleted, 
    newItemName, setNewItemName, 
    onNewItemNameFocus, activeInputKey 
}) => {
    const categorizedItems = useMemo(() => {
        return items.reduce((acc, item) => {
            const section = item.section || 'Other';
            if (!acc[section]) {
                acc[section] = [];
            }
            acc[section].push(item);
            return acc;
        }, {} as Record<string, GroceryItem[]>);
    }, [items]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(newItemName, 'Other');
    };
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto pr-2">
                {Object.keys(categorizedItems).sort().map(section => (
                    <div key={section} className="mb-6">
                        <h3 className="text-xl font-semibold text-teal-700 mb-3 border-b-2 border-teal-200/80 pb-2">{section}</h3>
                        <div className="space-y-3">
                            {categorizedItems[section].map(item => (
                                <GroceryItemView key={item.id} item={item} onToggle={onToggle} />
                            ))}
                        </div>
                    </div>
                ))}
                 {items.length === 0 && <p className="text-slate-500 italic text-center mt-8 text-lg">Your grocery list is empty.</p>}
            </div>

            <div className="mt-4 border-t border-slate-200/80 pt-4">
                <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-4">
                    <input 
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onFocus={onNewItemNameFocus}
                        placeholder="Item Name"
                        className={`flex-grow bg-slate-100/80 text-slate-800 p-3 rounded-lg focus:outline-none transition-shadow ${activeInputKey === 'new-grocery-name' ? 'ring-2 ring-teal-500' : 'focus:ring-2 focus:ring-teal-500'}`}
                    />
                    <button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Add
                    </button>
                </form>
                <button 
                    onClick={onClearCompleted} 
                    className="w-full bg-red-600/90 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    disabled={!items.some(i => i.completed)}
                >
                    Clear Completed Items
                </button>
            </div>
        </div>
    );
};