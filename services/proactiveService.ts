import { Type } from './schemaTypes';
import { CalendarEvent, GroceryItem, WeatherData, ProactiveSuggestion } from '../types';
import { ai, USE_FAKE_DATA } from './geminiService';
import { getLocalEvents } from './eventService';
import { daysFromToday } from './dateService';

const proactiveSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        type: {
            type: Type.STRING,
            description: "The type of suggestion. Options: 'grocery', 'activity', 'event', 'none'.",
        },
        suggestion: {
            type: Type.STRING,
            description: "The text to display to the user. E.g., 'I see Taco Night on your calendar. Should I add tortillas to the grocery list?'"
        },
        actionableItem: {
            type: Type.STRING,
            description: "If applicable, the item to act on. For 'grocery', this is the item to add. For 'event', this is the event title. E.g., 'Tortillas' or 'Farmers Market'."
        }
    },
    required: ["type", "suggestion"]
};

export async function getProactiveSuggestion(
    events: CalendarEvent[],
    groceryList: GroceryItem[],
    weather: WeatherData,
    userLocation?: string
): Promise<ProactiveSuggestion | null> {
    if (USE_FAKE_DATA) {
        return Promise.resolve(null);
    }
    const relevantEvents = events.filter(e => {
        const diffDays = daysFromToday(e.date);
        return diffDays !== null && diffDays >= 0 && diffDays <= 3; // Look at today and next 3 days
    }).map(e => ({ title: e.title, date: e.date }));

    const incompleteGroceries = groceryList.filter(i => !i.completed).map(i => i.name);
    
    const locationQuery = userLocation?.trim() || 'Bowling Green, KY';

    // Fetch events for the user's location rather than a fixed city.
    const localEvents = await getLocalEvents(locationQuery);
    const upcomingLocalEvents = localEvents.filter(e => {
        const diffDays = daysFromToday(e.date);
        return diffDays !== null && diffDays >= 0 && diffDays <= 2; // Look at today and next 2 days
    });

    const prompt = `
        You are a clever and proactive home assistant for a family. Your goal is to find one helpful, non-obvious connection between the family's data to offer a suggestion.
        Current Date: ${new Date().toDateString()}
        Family's Calendar Events for the next few days: ${JSON.stringify(relevantEvents)}
        Family's Current Grocery List (incomplete items): ${JSON.stringify(incompleteGroceries)}
        Today's Weather: The forecast is ${weather.condition} with a high of ${weather.temp} degrees.
        Upcoming Local Events: ${JSON.stringify(upcomingLocalEvents.map(e => ({ title: e.title, date: e.date, location: e.location })))}

        Analyze the data and find a single suggestion. Here are some ideas:
        - If an event looks like a meal (e.g., "Taco Night", "Pizza Party"), check the grocery list for key ingredients. If a common ingredient is missing, suggest adding it.
        - If the weather is nice and there are no conflicting family events, suggest attending a cool local event. Frame it as a question.
        - If the weather is rainy or stormy, suggest an indoor activity like playing a game or trying a new recipe.
        - If a calendar event mentions a specific person (e.g., "Lunch with Bob"), it's probably not a meal to prepare for.

        **IMPORTANT**:
        - Only make ONE suggestion.
        - Do not be repetitive.
        - If suggesting a local event, make sure it doesn't conflict with an existing calendar event on the same day.
        - If you cannot find a good, genuinely helpful suggestion, you MUST return 'none' for the type.
        - Your response must be in JSON format.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: proactiveSuggestionSchema,
                thinkingConfig: {
                    thinkingBudget: 24576,
                }
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
