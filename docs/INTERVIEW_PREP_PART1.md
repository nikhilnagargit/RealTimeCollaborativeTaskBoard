# 🎯 Interview Preparation Guide - Part 1
## Real-Time Collaborative Task Board Project

**Candidate:** Nikhil Nagar  
**Project:** Real-Time Collaborative Task Board  
**Tech Stack:** React 18, TypeScript, Tailwind CSS  
**Live Demo:** https://real-time-collaborative-task-board-rho.vercel.app/

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Component Structure](#architecture--component-structure)
3. [State Management Deep Dive](#state-management-deep-dive)
4. [Custom Hooks Explained](#custom-hooks-explained)

---

## 📊 Project Overview

### What is this project?

A **production-ready task management application** featuring:
- ✅ Drag-and-drop task reordering
- ✅ Undo/Redo system with full history tracking
- ✅ Custom virtualization (handles 100,000+ tasks)
- ✅ Advanced filtering and search
- ✅ Dark mode with system preference detection
- ✅ PWA with offline support
- ✅ LocalStorage persistence
- ✅ Full keyboard accessibility

### Key Metrics

| Feature | Performance |
|---------|-------------|
| **100 tasks** | 12ms render, 5MB memory |
| **1,000 tasks** | 18ms render, 7MB memory |
| **100,000 tasks** | 22ms render, 10MB memory |
| **Re-render reduction** | 70% with React.memo |
| **Search debounce** | 300ms |

---

## 🏗 Architecture & Component Structure

### Component Hierarchy

```
App.tsx
└── TaskContext (Context Provider)
    └── TaskBoard.tsx (Main Container)
        ├── Navbar
        │   ├── ThomsonReutersLogo
        │   ├── Virtualization Toggle
        │   ├── Dark Mode Toggle
        │   ├── Shortcuts Help Button
        │   └── Profile Icon
        │
        ├── Hero Section
        │   ├── Title
        │   └── Description
        │
        ├── FilterBar.tsx
        │   ├── Create Button
        │   ├── Undo/Redo Buttons
        │   ├── Search Input
        │   ├── MultiSelect (Assignees)
        │   ├── MultiSelect (Priorities)
        │   └── Statistics Badges
        │
        ├── TaskColumn.tsx (x3) OR VirtualizedTaskColumn.tsx (x3)
        │   ├── Column Header
        │   ├── Task Count Badge
        │   ├── TaskCard.tsx (multiple)
        │   │   ├── Priority Badge
        │   │   ├── Title
        │   │   ├── Description
        │   │   ├── Tags
        │   │   ├── Assignee
        │   │   ├── Date
        │   │   └── Actions Dropdown
        │   └── Drop Indicators
        │
        ├── TaskModal.tsx (Create/Edit)
        │   ├── Form Fields
        │   ├── Priority Selector
        │   ├── Assignee Selector
        │   └── Submit/Cancel Buttons
        │
        └── ShortcutsHelp.tsx (Modal)
            └── Keyboard Shortcuts List
```

### File Structure

```
src/
├── components/
│   ├── TaskBoard.tsx          # Main container
│   ├── TaskColumn.tsx         # Regular column
│   ├── VirtualizedTaskColumn.tsx  # Virtualized column
│   ├── TaskCard.tsx           # Individual task card
│   ├── TaskModal.tsx          # Create/Edit modal
│   ├── FilterBar.tsx          # Filters, search, undo/redo
│   ├── MultiSelect.tsx        # Reusable dropdown
│   ├── ShortcutsHelp.tsx      # Keyboard shortcuts
│   └── ThomsonReutersLogo.tsx # Logo component
│
├── context/
│   ├── TaskContext.tsx        # Global task state
│   └── TaskProvider.tsx       # Context provider
│
├── hooks/
│   ├── useTasks.ts            # Task CRUD operations
│   ├── useHistory.ts          # Undo/Redo
│   ├── useVirtualization.ts   # Custom virtualization
│   ├── useDebounce.ts         # Debounce hook
│   ├── useDarkMode.ts         # Dark mode toggle
│   ├── useLocalStorage.ts     # LocalStorage persistence
│   ├── useKeyboardShortcuts.ts # Keyboard navigation
│   ├── useOptimisticUpdate.ts # Optimistic UI
│   └── useRealTimeSync.ts     # Real-time sync
│
├── types/
│   ├── index.ts               # All TypeScript types
│   └── history.ts             # History action types
│
├── utils/
│   ├── taskHelpers.ts         # Task filtering & grouping
│   ├── mockData.ts            # Mock data generation
│   └── orderHelpers.ts        # Order calculation
│
└── services/
    ├── taskService.ts         # Task API service
    └── storageService.ts      # LocalStorage service
```

---

## 🔄 State Management Deep Dive

### 1. TaskContext (Global State)

**Location:** `src/context/TaskContext.tsx`

**Purpose:** Centralized state management for all tasks

**State Structure:**
```typescript
interface TaskContextType {
  // State
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  
  // CRUD Operations
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  reorderTask: (id: string, newStatus: TaskStatus, newOrder: number) => void;
  
  // History Operations
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;
}
```

### 2. Local Component State

**TaskBoard.tsx:**
```typescript
const [filters, setFilters] = useState<FilterOptions>({});
const [isModalOpen, setIsModalOpen] = useState(false);
const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
const [isDark, toggleDarkMode] = useDarkMode();
const [isVirtualizationEnabled, setIsVirtualizationEnabled] = useState(false);
```

**FilterBar.tsx:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
const [selectedPriorities, setSelectedPriorities] = useState<TaskPriority[]>([]);
const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
```

**TaskColumn.tsx:**
```typescript
const [draggedOverTaskId, setDraggedOverTaskId] = useState<string | null>(null);
const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
const [isDraggingOver, setIsDraggingOver] = useState(false);
```

### 3. Derived State (useMemo)

**Filtered Tasks:**
```typescript
const groupedTasks = useMemo(() => {
  const filtered = filterTasks(tasks, filters);
  return groupTasksByStatus(filtered);
}, [tasks, filters]);
```

**All Tasks (Unfiltered for Statistics):**
```typescript
const allGroupedTasks = useMemo(() => {
  return groupTasksByStatus(tasks);
}, [tasks]);
```

---

## 🎣 Custom Hooks Explained

### 1. useHistory Hook

**Purpose:** Implements undo/redo functionality

**Key Concepts:**
```typescript
interface HistoryState {
  past: HistoryActionUnion[];    // Stack of past actions
  future: HistoryActionUnion[];  // Stack of undone actions
  maxSize: number;               // Limit history size (50)
}

enum HistoryActionType {
  CREATE_TASK = 'CREATE_TASK',
  UPDATE_TASK = 'UPDATE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  REORDER_TASK = 'REORDER_TASK',
}
```

**How it works:**

1. **Recording Actions:**
   ```typescript
   recordCreate(task)    // Adds to past[], clears future[]
   recordUpdate(id, prev, new)
   recordDelete(task)
   recordReorder(id, prevStatus, newStatus, prevOrder, newOrder)
   ```

2. **Undo:**
   ```typescript
   undo() {
     // Pop from past[]
     // Push to future[]
     // Return action to reverse
   }
   ```

3. **Redo:**
   ```typescript
   redo() {
     // Pop from future[]
     // Push to past[]
     // Return action to reapply
   }
   ```

**Preventing Infinite Loops:**
```typescript
const isUndoingRef = useRef(false);
const isRedoingRef = useRef(false);

// Don't record history during undo/redo
if (isUndoingRef.current || isRedoingRef.current) {
  return;
}
```

### 2. useVirtualization Hook

**Purpose:** Efficiently render large lists

**Algorithm:**
```typescript
// 1. Calculate visible range
const scrollTop = containerRef.current.scrollTop;
const startIndex = Math.floor(scrollTop / itemHeight);
const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);

// 2. Add overscan (buffer)
const visibleStartIndex = Math.max(0, startIndex - overscan);
const visibleEndIndex = Math.min(totalItems - 1, endIndex + overscan);

// 3. Slice array to visible items only
const visibleItems = items.slice(visibleStartIndex, visibleEndIndex + 1);

// 4. Calculate offset for positioning
const offsetY = visibleStartIndex * itemHeight;
```

**Performance:**
- **Without virtualization:** Renders ALL items (100,000 DOM nodes)
- **With virtualization:** Renders ~20 items (visible + overscan)
- **Result:** Constant O(1) rendering time

### 3. useDebounce Hook

**Purpose:** Delay execution until user stops typing

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

**Usage:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);

// Filter only triggers when user stops typing for 300ms
const filtered = filterTasks(tasks, { search: debouncedSearch });
```

### 4. useLocalStorage Hook

**Purpose:** Persist state to browser's LocalStorage

**Implementation:**
```typescript
export const useLocalStorage = <T,>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};
```

---

**Continue to Part 2 for Drag & Drop, Challenges, and Mock Interview Q&A**
