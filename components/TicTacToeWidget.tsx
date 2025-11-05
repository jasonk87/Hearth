
import React, { useState } from 'react';
import { RefreshCwIcon } from './icons';
import type { SquareValue } from '../types';

const calculateWinner = (squares: SquareValue[]): SquareValue | 'Draw' | null => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6], // diagonals
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  if (squares.every(square => square !== null)) {
      return 'Draw';
  }
  return null;
};

const Square: React.FC<{ value: SquareValue; onClick: () => void }> = ({ value, onClick }) => (
  <button
    className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-700 rounded-lg flex items-center justify-center text-5xl font-bold transition-colors hover:bg-slate-600"
    onClick={onClick}
  >
    {value === 'X' && <span className="text-teal-400">{value}</span>}
    {value === 'O' && <span className="text-yellow-400">{value}</span>}
  </button>
);

export const TicTacToeWidget: React.FC = () => {
    const [board, setBoard] = useState<SquareValue[]>(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState(true);

    const winner = calculateWinner(board);

    const handleClick = (i: number) => {
        if (winner || board[i]) {
            return;
        }
        const newBoard = board.slice();
        newBoard[i] = xIsNext ? 'X' : 'O';
        setBoard(newBoard);
        setXIsNext(!xIsNext);
    };

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setXIsNext(true);
    };

    return (
        <div className="relative flex flex-col items-center justify-center h-full p-4 text-white bg-slate-800 rounded-xl">
            {winner && (
                <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center gap-4 animate-fade-in rounded-xl">
                    <h2 className={`text-5xl font-bold ${winner === 'Draw' ? 'text-yellow-400' : 'text-green-400'}`}>
                        {winner === 'Draw' ? "It's a Draw!" : `Player ${winner} Wins!`}
                    </h2>
                    <button onClick={resetGame} className="mt-4 bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-6 rounded-lg text-lg">
                        Play Again
                    </button>
                </div>
            )}
            <div className="flex justify-between items-center w-full max-w-sm mb-4">
                 <h2 className="text-2xl font-bold text-teal-300">Tic-Tac-Toe</h2>
                 <button onClick={resetGame} className="p-2 rounded-full hover:bg-slate-700/50" aria-label="New Game">
                    <RefreshCwIcon className="w-6 h-6" />
                 </button>
            </div>
            
            <p className="text-xl mb-4 h-8">{!winner && `Next player: ${xIsNext ? 'X' : 'O'}`}</p>

            <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <Square key={i} value={board[i]} onClick={() => handleClick(i)} />
                ))}
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.5s ease-in-out; }
            `}</style>
        </div>
    );
};