

import React, { useState, useEffect } from 'react';
import { TicTacToeWidget } from './TicTacToeWidget';
import { HangmanWidget } from './HangmanWidget';
import { MemoryMatchWidget } from './MemoryMatchWidget';
import { SnakeWidget } from './SnakeWidget';
import { Game2048Widget } from './Game2048Widget';
import { StoryboardApp } from './StoryboardApp';
import type { Game, StoryPage } from '../types';

const GameCard: React.FC<{ title: string; description: string; onClick: () => void; }> = ({ title, description, onClick }) => (
    <div 
        onClick={onClick}
        className="bg-white/50 p-6 rounded-xl border border-transparent hover:border-teal-500 cursor-pointer transition-all duration-300 text-center transform hover:scale-105 hover:bg-white/80"
    >
        <h3 className="text-2xl font-bold text-teal-600 mb-2">{title}</h3>
        <p className="text-slate-500">{description}</p>
    </div>
);

interface GamesAppProps {
    initialGame: Game | null;
    story: StoryPage[];
    isGenerating: boolean;
    onStartStory: (prompt: string) => void;
    onContinueStory: () => void;
    onResetStory: () => void;
}

export const GamesApp: React.FC<GamesAppProps> = ({ 
    initialGame,
    story,
    isGenerating,
    onStartStory,
    onContinueStory,
    onResetStory,
}) => {
    const [activeGame, setActiveGame] = useState<Game | null>(initialGame);

    useEffect(() => {
        setActiveGame(initialGame);
    }, [initialGame]);

    const renderGame = () => {
        switch (activeGame) {
            case 'tictactoe':
                return <TicTacToeWidget />;
            case 'hangman':
                return <HangmanWidget />;
            case 'memory':
                return <MemoryMatchWidget />;
            case 'snake':
                return <SnakeWidget />;
            case '2048':
                return <Game2048Widget />;
            case 'storyboard':
                return <StoryboardApp 
                    story={story}
                    isGenerating={isGenerating}
                    onStartStory={onStartStory}
                    onContinueStory={onContinueStory}
                    onResetStory={onResetStory}
                />;
            default:
                return null;
        }
    };

    if (activeGame) {
        return (
            <div className="flex flex-col h-full">
                <div className="mb-4">
                    <button onClick={() => setActiveGame(null)} className="text-sm bg-slate-200 hover:bg-slate-300 text-teal-700 font-semibold py-1 px-3 rounded-md transition-colors">
                        &larr; Back to Games
                    </button>
                </div>
                <div className="flex-grow flex items-center justify-center">
                    {renderGame()}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-3xl font-bold mb-8 text-slate-800">Choose a Game</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-4xl">
                <GameCard 
                    title="Tic-Tac-Toe"
                    description="The classic game of Xs and Os. Challenge a friend!"
                    onClick={() => setActiveGame('tictactoe')}
                />
                <GameCard 
                    title="Memory Match"
                    description="Find all the matching pairs of cards."
                    onClick={() => setActiveGame('memory')}
                />
                <GameCard 
                    title="Snake"
                    description="Eat the food and grow as long as you can."
                    onClick={() => setActiveGame('snake')}
                />
                <GameCard 
                    title="2048"
                    description="Slide tiles to combine them and reach 2048."
                    onClick={() => setActiveGame('2048')}
                />
                 <GameCard 
                    title="AI Storyboard"
                    description="Create a story with an AI, complete with pictures."
                    onClick={() => setActiveGame('storyboard')}
                />
                <GameCard 
                    title="Hangman"
                    description="Guess the secret word before you run out of chances."
                    onClick={() => setActiveGame('hangman')}
                />
            </div>
        </div>
    );
};