import type { CalendarEvent, ChatMessage, GroceryItem, LocalEventPreferences, Note, Recipe, StoryPage } from '../types';

export interface PersistentAppState {
  groceryList: GroceryItem[];
  notes: Note[];
  familyEvents: CalendarEvent[];
  dinnerPlan: Record<string, Recipe>;
  savedRecipes: Recipe[];
  location: string;
  briefingStatus: Record<string, string>;
  chatMessages: ChatMessage[];
  story: StoryPage[];
  localEventPreferences: LocalEventPreferences;
}

export const DEFAULT_PERSISTENT_STATE: PersistentAppState = {
  groceryList: [
    { id: 1, name: 'Milk', completed: false, section: 'Dairy' },
    { id: 2, name: 'Bread', completed: true, section: 'Bakery' },
    { id: 3, name: 'Apples', completed: false, section: 'Produce' },
  ],
  notes: [
    { id: 1, text: 'Grocery List:\n- Milk\n- Bread\n- Eggs', color: 'yellow' },
    { id: 2, text: 'Call plumber about leaky faucet in the kitchen.', color: 'pink' },
    { id: 3, text: 'Soccer practice for Jamie is at 6 PM on Friday.', color: 'blue' },
  ],
  familyEvents: [],
  dinnerPlan: {},
  savedRecipes: [],
  location: '',
  briefingStatus: {},
  chatMessages: [],
  story: [],
  localEventPreferences: { radius: 50, reactions: {}, seen: [] },
};

export const PERSISTENT_STATE_KEYS = Object.keys(DEFAULT_PERSISTENT_STATE) as Array<keyof PersistentAppState>;
