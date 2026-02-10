# Troubleshooting Guide 🔧

## Problems Solved & Solutions

This document tracks all issues encountered during development and their solutions.

---

## 🐛 Problem 1: Date Formatting Error

### **Issue:**
```
Error: Invalid time value
```
Runtime error when displaying task dates in TaskCard component.

### **Root Cause:**
- Tasks stored in localStorage as JSON
- Date objects serialized to ISO strings
- `formatDate()` function expected Date objects only
- Caused error when passed strings

### **Solution:**
Updated `formatDate()` utility function to handle both Date objects and ISO strings:

```typescript
export const formatDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};
```

**Files Modified:**
- `src/utils/taskHelpers.ts`
- `src/types/index.ts` (updated Task interface)

**Status:** ✅ Fixed

---

## 🐛 Problem 2: Infinite Update Loop Warning

### **Issue:**
```
Warning: Maximum update depth exceeded
```
React warning caused infinite re-renders in FilterBar component.

### **Root Cause:**
- `handleFilterChange` function recreated on every render
- Passed as dependency to `useEffect` in FilterBar
- Caused effect to run infinitely

### **Solution:**
Wrapped `handleFilterChange` in `useCallback` with stable dependencies:

```typescript
const handleFilterChange = useCallback((newFilters: FilterOptions) => {
  setFilters(newFilters);
}, []); // Empty deps - function is stable
```

**Files Modified:**
- `src/components/TaskBoard.tsx`

**Status:** ✅ Fixed

---

## 🐛 Problem 3: Dark Mode Not Working

### **Issue:**
Dark mode toggle button present but styles not applying.

### **Root Cause:**
Missing `darkMode: 'class'` configuration in Tailwind config.

### **Solution:**
Added dark mode configuration:

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  // ... rest of config
}
```

**Files Modified:**
- `tailwind.config.js`
- All component files (added `dark:` classes)

**Status:** ✅ Fixed

---

## 🐛 Problem 4: TypeScript Errors - Missing `order` Field

### **Issue:**
```
Property 'order' is missing in type '...' but required in type 'Task'
```
30+ TypeScript errors after adding `order` field to Task interface.

### **Root Cause:**
- Added `order: number` to Task interface
- Mock data didn't have order values
- TypeScript strict mode caught missing field

### **Solution:**
Created helper function to auto-assign orders:

```typescript
export const ensureTasksHaveOrder = (tasks: Task[]): Task[] => {
  const grouped = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  return tasks.map((task) => {
    if (task.order !== undefined) return task;
    const statusTasks = grouped[task.status];
    const index = statusTasks.indexOf(task);
    return { ...task, order: index };
  });
};
```

Used in mockData.ts:
```typescript
export const mockTasks: Task[] = ensureTasksHaveOrder(rawMockTasks as Task[]);
```

**Files Modified:**
- `src/types/index.ts`
- `src/utils/taskHelpers.ts`
- `src/utils/mockData.ts`

**Status:** ✅ Fixed

---

## 🐛 Problem 5: Unused Variable Warning

### **Issue:**
```
'modalRef' is assigned a value but never used
```
ESLint warning in TaskModal component.

### **Root Cause:**
`modalRef` was declared but not used in the component.

### **Solution:**
Removed unused variable:

```typescript
// Removed this line:
const modalRef = useRef<HTMLDivElement>(null);
```

**Files Modified:**
- `src/components/TaskModal.tsx`

**Status:** ✅ Fixed

---

## 🐛 Problem 6: Drop Indicator Not Clear

### **Issue:**
Drop indicator line was too subtle - hard to see where task would land.

### **Root Cause:**
- Small line (0.5px height)
- No spacing around line
- Solid color (not gradient)
- No glow effect

### **Solution:**
Enhanced drop indicator with:
1. **Gradient line** - fades from transparent to blue
2. **Glow effect** - shadow around line
3. **Spacing** - 24px + 8px gap (32px total)
4. **Pulsing animation** - draws attention
5. **Larger size** - 1px line in 6px container

```typescript
<div className="absolute -top-6 left-0 right-0 h-6 flex items-center justify-center z-20">
  <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent dark:via-blue-400 rounded-full shadow-lg shadow-blue-500/50 animate-pulse" />
