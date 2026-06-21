import { Type } from '@google/genai';
import { WeatherData } from '../types';
import { ai, USE_FAKE_DATA } from './geminiService';

const MOCK_WEATHER: WeatherData[] = [
    { day: 'Mon', temp: 72, condition: 'sunny', hourly: [{time: '3 PM', temp: 75, condition: 'sunny'}] },
    { day: 'Tue', temp: 68, condition: 'partly-cloudy' },
    { day: 'Wed', temp: 65, condition: 'rainy' },
    { day: 'Thu', temp: 70, condition: 'cloudy' },
    { day: 'Fri', temp: 75, condition: 'sunny' },
    { day: 'Sat', temp: 78, condition: 'sunny' },
    { day: 'Sun', temp: 76, condition: 'partly-cloudy' },
];

export async function getWeatherForecast(): Promise<WeatherData[]> {
    if (USE_FAKE_DATA) {
        return Promise.resolve(MOCK_WEATHER);
    }
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
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: weatherSchema,
                thinkingConfig: {
                    thinkingBudget: 24576,
                }
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
