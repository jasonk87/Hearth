import React from 'react';
import { useDrop } from 'react-dnd';
import type { Recipe } from '../types';
import { useToast } from './Toast';
import { DraggableRecipeCard } from './DraggableRecipeCard';
import { useRecipes } from '../contexts/RecipeContext';
import { toLocalDateKey } from '../services/dateService';
import { Trash2Icon } from './icons';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getRecipeKey = (recipe: Recipe) => recipe.id ?? recipe.recipeName;

interface MealPlannerAppProps {
    onAddCalendarEvent: (title: string, date: string, time: string) => void;
    onScheduleDinner: (dateKey: string, recipe: Recipe) => void;
    onRemoveDinner: (dateKey: string) => void;
    dinnerPlan: Record<string, Recipe>;
}

const DayColumn: React.FC<{ 
    day: string; 
    dateKey: string;
    recipe?: Recipe; 
    onDrop: (dateKey: string, recipe: Recipe) => void; 
    onRemove: (dateKey: string) => void; 
}> = ({ day, dateKey, recipe, onDrop, onRemove }) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'recipe',
        drop: (item: { recipe: Recipe }) => onDrop(dateKey, item.recipe),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    return (
        <div ref={drop} className={`bg-slate-100/80 rounded-lg p-3 h-full flex flex-col ${isOver ? 'bg-teal-100' : ''}`}>
            <h3 className="font-bold text-lg text-teal-600 mb-1 text-center">{day}</h3>
            <p className="text-xs text-slate-500 text-center mb-3">{new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            <div className="space-y-2 flex-grow overflow-y-auto">
                {recipe ? (
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        {recipe.imageUrl && (
                            <img src={recipe.imageUrl} alt={recipe.recipeName} className="h-24 w-full object-cover" />
                        )}
                        <p className="truncate p-2 text-xs font-semibold">{recipe.recipeName}</p>
                        <button
                            type="button"
                            onClick={() => onRemove(dateKey)}
                            aria-label={`Remove ${recipe.recipeName} from ${day}`}
                            className="flex min-h-11 w-full items-center justify-center gap-1 border-t border-red-100 bg-red-50 px-2 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 active:bg-red-200"
                        >
                            <Trash2Icon className="h-4 w-4 shrink-0" />
                            <span>Remove</span>
                        </button>
                    </div>
                ) : (
                    <div className="text-center text-slate-400 text-sm pt-4 italic">Drop recipe here</div>
                )}
            </div>
        </div>
    );
};

export const MealPlannerApp: React.FC<MealPlannerAppProps> = ({ onAddCalendarEvent, onScheduleDinner, onRemoveDinner, dinnerPlan }) => {
    const { showToast } = useToast();
    const { savedRecipes } = useRecipes();

    const today = new Date();
    const currentDayOfWeek = today.getDay();

    const handleDrop = (dateKey: string, recipe: Recipe) => {
        onScheduleDinner(dateKey, recipe);
        onAddCalendarEvent(`Dinner: ${recipe.recipeName}`, dateKey, '6:00 PM');
    };

    const handleRemove = (dateKey: string) => {
        onRemoveDinner(dateKey);
        showToast('Dinner removed from schedule.', 'info');
    };

    return (
        <div className="flex h-full flex-col gap-4 lg:flex-row">
            {/* Left side: Available Recipes */}
            <div className="flex max-h-72 w-full flex-col lg:max-h-none lg:w-1/3">
                 <h2 className="text-2xl font-bold mb-4 text-slate-800">Saved Recipes</h2>
                 <div className="flex-grow overflow-y-auto pr-2 grid grid-cols-1 gap-3">
                    {savedRecipes.map((recipe) => (
                        <DraggableRecipeCard key={getRecipeKey(recipe)} recipe={recipe} onClick={() => {}} />
                    ))}
                    {savedRecipes.length === 0 && (
                        <div className="text-center text-slate-500 py-10">
                            <p>No saved recipes yet. Head over to the Recipes tab and save some favorites first!</p>
                        </div>
                    )}
                 </div>
            </div>

            {/* Right side: Meal Planner */}
            <div className="flex min-h-0 min-w-0 w-full flex-col lg:w-2/3">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">Weekly Meal Planner</h2>
                    <span className="text-slate-500 text-sm font-medium bg-slate-100 px-3 py-1 rounded-full">Auto-saves to Calendar</span>
                </div>
                <div className="flex-grow overflow-x-auto pb-3 touch-pan-x">
                    <div className="grid h-full min-w-[980px] grid-cols-7 gap-3">
                        {days.map((day, index) => {
                            const targetDate = new Date(today);
                            targetDate.setDate(today.getDate() - currentDayOfWeek + index);
                            const dateKey = toLocalDateKey(targetDate);

                            return (
                                <DayColumn
                                    key={day}
                                    day={day}
                                    dateKey={dateKey}
                                    recipe={dinnerPlan[dateKey]}
                                    onDrop={handleDrop}
                                    onRemove={handleRemove}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
