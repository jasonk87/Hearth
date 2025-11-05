import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCwIcon } from './icons';

const addRandomTile = (board: number[][]): number[][] => {
  let emptyTiles: { r: number, c: number }[] = [];
  board.forEach((row, r) => row.forEach((val, c) => {
    if (val === 0) emptyTiles.push({ r, c });
  }));
  if (emptyTiles.length === 0) return board;

  const { r, c } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
  const newBoard = board.map(row => [...row]);
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
};

const getInitialBoard = () => {
  let board = Array(4).fill(0).map(() => Array(4).fill(0));
  board = addRandomTile(board);
  board = addRandomTile(board);
  return board;
};

const slide = (row: number[]): [number[], number] => {
    let arr = row.filter(val => val);
    let score = 0;
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            score += arr[i];
            arr.splice(i + 1, 1);
        }
    }
    while (arr.length < 4) {
        arr.push(0);
    }
    return [arr, score];
};

const rotateBoard = (board: number[][]): number[][] => {
    const newBoard = Array(4).fill(0).map(() => Array(4).fill(0));
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            newBoard[c][3 - r] = board[r][c];
        }
    }
    return newBoard;
};

const move = (board: number[][], direction: 'left' | 'right' | 'up' | 'down'): { newBoard: number[][], score: number, moved: boolean } => {
    let currentBoard = board.map(row => [...row]);
    let totalScore = 0;
    let rotations = 0;
    
    if (direction === 'up') { rotations = 1; }
    else if (direction === 'right') { rotations = 2; }
    else if (direction === 'down') { rotations = 3; }

    for(let i=0; i<rotations; i++) {
        currentBoard = rotateBoard(currentBoard);
    }

    let moved = false;
    const newBoard = currentBoard.map(row => {
        const [newRow, score] = slide(row);
        if (JSON.stringify(newRow) !== JSON.stringify(row)) moved = true;
        totalScore += score;
        return newRow;
    });

    let finalBoard = newBoard;
    for(let i=0; i<rotations; i++) {
        finalBoard = rotateBoard(finalBoard);
        finalBoard = rotateBoard(finalBoard);
        finalBoard = rotateBoard(finalBoard);
    }

    return { newBoard: finalBoard, score: totalScore, moved };
};

const isGameOver = (board: number[][]): boolean => {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) return false; // empty cell
      if (r < 3 && board[r][c] === board[r + 1][c]) return false; // can merge down
      if (c < 3 && board[r][c] === board[r][c + 1]) return false; // can merge right
    }
  }
  return true;
};

const tileColors: { [key: number]: string } = {
  2: 'bg-slate-300 text-slate-800', 4: 'bg-slate-400 text-slate-900',
  8: 'bg-orange-300 text-white', 16: 'bg-orange-400 text-white',
  32: 'bg-red-400 text-white', 64: 'bg-red-500 text-white',
  128: 'bg-yellow-300 text-white', 256: 'bg-yellow-400 text-white',
  512: 'bg-yellow-500 text-white', 1024: 'bg-teal-400 text-white',
  2048: 'bg-teal-500 text-white',
};

const Tile: React.FC<{ value: number }> = ({ value }) => {
  const color = tileColors[value] || 'bg-slate-700';
  const textSize = value > 1000 ? 'text-2xl' : value > 100 ? 'text-3xl' : 'text-4xl';
  return (
    <div className={`w-full h-full rounded-lg flex items-center justify-center font-bold ${color} ${textSize}`}>
      {value > 0 ? value : ''}
    </div>
  );
};

export const Game2048Widget: React.FC = () => {
  const [board, setBoard] = useState(getInitialBoard());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  const resetGame = useCallback(() => {
    setBoard(getInitialBoard());
    setScore(0);
    setGameOver(false);
  }, []);

  const handleMove = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver) return;
    const { newBoard, score: moveScore, moved } = move(board, direction);
    if (moved) {
      const boardWithNewTile = addRandomTile(newBoard);
      setBoard(boardWithNewTile);
      setScore(s => s + moveScore);
      if (isGameOver(boardWithNewTile)) {
        setGameOver(true);
      }
    }
  }, [board, gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      switch (e.key) {
        case 'ArrowUp': handleMove('up'); break;
        case 'ArrowDown': handleMove('down'); break;
        case 'ArrowLeft': handleMove('left'); break;
        case 'ArrowRight': handleMove('right'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;

    if (Math.abs(dx) > Math.abs(dy)) { // Horizontal swipe
        if (Math.abs(dx) > 30) handleMove(dx > 0 ? 'right' : 'left');
    } else { // Vertical swipe
        if (Math.abs(dy) > 30) handleMove(dy > 0 ? 'down' : 'up');
    }
    touchStartRef.current = null;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-white bg-slate-800 rounded-xl w-full">
      <div className="flex justify-between items-center w-full max-w-sm mb-4">
        <h3 className="text-xl font-bold text-teal-300">2048</h3>
        <div className="flex items-center gap-4">
            <p className="text-lg">Score: {score}</p>
            <button onClick={resetGame} className="text-slate-400 hover:text-white"><RefreshCwIcon /></button>
        </div>
      </div>
      <div 
        className="relative bg-slate-900 border-2 border-slate-700 rounded-lg p-2 grid grid-cols-4 grid-rows-4 gap-2 w-80 h-80 sm:w-96 sm:h-96"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {gameOver && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 rounded-lg">
                <p className="text-3xl font-bold text-red-500">Game Over</p>
                <button onClick={resetGame} className="mt-4 bg-teal-600 px-4 py-2 rounded-lg">Play Again</button>
            </div>
        )}
        {board.flat().map((value, i) => (
          <div key={i} className="bg-slate-700/50 rounded-lg">
            {value > 0 && <Tile value={value} />}
          </div>
        ))}
      </div>
       <p className="mt-4 text-sm text-slate-400">Use arrow keys or swipe to play.</p>
    </div>
  );
};