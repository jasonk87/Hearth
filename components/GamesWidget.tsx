
import React from 'react';
import { Widget } from './Widget';
import { HashIcon, GallowsIcon, BrainCircuitIcon, SnakeIcon, BookOpenTextIcon, BlocksIcon } from './icons';
import type { Game } from '../types';

interface GamesWidgetProps {
  onLaunchGame: (game: Game) => void;
  onOpenGameCenter: () => void;
  className?: string;
}

const GameButton: React.FC<{
    title: string;
    icon: React.ReactNode;
    onClick: () => void;
}> = ({ title, icon, onClick }) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-2 p-4 bg-white/30 rounded-lg w-full h-full text-center transition-all duration-300 hover:bg-teal-100/50 hover:border-teal-600 border border-transparent"
    >
        {React.cloneElement(icon as React.ReactElement, { className: 'w-10 h-10 text-teal-700' })}
        <span className="font-semibold text-stone-800">{title}</span>
    </button>
);

export const GamesWidget: React.FC<GamesWidgetProps> = ({ onLaunchGame, onOpenGameCenter, className }) => {
  return (
    <Widget 
        title="Games" 
        className={className}
        titleAction={
            <button 
                onClick={onOpenGameCenter}
                className="text-sm bg-white/30 hover:bg-white/50 text-teal-700 font-semibold py-1 px-3 rounded-md transition-colors"
            >
                View All
            </button>
        }
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 h-full min-h-[150px] md:min-h-[200px]">
        <GameButton 
            title="Tic-Tac-Toe" 
            icon={<HashIcon />} 
            onClick={() => onLaunchGame('tictactoe')} 
        />
        <GameButton 
            title="Memory" 
            icon={<BrainCircuitIcon />} 
            onClick={() => onLaunchGame('memory')} 
        />
        <GameButton 
            title="Snake" 
            icon={<SnakeIcon />} 
            onClick={() => onLaunchGame('snake')} 
        />
        <GameButton 
            title="2048" 
            icon={<BlocksIcon />} 
            onClick={() => onLaunchGame('2048')} 
        />
        <GameButton 
            title="AI Story" 
            icon={<BookOpenTextIcon />} 
            onClick={() => onLaunchGame('storyboard')} 
        />
        <GameButton 
            title="Hangman" 
            icon={<GallowsIcon />} 
            onClick={() => onLaunchGame('hangman')} 
        />
      </div>
    </Widget>
  );
};