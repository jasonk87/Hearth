import React, { createContext, useContext, ReactNode } from 'react';
import { Recipe } from '../types';
import { usePersistentState } from './PersistentStateContext';

interface RecipeContextType {
    savedRecipes: Recipe[];
    saveRecipe: (recipe: Recipe) => void;
    removeRecipe: (recipeId: string) => void;
    isRecipeSaved: (recipeId: string) => boolean;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { state, setField } = usePersistentState();
    const savedRecipes = state.savedRecipes;

    const saveRecipe = (recipe: Recipe) => {
        setField('savedRecipes', prev => {
            if (!prev.some(r => r.id === recipe.id)) {
                return [recipe, ...prev];
            }
            return prev;
        });
    };

    const removeRecipe = (recipeId: string) => {
        setField('savedRecipes', prev => prev.filter(r => r.id !== recipeId));
    };

    const isRecipeSaved = (recipeId: string) => {
        return savedRecipes.some(r => r.id === recipeId);
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
