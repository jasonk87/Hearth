import { Modality } from '@google/genai';
import { CalendarEvent, WeatherData } from '../types';
import { ai, USE_FAKE_DATA } from './geminiService';

export async function generateDailyBriefing(
    events: CalendarEvent[],
    weather: WeatherData | null
): Promise<string> {
    if (USE_FAKE_DATA) {
        return Promise.resolve("Good morning! The weather is sunny with a high of 72 degrees. You have one event today: a team stand-up at 10am. Have a great day!");
    }
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    const eventsString = events.length > 0
        ? `Here are the events for today: ${events.map(e => `${e.title} at ${e.time}`).join(', ')}.`
        : "You have no events scheduled for today.";
        
    const weatherString = weather
        ? `The forecast is ${weather.condition.replace('-', ' ')} with a high of ${weather.temp} degrees.`
        : "Weather forecast is currently unavailable.";

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
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: {
            thinkingConfig: {
                thinkingBudget: 24576,
            }
        }
    });

    return response.text.trim();
}

export async function getBriefingAudio(text: string): Promise<string> {
    if (USE_FAKE_DATA) {
        return Promise.resolve("");
    }
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
