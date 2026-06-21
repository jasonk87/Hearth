
import React, { useState, useCallback } from 'react';
import type { Recipe } from '../types';
import { RefreshCwIcon } from './icons';
import { MicInputButton } from './MicInputButton';
import { DraggableRecipeCard } from './DraggableRecipeCard';
import { useRecipes } from '../contexts/RecipeContext';

interface RecipesAppProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  isFetching: boolean;
  onSearch: (query: string) => void;
}

export const RecipesApp: React.FC<RecipesAppProps> = ({ recipes, onSelectRecipe, isFetching, onSearch }) => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'discover' | 'saved'>('discover');
  const { savedRecipes } = useRecipes();
  
  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (prompt.trim()) {
        onSearch(prompt);
      }
  };
  
  const handleTranscription = (text: string) => {
    const newPrompt = prompt ? `${prompt} ${text}` : text;
    setPrompt(newPrompt);
    onSearch(newPrompt);
  };

  return (
    <div className="flex flex-col h-full text-slate-800">
      <header className="mb-4 space-y-4">
        <div className="flex border-b border-slate-200">
           <button 
             onClick={() => setActiveTab('discover')}
             className={`pb-2 px-4 font-semibold transition-colors ${activeTab === 'discover' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
           >
             Discover
           </button>
           <button 
             onClick={() => setActiveTab('saved')}
             className={`pb-2 px-4 font-semibold transition-colors ${activeTab === 'saved' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
           >
             Saved Recipes ({savedRecipes.length})
           </button>
        </div>

        {activeTab === 'discover' && (
          <form onSubmit={handleSearch} className="flex gap-2">
             <div className="relative flex-grow">
               <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'quick vegan lunches'..."
                  className="w-full bg-slate-100/80 text-slate-800 p-3 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  disabled={isFetching}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <MicInputButton onTranscription={handleTranscription} />
                </div>
             </div>
            <button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2" disabled={isFetching}>
              {isFetching ? <RefreshCwIcon className="animate-spin" /> : 'Search'}
            </button>
          </form>
        )}
      </header>
      
      {error && <p className="text-center text-red-500">{error}</p>}

      {isFetching && activeTab === 'discover' ? (
        <div className="flex-grow flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-500">
                <RefreshCwIcon className="w-8 h-8 animate-spin" />
                <span>Finding delicious ideas...</span>
            </div>
        </div>
        ) : (
        <div 
          className="flex-grow overflow-y-auto pr-2 grid gap-6 items-start auto-rows-max pb-6"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
        >
          {(activeTab === 'discover' ? recipes : savedRecipes).map((recipe, index) => (
            <DraggableRecipeCard
              key={recipe.id || index}
              recipe={recipe}
              onClick={() => onSelectRecipe(recipe)}
            />
          ))}
           {activeTab === 'discover' && recipes.length === 0 && !isFetching && (
                <div className="text-center text-slate-500 md:col-span-2 lg:col-span-3 py-10">
                    <p className="text-lg">No recipes to show.</p>
                    <p>Try searching for something or switch profiles for new suggestions.</p>
                </div>
            )}
           {activeTab === 'saved' && savedRecipes.length === 0 && (
                <div className="text-center text-slate-500 md:col-span-2 lg:col-span-3 py-10">
                    <p className="text-lg">No saved recipes yet.</p>
                    <p>Heart a recipe in the Discover tab to save it here!</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};
