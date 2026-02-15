# 🎯 Interview Preparation Guide - Part 2
## Drag & Drop, Challenges, and Mock Interview Q&A

---

## 🎯 Drag & Drop Implementation

### Overview

The drag-and-drop system allows users to:
1. Reorder tasks within the same column
2. Move tasks between columns
3. See visual feedback during dragging
4. Drop at precise positions (before/after specific tasks)

### Key Components

#### 1. TaskCard (Draggable)

**Drag Start:**
```typescript
const handleDragStart = (e: React.DragEvent) => {
  // Set data transfer
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', task.id);
  
  // Visual feedback
  e.currentTarget.classList.add('opacity-50');
  
  // Notify parent
  onDragStart?.(task.id);
};
```

**Drag End:**
```typescript
const handleDragEnd = (e: React.DragEvent) => {
  // Remove visual feedback
  e.currentTarget.classList.remove('opacity-50');
  
  // Notify parent
  onDragEnd?.();
};
```

**Drag Over (for drop position detection):**
```typescript
const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  // Calculate drop position (before/after)
  const rect = e.currentTarget.getBoundingClientRect();
  const midpoint = rect.top + rect.height / 2;
  const position = e.clientY < midpoint ? 'before' : 'after';
  
  // Notify parent
  onDragOver?.(task.id, position);
};
```

#### 2. TaskColumn (Drop Target)

**State Management:**
```typescript
const [draggedOverTaskId, setDraggedOverTaskId] = useState<string | null>(null);
const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
const [isDraggingOver, setIsDraggingOver] = useState(false);
```

**Drop Handler:**
```typescript
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  
  // Get dragged task ID
  const taskId = e.dataTransfer.getData('text/plain');
  
  // Call parent handler with position info
  onDrop(taskId, status, draggedOverTaskId, dropPosition);
  
  // Reset state
  setIsDraggingOver(false);
  setDraggedOverTaskId(null);
  setDropPosition(null);
};
```

#### 3. TaskBoard (Order Calculation)

**The Algorithm:**

```typescript
const handleTaskDrop = useCallback((
  taskId: string,
  newStatus: TaskStatus,
  dropTargetId?: string,
  dropPosition?: 'before' | 'after'
) => {
  // 1. Prevent dropping on itself
  if (dropTargetId === taskId) return;
  
  // 2. Get dragged task
  const draggedTask = tasks.find(t => t.id === taskId);
  const isSameColumn = draggedTask?.status === newStatus;
  
  // 3. Get column tasks (excluding dragged if same column)
  const columnTasks = isSameColumn
    ? groupedTasks[newStatus].filter(t => t.id !== taskId)
    : groupedTasks[newStatus];
  
  // 4. Handle empty column or no target
  if (!dropTargetId || columnTasks.length === 0) {
    const maxOrder = columnTasks.length > 0
      ? Math.max(...columnTasks.map(t => t.order || 0))
      : -1;
    reorderTask(taskId, newStatus, maxOrder + 1);
    return;
  }
  
  // 5. Find target task
  const targetIndex = columnTasks.findIndex(t => t.id === dropTargetId);
  const targetTask = columnTasks[targetIndex];
  let newOrder: number;
  
  // 6. Calculate new order based on position
  if (dropPosition === 'before') {
    const prevTask = targetIndex > 0 ? columnTasks[targetIndex - 1] : null;
    if (prevTask) {
      // Insert between prevTask and targetTask
      newOrder = (prevTask.order + targetTask.order) / 2;
    } else {
      // Inserting before first task
      newOrder = targetTask.order - 1;
    }
  } else {
    // Insert after target
    const nextTask = targetIndex < columnTasks.length - 1 
      ? columnTasks[targetIndex + 1] 
      : null;
    newOrder = nextTask
      ? (targetTask.order + nextTask.order) / 2
      : targetTask.order + 1;
  }
  
  // 7. Execute reorder
  reorderTask(taskId, newStatus, newOrder);
}, [tasks, groupedTasks, reorderTask]);
```

