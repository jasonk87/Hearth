
import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import type { Recipe } from '../types';
import { useToast } from './Toast';
import { DraggableRecipeCard } from './DraggableRecipeCard';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface MealPlan {
    [day: string]: Recipe[];
}

interface MealPlannerAppProps {
    recipes: Recipe[];
    onAddCalendarEvent: (dayIndex: number, title: string, time: string) => void;
    onAddGroceryItem: (name: string, section?: string) => void;
}

const DayColumn: React.FC<{ day: string; recipes: Recipe[]; onDrop: (day: string, recipe: Recipe) => void; onRemove: (day: string, recipeId: number) => void; }> = ({ day, recipes, onDrop, onRemove }) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'recipe',
        drop: (item: { recipe: Recipe }) => onDrop(day, item.recipe),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    return (
        <div ref={drop} className={`bg-slate-100/80 rounded-lg p-3 h-full flex flex-col ${isOver ? 'bg-teal-100' : ''}`}>
            <h3 className="font-bold text-lg text-teal-600 mb-3 text-center">{day}</h3>
            <div className="space-y-2 flex-grow overflow-y-auto">
                {recipes.map((recipe, index) => (
                    <div key={index} className="bg-white p-2 rounded-lg shadow relative">
                        <p className="font-semibold text-sm pr-4">{recipe.recipeName}</p>
                        <button onClick={() => onRemove(day, recipe.id)} className="absolute top-1 right-1 text-slate-400 hover:text-red-500 text-xs">✕</button>
                    </div>
                ))}
                {recipes.length === 0 && <div className="text-center text-slate-400 text-sm pt-4">Drop recipes here</div>}
            </div>
        </div>
    );
};

export const MealPlannerApp: React.FC<MealPlannerAppProps> = ({ recipes, onAddCalendarEvent, onAddGroceryItem }) => {
    const [mealPlan, setMealPlan] = useState<MealPlan>({});
    const { showToast } = useToast();

    const handleDrop = (day: string, recipe: Recipe) => {
        setMealPlan(prev => {
            const dayRecipes = prev[day] || [];
            if (dayRecipes.some(r => r.id === recipe.id)) {
                return prev; // Avoid duplicates
            }
            return {
                ...prev,
                [day]: [...dayRecipes, recipe],
            };
        });
    };

    const handleRemove = (day: string, recipeId: number) => {
        setMealPlan(prev => ({
            ...prev,
            [day]: prev[day].filter(r => r.id !== recipeId),
        }));
    };

    const handleFinalizePlan = () => {
        let groceryCount = 0;
        let eventCount = 0;
        const today = new Date();
        const currentDayOfWeek = today.getDay();

        Object.entries(mealPlan).forEach(([day, recipes]) => {
            if (recipes.length > 0) {
                const dayIndex = days.indexOf(day);
                let dayOffset = dayIndex - currentDayOfWeek;
                if (dayOffset < 0) dayOffset += 7; // Ensure future date

                recipes.forEach(recipe => {
                    // Add calendar event for dinner
                    onAddCalendarEvent(dayOffset, `${recipe.recipeName}`, '6:00 PM');
                    eventCount++;

                    // Add ingredients to grocery list
                    recipe.ingredients.forEach(ingredient => {
                        const name = ingredient.split(/\s*,\s*|\s+of\s+/).pop()?.trim() || ingredient;
                        onAddGroceryItem(name.charAt(0).toUpperCase() + name.slice(1));
                        groceryCount++;
                    });
                });
            }
        });

        if (eventCount > 0 || groceryCount > 0) {
            showToast(`Added ${eventCount} dinner plans and ${groceryCount} items to your grocery list.`, 'success');
            setMealPlan({});
        } else {
            showToast(`Your meal plan is empty. Drag some recipes over first!`, 'error');
        }
    };

    return (
        <div className="flex h-full gap-4">
            {/* Left side: Available Recipes */}
            <div className="w-1/3 flex flex-col">
                 <h2 className="text-2xl font-bold mb-4 text-slate-800">Available Recipes</h2>
                 <div className="flex-grow overflow-y-auto pr-2 grid grid-cols-1 gap-3">
                    {recipes.map((recipe) => (
                        // We pass a dummy onClick because DraggableRecipeCard requires it.
                        // In this view, clicking does nothing as we only want to drag.
                        <DraggableRecipeCard key={recipe.id} recipe={recipe} onClick={() => {}} />
                    ))}
                    {recipes.length === 0 && (
                        <div className="text-center text-slate-500 py-10">
                            <p>No recipes found. Try searching in the Recipes tab first.</p>
                        </div>
                    )}
                 </div>
            </div>

            {/* Right side: Meal Planner */}
            <div className="w-2/3 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">Weekly Meal Planner</h2>
                    <button
                        onClick={handleFinalizePlan}
                        className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        Finalize Plan
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-3 flex-grow">
                    {days.map(day => (
                        <DayColumn
                            key={day}
                            day={day}
                            recipes={mealPlan[day] || []}
                            onDrop={handleDrop}
                            onRemove={handleRemove}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
