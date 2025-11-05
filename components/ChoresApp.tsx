

import React, { useState, useMemo } from 'react';
import type { Chore, User } from '../types';

interface ChoresAppProps {
  chores: Chore[];
  onToggleChore: (id: number) => void;
  onAddChore: (text: string, assigneeId: string) => void;
  users: User[];
  newChoreText: string;
  setNewChoreText: (text: string) => void;
  onNewChoreTextFocus: () => void;
  activeInputKey?: string;
}

const ChoreItem: React.FC<{ chore: Chore; onToggle: (id: number) => void; assignee?: User | {name: string, avatar: string} }> = ({ chore, onToggle, assignee }) => (
  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
    <div className="flex items-center">
        <input
          type="checkbox"
          id={`chore-app-${chore.id}`}
          checked={chore.completed}
          onChange={() => onToggle(chore.id)}
          className="h-6 w-6 rounded border-slate-500 bg-slate-600 text-teal-500 focus:ring-teal-600 cursor-pointer"
        />
        <label
          htmlFor={`chore-app-${chore.id}`}
          className={`ml-4 text-lg transition-colors cursor-pointer ${
            chore.completed ? 'text-slate-500 line-through' : 'text-slate-200'
          }`}
        >
          {chore.text}
        </label>
    </div>
    {assignee && <span className="text-3xl ml-2" title={assignee.name}>{assignee.avatar}</span>}
  </div>
);

export const ChoresApp: React.FC<ChoresAppProps> = ({ chores, onToggleChore, onAddChore, users, newChoreText, setNewChoreText, onNewChoreTextFocus, activeInputKey }) => {
    const [assigneeId, setAssigneeId] = useState('family');

    const getAssignee = (chore: Chore) => {
        if (chore.assigneeId === 'family') return { name: 'Family', avatar: '👨‍👩‍👧‍👦' };
        return users.find(u => u.id === chore.assigneeId);
    }

    const { completed, todo } = useMemo(() => ({
        completed: chores.filter(c => c.completed),
        todo: chores.filter(c => !c.completed)
    }), [chores]);

    const completionPercentage = chores.length > 0 ? (completed.length / chores.length) * 100 : 0;

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        onAddChore(newChoreText, assigneeId);
    };
    
    return (
        <div className="flex flex-col h-full">
            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between mb-1">
                    <span className="text-base font-medium text-teal-300">Daily Progress</span>
                    <span className="text-sm font-medium text-teal-300">{Math.round(completionPercentage)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <div className="bg-teal-500 h-2.5 rounded-full transition-all duration-500" style={{width: `${completionPercentage}%`}}></div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-y-auto">
                {/* To Do Column */}
                <div className="flex flex-col">
                    <h3 className="text-xl font-semibold text-slate-300 mb-3">To Do ({todo.length})</h3>
                    <div className="space-y-3 pr-2 overflow-y-auto">
                         {todo.length > 0 ? todo.map(chore => (
                            <ChoreItem key={chore.id} chore={chore} onToggle={onToggleChore} assignee={getAssignee(chore)} />
                         )) : <p className="text-slate-400 italic text-center mt-4">All done!</p>}
                    </div>
                </div>

                {/* Completed Column */}
                <div className="flex flex-col">
                    <h3 className="text-xl font-semibold text-slate-500 mb-3">Completed ({completed.length})</h3>
                    <div className="space-y-3 pr-2 overflow-y-auto">
                        {completed.map(chore => (
                           <ChoreItem key={chore.id} chore={chore} onToggle={onToggleChore} assignee={getAssignee(chore)} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Add Chore Form */}
            <form onSubmit={handleAdd} className="mt-4 flex flex-col sm:flex-row gap-3 border-t border-slate-700 pt-4">
                <input 
                    type="text"
                    value={newChoreText}
                    onChange={(e) => setNewChoreText(e.target.value)}
                    onFocus={onNewChoreTextFocus}
                    placeholder="Add a new chore..."
                    className={`flex-grow bg-slate-900/50 text-slate-200 p-3 rounded-lg focus:outline-none transition-shadow ${activeInputKey === 'new-chore' ? 'ring-2 ring-teal-500' : 'focus:ring-2 focus:ring-teal-500'}`}
                />
                <select 
                    value={assigneeId} 
                    onChange={e => setAssigneeId(e.target.value)}
                    className="bg-slate-900/50 text-slate-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                    <option value="family">Family</option>
                    {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>
                <button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    Add
                </button>
            </form>
        </div>
    );
};