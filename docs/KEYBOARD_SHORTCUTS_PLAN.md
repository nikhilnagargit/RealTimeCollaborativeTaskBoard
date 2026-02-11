# Keyboard Shortcuts Plan ⌨️

## Reasonable Keyboard Shortcuts for Task Board

### 🎯 Design Principles

1. **Familiar** - Use common shortcuts (Cmd/Ctrl+N for new, etc.)
2. **Intuitive** - Shortcuts match their action
3. **Non-conflicting** - Don't override browser shortcuts
4. **Discoverable** - Show shortcuts in UI
5. **Accessible** - Support both Mac and Windows

---

## 📋 Recommended Shortcuts

### **1. Task Management** ⭐ HIGH PRIORITY

| Shortcut | Action | Description |
|----------|--------|-------------|
| `N` or `Cmd/Ctrl+N` | New Task | Open task creation modal |
| `E` | Edit Task | Edit selected/focused task |
| `Delete` or `Backspace` | Delete Task | Delete selected task (with confirmation) |
| `D` | Duplicate Task | Duplicate selected task |
| `Cmd/Ctrl+S` | Save Task | Save task in modal |
| `Esc` | Close Modal | Close any open modal |

**Why these?**
- `N` is quick and intuitive (New)
- `E` for Edit is standard
- `Delete` is universal
- `D` for Duplicate is memorable
- `Cmd/Ctrl+S` is universal save
- `Esc` is standard for closing

---

### **2. Navigation** ⭐ HIGH PRIORITY

| Shortcut | Action | Description |
|----------|--------|-------------|
| `←` `→` | Navigate Columns | Move focus between columns |
| `↑` `↓` | Navigate Tasks | Move focus between tasks in column |
| `Tab` | Next Task | Move to next task |
| `Shift+Tab` | Previous Task | Move to previous task |
| `Enter` | Open Task | Open focused task details |
| `1` `2` `3` | Jump to Column | Jump to Todo/In Progress/Done |

**Why these?**
- Arrow keys are intuitive for navigation
- Tab is standard for focus movement
- Enter to open is universal
- Number keys for quick column jumping

---

### **3. Task Status** ⭐ MEDIUM PRIORITY

| Shortcut | Action | Description |
|----------|--------|-------------|
| `T` | Move to Todo | Move focused task to Todo |
| `P` | Move to In Progress | Move focused task to In Progress |
| `C` | Move to Done | Move focused task to Complete/Done |
| `Cmd/Ctrl+←` | Move Left | Move task to previous column |
| `Cmd/Ctrl+→` | Move Right | Move task to next column |

**Why these?**
- `T`, `P`, `C` are first letters (Todo, Progress, Complete)
- Cmd+Arrow for column movement is intuitive

---

### **4. Filtering & Search** ⭐ MEDIUM PRIORITY

| Shortcut | Action | Description |
|----------|--------|-------------|
| `/` or `Cmd/Ctrl+F` | Focus Search | Focus search/filter bar |
| `Cmd/Ctrl+K` | Quick Actions | Open command palette (future) |
| `A` | Show All | Clear all filters |
| `H` | High Priority | Filter high priority tasks |
| `M` | Medium Priority | Filter medium priority tasks |
| `L` | Low Priority | Filter low priority tasks |

**Why these?**
- `/` is standard for search (GitHub, Slack)
- `Cmd+K` is becoming standard for command palette
- Letter keys for quick filtering

---

### **5. View & Display** ⭐ LOW PRIORITY

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl+D` | Toggle Dark Mode | Switch between light/dark |
| `?` | Show Shortcuts | Display keyboard shortcuts help |
| `F` | Toggle Fullscreen | Fullscreen mode |
| `R` | Refresh | Reload tasks |

**Why these?**
- `Cmd+D` for dark mode is common
- `?` for help is universal
- `F` for fullscreen is standard

---

### **6. Bulk Actions** ⭐ LOW PRIORITY

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl+A` | Select All | Select all tasks in column |
| `Cmd/Ctrl+Shift+A` | Select All (Global) | Select all tasks |
| `Shift+Click` | Multi-select | Select multiple tasks |
| `Cmd/Ctrl+X` | Cut | Cut selected tasks |
| `Cmd/Ctrl+C` | Copy | Copy selected tasks |
| `Cmd/Ctrl+V` | Paste | Paste tasks |

