import axios from 'axios';
import { Recipe } from '../types';

const SPOONACULAR_API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY || '5f8fb4a5b53a4f3fb5fc28fdc56b8c4b';
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com/recipes';
const RECIPE_CACHE_KEY = 'hearth-spoonacular-cache-v1';

const mapSpoonacularRecipe = (recipe: any): Recipe => {
    // Collect ingredients
    const ingredientList: string[] = [];
    if (recipe.extendedIngredients) {
        recipe.extendedIngredients.forEach((ing: any) => ingredientList.push(ing.original));
    } else {
        if (recipe.missedIngredients) recipe.missedIngredients.forEach((ing: any) => ingredientList.push(ing.original));
        if (recipe.usedIngredients) recipe.usedIngredients.forEach((ing: any) => ingredientList.push(ing.original));
    }

    // Process instructions
    let instructionList: string[] = [];
    if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
        recipe.analyzedInstructions[0].steps.forEach((step: any) => instructionList.push(step.step));
    } else if (recipe.instructions) {
        instructionList = recipe.instructions.split('\n').filter((step: string) => step.trim() !== '');
    } else {
        instructionList = ["Instructions not available for this recipe."];
    }

    // Strip HTML from summary
    const cleanSummary = recipe.summary ? recipe.summary.replace(/<[^>]*>?/gm, '') : '';

    return {
        id: recipe.id.toString(),
        recipeName: recipe.title,
        description: cleanSummary || "A delicious Spoonacular recipe.",
        ingredients: ingredientList,
        instructions: instructionList,
        prepTime: recipe.readyInMinutes ? `${recipe.readyInMinutes} mins` : undefined,
        imageUrl: recipe.image,
        category: recipe.cuisines && recipe.cuisines.length > 0 ? recipe.cuisines[0] : 'General'
    };
};

export async function getPersonalizedRecipes(userId?: string): Promise<Recipe[]> {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    try {
        const cachedDataString = localStorage.getItem(RECIPE_CACHE_KEY);
        if (cachedDataString) {
            const cache = JSON.parse(cachedDataString);
            if (cache.date === todayKey && cache.recipes) {
                return cache.recipes;
            }
        }
    } catch (e) {
        console.error("Failed to parse recipe cache", e);
    }

    try {
        const response = await axios.get(`${SPOONACULAR_BASE_URL}/random`, {
            params: {
                number: 12,
                apiKey: SPOONACULAR_API_KEY
            }
        });

        if (response.data && response.data.recipes) {
            const recipes = response.data.recipes.map(mapSpoonacularRecipe);
            
            try {
                localStorage.setItem(RECIPE_CACHE_KEY, JSON.stringify({
                    date: todayKey,
                    recipes: recipes
                }));
            } catch (e) {
                console.error("Failed to save recipe cache", e);
            }
            
            return recipes;
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch recipes from Spoonacular", error);
        return [];
    }
}

export async function searchRecipes(query: string): Promise<Recipe[]> {
    try {
        const response = await axios.get(`${SPOONACULAR_BASE_URL}/complexSearch`, {
            params: {
                query: query,
                number: 12,
                addRecipeInformation: true,
                fillIngredients: true,
                instructionsRequired: true,
                apiKey: SPOONACULAR_API_KEY
            }
        });

        if (response.data && response.data.results) {
            return response.data.results.map(mapSpoonacularRecipe);
        }
        return [];
    } catch (error) {
        console.error("Failed to search recipes from Spoonacular", error);
        return [];
    }
}
