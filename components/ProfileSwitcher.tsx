import React, { useState } from 'react';
import type { User } from '../types';
import { ChevronDownIcon, UsersIcon } from './icons';

interface ProfileSwitcherProps {
  users: User[];
  currentUser: User;
  onSwitchUser: (user: User) => void;
  familyUser: User;
  onManageProfiles: () => void;
}

export const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({ users, currentUser, onSwitchUser, familyUser, onManageProfiles }) => {
  const [isOpen, setIsOpen] = useState(false);
  const allProfiles = [familyUser, ...users];

  const handleSelect = (user: User) => {
    onSwitchUser(user);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-full hover:bg-black/5 transition-colors"
      >
        <span className="text-3xl">{currentUser.avatar}</span>
        <span className="font-semibold text-lg hidden sm:inline">{currentUser.name}</span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full mt-2 left-0 bg-white/60 backdrop-blur-lg border border-stone-200/60 rounded-lg shadow-xl w-48 z-10 animate-fade-in"
          onMouseLeave={() => setIsOpen(false)}
        >
          <ul className="py-1">
            {allProfiles.map(user => (
              <li key={user.id}>
                <button
                  onClick={() => handleSelect(user)}
                  className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-stone-200/50 transition-colors"
                >
                  <span className="text-2xl">{user.avatar}</span>
                  <span>{user.name}</span>
                </button>
              </li>
            ))}
          </ul>
           <div className="border-t border-slate-500/20">
            <button
              onClick={() => {
                onManageProfiles();
                setIsOpen(false);
              }}
              className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-stone-200/50 transition-colors text-teal-700 font-semibold"
            >
              <UsersIcon className="w-5 h-5" />
              <span>Manage Profiles</span>
            </button>
          </div>
           <style>{`
            @keyframes fade-in {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
              animation: fade-in 0.2s ease-out forwards;
            }
          `}</style>
        </div>
      )}
    </div>
  );
};