### Order Calculation Explained

**Problem:** How to insert a task between two existing tasks without reordering everything?

**Solution:** Use fractional orders (average of neighbors)

**Example:**

```
Initial state:
Task A: order = 1
Task B: order = 2
Task C: order = 3

Drop Task D between A and B:
Task D: order = (1 + 2) / 2 = 1.5

Result:
Task A: order = 1
Task D: order = 1.5  ← New position!
Task B: order = 2
Task C: order = 3
```

**Edge Cases Handled:**

1. **Drop at beginning:**
   ```typescript
   newOrder = firstTask.order - 1;
   ```

2. **Drop at end:**
   ```typescript
   newOrder = lastTask.order + 1;
   ```

3. **Empty column:**
   ```typescript
   newOrder = 0;
   ```

4. **Same column reorder:**
   ```typescript
   const columnTasks = tasks.filter(t => t.id !== taskId);
   ```

### Visual Feedback

**Drop Indicators:**
```typescript
{draggedOverTaskId === task.id && dropPosition === 'before' && (
  <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500" />
)}

{draggedOverTaskId === task.id && dropPosition === 'after' && (
  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500" />
)}
```

**Column Highlight:**
```typescript
<div className={`
  ${isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
`}>
```

---

## 🚧 Technical Challenges & Solutions

### Challenge 1: Z-Index Stacking Context Issues

**Problem:**
- Dropdowns hidden behind task columns
- Modals not appearing on top
- Navbar covered by hero section

**Root Cause:**
```typescript
// Parent with z-index creates stacking context
<div className="relative z-0">  ← Traps children!
  <div className="z-100">       ← Can't escape
    Dropdown
  </div>
</div>
```

**Solution:**
```typescript
// Remove z-index from parent
<div className="relative">      ← No stacking context
  <div className="z-100">       ← Free to stack globally
    Dropdown
  </div>
</div>
```

**Final Z-Index Hierarchy:**
```
z-210: Modal Content
z-200: Modal Backdrop
z-150: Navbar
z-100: Dropdowns
z-auto: Content
```

### Challenge 2: Undo/Redo Infinite Loops

**Problem:**
- Undo/redo creates infinite loops
- History records undo/redo actions themselves

**Solution:**
```typescript
const isUndoingRef = useRef(false);

const undo = () => {
  isUndoingRef.current = true;
  // ... perform undo
  setTimeout(() => {
    isUndoingRef.current = false;
  }, 0);
};

const recordAction = (action) => {
  if (isUndoingRef.current) return;  // Don't record!
  // ... add to history
};
```

### Challenge 3: Performance with Large Lists

**Problem:**
- 1000+ tasks cause lag
- React renders ALL tasks even if not visible

**Solutions:**

**1. React.memo**
```typescript
export const TaskCard = React.memo(({ task, ... }) => {
  // Only re-renders if props change
});
```

**2. useMemo for filtering**
```typescript
const groupedTasks = useMemo(() => {
  const filtered = filterTasks(tasks, filters);
  return groupTasksByStatus(filtered);
}, [tasks, filters]);
```

**3. Custom Virtualization**
```typescript
// Only render visible items
const visibleTasks = tasks.slice(startIndex, endIndex);
```

**Results:**
- 70% reduction in re-renders
- Constant render time regardless of list size
- 100,000 tasks render in 22ms

### Challenge 4: Drag-and-Drop Order Conflicts

**Problem:**
- Multiple tasks with same order
- Order becomes fractional (1.5, 1.75, 1.875...)
- Eventually runs out of precision

**Solution:**
```typescript
// Periodic reordering to reset orders
const normalizeOrders = (tasks: Task[]) => {
  return tasks
    .sort((a, b) => a.order - b.order)
    .map((task, index) => ({
      ...task,
      order: index * 10  // Reset to 0, 10, 20, 30...
    }));
};
```

### Challenge 5: Dark Mode Layout Shift

**Problem:**
- Border appears in dark mode
- Causes layout shift (CLS)

**Solution:**
```typescript
// Use transparent border in light mode
<div className="
  border border-transparent dark:border-gray-700
">
```

---

## ⚡ Performance Optimizations

### 1. React.memo

**Impact:** 70% reduction in re-renders

```typescript
export const TaskCard = React.memo<Props>(({ task, ... }) => {
  // Only re-renders if props change
});
```

### 2. useMemo

**Expensive Computations:**
```typescript
const filteredTasks = useMemo(() => 
  filterTasks(tasks, filters),
  [tasks, filters]
);

const groupedTasks = useMemo(() => 
  groupTasksByStatus(filteredTasks),
  [filteredTasks]
);
```

### 3. useCallback

**Event Handlers:**
```typescript
const handleDrop = useCallback((taskId, status) => {
  // ... logic
}, [reorderTask]);

<TaskColumn onDrop={handleDrop} />
```

### 4. Debouncing

**Search Input:**
```typescript
const debouncedSearch = useDebounce(searchQuery, 300);

// Only filters after 300ms of no typing
useEffect(() => {
  const filtered = filterTasks(tasks, { search: debouncedSearch });
  setFilteredTasks(filtered);
}, [debouncedSearch]);
```

### 5. Virtualization

**Custom Implementation:**
```typescript
const { visibleItems, offsetY } = useVirtualization({
  items: tasks,
  itemHeight: 120,
  containerHeight: 600,
  overscan: 3
});

return (
  <div style={{ height: tasks.length * 120 }}>
    <div style={{ transform: `translateY(${offsetY}px)` }}>
      {visibleItems.map(task => <TaskCard key={task.id} task={task} />)}
    </div>
  </div>
);
```

---

## 🎤 Mock Interview Q&A

### Section 1: Project Overview

**Q1: Can you give me a high-level overview of your Task Board project?**

**A:** I built a production-ready task management application using React 18 and TypeScript. The key features include:

1. **Drag-and-drop** for reordering tasks within and across columns
2. **Undo/Redo system** with full history tracking
3. **Custom virtualization** that handles 100,000+ tasks at 60 FPS
4. **Advanced filtering** with multi-select and debounced search
5. **Dark mode** with system preference detection
6. **PWA capabilities** with offline support

The app is fully accessible with keyboard navigation and ARIA labels, deployed on Vercel.

---

**Q2: What was your motivation for building this project?**

**A:** I wanted to demonstrate my ability to build a complex, production-ready application. I focused on:

1. **Performance at scale** - Custom virtualization for large lists
2. **User experience** - Undo/redo, keyboard shortcuts, optimistic updates
3. **Code quality** - TypeScript, custom hooks, proper state management
4. **Modern practices** - React 18, PWA, accessibility

---

### Section 2: Architecture

**Q3: Walk me through your component architecture.**

**A:** I used a hierarchical structure with clear separation of concerns:

**Top Level:**
- `App.tsx` wraps everything with `TaskContext` provider
- `TaskBoard.tsx` orchestrates all features

**Mid Level:**
- `FilterBar.tsx` handles filtering, search, undo/redo
- `TaskColumn.tsx` manages drag-and-drop
- `TaskModal.tsx` handles task creation/editing

**Low Level:**
- `TaskCard.tsx` displays individual tasks (React.memo)
- `MultiSelect.tsx` is a reusable dropdown

**State Management:**
- Context API for global task state
- Local state for UI concerns
- useMemo for derived state

---

**Q4: Why Context API over Redux?**

**A:** I chose Context API because:

1. **Simplicity** - Single main state (tasks), Redux would be overkill
2. **Performance** - With proper memoization, performs well
3. **Type Safety** - Straightforward TypeScript integration
4. **Modern** - React 18's Context API is optimized

**State layers:**
- **Global (Context):** tasks, CRUD operations, undo/redo
- **Derived (useMemo):** filtered tasks, grouped tasks, statistics
- **Local (useState):** UI state (modals, dropdowns)

---

**Q5: How does your undo/redo system work?**

**A:** It uses a **history stack pattern**:

**Data Structure:**
```typescript
{
  past: [action1, action2, action3],
  future: [action4, action5],
  maxSize: 50
}
```

**Recording:**
```typescript
{
  type: 'UPDATE_TASK',
  taskId: '123',
  previousState: { title: 'Old' },
  newState: { title: 'New' },
  timestamp: Date.now()
}
```

**Undo:** Pop from past[], push to future[], reverse action
**Redo:** Pop from future[], push to past[], reapply action

**Key Challenge:** Preventing infinite loops

**Solution:** Use refs to track undo/redo state:
```typescript
const isUndoingRef = useRef(false);

const undo = () => {
  isUndoingRef.current = true;
  // ... perform undo
  setTimeout(() => isUndoingRef.current = false, 0);
};

const recordAction = (action) => {
  if (isUndoingRef.current) return;  // Don't record!
  // ... add to history
};
```

---

### Section 3: Custom Hooks

**Q6: Walk me through your most complex custom hook.**

**A:** The most complex is `useVirtualization`:

**Purpose:** Render only visible items in large lists

**Algorithm:**

1. **Calculate visible range:**
```typescript
const scrollTop = containerRef.current.scrollTop;
const startIndex = Math.floor(scrollTop / itemHeight);
const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);
```

2. **Add overscan (buffer):**
```typescript
const visibleStartIndex = Math.max(0, startIndex - overscan);
const visibleEndIndex = Math.min(totalItems - 1, endIndex + overscan);
```

3. **Slice array:**
```typescript
const visibleItems = items.slice(visibleStartIndex, visibleEndIndex + 1);
```

4. **Calculate offset:**
```typescript
const offsetY = visibleStartIndex * itemHeight;
```

**Performance:**
- 100 tasks: 12ms
- 100,000 tasks: 22ms (constant time!)

---

**Q7: Explain your useDebounce hook.**

**A:** It delays updating a value until the user stops changing it.

**Implementation:**
```typescript
export const useDebounce = <T,>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
```

**Why it's important:**
- **Performance:** Prevents filtering on EVERY keystroke
- **UX:** No laggy typing
- **API calls:** Prevents excessive requests

**Usage:**
```typescript
const debouncedSearch = useDebounce(searchQuery, 300);

useEffect(() => {
  const filtered = filterTasks(tasks, { search: debouncedSearch });
  setFilteredTasks(filtered);
}, [debouncedSearch]);
```

---

### Section 4: Drag & Drop

**Q8: Explain your drag-and-drop system.**

**A:** It has three main parts:

**1. Drag Start (TaskCard):**
```typescript
const handleDragStart = (e: React.DragEvent) => {
  e.dataTransfer.setData('text/plain', task.id);
  e.currentTarget.classList.add('opacity-50');
};
```

**2. Drag Over (Calculate position):**
```typescript
const handleDragOver = (e: React.DragEvent) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const midpoint = rect.top + rect.height / 2;
  const position = e.clientY < midpoint ? 'before' : 'after';
  onDragOver(task.id, position);
};
```

**3. Drop (TaskColumn):**
```typescript
const handleDrop = (e: React.DragEvent) => {
  const taskId = e.dataTransfer.getData('text/plain');
  onDrop(taskId, status, draggedOverTaskId, dropPosition);
};
```

**Visual Feedback:**
```typescript
{dropPosition === 'before' && (
  <div className="absolute -top-1 h-0.5 bg-blue-500" />
)}
```

---

**Q9: How do you calculate the new order when dropping?**

**A:** I use **fractional ordering**:

**Concept:**
Instead of reordering all tasks, calculate a fractional order between neighbors.

**Example:**
```
Task A: order = 1
Task B: order = 2

Drop Task D between A and B:
Task D: order = (1 + 2) / 2 = 1.5

Result: A: 1, D: 1.5, B: 2
```

**Algorithm:**
```typescript
if (dropPosition === 'before') {
  const prevTask = columnTasks[targetIndex - 1];
  const targetTask = columnTasks[targetIndex];
  
  newOrder = prevTask
    ? (prevTask.order + targetTask.order) / 2
    : targetTask.order - 1;
} else {
  const targetTask = columnTasks[targetIndex];
  const nextTask = columnTasks[targetIndex + 1];
  
  newOrder = nextTask
    ? (targetTask.order + nextTask.order) / 2
    : targetTask.order + 1;
}
```

**Edge Cases:**
- Drop at beginning: `firstTask.order - 1`
- Drop at end: `lastTask.order + 1`
- Empty column: `order = 0`
- Same column: Filter out dragged task first

**Potential Issue:** Orders become very fractional (1.875...)

**Solution:** Periodic normalization:
```typescript
const normalizeOrders = (tasks: Task[]) => {
  return tasks
    .sort((a, b) => a.order - b.order)
    .map((task, index) => ({
      ...task,
      order: index * 10
    }));
};
```

---

### Section 5: Performance

**Q10: How did you achieve performance with 100,000+ tasks?**

**A:** Multi-layered approach:

**1. Custom Virtualization (Biggest Impact):**
- Only renders ~20 visible items
- Constant O(1) time
- 22ms render time regardless of size

**2. React.memo:**
- 70% reduction in re-renders
- Prevents unnecessary TaskCard updates

**3. useMemo:**
- Only recalculates when dependencies change
- Prevents filtering on every render

**4. useCallback:**
- Stable function references
- Prevents child re-renders

**5. Debouncing:**
- Reduces filter operations
- Improves typing experience

**Metrics:**

| Tasks | Render | Memory | FPS |
|-------|--------|--------|-----|
| 100 | 12ms | 5MB | 60 |
| 1,000 | 18ms | 7MB | 60 |
| 100,000 | 22ms | 10MB | 60 |

---

**Q11: What tools did you use to identify bottlenecks?**

**A:**

**1. React DevTools Profiler:**
- Identified excessive re-renders
- Found TaskCard re-rendering unnecessarily
- Solution: React.memo

**2. Chrome DevTools Performance:**
- Recorded interactions
- Identified long tasks (>50ms)
- Found filtering blocking main thread
- Solution: Debouncing + useMemo

**3. Lighthouse:**
- Performance score: 95+
- Identified layout shifts
- Solution: Transparent borders

**4. Custom Monitoring:**
```typescript
const startTime = performance.now();
// ... operation
const endTime = performance.now();
console.log(`Took ${endTime - startTime}ms`);
```

---

### Section 6: Challenges

**Q12: Most challenging bug?**

**A:** The **z-index stacking context issue**.

**Problem:** Dropdowns hidden behind task columns, even with `z-index: 99999`.

**Debugging:**
1. Checked z-index values - seemed correct
2. Tried increasing - didn't work
3. Inspected DOM - rendering but invisible

**Root Cause:**
```typescript
<div className="relative z-0">  ← Creates stacking context!
  <div className="z-99999">     ← Trapped inside
    Dropdown
  </div>
</div>
```

**Key Learning:** When you add z-index to a positioned element, it creates a **new stacking context**. Children can only stack within that context.

**Solution:**
```typescript
<div className="relative">      ← No z-index
  <div className="z-100">       ← Can stack globally
    Dropdown
  </div>
</div>
```

**Lesson:** Understanding CSS stacking contexts is crucial.

---

**Continue to Part 3 for more Q&A and key takeaways**
