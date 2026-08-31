import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCwIcon } from './icons';

const GRID_SIZE = 20;
const TILE_SIZE = 20; // in pixels

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const getRandomPosition = (snake: Position[] = []): Position => {
    let position: Position;
    do {
        position = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
        };
    } while (snake.some(segment => segment.x === position.x && segment.y === position.y));
    return position;
};

export const SnakeWidget: React.FC = () => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>(getRandomPosition(snake));
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const gameLoopRef = useRef<number>();

  const resetGame = useCallback(() => {
    const startSnake = [{ x: 10, y: 10 }];
    setSnake(startSnake);
    setFood(getRandomPosition(startSnake));
    setDirection('RIGHT');
    setIsGameOver(false);
    setScore(0);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); if (direction !== 'DOWN') setDirection('UP'); break;
      case 'ArrowDown': e.preventDefault(); if (direction !== 'UP') setDirection('DOWN'); break;
      case 'ArrowLeft': e.preventDefault(); if (direction !== 'RIGHT') setDirection('LEFT'); break;
      case 'ArrowRight': e.preventDefault(); if (direction !== 'LEFT') setDirection('RIGHT'); break;
    }
  }, [direction]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const moveSnake = useCallback(() => {
    if (isGameOver) return;

    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      switch (direction) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // Wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setIsGameOver(true);
        return newSnake;
      }

      // Self collision
      for (let i = 1; i < newSnake.length; i++) {
        if (head.x === newSnake[i].x && head.y === newSnake[i].y) {
          setIsGameOver(true);
          return newSnake;
        }
      }

      newSnake.unshift(head);

      // Food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 10);
        setFood(getRandomPosition(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver]);

  useEffect(() => {
    gameLoopRef.current = window.setInterval(moveSnake, 150);
    return () => clearInterval(gameLoopRef.current);
  }, [moveSnake]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-white bg-slate-800 rounded-xl w-full">
      <div className="flex justify-between items-center w-full max-w-sm mb-4">
        <h3 className="text-xl font-bold text-teal-300">Snake</h3>
        <div className="flex items-center gap-4">
            <p className="text-lg">Score: {score}</p>
            <button onClick={resetGame} className="text-slate-400 hover:text-white"><RefreshCwIcon /></button>
        </div>
      </div>
      <div 
        className="relative bg-slate-900 border-2 border-slate-700" 
        style={{ width: GRID_SIZE * TILE_SIZE, height: GRID_SIZE * TILE_SIZE }}
      >
        {isGameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
            <p className="text-3xl font-bold text-red-500">Game Over</p>
            <p>Your score: {score}</p>
            <button onClick={resetGame} className="mt-4 bg-teal-600 px-4 py-2 rounded-lg">Play Again</button>
          </div>
        )}
        {snake.map((segment, index) => (
          <div key={index} className={`absolute ${index === 0 ? 'bg-green-400' : 'bg-green-600'}`} style={{ left: segment.x * TILE_SIZE, top: segment.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }} />
        ))}
        <div className="absolute bg-red-500 rounded-full" style={{ left: food.x * TILE_SIZE, top: food.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }} />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 w-48">
        <div></div>
        <button onClick={() => direction !== 'DOWN' && setDirection('UP')} className="bg-slate-700 p-2 rounded-lg">▲</button>
        <div></div>
        <button onClick={() => direction !== 'RIGHT' && setDirection('LEFT')} className="bg-slate-700 p-2 rounded-lg">◀</button>
        <button onClick={() => direction !== 'UP' && setDirection('DOWN')} className="bg-slate-700 p-2 rounded-lg">▼</button>
        <button onClick={() => direction !== 'LEFT' && setDirection('RIGHT')} className="bg-slate-700 p-2 rounded-lg">▶</button>
      </div>
    </div>
  );
};
