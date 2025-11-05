
import React from 'react';
import { Widget } from './Widget';
import type { GroceryItem } from '../types';
import { ShoppingCartIcon } from './icons';

interface GroceryWidgetProps {
  items: GroceryItem[];
  onToggle: (id: number) => void;
  onClick?: () => void;
}

export const GroceryWidget: React.FC<GroceryWidgetProps> = ({ items, onToggle, onClick }) => {
  const incompleteItems = items.filter(item => !item.completed);
  return (
    <Widget title="Groceries" onClick={onClick} titleAction={<ShoppingCartIcon className="text-teal-700" />}>
      <div className="space-y-3 h-full overflow-y-auto max-h-[150px] md:max-h-[200px] pr-2">
        {incompleteItems.length === 0 ? (
            <p className="text-slate-500 text-center pt-8">Grocery list is empty!</p>
        ) : incompleteItems.slice(0, 5).map(item => (
          <div key={item.id} className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              id={`grocery-widget-${item.id}`}
              checked={item.completed}
              onChange={() => onToggle(item.id)}
              className="h-5 w-5 rounded border-slate-400 bg-slate-200/50 text-teal-600 focus:ring-teal-600 cursor-pointer"
            />
            <label
              htmlFor={`grocery-widget-${item.id}`}
              className="ml-3 text-lg text-stone-800 cursor-pointer"
            >
              {item.name}
            </label>
          </div>
        ))}
        {incompleteItems.length > 5 && <p className="text-slate-500 text-center text-sm pt-2">...and {incompleteItems.length - 5} more</p>}
      </div>
    </Widget>
  );
};
