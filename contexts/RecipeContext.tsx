import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Recipe } from '../types';

interface RecipeContextType {
    savedRecipes: Recipe[];
    saveRecipe: (recipe: Recipe) => void;
    removeRecipe: (recipeId: string) => void;
    isRecipeSaved: (recipeId: string) => boolean;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const SAVED_RECIPES_KEY = 'hearth_saved_recipes';

export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [savedRecipes, setSavedRecipes] = useState<Recipe[]>(() => {
        try {
            const saved = localStorage.getItem(SAVED_RECIPES_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load saved recipes", e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(savedRecipes));
    }, [savedRecipes]);

    const saveRecipe = (recipe: Recipe) => {
        setSavedRecipes(prev => {
            if (!prev.some(r => r.id === recipe.id)) {
                return [recipe, ...prev];
            }
            return prev;
        });
    };

    const removeRecipe = (recipeId: string) => {
        setSavedRecipes(prev => prev.filter(r => r.id !== recipeId));
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
