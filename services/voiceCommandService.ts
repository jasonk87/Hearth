import { Type } from './schemaTypes';
import { ai, USE_FAKE_DATA } from './geminiService';
import { toLocalDateKey } from './dateService';

export type VoiceAction =
  | 'navigate'
  | 'close'
  | 'add_note'
  | 'update_note'
  | 'delete_note'
  | 'change_note_color'
  | 'add_grocery'
  | 'complete_grocery'
  | 'rename_grocery'
  | 'remove_grocery'
  | 'clear_completed_groceries'
  | 'add_event'
  | 'edit_event'
  | 'delete_event'
  | 'set_dinner'
  | 'remove_dinner'
  | 'search_recipes'
  | 'launch_game'
  | 'start_story'
  | 'general_query';

export interface VoiceCommand {
  action: VoiceAction;
  target?: string;
  text?: string;
  match?: string;
  replacement?: string;
  color?: string;
  section?: string;
  day?: string;
  date?: string;
  time?: string;
  title?: string;
  newTitle?: string;
  newTime?: string;
  mealName?: string;
  query?: string;
  game?: string;
}

const VALID_ACTIONS = new Set<VoiceAction>([
  'navigate', 'close', 'add_note', 'update_note', 'delete_note', 'change_note_color',
  'add_grocery', 'complete_grocery', 'rename_grocery', 'remove_grocery',
  'clear_completed_groceries', 'add_event', 'edit_event', 'delete_event',
  'set_dinner', 'remove_dinner', 'search_recipes', 'launch_game', 'start_story', 'general_query',
]);

const commandSchema = {
  type: Type.OBJECT,
  properties: {
    action: { type: Type.STRING, enum: [...VALID_ACTIONS], description: 'The single best action for the request.' },
    target: { type: Type.STRING, description: 'App/view target for navigation.' },
    text: { type: Type.STRING, description: 'New note text or grocery item name.' },
    match: { type: Type.STRING, description: 'Existing note, grocery item, or event phrase to match.' },
    replacement: { type: Type.STRING, description: 'Replacement note text or grocery item name.' },
    color: { type: Type.STRING, description: 'Note color: yellow, pink, blue, or green.' },
    section: { type: Type.STRING, description: 'Grocery section when explicitly stated.' },
    day: { type: Type.STRING, description: 'Relative day or weekday as spoken.' },
    date: { type: Type.STRING, description: 'Explicit date in YYYY-MM-DD format when known.' },
    time: { type: Type.STRING, description: 'Event time as spoken.' },
    title: { type: Type.STRING, description: 'Calendar event title.' },
    newTitle: { type: Type.STRING, description: 'Replacement event title.' },
    newTime: { type: Type.STRING, description: 'Replacement event time.' },
    mealName: { type: Type.STRING, description: 'Dinner meal name.' },
    query: { type: Type.STRING, description: 'Recipe search or general question.' },
    game: { type: Type.STRING, description: 'Game to launch.' },
  },
  required: ['action'],
};

export const interpretVoiceCommand = async (transcript: string): Promise<VoiceCommand> => {
  if (USE_FAKE_DATA) return { action: 'general_query', query: transcript };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `You are the intent router for Hearth, a natural voice-first household assistant. Understand meaning conversationally; never require keywords or rigid phrasing.

Choose exactly one action:
- navigate(target) opens Home/Calendar, Notes, Grocery, Recipes, Meal Plan, Local Events, or Games.
- close dismisses the current view or overlay.
- add_note(text), update_note(match, replacement), delete_note(match), change_note_color(match, color).
- add_grocery(text, optional section), complete_grocery(match), rename_grocery(match, replacement), remove_grocery(match), clear_completed_groceries.
- add_event(title, day or date, time), edit_event(match, optional day/date, newTitle and/or newTime), delete_event(match, optional day/date).
- set_dinner(mealName, day or date), remove_dinner(day or date).
- search_recipes(query), launch_game(game), start_story(query).
- general_query(query) only for information, advice, explanation, or conversation—not app actions.

Preserve names, content, groceries, event titles, meals, dates, and times faithfully. Infer obvious fields from natural language, but do not invent critical missing details. Today is ${toLocalDateKey()}. Request: ${JSON.stringify(transcript)}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: commandSchema,
        thinkingConfig: { thinkingBudget: 1024 },
      },
    });
    const command = JSON.parse(response.text.trim()) as VoiceCommand;
    return VALID_ACTIONS.has(command.action) ? command : { action: 'general_query', query: transcript };
  } catch (error) {
    console.warn('Voice command interpretation failed; treating request as a general query.', error);
    return { action: 'general_query', query: transcript };
  }
};

export const resolveSpokenDate = (day?: string, explicitDate?: string): string | null => {
  if (explicitDate && /^\d{4}-\d{2}-\d{2}$/.test(explicitDate)) return explicitDate;
  if (!day) return null;

  const value = day.trim().replace(/[.!?]+$/, '').trim().toLowerCase();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  if (value === 'today') return toLocalDateKey(today);
  if (value === 'tomorrow') {
    today.setDate(today.getDate() + 1);
    return toLocalDateKey(today);
  }

  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const weekday = weekdays.indexOf(value);
  if (weekday < 0) return null;
  const difference = (weekday - today.getDay() + 7) % 7;
  today.setDate(today.getDate() + difference);
  return toLocalDateKey(today);
};
