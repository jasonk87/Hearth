
import React from 'react';
import type { Recipe } from '../types';
import { useDrag } from 'react-dnd';

interface RecipeCardProps {
    recipe: Recipe;
    onClick: () => void;
}

export const DraggableRecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'recipe',
        item: { recipe },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <button
            ref={drag}
            onClick={onClick}
            className={`text-left bg-white/50 p-4 rounded-xl border border-transparent hover:border-teal-500 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:bg-white/80 flex flex-col ${isDragging ? 'opacity-50' : ''}`}
        >
            <h3 className="text-lg font-bold text-teal-700 mb-2">{recipe.recipeName}</h3>
            <p className="text-slate-600 text-sm flex-grow">{recipe.description}</p>
        </button>
    );
};
