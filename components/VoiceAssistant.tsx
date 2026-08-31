import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ai, transcribeAudio } from '../services/geminiService';
import { interpretVoiceCommand, resolveSpokenDate, VoiceCommand } from '../services/voiceCommandService';
import { MicIcon, RefreshCwIcon } from './icons';
import type { CalendarEvent, CalendarSource, Game, GroceryItem, Note, NoteColor } from '../types';
import type { ModalType } from '../App';
import { useToast } from './Toast';

interface VoiceAssistantProps {
  notes: Note[];
  onAddNote: (text: string) => void;
  onUpdateNote: (id: number, text: string) => void;
  onDeleteNote: (id: number) => void;
  onChangeNoteColor: (id: number, color: NoteColor) => void;
  eventsBySource: Record<CalendarSource, Record<string, CalendarEvent[]>>;
  onAddCalendarEvent: (title: string, date: string, time: string) => void;
  onDeleteCalendarEvent: (eventId: number | string) => void;
  onEditCalendarEvent: (event: CalendarEvent) => void;
  groceryList: GroceryItem[];
  onAddGroceryItem: (name: string, section: string) => void;
  onToggleGroceryItem: (id: number) => void;
  onRenameGroceryItem: (id: number, name: string) => void;
  onRemoveGroceryItem: (id: number) => void;
  onClearCompletedGroceries: () => void;
  setActiveModal: (modal: ModalType | null) => void;
  onLaunchGame: (game: Game) => void;
  onCloseCurrent: () => void;
  onSetDinnerForDay: (dateKey: string, mealName: string) => void;
  onRemoveDinnerForDay: (dateKey: string) => void;
  onSearchRecipes: (query: string) => void;
  onGeneralQuery: (userQuery: string, modelResponse: string) => void;
  onStartStory: (prompt: string) => Promise<void>;
}

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => typeof reader.result === 'string'
    ? resolve(reader.result.split(',')[1])
    : reject(new Error('Unable to encode microphone audio.'));
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

const normalize = (value: string) => value.toLowerCase().trim();

const findByPhrase = <T,>(items: T[], phrase: string | undefined, getText: (item: T) => string): T | undefined => {
  if (!phrase) return undefined;
  const search = normalize(phrase);
  return items.find(item => {
    const text = normalize(getText(item));
    return text.includes(search) || search.includes(text);
  });
};

const inferGrocerySection = (itemName: string): string => {
  const item = normalize(itemName);
  if (/milk|cheese|yogurt|cream|butter|egg/.test(item)) return 'Dairy';
  if (/apple|banana|orange|lettuce|tomato|onion|potato|fruit|vegetable/.test(item)) return 'Produce';
  if (/bread|bagel|bun|roll|tortilla/.test(item)) return 'Bakery';
  if (/chicken|beef|pork|fish|turkey|meat/.test(item)) return 'Meat';
  if (/frozen|ice cream/.test(item)) return 'Frozen';
  if (/water|juice|soda|coffee|tea/.test(item)) return 'Drinks';
  if (/soap|paper|cleaner|detergent|trash bag/.test(item)) return 'Household';
  return 'Other';
};

const navigationTargets: Record<string, ModalType | null> = {
  home: null,
  calendar: null,
  notes: 'notes',
  note: 'notes',
  grocery: 'grocery',
  groceries: 'grocery',
  'grocery list': 'grocery',
  'shopping list': 'grocery',
  recipes: 'recipes',
  recipe: 'recipes',
  'meal plan': 'mealPlanner',
  'meal planner': 'mealPlanner',
  meals: 'mealPlanner',
  events: 'events',
  'local events': 'events',
  games: 'games',
};

const gameTargets: Record<string, Game> = {
  'tic tac toe': 'tictactoe',
  tictactoe: 'tictactoe',
  hangman: 'hangman',
  memory: 'memory',
  'memory match': 'memory',
  snake: 'snake',
  '2048': '2048',
  storyboard: 'storyboard',
  story: 'storyboard',
};

