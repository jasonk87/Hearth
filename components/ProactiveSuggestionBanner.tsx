import React from 'react';
import type { ProactiveSuggestion } from '../types';
import { SparklesIcon } from './icons';

interface ProactiveSuggestionBannerProps {
  suggestion: ProactiveSuggestion;
  onAccept: (suggestion: ProactiveSuggestion) => void;
  onDismiss: () => void;
}

export const ProactiveSuggestionBanner: React.FC<ProactiveSuggestionBannerProps> = ({ suggestion, onAccept, onDismiss }) => {
  const getAcceptButtonText = () => {
    switch (suggestion.type) {
      case 'grocery':
        return `Add "${suggestion.actionableItem}"`;
      case 'activity':
        return 'Sounds good!';
      default:
        return 'Okay';
    }
  };

  return (
    <div className="bg-teal-700/80 backdrop-blur-xl border border-teal-500/60 rounded-2xl shadow-lg p-4 flex items-center justify-between gap-4 animate-slide-down mb-4">
      <div className="flex items-center gap-3">
        <div className="bg-teal-500 p-2 rounded-full flex-shrink-0">
          <SparklesIcon className="w-6 h-6 text-white" />
        </div>
        <p className="text-white font-medium">{suggestion.suggestion}</p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        {suggestion.type !== 'none' && suggestion.actionableItem && (
          <button
            onClick={() => onAccept(suggestion)}
            className="bg-teal-500 hover:bg-teal-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            {getAcceptButtonText()}
          </button>
        )}
        <button
          onClick={onDismiss}
          className="bg-teal-200/20 hover:bg-teal-200/40 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          Dismiss
        </button>
      </div>
      <style>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};