</div>
```

**Files Modified:**
- `src/components/TaskColumn.tsx`

**Status:** ✅ Fixed

---

## 🐛 Problem 7: Unbalanced Spacing Around Drop Line

### **Issue:**
Spacing appeared only on one side of the drop indicator line (top OR bottom, not both).

### **Root Cause:**
Margin applied only in one direction:
- `mt-4` for "before" position (space above only)
- `mb-4` for "after" position (space below only)

### **Solution:**
Added balanced spacing on both sides:

```typescript
className={`relative transition-all duration-200 ${
  dragOverTaskId === task.id && dropPosition === 'before' ? 'mt-6 mb-2' : ''
} ${
  dragOverTaskId === task.id && dropPosition === 'after' ? 'mt-2 mb-6' : ''
}`}
```

**Result:**
- Total gap: 32px (24px + 8px)
- Line centered in gap
- Space on both sides

**Files Modified:**
- `src/components/TaskColumn.tsx`

**Status:** ✅ Fixed

---

## 🐛 Problem 8: Same-Column Reordering Not Working

### **Issue:**
Dragging tasks within the same column didn't reorder them correctly.

### **Root Cause:**
When calculating drop position, the dragged task was included in the column tasks array, causing incorrect position calculations.

### **Solution:**
1. **Detect same-column reordering:**
```typescript
const draggedTask = tasks.find((t) => t.id === taskId);
const isSameColumn = draggedTask?.status === newStatus;
```

2. **Filter out dragged task:**
```typescript
const columnTasks = isSameColumn
  ? groupedTasks[newStatus].filter((t) => t.id !== taskId)
  : groupedTasks[newStatus];
```

3. **Prevent self-drop:**
```typescript
if (dropTargetId === taskId) {
  return; // Can't drop on yourself
}
```

**Files Modified:**
- `src/components/TaskBoard.tsx`

**Status:** ✅ Fixed

---

## 🐛 Problem 10: Negative Order Values

### **Issue:**
When repeatedly dropping tasks at the first position in a column, order values became negative (-1, -2, -3...), causing sorting issues.

### **Root Cause:**
When inserting before the first task (order: 0), the code calculated:
```typescript
newOrder = targetTask.order - 1  // 0 - 1 = -1
```
Each subsequent drop at the top made it more negative.

### **Solution:**
Implemented automatic order normalization:

1. **Created `normalizeTaskOrders()` function:**
```typescript
export const normalizeTaskOrders = (tasks: Task[]): Task[] => {
  // Group by status and sort by current order
  // Reassign sequential orders (0, 1, 2, 3...)
  return tasks.map((task) => ({ ...task, order: index }));
};
```

2. **Added auto-normalization in TaskContext:**
```typescript
useEffect(() => {
  const hasNegativeOrders = tasks.some(t => (t.order || 0) < 0);
  if (hasNegativeOrders) {
    console.log('🔄 Normalizing task orders...');
    const normalized = normalizeTaskOrders(tasks);
    setTasks(normalized);
  }
}, [tasks]);
```

**Result:**
- Orders can temporarily go negative
- System automatically detects and normalizes them
- All tasks get sequential orders (0, 1, 2, 3...)
- Future operations work correctly

**Files Modified:**
- `src/utils/taskHelpers.ts` - Added normalizeTaskOrders function
- `src/context/TaskContext.tsx` - Added auto-normalization effect
- `src/components/TaskBoard.tsx` - Improved order calculation

**Status:** ✅ Fixed

---

## 🐛 Problem 11: Real-Time Simulation Data Pollution

### **Issue:**
Task titles and descriptions kept growing infinitely during real-time simulation:

```
"Update dependencies"
→ "Update dependencies (updated by Bob Smith)"
→ "Update dependencies (updated by Bob Smith) (updated by David Brown)"
→ "Update dependencies (updated by Bob Smith) (updated by David Brown) (updated by Emma Davis)"
→ ... continued growing indefinitely!
```

**Visual Impact:**
- Task cards became extremely long
- Titles wrapped multiple lines
- Descriptions filled with repeated "[Updated by X]" text
- UI became cluttered and unreadable
- Poor user experience

### **Root Cause:**
The real-time simulator included `title_edit` and `description_edit` update types that **appended** text to existing content:

```typescript
// Problematic code:
case 'title_edit':
  updates.title = `${task.title} (updated by ${externalUser})`;
  break;

case 'description_edit':
  updates.description = `${task.description}\n\n[Updated by ${externalUser}]`;
  break;
```

**Why This Was Bad:**
- Each simulation cycle (15-20s) would append more text
- No limit on growth
- Destructive to original data
- Not realistic collaboration behavior

### **Solution:**
Removed destructive update types and kept only clean, non-destructive updates:

```typescript
// Fixed: Only non-destructive updates
const UPDATE_TYPES = [
  'status_change',      // ✅ Clean: changes status (todo/in-progress/done)
  'priority_change',    // ✅ Clean: changes priority (low/medium/high/urgent)
  'assignee_change',    // ✅ Clean: changes assignee (Alice/Bob/Carol/etc)
  // ❌ REMOVED: 'title_edit'
  // ❌ REMOVED: 'description_edit'
] as const;
```

**Removed Code:**
```typescript
// Deleted from generateRandomUpdate():
case 'title_edit':
  updates.title = `${task.title} (updated by ${externalUser})`;
  break;

case 'description_edit':
  updates.description = `${task.description}\n\n[Updated by ${externalUser}]`;
  break;

