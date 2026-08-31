

export type CalendarSource = 'family';

export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
  category?: 'parent' | 'kid' | 'other';
  isFaceEnrolled?: boolean;
  isVoiceEnrolled?: boolean;
}

export interface CalendarEvent {
  id: number | string;
  time: string;
  title: string;
  color: string; // Maintained for background, but border will indicate owner
  source: CalendarSource | 'google';
  participants?: string[];
  date: string; // YYYY-MM-DD
  calendarName?: string;
  creatorEmail?: string;
}

export interface WeatherData {
  day: string;
  temp: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'partly-cloudy';
  hourly?: {
    time: string;
    temp: number;
    condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'partly-cloudy';
  }[];
}

export interface GroceryItem {
    id: number;
    name: string;
    completed: boolean;
    section: string;
}

export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green';

export interface Note {
  id: number;
  text: string;
  color: NoteColor;
}

export interface ProactiveSuggestion {
  type: 'grocery' | 'activity' | 'event' | 'none';
  suggestion: string;
  actionableItem?: string;
}

export interface Recipe {
  id: string;
  recipeName: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string;
  videoUrl?: string;
  category?: string;
  prepTime?: string;
}

export interface StoryPage {
  id: number;
  text: string;
  imageUrl: string; // base64 data URL
}

export type Game = 'tictactoe' | 'hangman' | 'memory' | 'snake' | '2048' | 'storyboard';
export type Player = 'X' | 'O';
export type SquareValue = Player | null;

// --- AI Chat Types ---
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

// --- Hangman Game Types ---
export interface HangmanWord {
  word: string;
  hint: string;
}
// FIX: Added missing type definitions to resolve compilation errors.
export interface Chore {
  id: number;
  text: string;
  completed: boolean;
  assigneeId: string;
}

export interface FamilyMessage {
  id: number;
  text: string;
  authorId: string;
  timestamp: string; // ISO string format
}

// --- Smart Home Types ---
export interface Light {
  name: string;
  on: boolean;
  brightness: number;
}

export interface Thermostat {
  currentTemp: number;
  targetTemp: number;
}

export interface SmartHomeState {
  lights: Record<string, Light>;
  thermostat: Thermostat;
}

export interface GoogleProfile {
  name: string;
  picture: string;
  email?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  attendees?: {
    email: string;
    displayName?: string;
  }[];
  backgroundColor?: string;
  calendarName?: string;
  creator?: {
    email: string;
    displayName?: string;
  };
}

export type LocalEventCategory = 'family' | 'music' | 'sports' | 'festival' | 'food' | 'outdoors' | 'other';
export type LocalEventReaction = 'interested' | 'going' | 'notInterested';

export interface LocalEventPreferences {
  radius: 25 | 50 | 75 | 100;
  reactions: Record<string, LocalEventReaction>;
  seen: string[];
}

export interface LocalEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  description: string;
  imageUrl?: string;
  venue?: string;
  sourceUrl?: string;
  ticketUrl?: string;
  price?: string;
  distanceMiles?: number;
  categories: LocalEventCategory[];
  isOutdoor?: boolean;
}
