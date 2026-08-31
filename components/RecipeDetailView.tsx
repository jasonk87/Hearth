

import React from 'react';
import type { Recipe } from '../types';
import { XIcon, ShoppingCartIcon, ChefHatIcon, HeartIcon } from './icons';
import { useRecipes } from '../contexts/RecipeContext';

interface RecipeDetailViewProps {
  recipe: Recipe;
  onClose: () => void;
  onAddToGroceryList: (recipe: Recipe) => void;
  onScheduleDinner: (recipe: Recipe) => void;
}

export const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({ recipe, onClose, onAddToGroceryList, onScheduleDinner }) => {
  const { isRecipeSaved, saveRecipe, removeRecipe } = useRecipes();
  const saved = isRecipeSaved(recipe.id);

  const toggleSave = () => {
      if (saved) {
          removeRecipe(recipe.id);
      } else {
          saveRecipe(recipe);
      }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-50/95 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl animate-slide-up-fast flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-start p-4 border-b border-slate-200/80 flex-shrink-0">
          <div>
              <h3 className="text-xl font-bold text-teal-600">{recipe.recipeName}</h3>
              {recipe.category && <span className="text-sm text-slate-500 font-medium">{recipe.category}</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={toggleSave} className={`p-2 rounded-full transition-colors ${saved ? 'bg-rose-100 text-rose-500 hover:bg-rose-200' : 'hover:bg-slate-200 text-slate-400'}`}>
              <HeartIcon className={`w-6 h-6 ${saved ? 'fill-current' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
              <XIcon className="w-6 h-6 text-slate-500" />
            </button>
          </div>
        </header>

        <main className="p-6 flex-grow overflow-y-auto text-slate-600 space-y-6">
          {recipe.imageUrl && (
              <img src={recipe.imageUrl} alt={recipe.recipeName} className="w-full h-64 object-cover rounded-xl shadow-sm" />
          )}
          <div>
            <h4 className="text-lg font-semibold text-teal-700 mb-2">Description</h4>
            <p>{recipe.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-teal-700 mb-2">Ingredients</h4>
              <ul className="list-disc list-inside space-y-1">
                {recipe.ingredients.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-teal-700 mb-2">Instructions</h4>
              <ol className="list-decimal list-inside space-y-2">
                {recipe.instructions.map((step, index) => <li key={index}>{step}</li>)}
              </ol>
            </div>
          </div>
        </main>
        
        <footer className="p-4 border-t border-slate-200/80 bg-slate-100/50 rounded-b-2xl flex justify-between items-center">
           <button
            onClick={() => onScheduleDinner(recipe)}
            className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            <ChefHatIcon className="w-5 h-5" />
            Schedule for Dinner
          </button>
          <button
            onClick={() => onAddToGroceryList(recipe)}
            className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            <ShoppingCartIcon className="w-5 h-5" />
            Add Ingredients to List
          </button>
        </footer>
      </div>
    </div>
  );
};
