import React, { useState, useEffect, useCallback } from 'react';
import { getHangmanWord } from '../services/geminiService';
import { RefreshCwIcon, LightbulbIcon } from './icons';

const MAX_MISTAKES = 6;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

const HangmanDrawing: React.FC<{ mistakes: number }> = ({ mistakes }) => {
    const parts = [
        <circle key="head" cx="100" cy="50" r="20" stroke="white" strokeWidth="4" fill="none" />,
        <line key="body" x1="100" y1="70" x2="100" y2="130" stroke="white" strokeWidth="4" />,
        <line key="arm1" x1="100" y1="90" x2="70" y2="110" stroke="white" strokeWidth="4" />,
        <line key="arm2" x1="100" y1="90" x2="130" y2="110" stroke="white" strokeWidth="4" />,
        <line key="leg1" x1="100" y1="130" x2="80" y2="160" stroke="white" strokeWidth="4" />,
        <line key="leg2" x1="100" y1="130" x2="120" y2="160" stroke="white" strokeWidth="4" />,
    ];

    return (
        <svg viewBox="0 0 200 250" className="w-48 h-60 sm:w-64 sm:h-80">
            {/* Gallows */}
            <line x1="20" y1="230" x2="180" y2="230" stroke="white" strokeWidth="4" />
            <line x1="60" y1="230" x2="60" y2="20" stroke="white" strokeWidth="4" />
            <line x1="60" y1="20" x2="100" y2="20" stroke="white" strokeWidth="4" />
            <line x1="100" y1="20" x2="100" y2="30" stroke="white" strokeWidth="4" />
            {parts.slice(0, mistakes)}
        </svg>
    );
};

export const HangmanWidget: React.FC = () => {
    const [wordToGuess, setWordToGuess] = useState('');
    const [hint, setHint] = useState('');
    const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
    const [gameState, setGameState] = useState<'loading' | 'playing' | 'won' | 'lost'>('loading');
    const [showHint, setShowHint] = useState(false);

    const startNewGame = useCallback(async () => {
        setGameState('loading');
        setShowHint(false);
        setGuessedLetters(new Set());
        try {
            const { word, hint } = await getHangmanWord();
            setWordToGuess(word);
            setHint(hint);
            setGameState('playing');
        } catch (error) {
            console.error("Couldn't start Hangman game:", error);
            // Fallback in case API fails hard
            setWordToGuess('error');
            setHint('Could not load a word.');
            setGameState('playing');
        }
    }, []);

    useEffect(() => {
        startNewGame();
    }, [startNewGame]);

    const incorrectGuesses = Array.from(guessedLetters).filter(letter => !wordToGuess.includes(letter));
    const mistakes = incorrectGuesses.length;

    const isWordGuessed = wordToGuess.split('').every(letter => guessedLetters.has(letter));

    useEffect(() => {
        if (isWordGuessed && wordToGuess) {
            setGameState('won');
        } else if (mistakes >= MAX_MISTAKES) {
            setGameState('lost');
        }
    }, [guessedLetters, wordToGuess, mistakes, isWordGuessed]);

    const handleGuess = (letter: string) => {
        if (gameState !== 'playing') return;
        setGuessedLetters(prev => new Set(prev).add(letter));
    };

    const renderWord = () => (
        <div className="flex gap-2 sm:gap-4 text-3xl sm:text-5xl font-bold tracking-widest">
            {wordToGuess.split('').map((letter, index) => (
                <span key={index} className="w-10 h-14 sm:w-14 sm:h-20 border-b-4 flex items-center justify-center">
                    {guessedLetters.has(letter) || gameState === 'lost' ? letter.toUpperCase() : '_'}
                </span>
            ))}
        </div>
    );

    const renderKeyboard = () => (
        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
            {ALPHABET.map(letter => (
                <button
                    key={letter}
                    onClick={() => handleGuess(letter)}
                    disabled={guessedLetters.has(letter) || gameState !== 'playing'}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-600 text-xl font-bold uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-500"
                >
                    {letter}
                </button>
            ))}
        </div>
    );

    if (gameState === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white gap-4 bg-slate-800 rounded-xl w-full">
                <RefreshCwIcon className="w-12 h-12 animate-spin text-teal-300" />
                <p className="text-xl">Getting a new word...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-between h-full p-4 text-white w-full bg-slate-800 rounded-xl relative">
            {gameState !== 'playing' && (
                <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center gap-4 animate-fade-in rounded-xl">
                    <h2 className={`text-5xl font-bold ${gameState === 'won' ? 'text-green-400' : 'text-red-500'}`}>
                        {gameState === 'won' ? 'You Won!' : 'Game Over'}
                    </h2>
                    {gameState === 'lost' && <p className="text-xl">The word was: <span className="font-bold tracking-widest">{wordToGuess.toUpperCase()}</span></p>}
                    <button onClick={startNewGame} className="mt-4 bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-6 rounded-lg text-lg">
                        Play Again
                    </button>
                </div>
            )}
            <div className="flex justify-between w-full items-start">
                 <div className="relative">
                    <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700">
                        <LightbulbIcon className="w-6 h-6 text-yellow-300" />
                        <span className="font-semibold">Hint</span>
                    </button>
                    {showHint && <div className="absolute top-full mt-2 left-0 bg-slate-900 p-3 rounded-lg shadow-lg max-w-xs z-20 animate-fade-in-fast">{hint}</div>}
                 </div>
                 <h2 className="text-2xl font-bold text-teal-300">Hangman</h2>
                 <button onClick={startNewGame} className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700" aria-label="New Game">
                    <RefreshCwIcon className="w-6 h-6" />
                 </button>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 lg:gap-16 w-full">
                <HangmanDrawing mistakes={mistakes} />
                <div className="flex flex-col items-center gap-8">
                    {renderWord()}
                </div>
            </div>

            {renderKeyboard()}
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.5s ease-in-out; }
                @keyframes fade-in-fast { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-fast { animation: fade-in-fast 0.3s ease-in-out; }
            `}</style>
        </div>
    );
};