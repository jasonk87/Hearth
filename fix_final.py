import re

with open('App.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('handleAddGroceryItem(parts[1])', 'handleAddGroceryItemWithClear(parts[1])')
code = code.replace('handleAddGroceryItem(item)', 'handleAddGroceryItemWithClear(item)')
code = code.replace('handleAddGroceryItem(newGroceryItemName)', 'handleAddGroceryItemWithClear(newGroceryItemName)')
code = code.replace('handleAddGroceryItem={handleAddGroceryItem}', 'handleAddGroceryItem={handleAddGroceryItemWithClear}')
code = code.replace('onDeleteNote={handleDeleteNote}', 'onDeleteNote={deleteNote}')
code = code.replace('onToggleItem={handleToggleGroceryItem}', 'onToggleItem={toggleGroceryItem}')
code = code.replace('onClearCompleted={handleClearCompletedGroceries}', 'onClearCompleted={clearCompletedGroceries}')
code = code.replace('onAddToGroceryList={handleAddGroceryItem}', 'onAddToGroceryList={handleAddGroceryItemWithClear}')
code = code.replace('onSave={handleSetDinnerForDay}', 'onSave={handleSetDinnerForDayWithToast}')

code = code.replace('handleToggleGroceryItem={handleToggleGroceryItem}', 'handleToggleGroceryItem={toggleGroceryItem}')
code = code.replace('handleClearCompletedGroceries={handleClearCompletedGroceries}', 'handleClearCompletedGroceries={clearCompletedGroceries}')
code = code.replace('handleDeleteNote={handleDeleteNote}', 'handleDeleteNote={deleteNote}')

# Catch any remaining references
code = code.replace(' handleAddGroceryItem\n', ' handleAddGroceryItemWithClear\n')
code = code.replace(' handleToggleGroceryItem\n', ' toggleGroceryItem\n')
code = code.replace(' handleClearCompletedGroceries\n', ' clearCompletedGroceries\n')
code = code.replace(' handleDeleteNote\n', ' deleteNote\n')
code = code.replace(' handleSetDinnerForDay\n', ' handleSetDinnerForDayWithToast\n')

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
