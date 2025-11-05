
import { GoogleGenAI, FunctionDeclaration, Type, Blob, Modality } from '@google/genai';
import type { User, Recipe, CalendarEvent, WeatherData, GroceryItem, ProactiveSuggestion, HangmanWord } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Recipe Generation ---

const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        recipes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    recipeName: { type: Type.STRING, description: "The name of the recipe." },
                    description: { type: Type.STRING, description: "A short, enticing description of the dish." },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of ingredients, including quantities." },
                    instructions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Step-by-step cooking instructions." },
                },
                required: ["recipeName", "description", "ingredients", "instructions"]
            }
        }
    },
    required: ["recipes"]
};

const RECIPE_CACHE_KEY = 'hearth-recipes-cache';

type MealType = 'breakfast' | 'lunch' | 'dinner';

interface RecipeCacheEntry {
    date: string; // YYYY-MM-DD
    breakfast?: Recipe[];
    lunch?: Recipe[];
    dinner?: Recipe[];
}

interface RecipeCache {
    [userId: string]: RecipeCacheEntry;
}

export async function getPersonalizedRecipes(): Promise<Recipe[]> {
    const todayKey = new Date().toISOString().split('T')[0];
    const hours = new Date().getHours();
    const mealType: MealType = hours < 11 ? 'breakfast' : hours < 16 ? 'lunch' : 'dinner';
    const familyUserId = 'family';

    // 1. Check cache
    try {
        const cachedDataString = localStorage.getItem(RECIPE_CACHE_KEY);
        if (cachedDataString) {
            const recipeCache: RecipeCache = JSON.parse(cachedDataString);
            const userCache = recipeCache[familyUserId];
            
            // Check if cache is for today and if the specific meal type is cached
            if (userCache && userCache.date === todayKey && userCache[mealType]) {
                return userCache[mealType]!;
            }
        }
    } catch (e) {
        console.error("Failed to read recipe cache:", e);
        localStorage.removeItem(RECIPE_CACHE_KEY); // Clear corrupted cache
    }
    
    // 2. If no valid cache, fetch from API
    const userContext = 'the whole family, which may include parents and kids';

    const prompt = `You are a helpful recipe assistant for a smart display. Suggest 3 interesting but not too complicated ${mealType} recipes suitable for ${userContext}.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: recipeSchema,
        },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    
    if (parsed.recipes && Array.isArray(parsed.recipes)) {
        // 3. Update cache
        try {
            const cachedDataString = localStorage.getItem(RECIPE_CACHE_KEY);
            const recipeCache: RecipeCache = cachedDataString ? JSON.parse(cachedDataString) : {};
            
            // Get or create the user cache entry for today
            let userCache = recipeCache[familyUserId];
            if (!userCache || userCache.date !== todayKey) {
                userCache = { date: todayKey };
            }

            // Update the specific meal type
            userCache[mealType] = parsed.recipes;
            recipeCache[familyUserId] = userCache;
            
            localStorage.setItem(RECIPE_CACHE_KEY, JSON.stringify(recipeCache));
        } catch (e) {
            console.error("Failed to write to recipe cache:", e);
        }
        
        return parsed.recipes;
    }
    throw new Error("Invalid format received for personalized recipes.");
}

export async function searchRecipes(query: string): Promise<Recipe[]> {
    const prompt = `Find 5 recipes for ${query}.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: recipeSchema,
        },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);

    if (parsed.recipes && Array.isArray(parsed.recipes)) {
        return parsed.recipes;
    }
    throw new Error("Invalid format received for recipe search.");
}

