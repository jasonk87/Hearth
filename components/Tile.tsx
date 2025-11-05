
import React from 'react';

interface TileProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}

export const Tile: React.FC<TileProps> = ({ title, icon, children, onClick, className = '' }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-lg p-4 flex flex-col cursor-pointer transition-all duration-300 hover:bg-gray-700/70 hover:border-cyan-500/50 hover:scale-105 group ${className}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-lg font-semibold text-cyan-300">{title}</h2>
        <div className="text-gray-500 group-hover:text-cyan-400 transition-colors">
            {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
        </div>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
};
