import React from 'react';
import { Widget } from './Widget';
import type { Chore, User } from '../types';

interface ChoresWidgetProps {
  chores: Chore[];
  users: User[];
  onToggle: (id: number) => void;
  onClick?: () => void;
}

export const ChoresWidget: React.FC<ChoresWidgetProps> = ({ chores, users, onToggle, onClick }) => {
  const getAssignee = (chore: Chore) => {
    if (chore.assigneeId === 'family') return { name: 'Family', avatar: '👨‍👩‍👧‍👦' };
    return users.find(u => u.id === chore.assigneeId);
  }

  return (
    <Widget title="Daily Chores" onClick={onClick}>
      <div className="space-y-3 h-full overflow-y-auto max-h-[150px] md:max-h-[200px] pr-2">
        {chores.length === 0 ? (
            <p className="text-slate-500 text-center pt-8">No chores for today!</p>
        ) : chores.map(chore => {
            const assignee = getAssignee(chore);
            return (
              <div key={chore.id} className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`chore-${chore.id}`}
                    checked={chore.completed}
                    onChange={() => onToggle(chore.id)}
                    className="h-5 w-5 rounded border-slate-400 bg-slate-200/50 text-teal-600 focus:ring-teal-600 cursor-pointer"
                  />
                  <label
                    htmlFor={`chore-${chore.id}`}
                    className={`ml-3 text-lg transition-colors cursor-pointer ${
                      chore.completed ? 'text-stone-500 line-through' : 'text-stone-800'
                    }`}
                  >
                    {chore.text}
                  </label>
                </div>
                {assignee && <span className="text-2xl ml-2" title={assignee.name}>{assignee.avatar}</span>}
              </div>
            );
        })}
      </div>
    </Widget>
  );
};