export async function generateDailyBriefing(
    events: CalendarEvent[],
    weather: WeatherData
): Promise<string> {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    const eventsString = events.length > 0
        ? `Here are the events for today: ${events.map(e => `${e.title} at ${e.time}`).join(', ')}.`
        : "You have no events scheduled for today.";
        
    const weatherString = `The forecast is ${weather.condition.replace('-', ' ')} with a high of ${weather.temp} degrees.`;

    const prompt = `
        You are a friendly and helpful smart display assistant. 
        Create a short, conversational daily briefing for the family.
        Today is ${today}.
        Keep it concise and positive, under 100 words.
        Here is the information to include:
        1. Weather: ${weatherString}
        2. Calendar: ${eventsString}
        
        Start with a warm greeting like "Good morning, family." and end with an encouraging phrase.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
    });

    return response.text.trim();
}

export async function getBriefingAudio(text: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' }, // A calm, friendly voice
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Failed to generate audio for the briefing.");
    }
    return base64Audio;
}

// --- Storyboard Generation ---
export async function generateStorySegment(prompt: string, existingStory: string = ''): Promise<string> {
    const fullPrompt = existingStory 
        ? `Continue this children's story. Keep the tone whimsical and imaginative. Write only one or two new paragraphs. STORY SO FAR:\n\n${existingStory}\n\n CONTINUE THE STORY:`
        : `Write the beginning of a children's story based on this prompt: "${prompt}". Keep the tone whimsical and imaginative. Write only one or two paragraphs.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: fullPrompt,
        config: {
            temperature: 0.8,
            topP: 0.95,
        }
    });

    return response.text.trim();
}

export async function generateStoryImage(textSegment: string): Promise<string> {
    const prompt = `A beautiful, whimsical, watercolor illustration for a children's storybook, depicting the following scene: ${textSegment}`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '4:3',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    if (!base64ImageBytes) {
        throw new Error("Image generation failed.");
    }
    return `data:image/png;base64,${base64ImageBytes}`;
}


// --- Proactive Assistant ---

const proactiveSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        type: {
            type: Type.STRING,
            description: "The type of suggestion. Options: 'grocery', 'activity', 'none'.",
        },
        suggestion: {
            type: Type.STRING,
            description: "The text to display to the user. E.g., 'I see Taco Night on your calendar. Should I add tortillas to the grocery list?'"
        },
        actionableItem: {
            type: Type.STRING,
            description: "If applicable, the item to act on. For 'grocery', this is the item to add. E.g., 'Tortillas'."
        }
    },
    required: ["type", "suggestion"]
};

export async function getProactiveSuggestion(
    events: CalendarEvent[],
    groceryList: GroceryItem[],
    weather: WeatherData
): Promise<ProactiveSuggestion | null> {
    const relevantEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        const today = new Date();
        today.setHours(0,0,0,0);
        const diffDays = (eventDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 3; // Look at today and next 3 days
    }).map(e => ({ title: e.title, date: e.date }));

    const incompleteGroceries = groceryList.filter(i => !i.completed).map(i => i.name);
    
    const prompt = `
        You are a clever and proactive home assistant for a family. Your goal is to find one helpful, non-obvious connection between the family's data to offer a suggestion.
        Current Date: ${new Date().toDateString()}
        Family's Calendar Events for the next few days: ${JSON.stringify(relevantEvents)}
        Family's Current Grocery List (incomplete items): ${JSON.stringify(incompleteGroceries)}
        Today's Weather: The forecast is ${weather.condition} with a high of ${weather.temp} degrees.

        Analyze the data and find a single suggestion. Here are some ideas:
        - If an event looks like a meal (e.g., "Taco Night", "Pizza Party"), check the grocery list for key ingredients. If a common ingredient is missing, suggest adding it.
        - If the weather is rainy or stormy, suggest an indoor activity like playing a game or trying a new recipe.
        - If a calendar event mentions a specific person (e.g., "Lunch with Bob"), it's probably not a meal to prepare for.

        **IMPORTANT**:
        - Only make ONE suggestion.
        - Do not be repetitive.
        - If you cannot find a good, genuinely helpful suggestion, you MUST return 'none' for the type.
        - Your response must be in JSON format.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: proactiveSuggestionSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText) as ProactiveSuggestion;

        // Basic validation
        if (parsed && typeof parsed.type === 'string' && typeof parsed.suggestion === 'string') {
            if (parsed.type === 'none') {
                return null;
            }
            // Ensure actionableItem exists for grocery type
            if (parsed.type === 'grocery' && !parsed.actionableItem) {
                console.warn("Proactive suggestion of type 'grocery' missing 'actionableItem'.");
                return null;
            }
            return parsed;
        }
        return null;
    } catch (error) {
        console.error("Failed to get proactive suggestion:", error);
        return null;
    }
}

// --- Hangman Game ---
const hangmanWordSchema = {
    type: Type.OBJECT,
    properties: {
        word: {
            type: Type.STRING,
            description: "A single, family-friendly English word, between 5 and 10 letters long. Should be lowercase."
        },
        hint: {
            type: Type.STRING,
            description: "A short, clever hint for the word."
        },
    },
    required: ["word", "hint"]
};

export async function getHangmanWord(): Promise<HangmanWord> {
    const prompt = `Generate a single, moderately difficult, family-friendly English word for a game of Hangman. The word should be between 5 and 10 letters long. Also, provide a short hint for the word. Ensure the word is lowercase.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: hangmanWordSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        if (parsed.word && parsed.hint && /^[a-z]{5,10}$/.test(parsed.word)) {
            return parsed;
        }
        console.warn("Model returned invalid Hangman word format, using fallback.", parsed);
        return { word: "family", hint: "A group of people living together" };

    } catch (error) {
        console.error("Failed to get Hangman word from Gemini:", error);
        return { word: "hearth", hint: "The floor of a fireplace" };
    }
}


