
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { VoiceAssistant } from './components/VoiceAssistant';
import OnScreenKeyboard from './components/OnScreenKeyboard';
import type { CalendarEvent, WeatherData, GroceryItem, CalendarSource, Game, Note, NoteColor, User, Recipe, ProactiveSuggestion, ChatMessage, StoryPage, GoogleProfile, GoogleCalendarEvent } from './types';
import { CalendarApp } from './components/CalendarApp';
import { GamesApp } from './components/GamesApp';
import { NotesApp } from './components/NotesApp';
import { GroceryApp } from './components/GroceryApp';
import { DayDetailView } from './components/DayDetailView';
import { EventDetailView } from './components/EventDetailView';
import { ToastProvider, useToast } from './components/Toast';
import { SeasonalBackground } from './components/SeasonalBackground';
import { initAudioOnInteraction, playSound } from './services/soundService';
import { RecipesApp } from './components/RecipesApp';
import { RecipeDetailView } from './components/RecipeDetailView';
import { getProactiveSuggestion, getPersonalizedRecipes, searchRecipes, generateDailyBriefing, generateStorySegment, generateStoryImage, getWeatherForecast } from './services/geminiService';
import { setAccessToken, logout, getProfile, getAccessToken, getCalendarEvents } from './services/authService';
import GoogleAuth from './components/GoogleAuth';
import { DailyBriefing } from './components/DailyBriefing';
import { Loader } from './components/Loader';
import { ProactiveSuggestionBanner } from './components/ProactiveSuggestionBanner';
import { ScheduleDinnerModal } from './components/ScheduleDinnerModal';
import { AiChatModal } from './components/AiChatModal';
import { HomeIcon, NotebookTextIcon, ShoppingCartIcon, ChefHatIcon, Gamepad2Icon, CalendarPlusIcon, TicketIcon } from './components/icons';
import { MealPlannerApp } from './components/MealPlannerApp';
import { LocalEvents } from './components/LocalEvents';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

type ActiveInput = {
  key: string;
  value: string;
  setValue: (value: string) => void;
} | null;

export type ModalType = 'calendar' | 'games' | 'notes' | 'grocery' | 'recipes' | 'mealPlanner' | 'events';

const today = new Date();
const todayKey = today.toISOString().split('T')[0];
const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(today.getDate() + 2);
const dayAfterTomorrowKey = dayAfterTomorrow.toISOString().split('T')[0];
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 5);
const nextWeekKey = nextWeek.toISOString().split('T')[0];

const FAMILY_USER: User = { id: 'family', name: 'Family', avatar: '👨‍👩‍👧‍👦', color: 'border-green-500' };

const initialEvents: CalendarEvent[] = [
    { id: 1, time: '10:00 AM', title: 'Team Standup', color: 'bg-blue-500', source: 'family', participants: ['Alice', 'Bob'], date: todayKey },
    { id: 2, time: '2:00 PM', title: 'Doctor Appointment', color: 'bg-red-500', source: 'family', participants: [], date: dayAfterTomorrowKey },
    { id: 3, time: '6:00 PM', title: 'Soccer Practice', color: 'bg-green-500', source: 'family', participants: ['Alex'], date: todayKey },
    { id: 4, time: '12:00 PM', title: 'Lunch', color: 'bg-purple-500', source: 'family', participants: ['Mom', 'Dad', 'Alex', 'Chloe'], date: nextWeekKey },
    { id: 5, time: '9:00 AM', title: 'School Assembly', color: 'bg-yellow-500', source: 'family', participants: [], date: dayAfterTomorrowKey },
];

const initialNotes: Note[] = [
    { id: 1, text: 'Grocery List:\n- Milk\n- Bread\n- Eggs', color: 'yellow' },
    { id: 2, text: 'Call plumber about leaky faucet in the kitchen.', color: 'pink' },
    { id: 3, text: 'Soccer practice for Jamie is at 6 PM on Friday.', color: 'blue' },
];

