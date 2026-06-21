import re

with open('App.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace any occurrence as a standalone token
code = re.sub(r'\bhandleAddGroceryItem\b', 'handleAddGroceryItemWithClear', code)
code = re.sub(r'\bhandleToggleGroceryItem\b', 'toggleGroceryItem', code)
code = re.sub(r'\bhandleClearCompletedGroceries\b', 'clearCompletedGroceries', code)
code = re.sub(r'\bhandleDeleteNote\b', 'deleteNote', code)
code = re.sub(r'\bhandleSetDinnerForDay\b', 'handleSetDinnerForDayWithToast', code)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