**Why these?**
- Standard clipboard operations
- Familiar to all users

---

## 🎨 Implementation Priority

### **Phase 1: Essential (Implement First)** 🔴

```
✅ Must Have:
- N: New Task
- Esc: Close Modal
- Enter: Open Task
- Delete: Delete Task
- ↑↓: Navigate Tasks
- ←→: Navigate Columns
- ?: Show Shortcuts Help
```

**Effort:** 2-3 hours  
**Impact:** High - Core power user features

---

### **Phase 2: Enhanced (Implement Second)** 🟡

```
⚠️ Should Have:
- T/P/C: Move to Column
- E: Edit Task
- /: Focus Search
- Cmd+S: Save Task
- Cmd+D: Toggle Dark Mode
- 1/2/3: Jump to Column
```

**Effort:** 1-2 hours  
**Impact:** Medium - Nice quality of life

---

### **Phase 3: Advanced (Future)** 🟢

```
💡 Nice to Have:
- D: Duplicate Task
- Cmd+←/→: Move Column
- H/M/L: Filter Priority
- A: Show All
- Cmd+K: Command Palette
- Bulk Actions
```

**Effort:** 3-4 hours  
**Impact:** Low - Advanced features

---

## 🏗️ Technical Implementation

### **1. Create useKeyboardShortcuts Hook**

```typescript
// src/hooks/useKeyboardShortcuts.ts
export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach(({ key, ctrl, shift, alt, handler }) => {
        if (matchesShortcut(e, { key, ctrl, shift, alt })) {
          e.preventDefault();
          handler();
        }
      });
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
```

### **2. Create ShortcutsHelp Modal**

```typescript
// src/components/ShortcutsHelp.tsx
export const ShortcutsHelp = () => {
  return (
    <Modal>
      <h2>Keyboard Shortcuts</h2>
      <ShortcutList>
        <ShortcutItem keys={['N']} action="New Task" />
        <ShortcutItem keys={['Esc']} action="Close Modal" />
        {/* ... */}
      </ShortcutList>
    </Modal>
  );
};
```

### **3. Add Focus Management**

```typescript
// Track focused task
const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);

// Navigate with arrow keys
const handleArrowKey = (direction: 'up' | 'down' | 'left' | 'right') => {
  // Move focus based on direction
};
```

### **4. Visual Indicators**

```typescript
// Show shortcuts in UI
<button title="New Task (N)">
  <PlusIcon />
  <span>New Task</span>
  <kbd>N</kbd>
</button>
```

---

## 🎯 User Experience

### **Discoverability:**

1. **Tooltip Hints**
   ```
   [+ New Task] ← Hover shows "N"
   ```

2. **Help Modal**
   ```
   Press ? to see all shortcuts
   ```

3. **First-time Tour**
   ```
   "Try pressing 'N' to create a task!"
   ```

### **Visual Feedback:**

```typescript
// Show focused task
<TaskCard 
  className={isFocused ? 'ring-2 ring-blue-500' : ''}
/>

// Show active shortcut
<div className="fixed bottom-4 right-4">
  Pressed: N
</div>
```

---

## 📊 Shortcut Categories

### **By Frequency:**

**Very Common (Daily):**
- N: New Task
- Enter: Open Task
- Esc: Close Modal
- ↑↓: Navigate

**Common (Weekly):**
- E: Edit
- Delete: Delete
- T/P/C: Move Status
- /: Search

**Occasional (Monthly):**
- D: Duplicate
- Cmd+D: Dark Mode
- ?: Help

### **By User Type:**

**Casual Users:**
- N: New Task
- Esc: Close
- Enter: Open

**Power Users:**
- All navigation shortcuts
- Status movement
- Quick filters

**Developers:**
- Cmd+K: Command palette
- Bulk operations
- Advanced filters

---

## ⚠️ Conflicts to Avoid