// --- Weather ---
export async function getWeatherForecast(): Promise<WeatherData[]> {
    const weatherSchema = {
        type: Type.OBJECT,
        properties: {
            forecast: {
                type: Type.ARRAY,
                description: "An array of 7 daily weather forecast objects.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        day: { type: Type.STRING, description: "The abbreviated day of the week (e.g., 'Mon')." },
                        temp: { type: Type.INTEGER, description: "The average temperature in Fahrenheit." },
                        condition: {
                            type: Type.STRING,
                            enum: ['sunny', 'cloudy', 'rainy', 'stormy', 'partly-cloudy'],
                            description: "The weather condition."
                        },
                        hourly: {
                            type: Type.ARRAY,
                            description: "Optional hourly forecast, only for the first day (today).",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    time: { type: Type.STRING, description: "The time (e.g., '9 AM', '12 PM')." },
                                    temp: { type: Type.INTEGER, description: "The temperature at that hour." },
                                    condition: {
                                        type: Type.STRING,
                                        enum: ['sunny', 'cloudy', 'rainy', 'stormy', 'partly-cloudy'],
                                        description: "The weather condition at that hour."
                                    },
                                },
                                required: ["time", "temp", "condition"]
                            }
                        }
                    },
                    required: ["day", "temp", "condition"]
                }
            }
        },
        required: ["forecast"]
    };

    const today = new Date();
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayDayName = daysOfWeek[today.getDay()];

    const prompt = `
        Generate a realistic 7-day weather forecast for a generic mid-latitude city.
        Today is ${todayDayName}. The forecast should start from today.
        For each day, provide the abbreviated day of the week, an average temperature in Fahrenheit (e.g., between 50 and 85), and a condition from the allowed enum.
        For the first day's forecast (today), ALSO include a simple hourly breakdown for 9 AM, 12 PM, 3 PM, and 6 PM.
        The other six days should not have an hourly breakdown.
        Ensure the days of the week are in the correct sequence starting from today (${todayDayName}).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: weatherSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        if (parsed.forecast && Array.isArray(parsed.forecast) && parsed.forecast.length > 0) {
            return parsed.forecast;
        }
    } catch (error) {
        console.error("Failed to generate weather forecast from Gemini:", error);
        // Fallback to mock data on error
        return [
            { day: 'Mon', temp: 72, condition: 'sunny', hourly: [{time: '3 PM', temp: 75, condition: 'sunny'}] },
            { day: 'Tue', temp: 68, condition: 'partly-cloudy' },
            { day: 'Wed', temp: 65, condition: 'rainy' },
            { day: 'Thu', temp: 70, condition: 'cloudy' },
            { day: 'Fri', temp: 75, condition: 'sunny' },
            { day: 'Sat', temp: 78, condition: 'sunny' },
            { day: 'Sun', temp: 76, condition: 'partly-cloudy' },
        ];
    }

    throw new Error("Failed to get weather data.");
}


// --- Function Declarations for Voice Assistant ---

export const launchAppFunctionDeclaration: FunctionDeclaration = {
    name: 'launchApp',
    parameters: {
        type: Type.OBJECT,
        description: 'Opens or launches a specific full-screen application view.',
        properties: {
            appName: {
                type: Type.STRING,
                description: 'The name of the app to launch. Valid options are "calendar", "games", "notes", "grocery", "storyboard".',
            },
        },
        required: ['appName'],
    },
};

export const addNoteFunctionDeclaration: FunctionDeclaration = {
    name: 'addNote',
    parameters: {
        type: Type.OBJECT,
        description: 'Adds a new sticky note to the board.',
        properties: {
            noteText: {
                type: Type.STRING,
                description: 'The content of the note to add, e.g., "Remember to buy milk".'
            },
        },
        required: ['noteText'],
    },
};

export const deleteNoteFunctionDeclaration: FunctionDeclaration = {
    name: 'deleteNote',
    parameters: {
        type: Type.OBJECT,
        description: 'Deletes a sticky note from the board based on its content.',
        properties: {
            noteText: {
                type: Type.STRING,
                description: 'A key phrase from the note to identify it for deletion, e.g., "buy milk".'
            },
        },
        required: ['noteText'],
    },
};

export const addGroceryItemFunctionDeclaration: FunctionDeclaration = {
    name: 'addGroceryItem',
    parameters: {
        type: Type.OBJECT,
        description: 'Adds a new item to the grocery list.',
        properties: {
            itemName: {
                type: Type.STRING,
                description: 'The name of the grocery item, e.g., "milk" or "apples".',
            },
        },
        required: ['itemName'],
    },
};

export const completeGroceryItemFunctionDeclaration: FunctionDeclaration = {
    name: 'completeGroceryItem',
    parameters: {
        type: Type.OBJECT,
        description: 'Marks a grocery item as complete or purchased.',
        properties: {
            itemName: {
                type: Type.STRING,
                description: 'The name of the grocery item to mark as complete.',
            },
        },
        required: ['itemName'],
    },
};

export const clearCompletedGroceriesFunctionDeclaration: FunctionDeclaration = {
    name: 'clearCompletedGroceries',
    parameters: {
        type: Type.OBJECT,
        description: 'Removes all completed items from the grocery list.',
        properties: {},
    },
};

export const addCalendarEventFunctionDeclaration: FunctionDeclaration = {
    name: 'addCalendarEvent',
    parameters: {
        type: Type.OBJECT,
        description: 'Adds a new event to the calendar for one of the next 7 days.',
        properties: {
            day: {
                type: Type.STRING,
                description: 'The day for the event. Can be a weekday like "Monday", or relative like "today" or "tomorrow".'
            },
            time: {
                type: Type.STRING,
                description: 'The time of the event, e.g., "3 PM" or "10:30 AM".'
            },
            title: {
                type: Type.STRING,
                description: 'The title or description of the event, e.g., "Dentist appointment".'
            },
        },
        required: ['day', 'time', 'title'],
    },
};

export const editCalendarEventFunctionDeclaration: FunctionDeclaration = {
    name: 'editCalendarEvent',
    parameters: {
        type: Type.OBJECT,
        description: 'Edits an existing calendar event. Can change the title, time, or add participants.',
        properties: {
            day: {
                type: Type.STRING,
                description: 'The day of the event to edit. Can be "today", "tomorrow", or a weekday.'
            },
            originalTitle: {
                type: Type.STRING,
                description: 'The current title of the event to identify it.'
            },
            newTitle: {
                type: Type.STRING,
                description: 'The new title for the event, if it needs to be changed.'
            },
            newTime: {
                type: Type.STRING,
                description: 'The new time for the event, if it needs to be changed.'
            },
            participantToAdd: {
                type: Type.STRING,
                description: 'The name of a person to add to the event participants list.'
            }
        },
        required: ['day', 'originalTitle'],
    },
};

export const deleteCalendarEventFunctionDeclaration: FunctionDeclaration = {
    name: 'deleteCalendarEvent',
    parameters: {
        type: Type.OBJECT,
        description: 'Deletes an event from the calendar based on its title and time.',
        properties: {
            day: {
                type: Type.STRING,
                description: 'The day of the event to delete. Can be a weekday or relative like "today" or "tomorrow".'
            },
            title: {
                type: Type.STRING,
                description: 'The title of the event to delete. Must be an exact or close match.'
            },
            time: {
                type: Type.STRING,
                description: 'The time of the event to help identify it, e.g., "6 PM".'
            }
        },
        required: ['day', 'title'],
    },
};

export const setDinnerPlanFunctionDeclaration: FunctionDeclaration = {
    name: 'setDinnerPlan',
    parameters: {
        type: Type.OBJECT,
        description: 'Sets or updates the dinner plan for a specific day.',
        properties: {
            day: {
                type: Type.STRING,
                description: 'The day for the dinner plan. Can be a weekday like "Monday", or relative like "today" or "tomorrow".'
            },
            mealName: {
                type: Type.STRING,
                description: 'The name of the meal for dinner, e.g., "Spaghetti Bolognese" or "Taco Night".'
            },
        },
        required: ['day', 'mealName'],
    },
};

export const startStoryFunctionDeclaration: FunctionDeclaration = {
    name: 'startStory',
    parameters: {
        type: Type.OBJECT,
        description: 'Starts a new AI-generated story.',
        properties: {
            prompt: {
                type: Type.STRING,
                description: "The initial prompt for the story, e.g., 'A cat who wants to be a pirate'."
            },
        },
        required: ['prompt'],
    },
};

// --- Audio Transcription ---
export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
    try {
        const audioPart = {
            inlineData: {
                mimeType,
                data: base64Audio,
            },
        };
        const textPart = { text: "Transcribe the following audio precisely and accurately." };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [audioPart, textPart] },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error in audio transcription:", error);
        throw new Error("Failed to transcribe audio.");
    }
}

// FIX: Added missing recognizeUser function to resolve import error in UserRecognition.tsx.
// --- User Recognition ---
export async function recognizeUser(base64Image: string, enrolledUsers: User[]): Promise<string | null> {
    if (enrolledUsers.length === 0) {
        return null;
    }

    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
        },
    };

    const userList = enrolledUsers.map(u => `- ${u.name} (id: ${u.id})`).join('\n');

    const textPart = { text: `From the following list of users, who is in this image? Respond with ONLY their user ID. If no one from the list is clearly identifiable, respond with "none".\n\nUsers:\n${userList}` };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        const recognizedId = response.text.trim();

        if (recognizedId.toLowerCase() === 'none') {
            return null;
        }

        // Validate that the returned ID is one of the enrolled users' IDs
        const isValidId = enrolledUsers.some(u => u.id === recognizedId);
        if (isValidId) {
            return recognizedId;
        }

        return null;
    } catch (error) {
        console.error("Error in user recognition:", error);
        return null;
    }
}


// --- Audio Helper Functions ---

export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    // The supported audio MIME type is 'audio/pcm'. Do not use other types.
    mimeType: 'audio/pcm;rate=16000',
  };
}