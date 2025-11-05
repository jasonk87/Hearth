
import React from 'react';
import { RefreshCwIcon } from './icons';

interface LoaderProps {
  message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-800/80 p-6 rounded-2xl w-full max-w-sm flex flex-col items-center gap-4 border border-slate-700/60">
        <RefreshCwIcon className="w-10 h-10 text-teal-400 animate-spin" />
        <p className="text-slate-300 text-lg font-semibold">{message}</p>
      </div>
    </div>
  );
};
