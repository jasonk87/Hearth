import React, { createContext, useContext, ReactNode } from 'react';
import { Recipe } from '../types';
import { usePersistentState } from './PersistentStateContext';

interface RecipeContextType {
    savedRecipes: Recipe[];
    saveRecipe: (recipe: Recipe) => void;
    removeRecipe: (recipeId: Recipe['id']) => void;
    isRecipeSaved: (recipeId: Recipe['id']) => boolean;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const recipeKey = (recipe: Recipe): string => recipe.id || `local:${recipe.recipeName}:${recipe.ingredients.join('|')}`;

export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { state, setField } = usePersistentState();
    const savedRecipes = state.savedRecipes;

    const saveRecipe = (recipe: Recipe) => {
        const normalizedRecipe = { ...recipe, id: recipeKey(recipe) };
        setField('savedRecipes', prev => {
            if (!prev.some(r => recipeKey(r) === normalizedRecipe.id)) {
                return [normalizedRecipe, ...prev];
            }
            return prev;
        });
    };

    const removeRecipe = (recipeId: Recipe['id']) => {
        setField('savedRecipes', prev => prev.filter(r => recipeKey(r) !== recipeId));
    };

    const isRecipeSaved = (recipeId: Recipe['id']) => {
        return savedRecipes.some(r => recipeKey(r) === recipeId);
    };

    return (
        <RecipeContext.Provider value={{ savedRecipes, saveRecipe, removeRecipe, isRecipeSaved }}>
            {children}
        </RecipeContext.Provider>
    );
};

export const useRecipes = () => {
    const context = useContext(RecipeContext);
    if (!context) {
        throw new Error('useRecipes must be used within a RecipeProvider');
    }
    return context;
};
