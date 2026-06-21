const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');

// Remove initial mock data logic since it's in Contexts now
code = code.replace(/const today = new Date\(\)[\s\S]*?const initialNotes: Note\[\] = \[[\s\S]*?\];/g, '');

const stateTarget = `  const [notes, setNotes] = useState<Note[]>(() => {
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
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);`;

code = code.replace(stateTarget, `  const { notes, addNote, updateNote, deleteNote, changeNoteColor } = useNotes();
  const { groceryList, addGroceryItem, toggleGroceryItem, clearCompletedGroceries, addFromRecipe } = useGroceries();
  const { events, setEvents, weatherData, dinnerPlan, addCalendarEvent, editCalendarEvent, deleteCalendarEvent, setDinnerForDay, eventsByDate, eventsBySourceAndDate } = useCalendar();

  const [activeInput, setActiveInput] = useState<ActiveInput>(null);
  const [activeView, setActiveView] = useState<ModalType | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);`);

const dinnerPlanTarget = `  // New state for dinner planning
  const [dinnerPlan, setDinnerPlan] = useState<Record<string, string>>({
    [todayKey]: 'Taco Night',
    [dayAfterTomorrowKey]: 'Pizza',
  });`;

code = code.replace(dinnerPlanTarget, `  // New state for dinner planning`);

const useEffectsTarget1 = `  useEffect(() => {
    localStorage.setItem('hearth-notes', JSON.stringify(notes));
  }, [notes]);`;
code = code.replace(useEffectsTarget1, '');

const useEffectsTarget2 = `  useEffect(() => {
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
  }, [showToast]);`;
code = code.replace(useEffectsTarget2, '');

const deleteHandlersRegex = /const eventsByDate = useMemo\(\(\) => \{[\s\S]*?const handleSetDinnerForDay = useCallback\(\(dateKey: string, dinner: string\) => \{\n.*?setDinnerPlan[\s\S]*?showToast\([\s\S]*?\);\n\s*\}, \[showToast\]\);/g;

code = code.replace(deleteHandlersRegex, `  const handleUpdateNote = useCallback((id: number, text: string) => {
    updateNote(id, text);
    setActiveInput(prev => {
        if (prev && prev.key === \`note-\${id}\`) {
            return { ...prev, value: text };
        }
        return prev;
    });
  }, [updateNote]);

  const handleCreateAndEditNote = useCallback(() => {
    const newNote = addNote('');
    setActiveInput({
        key: \`note-\${newNote.id}\`,
        value: newNote.text,
        setValue: (newText) => handleUpdateNote(newNote.id, newText)
    });
  }, [addNote, handleUpdateNote]);

  const handleAddToGroceryListFromRecipe = useCallback((recipe: Recipe) => {
      const itemsAddedCount = addFromRecipe(recipe);
      setSelectedRecipe(null);
      showToast(\`Added \${itemsAddedCount} ingredients to your grocery list.\`, 'success');
  }, [addFromRecipe, showToast]);

  const handleAddGroceryItemWithClear = useCallback((name: string, section?: string) => {
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
      showToast(\`Set "\${dinner}" for dinner on \${friendlyDate}.\`, 'success');
  }, [setDinnerForDay, showToast]);`);

code = code.replace(/onAdd=\{handleAddGroceryItem\}/g, 'onAdd={handleAddGroceryItemWithClear}');
code = code.replace(/onAddCalendarEvent=\{handleAddCalendarEvent\}/g, 'onAddCalendarEvent={handleAddCalendarEventWithToast}');
code = code.replace(/onSetDinnerForDay=\{handleSetDinnerForDay\}/g, 'onSetDinnerForDay={handleSetDinnerForDayWithToast}');
code = code.replace(/onChangeColor=\{handleChangeNoteColor\}/g, 'onChangeColor={changeNoteColor}');

const appComponent = `function App() {
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
}`;
code = code.replace(/function App\(\) \{[\s\S]*?return \([\s\S]*?\);\n\}/, appComponent);

fs.writeFileSync('App.tsx', code);