// Deleted from getUpdateDescription():
case 'title_edit':
  return `${externalUser} updated a task title`;

case 'description_edit':
  return `${externalUser} updated a task description`;
```

**Result:**
- ✅ Titles and descriptions remain intact
- ✅ Only meaningful workflow changes (status, priority, assignee)
- ✅ No data pollution
- ✅ Better simulation of real collaboration
- ✅ Cleaner, more professional UI
- ✅ Realistic collaborative behavior

**Files Modified:**
- `src/services/realtimeSimulator.ts` - Removed title_edit and description_edit types

**Status:** ✅ Fixed

---

## 📊 Summary of Issues

| # | Issue | Severity | Status | Files Modified |
|---|-------|----------|--------|----------------|
| 1 | Date formatting error | 🔴 High | ✅ Fixed | taskHelpers.ts, types/index.ts |
| 2 | Infinite update loop | 🔴 High | ✅ Fixed | TaskBoard.tsx |
| 3 | Dark mode not working | 🟡 Medium | ✅ Fixed | tailwind.config.js, all components |
| 4 | TypeScript errors (order) | 🟡 Medium | ✅ Fixed | types/index.ts, taskHelpers.ts, mockData.ts |
| 5 | Unused variable warning | 🟢 Low | ✅ Fixed | TaskModal.tsx |
| 6 | Drop indicator unclear | 🟡 Medium | ✅ Fixed | TaskColumn.tsx |
| 7 | Unbalanced spacing | 🟢 Low | ✅ Fixed | TaskColumn.tsx |
| 8 | Same-column reordering | 🔴 High | ✅ Fixed | TaskBoard.tsx |
| 9 | Duplicate card during drag | 🟡 Medium | ✅ Enhanced | TaskCard.tsx |
| 10 | Negative order values | 🔴 High | ✅ Fixed | taskHelpers.ts, TaskContext.tsx, TaskBoard.tsx |
| 11 | Real-time data pollution | 🔴 High | ✅ Fixed | realtimeSimulator.ts |

---

## 🎯 Best Practices Learned

### **1. Date Handling**
- Always handle both Date objects and ISO strings
- Add validation and error handling
- Use try-catch for date operations

### **2. React Hooks**
- Use `useCallback` for functions passed as props
- Memoize expensive calculations with `useMemo`
- Keep dependency arrays stable

### **3. TypeScript**
- Use strict mode for better type safety
- Handle optional fields properly
- Create helper functions for migrations

### **4. Dark Mode**
- Configure Tailwind properly (`darkMode: 'class'`)
- Add dark variants to all color classes
- Test in both modes

### **5. UX/UI**
- Make interactive elements obvious
- Use multiple visual cues (color, spacing, animation)
- Balance aesthetics with clarity

### **6. Drag & Drop**
- Filter out dragged item in same-column operations
- Prevent self-drop scenarios
- Provide clear visual feedback

---

## 🔍 Debugging Tips

### **For Date Issues:**
```javascript
// Check date type
console.log(typeof date, date);

// Validate date
const dateObj = new Date(date);
console.log(isNaN(dateObj.getTime()) ? 'Invalid' : 'Valid');
```

### **For Infinite Loops:**
```javascript
// Check effect dependencies
useEffect(() => {
  console.log('Effect running');
}, [dependency]); // Log when this changes
```

### **For TypeScript Errors:**
```typescript
// Use type assertions carefully
const tasks = rawTasks as Task[];

// Or create helper functions
const ensureType = (data: unknown): Task[] => { ... }
```

### **For Dark Mode:**
```javascript
// Check if dark class is applied
console.log(document.body.classList.contains('dark'));

// Test Tailwind config
// Ensure darkMode: 'class' is set
```

---

## 📝 Future Improvements

### **Potential Enhancements:**
1. **Order Normalization** - Reset orders to sequential integers periodically
2. **Undo/Redo** - Track history of task movements
3. **Keyboard Navigation** - Arrow keys to reorder tasks
4. **Touch Support** - Mobile drag-and-drop
5. **Batch Operations** - Move multiple tasks at once
6. **Animation Polish** - Smooth task movements on reorder

### **Performance Optimizations:**
1. **Virtual Scrolling** - For columns with many tasks
2. **Debounced Updates** - Reduce localStorage writes
3. **Lazy Loading** - Load tasks on demand
4. **Memoization** - Cache expensive calculations

---

## 🆘 Getting Help

If you encounter new issues:

1. **Check Console** - Look for errors and warnings
2. **Check Network** - Verify API calls (if any)
3. **Check State** - Use React DevTools
4. **Check Types** - TypeScript errors are your friend
5. **Check Docs** - Refer to this troubleshooting guide

---

**Last Updated:** 2026-02-10  
**Total Issues Resolved:** 11  
**Status:** All known issues resolved ✅
