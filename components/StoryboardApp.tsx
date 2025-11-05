

import React, { useState, useEffect } from 'react';
import type { StoryPage } from '../types';
import { Wand2Icon, RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { MicInputButton } from './MicInputButton';

interface StoryboardAppProps {
  story: StoryPage[];
  isGenerating: boolean;
  onStartStory: (prompt: string) => void;
  onContinueStory: () => void;
  onResetStory: () => void;
}

export const StoryboardApp: React.FC<StoryboardAppProps> = ({ story, isGenerating, onStartStory, onContinueStory, onResetStory }) => {
  const [prompt, setPrompt] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
      if (story.length > 0) {
          setCurrentPage(story.length - 1);
      } else {
          setCurrentPage(0);
      }
  }, [story.length]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onStartStory(prompt);
    }
  };
  
  const handleTranscription = (text: string) => {
    const newPrompt = prompt ? `${prompt} ${text}` : text;
    setPrompt(newPrompt);
  };

  if (isGenerating && story.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-slate-300 gap-4">
        <Wand2Icon className="w-16 h-16 text-teal-400 animate-pulse" />
        <h2 className="text-2xl font-bold">Crafting your story's beginning...</h2>
        <p>Our AI storyteller is dreaming up a magical world.</p>
      </div>
    );
  }

  if (story.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-slate-200">
        <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-teal-300">A New Story Awaits</h2>
            <p className="text-slate-400 mt-2">What magical tale shall we create today?</p>
        </div>
        <form onSubmit={handleStart} className="w-full max-w-lg flex gap-2">
            <div className="relative flex-grow">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A shy dragon who loves to bake..."
                    className="w-full bg-slate-900/50 text-slate-200 p-4 pr-14 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <MicInputButton onTranscription={handleTranscription} />
                </div>
            </div>
          <button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white font-bold p-4 rounded-lg transition-colors flex items-center justify-center">
            <Wand2Icon className="w-6 h-6" />
          </button>
        </form>
      </div>
    );
  }

  const currentStoryPage = story[currentPage];

  return (
    <div className="flex flex-col h-full text-white">
        <div className="flex-grow relative flex items-center justify-center">
            {/* Image */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg">
                <img src={currentStoryPage.imageUrl} alt={`Illustration for story page ${currentPage + 1}`} className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/20"></div>
            </div>

            {/* Text */}
            <div className="relative w-full self-end p-6 bg-black/40 backdrop-blur-sm max-h-1/2 overflow-y-auto">
                <p className="text-lg leading-relaxed">{currentStoryPage.text}</p>
            </div>
             
             {/* Navigation */}
             {currentPage > 0 && (
                <button onClick={() => setCurrentPage(p => p - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/60 transition-colors">
                    <ChevronLeftIcon className="w-8 h-8"/>
                </button>
             )}
              {currentPage < story.length - 1 && (
                <button onClick={() => setCurrentPage(p => p + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/60 transition-colors">
                    <ChevronRightIcon className="w-8 h-8"/>
                </button>
             )}
        </div>
        
        <footer className="flex-shrink-0 p-4 flex justify-between items-center gap-4 border-t border-slate-700">
            <button onClick={onResetStory} className="bg-red-800/80 hover:bg-red-700 text-white font-semibold py-3 px-5 rounded-lg flex items-center gap-2 transition-colors">
                <RefreshCwIcon className="w-5 h-5"/> Start Over
            </button>
            <div className="text-slate-400">Page {currentPage + 1} of {story.length}</div>
            <button 
                onClick={onContinueStory} 
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                disabled={isGenerating || currentPage < story.length - 1}
            >
                {isGenerating ? 'Imagining...' : 'What happens next?'}
                {isGenerating ? <RefreshCwIcon className="w-5 h-5 animate-spin"/> : <Wand2Icon className="w-5 h-5"/>}
            </button>
        </footer>
    </div>
  );
};