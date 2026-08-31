type FunctionDeclaration = { name: string; parameters: Record<string, unknown> };
type Blob = { data: string; mimeType: string };
import type { User, HangmanWord } from '../types';

export const USE_FAKE_DATA = import.meta.env.VITE_USE_FAKE_DATA === 'true';

const postGemini = async <T,>(endpoint: string, body: unknown): Promise<T> => {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`AI request failed (${response.status})`);
    return response.json() as Promise<T>;
};

/** Browser-safe Gemini client: credentials remain in the server environment. */
export const ai = {
    models: {
        generateContent: (request: unknown) => postGemini<{ text: string; candidates?: any[] }>('/api/gemini/content', request),
        generateImages: (request: unknown) => postGemini<{ generatedImages?: Array<{ image?: { imageBytes?: string } }> }>('/api/gemini/images', request),
    },
};

const Type = { OBJECT: 'OBJECT', ARRAY: 'ARRAY', STRING: 'STRING', INTEGER: 'INTEGER' } as const;

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
    if (USE_FAKE_DATA) {
        return Promise.resolve({ word: "developer", hint: "Someone who writes code" });
    }
    const prompt = `Generate a single, moderately difficult, family-friendly English word for a game of Hangman. The word should be between 5 and 10 letters long. Also, provide a short hint for the word. Ensure the word is lowercase.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: hangmanWordSchema,
                thinkingConfig: {
                    thinkingBudget: 24576,
                }
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
    if (USE_FAKE_DATA) {
        return Promise.resolve("This is a mock transcription.");
    }
    try {
        const audioPart = {
            inlineData: {
                mimeType,
                data: base64Audio,
            },
        };
        const textPart = { text: "Transcribe the following audio precisely and accurately." };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: { parts: [audioPart, textPart] },
            config: {
                thinkingConfig: {
                    thinkingBudget: 0,
                }
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error in audio transcription:", error);
        throw new Error("Failed to transcribe audio.");
    }
}

// --- User Recognition ---
export async function recognizeUser(base64Image: string, enrolledUsers: User[]): Promise<string | null> {
    if (USE_FAKE_DATA) {
        return Promise.resolve(null);
    }
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
            model: 'gemini-2.5-flash-lite',
            contents: { parts: [imagePart, textPart] },
            config: {
                thinkingConfig: {
                    thinkingBudget: 24576,
                }
            }
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
