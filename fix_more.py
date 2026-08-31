import re

with open('App.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix FAMILY_USER
code = code.replace("const FAMILY_USER: User = { id: 'family', name: 'Family', avatar: '👨‍👩‍👧‍👦', color: 'border-green-500' };", '')
code = code.replace("function AppContent() {", "const FAMILY_USER: User = { id: 'family', name: 'Family', avatar: '👨‍👩‍👧‍👦', color: 'border-green-500' };\n\nfunction AppContent() {")

# Fix missing handlers by creating them or replacing them inline

# App.tsx(382,9): handleAddGroceryItem -> addGroceryItem (or handleAddGroceryItemWithClear)
code = code.replace('handleAddGroceryItem(parts[1])', 'handleAddGroceryItemWithClear(parts[1])')
code = code.replace('handleAddGroceryItem(item)', 'handleAddGroceryItemWithClear(item)')

# In JSX where handlers were passed to child components, they were sometimes passed differently
# Wait, VoiceAssistant needs the handle* versions but I should just map them correctly.
# App.tsx(463,118): handleDeleteNote
code = code.replace('onDeleteNote={handleDeleteNote}', 'onDeleteNote={deleteNote}')
# App.tsx(465,66): handleToggleGroceryItem
code = code.replace('onToggleItem={handleToggleGroceryItem}', 'onToggleItem={toggleGroceryItem}')
# App.tsx(465,147): handleClearCompletedGroceries
code = code.replace('onClearCompleted={handleClearCompletedGroceries}', 'onClearCompleted={clearCompletedGroceries}')
# App.tsx(469,129): handleAddGroceryItem in RecipesApp
code = code.replace('onAddToGroceryList={handleAddGroceryItem}', 'onAddToGroceryList={handleAddGroceryItemWithClear}')
# App.tsx(581,25): handleSetDinnerForDay
code = code.replace('onSave={handleSetDinnerForDay}', 'onSave={handleSetDinnerForDayWithToast}')

# VoiceAssistant props
code = code.replace('onAddNote={handleAddNote}', 'onAddNote={addNote}')
code = code.replace('onAddCalendarEvent={handleAddCalendarEvent}', 'onAddCalendarEvent={handleAddCalendarEventWithToast}')
code = code.replace('onDeleteCalendarEvent={handleDeleteCalendarEvent}', 'onDeleteCalendarEvent={deleteCalendarEvent}')
code = code.replace('onEditCalendarEvent={handleEditCalendarEvent}', 'onEditCalendarEvent={editCalendarEvent}')

# Ensure we replace any other standalone handleAddGroceryItem or handleToggleGroceryItem
code = code.replace('handleAddGroceryItem={handleAddGroceryItem}', 'handleAddGroceryItem={handleAddGroceryItemWithClear}')

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
