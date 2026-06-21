import re

with open('App.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update imports
imports_target = "import { getProactiveSuggestion, getPersonalizedRecipes, searchRecipes, generateDailyBriefing, generateStorySegment, generateStoryImage, getWeatherForecast } from './services/geminiService';"
imports_replacement = """import { getProactiveSuggestion } from './services/proactiveService';
import { getPersonalizedRecipes, searchRecipes } from './services/recipeService';
import { generateDailyBriefing } from './services/briefingService';
import { generateStorySegment, generateStoryImage } from './services/storyService';
import { getWeatherForecast } from './services/weatherService';
import { NotesProvider, useNotes } from './contexts/NotesContext';
import { GroceryProvider, useGroceries } from './contexts/GroceryContext';
import { CalendarProvider, useCalendar } from './contexts/CalendarContext';
import { USE_FAKE_DATA } from './services/geminiService';"""
code = code.replace(imports_target, imports_replacement)

# Remove old USE_FAKE_DATA definition
fake_data_target = "const USE_FAKE_DATA = import.meta.env.VITE_USE_FAKE_DATA === 'true' || !HAS_GOOGLE_CLIENT_ID;"
code = code.replace(fake_data_target, "")

# Remove today, initialEvents, initialNotes
code = re.sub(r'const today = new Date\(\);[\s\S]*?const initialNotes: Note\[\] = \[[\s\S]*?\];\n', '', code)

# Replace state in AppContent
state_target = r"""  const \[notes, setNotes\] = useState<Note\[\]>\(\(\) => \{[\s\S]*?\}\);\n  const \[activeInput, setActiveInput\] = useState<ActiveInput>\(null\);\n  const \[events, setEvents\] = useState<CalendarEvent\[\]>\(initialEvents\);\n  const \[activeView, setActiveView\] = useState<ModalType \| null>\(null\);\n  const \[groceryList, setGroceryList\] = useState<GroceryItem\[\]>\([\s\S]*?\]\);\n  const \[recipes, setRecipes\] = useState<Recipe\[\]>\(\[\]\);\n  const \[weatherData, setWeatherData\] = useState<WeatherData\[\]>\(\[\]\);"""
state_replacement = """  const { notes, addNote, updateNote, deleteNote, changeNoteColor } = useNotes();
  const { groceryList, addGroceryItem, toggleGroceryItem, clearCompletedGroceries, addFromRecipe } = useGroceries();
  const { events, setEvents, weatherData, dinnerPlan, addCalendarEvent, editCalendarEvent, deleteCalendarEvent, setDinnerForDay, eventsByDate, eventsBySourceAndDate } = useCalendar();

  const [activeInput, setActiveInput] = useState<ActiveInput>(null);
  const [activeView, setActiveView] = useState<ModalType | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);"""
code = re.sub(state_target, state_replacement, code)

# Remove dinnerPlan state
code = re.sub(r'  // New state for dinner planning\n  const \[dinnerPlan, setDinnerPlan\] = useState<Record<string, string>>\(\{[\s\S]*?\}\);\n', '', code)

# Remove useEffects for notes and weather
code = re.sub(r'  useEffect\(\(\) => \{\n    localStorage\.setItem\(\'hearth-notes\', JSON\.stringify\(notes\)\);\n  \}, \[notes\]\);\n', '', code)
code = re.sub(r'  useEffect\(\(\) => \{\n    const fetchWeather = async \(\) => \{[\s\S]*?fetchWeather\(\);\n  \}, \[showToast\]\);\n', '', code)

# Replace all handlers
handlers_regex = r'  const eventsByDate = useMemo\(\(\) => \{[\s\S]*?const handleSetDinnerForDay = useCallback\(\(dateKey: string, dinner: string\) => \{[\s\S]*?\}, \[showToast\]\);\n'
handlers_replacement = """  const handleUpdateNote = useCallback((id: number, text: string) => {
    updateNote(id, text);
    setActiveInput(prev => {
        if (prev && prev.key === `note-${id}`) {
            return { ...prev, value: text };
        }
        return prev;
    });
  }, [updateNote]);

  const handleCreateAndEditNote = useCallback(() => {
    const newNote = addNote('');
    setActiveInput({
        key: `note-${newNote.id}`,
        value: newNote.text,
        setValue: (newText) => handleUpdateNote(newNote.id, newText)
    });
  }, [addNote, handleUpdateNote]);

  const handleAddToGroceryListFromRecipe = useCallback((recipe: Recipe) => {
      const itemsAddedCount = addFromRecipe(recipe);
      setSelectedRecipe(null);
      showToast(`Added ${itemsAddedCount} ingredients to your grocery list.`, 'success');
  }, [addFromRecipe, showToast]);

  const handleAddGroceryItemWithClear = useCallback((name: string, section: string = 'Other') => {
      addGroceryItem(name, section);
      setNewGroceryItemName('');
  }, [addGroceryItem]);

  const handleSaveEvent = useCallback((eventToSave: CalendarEvent) => {
    editCalendarEvent(eventToSave);
    setEditingEvent(null);
    showToast('Event saved successfully!', 'success');
  }, [editCalendarEvent, showToast]);

  const handleDeleteEvent = useCallback((eventId: CalendarEvent['id']) => {
      deleteCalendarEvent(eventId);
      setEditingEvent(null);
      showToast('Event deleted.', 'success');
  }, [deleteCalendarEvent, showToast]);
  
  const handleAddCalendarEventWithToast = useCallback((title: string, date: string, time: string) => {
      addCalendarEvent(title, date, time);
      showToast('Event added to calendar!', 'success');
  }, [addCalendarEvent, showToast]);
  
  const handleSetDinnerForDayWithToast = useCallback((dateKey: string, dinner: string) => {
      setDinnerForDay(dateKey, dinner);
      const friendlyDate = new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
      showToast(`Set "${dinner}" for dinner on ${friendlyDate}.`, 'success');
  }, [setDinnerForDay, showToast]);
"""
code = re.sub(handlers_regex, handlers_replacement, code)

# Update JSX props
code = code.replace('onAdd={handleAddGroceryItem}', 'onAdd={handleAddGroceryItemWithClear}')
code = code.replace('onAddCalendarEvent={handleAddCalendarEvent}', 'onAddCalendarEvent={handleAddCalendarEventWithToast}')
code = code.replace('onSetDinnerForDay={handleSetDinnerForDay}', 'onSetDinnerForDay={handleSetDinnerForDayWithToast}')
code = code.replace('onChangeColor={handleChangeNoteColor}', 'onChangeColor={changeNoteColor}')

# Replace App export
app_regex = r'function App\(\) \{\n    return \([\s\S]*?\);\n\}'
app_replacement = """function App() {
    return (
        <DndProvider backend={HTML5Backend}>
            <ToastProvider>
                <CalendarProvider>
                    <GroceryProvider>
                        <NotesProvider>
                            <AppContent />
                        </NotesProvider>
                    </GroceryProvider>
                </CalendarProvider>
            </ToastProvider>
        </DndProvider>
    );
}"""
code = re.sub(app_regex, app_replacement, code)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
