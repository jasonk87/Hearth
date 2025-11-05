
import React from 'react';
import { Widget } from './Widget';
import type { Recipe } from '../types';
import { ChefHatIcon, RefreshCwIcon } from './icons';

interface RecipesWidgetProps {
  recipes: Recipe[];
  onClick?: () => void;
  isFetching: boolean;
  className?: string;
}

export const RecipesWidget: React.FC<RecipesWidgetProps> = ({ recipes, onClick, isFetching, className }) => {
  return (
    <Widget 
      title="Meal Ideas" 
      onClick={onClick}
      className={className}
      titleAction={isFetching 
        ? <RefreshCwIcon className="text-teal-700 animate-spin" />
        : <ChefHatIcon className="text-teal-700" />
      }
    >
      <div className="space-y-3 overflow-y-auto max-h-[150px] md:max-h-[200px] pr-2">
        {recipes.length > 0 ? (
          recipes.slice(0, 3).map((recipe, index) => (
            <div key={index} className="p-3 bg-white/30 rounded-lg">
              <h4 className="font-bold text-stone-800 truncate">{recipe.recipeName}</h4>
              <p className="text-sm text-stone-600 truncate">{recipe.description}</p>
            </div>
          ))
        ) : (
          <div className="text-center pt-8">
            <p className="text-stone-600">No meal ideas yet.</p>
            <p className="text-stone-500 text-sm">Click to find recipes!</p>
          </div>
        )}
      </div>
    </Widget>
  );
};