export const VoiceAssistant: React.FC<VoiceAssistantProps> = (props) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<number | null>(null);
  const { showToast } = useToast();

  const finish = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setFeedback(message);
    showToast(message, type);
  }, [showToast]);

  const allEvents = Object.values(props.eventsBySource).flatMap(byDate => Object.values(byDate).flat());

  const executeCommand = useCallback(async (command: VoiceCommand, originalTranscript: string) => {
    switch (command.action) {
      case 'navigate': {
        const target = navigationTargets[normalize(command.target || '')];
        if (target === undefined && normalize(command.target || '') !== 'home' && normalize(command.target || '') !== 'calendar') {
          finish(`I couldn't find ${command.target || 'that app'}.`, 'error');
          return;
        }
        props.setActiveModal(target);
        finish(target ? `Opening ${command.target}.` : 'Opening the calendar.');
        return;
      }
      case 'close':
        props.onCloseCurrent();
        finish('Closed.');
        return;
      case 'launch_game': {
        const game = gameTargets[normalize(command.game || command.target || '')];
        if (!game) return finish(`I couldn't find that game.`, 'error');
        props.onLaunchGame(game);
        finish(`Starting ${command.game || command.target}.`);
        return;
      }
      case 'add_note':
        if (!command.text) return finish('Tell me what the note should say.', 'error');
        props.onAddNote(command.text);
        finish('Note added.');
        return;
      case 'update_note': {
        const note = findByPhrase<Note>(props.notes, command.match, item => item.text);
        if (!note || !command.replacement) return finish(`I couldn't find that note or its replacement text.`, 'error');
        props.onUpdateNote(note.id, command.replacement);
        finish('Note updated.');
        return;
      }
      case 'delete_note': {
        const note = findByPhrase<Note>(props.notes, command.match || command.text, item => item.text);
        if (!note) return finish(`I couldn't find that note.`, 'error');
        props.onDeleteNote(note.id);
        finish('Note deleted.');
        return;
      }
      case 'change_note_color': {
        const note = findByPhrase<Note>(props.notes, command.match, item => item.text);
        const color = normalize(command.color || '') as NoteColor;
        if (!note || !['yellow', 'pink', 'blue', 'green'].includes(color)) return finish(`I couldn't update that note color.`, 'error');
        props.onChangeNoteColor(note.id, color);
        finish(`Note changed to ${color}.`);
        return;
      }
      case 'add_grocery':
        if (!command.text) return finish('Tell me which grocery item to add.', 'error');
        props.onAddGroceryItem(command.text, command.section || inferGrocerySection(command.text));
        finish(`${command.text} added to groceries.`);
        return;
      case 'complete_grocery': {
        const item = findByPhrase<GroceryItem>(props.groceryList.filter(grocery => !grocery.completed), command.match || command.text, grocery => grocery.name);
        if (!item) return finish(`I couldn't find that unfinished grocery item.`, 'error');
        props.onToggleGroceryItem(item.id);
        finish(`${item.name} checked off.`);
        return;
      }
      case 'rename_grocery': {
        const item = findByPhrase<GroceryItem>(props.groceryList, command.match, grocery => grocery.name);
        if (!item || !command.replacement) return finish(`I couldn't rename that grocery item.`, 'error');
        props.onRenameGroceryItem(item.id, command.replacement);
        finish(`Renamed ${item.name} to ${command.replacement}.`);
        return;
      }
      case 'remove_grocery': {
        const item = findByPhrase<GroceryItem>(props.groceryList, command.match || command.text, grocery => grocery.name);
        if (!item) return finish(`I couldn't find that grocery item.`, 'error');
        props.onRemoveGroceryItem(item.id);
        finish(`${item.name} removed.`);
        return;
      }
      case 'clear_completed_groceries':
        props.onClearCompletedGroceries();
        finish('Completed grocery items cleared.');
        return;
      case 'add_event': {
        const date = resolveSpokenDate(command.day, command.date);
        if (!date || !command.title || !command.time) return finish('I need the event title, day, and time.', 'error');
        props.onAddCalendarEvent(command.title, date, command.time);
        finish(`${command.title} added to the calendar.`);
        return;
      }
      case 'edit_event': {
        const date = resolveSpokenDate(command.day, command.date);
        const event = findByPhrase(allEvents.filter(item => !date || item.date === date), command.match || command.title, item => item.title);
        if (!event || event.source === 'google') return finish(`I couldn't edit that family calendar event.`, 'error');
        props.onEditCalendarEvent({ ...event, title: command.newTitle || event.title, time: command.newTime || event.time });
        finish(`${event.title} updated.`);
        return;
      }
      case 'delete_event': {
        const date = resolveSpokenDate(command.day, command.date);
        const event = findByPhrase(allEvents.filter(item => !date || item.date === date), command.match || command.title, item => item.title);
        if (!event || event.source === 'google') return finish(`I couldn't remove that family calendar event.`, 'error');
        props.onDeleteCalendarEvent(event.id);
        finish(`${event.title} removed from the calendar.`);
        return;
      }
      case 'set_dinner': {
        const date = resolveSpokenDate(command.day, command.date);
        if (!date || !command.mealName) return finish('Tell me the meal and day for dinner.', 'error');
        props.onSetDinnerForDay(date, command.mealName);
        finish(`${command.mealName} set for dinner.`);
        return;
      }
      case 'remove_dinner': {
        const date = resolveSpokenDate(command.day, command.date);
        if (!date) return finish('Tell me which dinner day to clear.', 'error');
        props.onRemoveDinnerForDay(date);
        finish('Dinner plan removed.');
        return;
      }
      case 'search_recipes':
        if (!command.query) return finish('Tell me what kind of recipe to find.', 'error');
        props.setActiveModal('recipes');
        props.onSearchRecipes(command.query);
        finish(`Searching recipes for ${command.query}.`);
        return;
      case 'start_story':
        if (!command.query) return finish('Tell me what the story should be about.', 'error');
        props.onLaunchGame('storyboard');
        await props.onStartStory(command.query);
        finish('Your story has started.');
        return;
      case 'general_query': {
        const query = command.query || originalTranscript;
        try {
          const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-lite', contents: query });
          props.onGeneralQuery(query, response.text);
          finish('I opened the answer for you.');
        } catch (error) {
          console.error('Voice general query failed:', error);
          finish(`I couldn't answer that right now.`, 'error');
        }
      }
    }
  }, [allEvents, finish, props]);

  const stopRecording = useCallback(() => {
    if (recordingTimeoutRef.current) window.clearTimeout(recordingTimeoutRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }, []);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      finish('This browser does not support microphone recording.', 'error');
      return;
    }

    try {
      setTranscript('');
      setFeedback('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        setIsListening(false);
        setIsProcessing(true);
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        try {
          const audio = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          if (audio.size === 0) throw new Error('No microphone audio was captured.');
          const text = await transcribeAudio(await blobToBase64(audio), audio.type);
          if (!text.trim()) throw new Error('No speech was recognized.');
          setTranscript(text);
          await executeCommand(await interpretVoiceCommand(text), text);
        } catch (error) {
          console.error('Voice command failed:', error);
          finish(error instanceof Error ? error.message : 'Voice command failed.', 'error');
        } finally {
          setIsProcessing(false);
          recorderRef.current = null;
        }
      };

      recorder.start();
      setIsListening(true);
      recordingTimeoutRef.current = window.setTimeout(stopRecording, 20_000);
    } catch (error) {
      console.error('Unable to start microphone:', error);
      finish('Microphone access was unavailable. Check the browser permission and try again.', 'error');
    }
  }, [executeCommand, finish, stopRecording]);

  useEffect(() => () => {
    if (recordingTimeoutRef.current) window.clearTimeout(recordingTimeoutRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  const toggleRecording = () => isListening ? stopRecording() : void startRecording();

  return (
    <>
      <button
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`fixed bottom-6 right-6 z-[55] flex h-16 w-16 items-center justify-center rounded-full text-white shadow-2xl transition-all duration-300 sm:bottom-8 sm:right-8 sm:h-20 sm:w-20 ${isListening ? 'animate-pulse bg-red-500' : 'bg-teal-600 hover:bg-teal-500'} disabled:cursor-wait disabled:opacity-70`}
        aria-label={isListening ? 'Stop voice command' : isProcessing ? 'Processing voice command' : 'Start voice command'}
      >
        {isProcessing ? <RefreshCwIcon className="h-8 w-8 animate-spin" /> : <MicIcon className="h-8 w-8 sm:h-10 sm:w-10" />}
      </button>

      {(isListening || isProcessing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-md">
          <div className="flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/95 p-8 text-center shadow-2xl">
            <h3 className="text-2xl font-bold text-teal-600">{isListening ? 'Listening…' : 'Working on it…'}</h3>
            {isProcessing ? <RefreshCwIcon className="h-14 w-14 animate-spin text-teal-500" /> : <MicIcon className="h-16 w-16 animate-pulse text-red-500" />}
            <p className="text-lg text-slate-600">{isListening ? 'Say one command, then tap Stop.' : transcript || 'Transcribing your request…'}</p>
            {isListening && <button onClick={stopRecording} className="min-h-12 rounded-xl bg-red-500 px-8 py-3 font-bold text-white">Stop</button>}
          </div>
        </div>
      )}

      {!isListening && !isProcessing && feedback && (
        <div className="fixed bottom-28 right-6 z-40 max-w-sm rounded-xl bg-slate-900/90 px-4 py-3 text-sm text-white shadow-lg sm:bottom-32 sm:right-8">
          {transcript && <p className="mb-1 text-slate-300">“{transcript}”</p>}
          <p>{feedback}</p>
        </div>
      )}
    </>
  );
};
