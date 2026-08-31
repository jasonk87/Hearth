import React, { useState, useEffect, useRef } from 'react';
import { RefreshCwIcon } from './icons';

const EMOJIS = ['🧠', '🕹️', '🎲', '🧩', '🎯', '🚀', '⭐', '💡'];

const generateCards = () => {
  const cards = [...EMOJIS, ...EMOJIS]
    .sort(() => Math.random() - 0.5)
    .map((emoji, index) => ({ id: index, emoji, isFlipped: false, isMatched: false }));
  return cards;
};

export const MemoryMatchWidget: React.FC = () => {
  const [cards, setCards] = useState(generateCards());
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const resetTimer = useRef<number | null>(null);

  const isGameWon = cards.every(card => card.isMatched);

  useEffect(() => {
    if (flippedIndices.length === 2) {
      const [firstIndex, secondIndex] = flippedIndices;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      if (firstCard.emoji === secondCard.emoji) {
        // Match
        setCards(prevCards =>
          prevCards.map(card =>
            card.id === firstCard.id || card.id === secondCard.id ? { ...card, isMatched: true } : card
          )
        );
        setFlippedIndices([]);
      } else {
        // No match, flip back after a delay
        resetTimer.current = window.setTimeout(() => {
          setCards(prevCards =>
            prevCards.map((card, index) =>
              index === firstIndex || index === secondIndex ? { ...card, isFlipped: false } : card
            )
          );
          setFlippedIndices([]);
        }, 1000);
      }
    }
  }, [flippedIndices]);

  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);

  const handleCardClick = (index: number) => {
    if (flippedIndices.length >= 2 || cards[index].isFlipped) {
      return;
    }

    setMoves(prev => prev + 1);
    setFlippedIndices(prev => [...prev, index]);
    setCards(prevCards =>
      prevCards.map((card, i) => (i === index ? { ...card, isFlipped: true } : card))
    );
  };

  const resetGame = () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = null;
    setCards(generateCards());
    setFlippedIndices([]);
    setMoves(0);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-white bg-slate-800 rounded-xl w-full">
      <div className="flex justify-between items-center w-full max-w-md mb-4">
        <h3 className="text-xl font-bold text-teal-300">Memory Match</h3>
        <div className="flex items-center gap-4">
          <p className="text-lg">Moves: {Math.floor(moves / 2)}</p>
          <button onClick={resetGame} className="text-slate-400 hover:text-white transition-colors" aria-label="Reset Game">
            <RefreshCwIcon className="w-5 h-5"/>
          </button>
        </div>
      </div>
      {isGameWon ? (
        <div className="text-center">
            <p className="text-3xl font-bold text-green-400 mb-4">You Won!</p>
            <p className="text-lg">It took you {Math.floor(moves / 2)} moves.</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {cards.map((card, index) => (
            <div key={card.id} className="w-16 h-16 sm:w-20 sm:h-20 [perspective:1000px]" onClick={() => handleCardClick(index)}>
              <div 
                className={`relative w-full h-full [transform-style:preserve-3d] transition-transform duration-500 ${card.isFlipped || card.isMatched ? '[transform:rotateY(180deg)]' : ''}`}
              >
                {/* Front */}
                <div className="absolute w-full h-full bg-slate-600 rounded-lg flex items-center justify-center text-4xl font-bold [backface-visibility:hidden]">?</div>
                {/* Back */}
                <div className={`absolute w-full h-full rounded-lg flex items-center justify-center text-4xl [transform:rotateY(180deg)] [backface-visibility:hidden] ${card.isMatched ? 'bg-green-600' : 'bg-teal-600'}`}>
                  {card.emoji}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