// --- Sidebar Components ---
const SidebarItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 w-full aspect-square rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-teal-100 text-teal-600'
        : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'
    }`}
    aria-label={label}
  >
    {icon}
    <span className="text-xs font-medium">{label}</span>
  </button>
);


const Sidebar: React.FC<{
  onNavigate: (view: ModalType | 'home') => void;
  activeView: ModalType | 'home';
}> = ({ onNavigate, activeView }) => {
  const navItems = [
    { view: 'home', label: 'Home', icon: <HomeIcon className="w-7 h-7" /> },
    { view: 'notes', label: 'Notes', icon: <NotebookTextIcon className="w-7 h-7" /> },
    { view: 'grocery', label: 'Grocery', icon: <ShoppingCartIcon className="w-7 h-7" /> },
    { view: 'recipes', label: 'Recipes', icon: <ChefHatIcon className="w-7 h-7" /> },
    { view: 'mealPlanner', label: 'Meal Plan', icon: <CalendarPlusIcon className="w-7 h-7" /> },
    { view: 'events', label: 'Events', icon: <TicketIcon className="w-7 h-7" /> },
    { view: 'games', label: 'Games', icon: <Gamepad2Icon className="w-7 h-7" /> },
  ];

  return (
    <nav className="w-24 bg-white/60 backdrop-blur-lg border-r border-slate-200/80 p-3 flex flex-col items-center gap-3 flex-shrink-0">
      <div className="text-teal-600 font-bold text-2xl mb-2">H</div>
      {navItems.map(item => (
        <SidebarItem
          key={item.view}
          icon={item.icon}
          label={item.label}
          isActive={activeView === item.view}
          onClick={() => onNavigate(item.view as ModalType | 'home')}
        />
      ))}
    </nav>
  );
};


function AppContent() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const savedNotes = localStorage.getItem('hearth-notes');
    try {
        return savedNotes ? JSON.parse(savedNotes) : initialNotes;
    } catch {
        return initialNotes;
    }
  });
  const [activeInput, setActiveInput] = useState<ActiveInput>(null);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [activeView, setActiveView] = useState<ModalType | null>(null);
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([
      { id: 1, name: 'Milk', completed: false, section: 'Dairy' },
      { id: 2, name: 'Bread', completed: true, section: 'Bakery' },
      { id: 3, name: 'Apples', completed: false, section: 'Produce' },
  ]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  
  // State for controlled inputs for on-screen keyboard
  const [newGroceryItemName, setNewGroceryItemName] = useState('');
  const [newEventParticipant, setNewEventParticipant] = useState('');

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isFetchingRecipes, setIsFetchingRecipes] = useState(false);
  const [initialGame, setInitialGame] = useState<Game | null>(null);
  
  // New state for daily briefing
  const [briefingStatus, setBriefingStatus] = useState<Record<string, string>>({}); // { userId: 'YYYY-MM-DD' }
  const [briefingData, setBriefingData] = useState<{ user: User; text: string } | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState<{ active: boolean, user: User | null }>({ active: false, user: null });

  // New state for proactive assistant
  const [proactiveSuggestion, setProactiveSuggestion] = useState<ProactiveSuggestion | null>(null);
  const [lastSuggestionTimestamp, setLastSuggestionTimestamp] = useState<number>(0);

  // New state for dinner planning
  const [dinnerPlan, setDinnerPlan] = useState<Record<string, string>>({
    [todayKey]: 'Taco Night',
    [dayAfterTomorrowKey]: 'Pizza',
  });
  const [schedulingDinnerFor, setSchedulingDinnerFor] = useState<Recipe | null>(null);
  
  // New state for AI Chat Modal
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  // New state for Storyboard
  const [story, setStory] = useState<StoryPage[]>([]);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [profile, setProfile] = useState<GoogleProfile | null>(null);

  const { showToast } = useToast();
  
  const [audioInitialized, setAudioInitialized] = useState(false);

  useEffect(() => {
    if (getAccessToken()) {
      getProfile().then(setProfile);
    }
  }, []);

  useEffect(() => {
    if (profile) {
      getCalendarEvents().then((events) => {
        const formattedEvents = events.map((event: GoogleCalendarEvent) => ({
            id: event.id,
            time: new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            title: event.summary,
            color: 'bg-blue-500',
            source: 'google',
            participants: event.attendees ? event.attendees.map((a) => a.email) : [],
            date: event.start.dateTime.split('T')[0],
        }));
        setEvents(formattedEvents);
      });
    }
  }, [profile]);

  const handleInteraction = useCallback(() => {
      if (!audioInitialized) {
          initAudioOnInteraction();
          setAudioInitialized(true);
      }
  }, [audioInitialized]);

  const triggerDailyBriefing = useCallback(async (user: User) => {
    if (isGeneratingBriefing.active || briefingData) return;
    
    setIsGeneratingBriefing({ active: true, user });
    showToast(`Preparing your daily briefing...`, 'success');
    
    const todayKey = new Date().toISOString().split('T')[0];
    const userEventsToday = events.filter(e => e.date === todayKey);
    const weatherToday = weatherData.length > 0 ? weatherData[0] : null;

    try {
        const briefingText = await generateDailyBriefing(userEventsToday, weatherToday);
        setBriefingData({ user, text: briefingText });
        
        setBriefingStatus(prev => ({ ...prev, [user.id]: todayKey }));
    } catch (error) {
        console.error("Failed to generate briefing:", error);
        showToast("Sorry, I couldn't prepare your briefing right now.", 'error');
    } finally {
        setIsGeneratingBriefing({ active: false, user: null });
    }
  }, [events, showToast, isGeneratingBriefing, briefingData, weatherData]);

  useEffect(() => {
    if (isGeneratingBriefing.active || briefingData) return;

    const now = new Date();
    const todayKey = now.toISOString().split('T')[0];
    const currentHour = now.getHours();

    const hasHadBriefingToday = briefingStatus[FAMILY_USER.id] === todayKey;
    const isMorning = currentHour >= 5 && currentHour < 12;

    if (isMorning && !hasHadBriefingToday) {
        triggerDailyBriefing(FAMILY_USER);
    }
  }, [triggerDailyBriefing, briefingStatus, isGeneratingBriefing.active, briefingData]);

  useEffect(() => {
      const handleGlobalClick = (event: MouseEvent) => {
          if (event.target instanceof Element && event.target.closest('button')) {
              playSound('click');
          }
      };
      document.body.addEventListener('click', handleGlobalClick);
      return () => {
          document.body.removeEventListener('click', handleGlobalClick);
      };
  }, []);
  
  useEffect(() => {
    const fetchWeather = async () => {
        try {
            const forecast = await getWeatherForecast();
            setWeatherData(forecast);
        } catch (error) {
            console.error("Failed to fetch weather data:", error);
            showToast("Couldn't fetch weather forecast.", "error");
        }
    };
    fetchWeather();
  }, [showToast]);

  const handleSetActiveView = (view: ModalType | null) => {
      if (view) {
          playSound('open');
      } else {
          playSound('close');
      }
      setActiveView(view);
      setInitialGame(null);
  };
  
  const handleCloseDayDetailView = () => {
      playSound('close');
      setSelectedDay(null);
  };

  const handleCloseEventDetailView = () => {
      playSound('close');
      setEditingEvent(null);
  };

  useEffect(() => {
    localStorage.setItem('hearth-notes', JSON.stringify(notes));
  }, [notes]);
  
  const eventsByDate = useMemo(() => {
    return events.reduce((acc, event) => {
        const dayKey = event.date;
        if (!acc[dayKey]) {
          acc[dayKey] = [];
        }
        acc[dayKey].push(event);
        return acc;
    }, {} as Record<string, CalendarEvent[]>);
  }, [events]);

  const handleUpdateNote = useCallback((id: number, text: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n));
    setActiveInput(prev => {
        if (prev && prev.key === `note-${id}`) {
            return { ...prev, value: text };
        }
        return prev;
    });
  }, []);
  
  const handleAddNote = useCallback((text: string = '') => {
    const newNote: Note = {
      id: Date.now(),
      text: text,
      color: 'yellow',
    };
    setNotes(prev => [...prev, newNote]);
  }, []);

  const handleCreateAndEditNote = useCallback(() => {
    const newNote: Note = {
        id: Date.now(),
        text: '',
        color: 'yellow',
    };
    setNotes(prev => [...prev, newNote]);
    
    setActiveInput({
        key: `note-${newNote.id}`,
        value: newNote.text,
        setValue: (newText) => handleUpdateNote(newNote.id, newText)
    });
  }, [handleUpdateNote]);

  const handleDeleteNote = useCallback((id: number) => {
    playSound('delete');
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleChangeNoteColor = useCallback((id: number, color: NoteColor) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, color } : n));
  }, []);

  const handleAddGroceryItem = useCallback((name: string, section: string = 'Other') => {
      if (name.trim() === '') return;
      const trimmedName = name.trim();
      const newItem: GroceryItem = {
        id: Date.now(),
        name: trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1),
        completed: false,
        section,
      };
      setGroceryList(prev => [newItem, ...prev]);
      setNewGroceryItemName('');
  }, []);

  const handleToggleGroceryItem = useCallback((id: number) => {
    setGroceryList(prev => {
        const item = prev.find(i => i.id === id);
        if (item) {
            playSound(item.completed ? 'toggleOff' : 'toggleOn');
        }
        return prev.map(i => i.id === id ? { ...i, completed: !i.completed } : i)
    });
  }, []);

  const handleClearCompletedGroceries = useCallback(() => {
    playSound('delete');
    setGroceryList(prev => prev.filter(item => !item.completed));
  }, []);
  
  const handleAddToGroceryListFromRecipe = useCallback((recipe: Recipe) => {
      let itemsAddedCount = 0;
      recipe.ingredients.forEach(ingredient => {
          const parts = ingredient.split(/\s*,\s*|\s+of\s+/);
          let name = ingredient;
          
          if (parts.length > 1) {
              name = parts[1];
          } else {
             const quantityMatch = ingredient.match(/^([\d/.\s]+(\w+)?)/);
             if (quantityMatch && quantityMatch[0].length < ingredient.length / 2) {
                 name = ingredient.replace(quantityMatch[0], '').trim();
             }
          }
          
          const newItem: GroceryItem = {
            id: Date.now() + itemsAddedCount,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            completed: false,
            section: 'Other',
          };
          setGroceryList(prev => [newItem, ...prev]);
          itemsAddedCount++;
      });
      setSelectedRecipe(null);
      showToast(`Added ${itemsAddedCount} ingredients to your grocery list.`, 'success');
  }, [showToast]);
  
  const handleSaveEvent = useCallback((eventToSave: CalendarEvent) => {
    setEvents(prev => prev.map(e => e.id === eventToSave.id ? eventToSave : e));
    setEditingEvent(null);
    showToast('Event saved successfully!', 'success');
  }, [showToast]);

  const handleDeleteEvent = useCallback((eventId: number) => {
      playSound('delete');
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setEditingEvent(null);
      showToast('Event deleted.', 'success');
  }, [showToast]);
  
  const handleAddCalendarEvent = useCallback((title: string, date: string, time: string) => {
    const newEvent: CalendarEvent = {
      id: Date.now(),
      time,
      title,
      color: 'bg-purple-500',
      source: 'family',
      date,
    };
    setEvents(prev => [...prev, newEvent]);
    showToast('Event added to calendar!', 'success');
  }, [showToast]);
  
  const handleEditCalendarEvent = useCallback((eventToEdit: CalendarEvent) => {
      setEvents(prev => prev.map(e => e.id === eventToEdit.id ? eventToEdit : e));
  }, []);
  
  const handleDeleteCalendarEvent = useCallback((eventId: number) => {
      setEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);
  
  const eventsBySourceAndDate = useMemo(() => {
    return events.reduce((acc, event) => {
      if (!acc[event.source]) acc[event.source] = {};
      const dayKey = event.date;
      if (!acc[event.source][dayKey]) acc[event.source][dayKey] = [];
      acc[event.source][dayKey].push(event);
      return acc;
    }, { family: {} } as Record<CalendarSource, Record<string, CalendarEvent[]>>);
  }, [events]);
  
  const handleSetDinnerForDay = useCallback((dateKey: string, dinner: string) => {
    setDinnerPlan(prev => ({...prev, [dateKey]: dinner }));
    const friendlyDate = new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
    showToast(`Set "${dinner}" for dinner on ${friendlyDate}.`, 'success');
  }, [showToast]);

  const handleSetActiveInput = useCallback((key: string, value: string, setValue: (value: string) => void) => {
      setActiveInput({ key, value, setValue });
  }, []);

  const handleKeyboardKeyPress = useCallback((key: string) => {
      if (!activeInput) return;
      if (key === '⌫') {
          activeInput.setValue(activeInput.value.slice(0, -1));
      } else if (key === 'Space') {
          activeInput.setValue(activeInput.value + ' ');
      } else {
          activeInput.setValue(activeInput.value + key);
      }
  }, [activeInput]);
  
  const fetchPersonalizedRecipes = useCallback(async () => {
    setIsFetchingRecipes(true);
    setRecipes([]);
    try {
        const fetchedRecipes = await getPersonalizedRecipes();
        setRecipes(fetchedRecipes);
    } catch (error) {
        console.error("Failed to fetch personalized recipes:", error);
        showToast("Couldn't get recipe suggestions right now.", "error");
    } finally {
        setIsFetchingRecipes(false);
    }
  }, [showToast]);

  const handleSearchRecipes = useCallback(async (query: string) => {
    setIsFetchingRecipes(true);
    setRecipes([]);
     try {
        const fetchedRecipes = await searchRecipes(query);
        setRecipes(fetchedRecipes);
    } catch (error) {
        console.error("Failed to fetch recipes for query:", query, error);
        showToast(`Couldn't find recipes for "${query}".`, "error");
    } finally {
        setIsFetchingRecipes(false);
    }
  }, [showToast]);
  
  useEffect(() => {
    fetchPersonalizedRecipes();
  }, [fetchPersonalizedRecipes]);

  useEffect(() => {
    const PROACTIVE_CHECK_INTERVAL = 30000;
    const SUGGESTION_COOLDOWN = 5 * 60 * 1000;

    const intervalId = setInterval(async () => {
        const shouldCheck = 
            !proactiveSuggestion &&
            !activeView &&
            !isGeneratingBriefing.active &&
            !briefingData &&
            Date.now() - lastSuggestionTimestamp > SUGGESTION_COOLDOWN;

        if (shouldCheck) {
            const allEvents = Object.keys(eventsByDate).reduce((acc: CalendarEvent[], key) => acc.concat(eventsByDate[key]), []);
            try {
                const weatherToday = weatherData.length > 0 ? weatherData[0] : null;
                const suggestion = await getProactiveSuggestion(
                    allEvents,
                    groceryList,
                    weatherToday
                );

                if (suggestion) {
                    setProactiveSuggestion(suggestion);
                }
            } catch (error) {
                console.error("Error fetching proactive suggestion:", error);
            }
        }
    }, PROACTIVE_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [proactiveSuggestion, activeView, lastSuggestionTimestamp, eventsByDate, groceryList, isGeneratingBriefing, briefingData, weatherData]);
  
  const handleAcceptSuggestion = useCallback((suggestion: ProactiveSuggestion) => {
    if (suggestion.type === 'grocery' && suggestion.actionableItem) {
        handleAddGroceryItem(suggestion.actionableItem, 'Other');
        showToast(`Added "${suggestion.actionableItem}" to your grocery list.`, 'success');
    } else if (suggestion.type === 'event') {
        setActiveView('events');
        showToast(`Here are some local events you might like!`, 'success');
    }
    setProactiveSuggestion(null);
    setLastSuggestionTimestamp(Date.now());
  }, [handleAddGroceryItem, showToast]);

  const handleDismissSuggestion = useCallback(() => {
    setProactiveSuggestion(null);
    setLastSuggestionTimestamp(Date.now());
  }, []);

  const syncSetValue = (key: string, setter: React.Dispatch<React.SetStateAction<string>>) => (newValue: string) => {
      setter(newValue);
      setActiveInput(prev => {
          if (prev && prev.key === key) {
              return { ...prev, value: newValue };
          }
          return prev;
      });
  };
  
  const handleGeneralQuery = useCallback((userQuery: string, modelResponse: string) => {
    setChatMessages([
        { role: 'user', content: userQuery },
        { role: 'model', content: modelResponse },
    ]);
    setIsAiChatOpen(true);
}, []);

    // --- Storyboard Handlers ---
    const handleStartStory = useCallback(async (prompt: string) => {
        setIsGeneratingStory(true);
        setStory([]);
        try {
            const text = await generateStorySegment(prompt);
            const imageUrl = await generateStoryImage(text);
            setStory([{ id: Date.now(), text, imageUrl }]);
        } catch (error) {
            console.error("Failed to start story:", error);
            showToast("Sorry, I couldn't start the story.", 'error');
        } finally {
            setIsGeneratingStory(false);
        }
    }, [showToast]);
    
    const handleContinueStory = useCallback(async () => {
        if (story.length === 0) return;
        setIsGeneratingStory(true);
        try {
            const existingStoryText = story.map(p => p.text).join('\n\n');
            const text = await generateStorySegment('', existingStoryText);
            const imageUrl = await generateStoryImage(text);
            setStory(prev => [...prev, { id: Date.now(), text, imageUrl }]);
        } catch (error) {
            console.error("Failed to continue story:", error);
            showToast("Sorry, I couldn't continue the story.", 'error');
        } finally {
            setIsGeneratingStory(false);
        }
    }, [story, showToast]);

    const handleResetStory = useCallback(() => {
        setStory([]);
    }, []);

    const handleNavigate = (view: ModalType | 'home') => {
        playSound('click');
        if (view === 'home') {
            handleSetActiveView(null);
        } else {
            handleSetActiveView(view);
        }
    };
    
    const renderActiveView = () => {
        switch (activeView) {
            case 'notes':
                return <NotesApp notes={notes} onAdd={handleCreateAndEditNote} onUpdate={handleUpdateNote} onDelete={handleDeleteNote} onChangeColor={handleChangeNoteColor} onNoteFocus={(id) => { const note = notes.find(n => n.id === id); if(note) handleSetActiveInput(`note-${id}`, note.text, (newText) => handleUpdateNote(id, newText)) }} activeInputKey={activeInput?.key} />;
            case 'grocery':
                return <GroceryApp items={groceryList} onToggle={handleToggleGroceryItem} onAdd={handleAddGroceryItem} onClearCompleted={handleClearCompletedGroceries} newItemName={newGroceryItemName} setNewItemName={syncSetValue('new-grocery-name', setNewGroceryItemName)} onNewItemNameFocus={() => handleSetActiveInput('new-grocery-name', newGroceryItemName, setNewGroceryItemName)} activeInputKey={activeInput?.key} />;
            case 'recipes':
                return <RecipesApp recipes={recipes} onSelectRecipe={setSelectedRecipe} isFetching={isFetchingRecipes} onSearch={handleSearchRecipes} />;
            case 'mealPlanner':
                return <MealPlannerApp recipes={recipes} onAddCalendarEvent={handleAddCalendarEvent} onAddGroceryItem={handleAddGroceryItem} />;
            case 'events':
                return <LocalEvents onAddCalendarEvent={handleAddCalendarEvent} />;
            case 'games':
                return <GamesApp initialGame={initialGame} story={story} isGenerating={isGeneratingStory} onStartStory={handleStartStory} onContinueStory={handleContinueStory} onResetStory={handleResetStory} />;
            default:
                return <CalendarApp eventsBySource={eventsByDate} weatherData={weatherData} onSelectDay={(day) => setSelectedDay(day)} onSelectEvent={(event) => setEditingEvent(event)} />;
        }
    };
    
    const getHeaderText = () => {
        if (!activeView) {
            return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        }
        return activeView.charAt(0).toUpperCase() + activeView.slice(1);
    }

  return (
    <div onClick={handleInteraction} className="flex h-screen bg-slate-100 text-slate-800 font-sans antialiased overflow-hidden">
        <SeasonalBackground />
        <Sidebar onNavigate={handleNavigate} activeView={activeView || 'home'} />

        <main className="flex-1 flex flex-col relative overflow-hidden">
            <header className="flex justify-between items-center flex-shrink-0 p-6">
                <h1 className="text-3xl font-bold text-teal-600 drop-shadow-sm">{getHeaderText()}</h1>
                <div>
                    {profile ? (
                        <div className="flex items-center gap-4">
                            <img src={profile.picture} alt="user image" className="w-10 h-10 rounded-full" />
                            <button onClick={() => {
                                logout();
                                setProfile(null);
                            }} className="text-sm font-medium text-slate-600 hover:text-slate-900">Log out</button>
                        </div>
                    ) : (
                        <>
                            {import.meta.env.VITE_USE_FAKE_DATA === 'true' ? (
                                <button onClick={() => {
                                    setAccessToken('fake_token');
                                    getProfile().then(setProfile);
                                }} className="ml-4 text-sm font-medium text-slate-600 hover:text-slate-900">
                                    Login with Fake User
                                </button>
                            ) : (
                                <GoogleAuth setProfile={setProfile} />
                            )}
                        </>
                    )}
                </div>
            </header>
            
            <div className="relative flex-1 px-6 pb-6 pt-0 min-h-0">
                {proactiveSuggestion && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl z-30">
                      <ProactiveSuggestionBanner
                          suggestion={proactiveSuggestion}
                          onAccept={handleAcceptSuggestion}
                          onDismiss={handleDismissSuggestion}
                      />
                  </div>
                )}
                <div className="h-full rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200/80 overflow-hidden">
                    <div className="h-full overflow-y-auto p-4 sm:p-6">
                        {renderActiveView()}
                    </div>
                </div>
            </div>

            {isGeneratingBriefing.active && <Loader message={`Preparing briefing...`} />}
            {briefingData && <DailyBriefing user={briefingData.user} briefingText={briefingData.text} onClose={() => setBriefingData(null)} />}
            
            {selectedDay && (
                <DayDetailView 
                  day={selectedDay} 
                  events={eventsByDate[selectedDay.toISOString().split('T')[0]] || []}
                  weather={weatherData.find(w => w.day === selectedDay.toLocaleDateString('en-US', { weekday: 'short' })) || null}
                  onClose={handleCloseDayDetailView}
                  onSelectEvent={setEditingEvent}
                  dinner={dinnerPlan[selectedDay.toISOString().split('T')[0]]}
                />
            )}

            {editingEvent && (
                <EventDetailView
                    event={editingEvent}
                    onClose={handleCloseEventDetailView}
                    onSave={handleSaveEvent}
                    onDelete={handleDeleteEvent}
                    activeInputKey={activeInput?.key}
                    onTitleFocus={() => handleSetActiveInput(`event-title-${editingEvent.id}`, editingEvent.title, (newTitle) => setEditingEvent(e => e ? {...e, title: newTitle} : null))}
                    onTimeFocus={() => handleSetActiveInput(`event-time-${editingEvent.id}`, editingEvent.time, (newTime) => setEditingEvent(e => e ? {...e, time: newTime} : null))}
                    onParticipantFocus={() => handleSetActiveInput(`event-participant-${editingEvent.id}`, newEventParticipant, setNewEventParticipant)}
                    newParticipant={newEventParticipant}
                    setNewParticipant={syncSetValue(`event-participant-${editingEvent.id}`, setNewEventParticipant)}
                />
            )}
            
            {selectedRecipe && (
                <RecipeDetailView 
                  recipe={selectedRecipe}
                  onClose={() => setSelectedRecipe(null)}
                  onAddToGroceryList={handleAddToGroceryListFromRecipe}
                  onScheduleDinner={setSchedulingDinnerFor}
                />
            )}

            {schedulingDinnerFor && (
                <ScheduleDinnerModal
                    isOpen={!!schedulingDinnerFor}
                    onClose={() => setSchedulingDinnerFor(null)}
                    recipeName={schedulingDinnerFor.recipeName}
                    onSchedule={(dateKey, recipeName) => {
                        handleSetDinnerForDay(dateKey, recipeName);
                        setSchedulingDinnerFor(null);
                    }}
                />
            )}
            
            {isAiChatOpen && (
                <AiChatModal 
                    isOpen={isAiChatOpen}
                    onClose={() => setIsAiChatOpen(false)}
                    messages={chatMessages}
                />
            )}
            
            <VoiceAssistant
                notes={notes}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                eventsBySource={eventsBySourceAndDate}
                onAddCalendarEvent={handleAddCalendarEvent}
                onDeleteCalendarEvent={handleDeleteCalendarEvent}
                onEditCalendarEvent={handleEditCalendarEvent}
                groceryList={groceryList}
                onAddGroceryItem={handleAddGroceryItem}
                onToggleGroceryItem={handleToggleGroceryItem}
                onClearCompletedGroceries={handleClearCompletedGroceries}
                setActiveModal={handleSetActiveView}
                onSetDinnerForDay={handleSetDinnerForDay}
                onGeneralQuery={handleGeneralQuery}
                onStartStory={handleStartStory}
            />
            
            {activeInput && <OnScreenKeyboard onKeyPress={handleKeyboardKeyPress} onClose={() => setActiveInput(null)} />}
        </main>
    </div>
  );
}

function App() {
    return (
        <DndProvider backend={HTML5Backend}>
            <ToastProvider>
                <AppContent />
            </ToastProvider>
        </DndProvider>
    );
}

export default App;