### **Browser Shortcuts (Don't Override):**
```
❌ Cmd+T: New Tab
❌ Cmd+W: Close Tab
❌ Cmd+R: Refresh Page
❌ Cmd+L: Address Bar
❌ Cmd+Q: Quit
```

### **Safe Shortcuts:**
```
✅ Single letters (N, E, D, etc.)
✅ Arrow keys
✅ Cmd+Custom (Cmd+K, Cmd+Shift+X)
✅ Function keys (F1-F12)
✅ Special keys (/, ?, Esc)
```

---

## 🧪 Testing Plan

### **Test Cases:**

1. **Basic Shortcuts**
   - Press N → Modal opens
   - Press Esc → Modal closes
   - Press Enter → Task opens

2. **Navigation**
   - Arrow keys move focus
   - Tab cycles through tasks
   - Number keys jump to columns

3. **Conflicts**
   - Shortcuts don't work in input fields
   - Browser shortcuts still work
   - No double-triggering

4. **Accessibility**
   - Screen reader announces shortcuts
   - Focus is visible
   - Keyboard-only navigation works

---

## 📱 Mobile Considerations

**Keyboard shortcuts don't apply to mobile**, but we can:

1. **Gesture Shortcuts**
   - Swipe left/right: Move task
   - Long press: Edit task
   - Double tap: Open task

2. **Quick Actions Menu**
   - Floating action button
   - Context menu on long press

---

## 🎨 UI Enhancements

### **1. Keyboard Shortcut Badge**

```tsx
<button>
  New Task
  <kbd className="ml-2 px-2 py-1 text-xs bg-gray-200 rounded">
    N
  </kbd>
</button>
```

### **2. Shortcuts Help Panel**

```tsx
<ShortcutsPanel>
  <h3>Quick Actions</h3>
  <ul>
    <li><kbd>N</kbd> New Task</li>
    <li><kbd>E</kbd> Edit Task</li>
    <li><kbd>?</kbd> Show Help</li>
  </ul>
</ShortcutsPanel>
```

### **3. Command Palette (Future)**

```tsx
<CommandPalette>
  <input placeholder="Type a command or search..." />
  <CommandList>
    <Command icon="+" shortcut="N">New Task</Command>
    <Command icon="✏️" shortcut="E">Edit Task</Command>
  </CommandList>
</CommandPalette>
```

---

## 🚀 Recommended Implementation

### **Start with Phase 1 (Essential):**

```typescript
// Implement these shortcuts first:
const essentialShortcuts = {
  'n': () => openNewTaskModal(),
  'Escape': () => closeModal(),
  'Enter': () => openFocusedTask(),
  'Delete': () => deleteFocusedTask(),
  'ArrowUp': () => moveFocusUp(),
  'ArrowDown': () => moveFocusDown(),
  'ArrowLeft': () => moveFocusLeft(),
  'ArrowRight': () => moveFocusRight(),
  '?': () => showShortcutsHelp(),
};
```

**Estimated Time:** 2-3 hours  
**Files to Create:**
- `src/hooks/useKeyboardShortcuts.ts`
- `src/components/ShortcutsHelp.tsx`
- `src/utils/keyboardHelpers.ts`

**Files to Modify:**
- `src/components/TaskBoard.tsx`
- `src/components/TaskCard.tsx`

---

## 📝 Summary

### **Recommended Shortcuts (Phase 1):**

| Key | Action | Priority |
|-----|--------|----------|
| `N` | New Task | 🔴 Essential |
| `Esc` | Close Modal | 🔴 Essential |
| `Enter` | Open Task | 🔴 Essential |
| `Delete` | Delete Task | 🔴 Essential |
| `↑` `↓` | Navigate Tasks | 🔴 Essential |
| `←` `→` | Navigate Columns | 🔴 Essential |
| `?` | Show Help | 🔴 Essential |

### **Total Shortcuts Planned:**
- **Phase 1:** 7 shortcuts (Essential)
- **Phase 2:** 8 shortcuts (Enhanced)
- **Phase 3:** 10+ shortcuts (Advanced)

---

**Ready to implement Phase 1?** Let's start with the essential shortcuts! 🚀
