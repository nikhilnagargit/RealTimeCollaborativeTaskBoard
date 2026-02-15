# 💻 Code Deep Dive
## Real-Time Collaborative Task Board - Technical Implementation

This document provides detailed code examples and explanations for interview preparation.

---

## 📁 Project Structure Deep Dive

### Complete File Tree
```
src/
├── components/
│   ├── TaskBoard.tsx              # Main container (363 lines)
│   ├── TaskColumn.tsx             # Drag-drop column (200+ lines)
│   ├── VirtualizedTaskColumn.tsx  # Virtualized version
│   ├── TaskCard.tsx               # Individual task (React.memo)
│   ├── TaskModal.tsx              # Create/Edit modal
│   ├── FilterBar.tsx              # Filters + undo/redo (300+ lines)
│   ├── MultiSelect.tsx            # Reusable dropdown
│   ├── ShortcutsHelp.tsx          # Keyboard shortcuts modal
│   └── ThomsonReutersLogo.tsx     # Logo component
│
├── context/
│   ├── TaskContext.tsx            # Context definition
│   └── TaskProvider.tsx           # Provider with reducer
│
├── hooks/
│   ├── index.ts                   # Barrel export
│   ├── useTasks.ts                # Task CRUD operations
│   ├── useHistory.ts              # Undo/Redo (246 lines)
│   ├── useVirtualization.ts       # Custom virtualization (150+ lines)
│   ├── useDebounce.ts             # Debounce hook (40 lines)
│   ├── useDarkMode.ts             # Dark mode (60 lines)
│   ├── useLocalStorage.ts         # LocalStorage (80 lines)
│   ├── useKeyboardShortcuts.ts    # Keyboard nav (130 lines)
│   ├── useOptimisticUpdate.ts     # Optimistic UI
│   └── useRealTimeSync.ts         # Real-time sync simulation
│
├── types/
│   ├── index.ts                   # Main types
│   └── history.ts                 # History action types
│
├── utils/
│   ├── taskHelpers.ts             # Filtering, grouping
│   ├── mockData.ts                # Mock data generation
│   └── orderHelpers.ts            # Order calculations
│
├── services/
│   ├── taskService.ts             # Task API service
│   └── storageService.ts          # LocalStorage service
│
├── App.tsx                        # Root component
├── index.tsx                      # Entry point
└── index.css                      # Global styles + Tailwind
```

---

## 🔍 Core Components Explained

### 1. TaskBoard.tsx (Main Container)

**Purpose:** Orchestrates the entire application

**Key Responsibilities:**
- Manages global UI state (modals, filters, dark mode)
- Provides task operations from context
- Handles drag-and-drop coordination
- Renders navbar, hero, filters, and columns

**State Management:**
```typescript
export const TaskBoard: React.FC = () => {
  // Global task state from context
  const { 
    tasks, 
    addTask, 
    reorderTask,
    undo,
    redo,
    canUndo,
    canRedo,
    getUndoDescription,
    getRedoDescription 
  } = useTasks();
  
  // Local UI state
  const [filters, setFilters] = useState<FilterOptions>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [isDark, toggleDarkMode] = useDarkMode();
  const [isVirtualizationEnabled, setIsVirtualizationEnabled] = useState(false);
  
  // Derived state - filtered and grouped tasks
  const groupedTasks = useMemo(() => {
    const filtered = filterTasks(tasks, filters);
    return groupTasksByStatus(filtered);
  }, [tasks, filters]);
  
  // Unfiltered tasks for statistics
  const allGroupedTasks = useMemo(() => {
    return groupTasksByStatus(tasks);
  }, [tasks]);
  
  // ... rest of component
};
```

**Drag-and-Drop Handler:**
```typescript
const handleTaskDrop = useCallback((
  taskId: string,
  newStatus: TaskStatus,
  dropTargetId?: string,
  dropPosition?: 'before' | 'after'
) => {
  // Prevent dropping on itself
  if (dropTargetId === taskId) return;
  
  // Get dragged task
  const draggedTask = tasks.find((t) => t.id === taskId);
  const isSameColumn = draggedTask?.status === newStatus;
  
  // Get column tasks (exclude dragged if same column)
  const columnTasks = isSameColumn
    ? groupedTasks[newStatus].filter((t) => t.id !== taskId)
    : groupedTasks[newStatus];
  
  // Handle empty column or no target
  if (!dropTargetId || columnTasks.length === 0) {
    const maxOrder = columnTasks.length > 0
      ? Math.max(...columnTasks.map((t) => t.order || 0))
      : -1;
    reorderTask(taskId, newStatus, maxOrder + 1);
    return;
  }
  
  // Find target task
  const targetIndex = columnTasks.findIndex((t) => t.id === dropTargetId);
  if (targetIndex === -1) {
    const maxOrder = Math.max(...columnTasks.map((t) => t.order || 0));
    reorderTask(taskId, newStatus, maxOrder + 1);
    return;
  }
  
  const targetTask = columnTasks[targetIndex];
  let newOrder: number;
  
  // Calculate new order based on position
  if (dropPosition === 'before') {
    const prevTask = targetIndex > 0 ? columnTasks[targetIndex - 1] : null;
    if (prevTask) {
      newOrder = (prevTask.order + targetTask.order) / 2;
    } else {
      newOrder = targetTask.order - 1;
    }
  } else {
    const nextTask = targetIndex < columnTasks.length - 1 
      ? columnTasks[targetIndex + 1] 
      : null;
    newOrder = nextTask
      ? (targetTask.order + nextTask.order) / 2
      : targetTask.order + 1;
  }
  
  reorderTask(taskId, newStatus, newOrder);
}, [tasks, groupedTasks, reorderTask]);
```

**Keyboard Shortcuts:**
```typescript
useKeyboardShortcuts({
  onCreateTask: () => setIsModalOpen(true),
  onUndo: undo,
  onRedo: redo,
  onShowHelp: () => setIsShortcutsHelpOpen(true),
  onCloseModal: () => {
    setIsModalOpen(false);
    setIsShortcutsHelpOpen(false);
  },
});
```

---

### 2. TaskColumn.tsx (Drag-Drop Column)

**Purpose:** Manages drag-and-drop for a single column

**State Management:**
```typescript
export const TaskColumn: React.FC<TaskColumnProps> = ({ status, tasks, onDrop }) => {
  // Drag-and-drop state
  const [draggedOverTaskId, setDraggedOverTaskId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // ... handlers
};
```

**Drag Handlers:**
```typescript
const handleDragEnter = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDraggingOver(true);
};

const handleDragLeave = (e: React.DragEvent) => {
  if (e.currentTarget === e.target) {
    setIsDraggingOver(false);
    setDraggedOverTaskId(null);
    setDropPosition(null);
  }
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  const taskId = e.dataTransfer.getData('text/plain');
  
  onDrop(taskId, status, draggedOverTaskId, dropPosition);
  
  setIsDraggingOver(false);
  setDraggedOverTaskId(null);
  setDropPosition(null);
};

const handleTaskDragOver = (taskId: string, position: 'before' | 'after') => {
  setDraggedOverTaskId(taskId);
  setDropPosition(position);
};
```

**Visual Feedback:**
```typescript
<div
  className={`
    min-h-[200px] p-4 rounded-lg transition-colors
    ${isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
  `}
  onDragEnter={handleDragEnter}
  onDragLeave={handleDragLeave}
  onDragOver={handleDragOver}
  onDrop={handleDrop}
>
  {tasks.map((task) => (
    <TaskCard
      key={task.id}
      task={task}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleTaskDragOver}
      isDropTarget={draggedOverTaskId === task.id}
      dropPosition={draggedOverTaskId === task.id ? dropPosition : null}
    />
  ))}
</div>
```

---

### 3. TaskCard.tsx (Individual Task)

**Purpose:** Display and handle drag events for a single task

**Memoization:**
```typescript
export const TaskCard = React.memo<TaskCardProps>(({ 
  task, 
  onDragStart, 
  onDragEnd, 
  onDragOver,
  isDropTarget,
  dropPosition
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  // ... component logic
});
```

**Drag Handlers:**
```typescript
const handleDragStart = (e: React.DragEvent) => {
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', task.id);
  e.currentTarget.classList.add('opacity-50');
  onDragStart?.(task.id);
};

const handleDragEnd = (e: React.DragEvent) => {
  e.currentTarget.classList.remove('opacity-50');
  onDragEnd?.();
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const rect = e.currentTarget.getBoundingClientRect();
  const midpoint = rect.top + rect.height / 2;
  const position = e.clientY < midpoint ? 'before' : 'after';
  
  onDragOver?.(task.id, position);
};
```

**Drop Indicators:**
```typescript
<div
  draggable
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  onDragOver={handleDragOver}
  className="relative bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md"
>
  {/* Drop indicator - before */}
  {isDropTarget && dropPosition === 'before' && (
    <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
  )}
  
  {/* Task content */}
  <div className="space-y-2">
    {/* ... task details */}
  </div>
  
  {/* Drop indicator - after */}
  {isDropTarget && dropPosition === 'after' && (
    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
  )}
</div>
```

---

### 4. FilterBar.tsx (Filters + Undo/Redo)

**Purpose:** Search, filters, undo/redo, and statistics

**State Management:**
```typescript
export const FilterBar: React.FC<FilterBarProps> = ({ 
  assignees, 
  onFilterChange,
  onCreateTask,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  getUndoDescription,
  getRedoDescription,
  totalTasks,
  todoTasks,
  inProgressTasks,
  completedTasks
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<TaskPriority[]>([]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  
  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // ... component logic
};
```

**Debounced Search:**
```typescript
useEffect(() => {
  onFilterChange({
    search: debouncedSearch,
    assignees: selectedAssignees,
    priorities: selectedPriorities,
  });
}, [debouncedSearch, selectedAssignees, selectedPriorities, onFilterChange]);
```

**Undo/Redo Buttons:**
```typescript
<button
  onClick={onUndo}
  disabled={!canUndo}
  className={`
    p-2 rounded-md transition-colors
    ${canUndo 
      ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300' 
      : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
    }
  `}
  title={getUndoDescription() || 'Undo'}
  aria-label="Undo last action"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
</button>
```

**Statistics Badges:**
```typescript
<div className="flex items-center gap-2 ml-auto flex-shrink-0">
  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">
    Total:
  </span>
  
  {/* Total Tasks */}
  <div 
    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md cursor-help transition-all duration-200 hover:bg-blue-100 dark:hover:bg-blue-900/50"
    title="Total Tasks"
    aria-label={`Total tasks: ${totalTasks}`}
  >
    <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{totalTasks}</span>
  </div>
  
  {/* Similar for In Progress and Completed */}
</div>
```

---

## 🎣 Custom Hooks Implementation

### 1. useHistory.ts (Undo/Redo)

**Full Implementation:**
```typescript
const MAX_HISTORY_SIZE = 50;

interface HistoryState {
  past: HistoryActionUnion[];
  future: HistoryActionUnion[];
  maxSize: number;
}

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    future: [],
    maxSize: MAX_HISTORY_SIZE,
  });
  
  const isUndoingRef = useRef(false);
  const isRedoingRef = useRef(false);
  
  const generateId = useCallback(() => {
    return `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);
  
  const addToHistory = useCallback((action: HistoryActionUnion) => {
    if (isUndoingRef.current || isRedoingRef.current) {
      return;
    }
    
    setHistory((prev) => {
      const newPast = [...prev.past, action];
      
      if (newPast.length > prev.maxSize) {
        newPast.shift();
      }
      
      return {
        ...prev,
        past: newPast,
        future: [],
      };
    });
  }, []);
  
  const recordCreate = useCallback((task: Task) => {
    const action: CreateTaskAction = {
      id: generateId(),
      type: HistoryActionType.CREATE_TASK,
      timestamp: new Date(),
      description: `Created task: ${task.title}`,
      task,
    };
    addToHistory(action);
  }, [addToHistory, generateId]);
  
  const recordUpdate = useCallback((
    taskId: string,
    previousState: Partial<Task>,
    newState: Partial<Task>,
    taskTitle?: string
  ) => {
    const changedFields = Object.keys(newState);
    const description = `Updated ${taskTitle || 'task'}: ${changedFields.join(', ')}`;
    
    const action: UpdateTaskAction = {
      id: generateId(),
      type: HistoryActionType.UPDATE_TASK,
      timestamp: new Date(),
      description,
      taskId,
      previousState,
      newState,
    };
    addToHistory(action);
  }, [addToHistory, generateId]);
  
  const recordDelete = useCallback((task: Task) => {
    const action: DeleteTaskAction = {
      id: generateId(),
      type: HistoryActionType.DELETE_TASK,
      timestamp: new Date(),
      description: `Deleted task: ${task.title}`,
      task,
    };
    addToHistory(action);
  }, [addToHistory, generateId]);
  
  const recordReorder = useCallback((
    taskId: string,
    previousStatus: string,
    newStatus: string,
    previousOrder: number,
    newOrder: number,
    taskTitle?: string
  ) => {
    const action: ReorderTaskAction = {
      id: generateId(),
      type: HistoryActionType.REORDER_TASK,
      timestamp: new Date(),
      description: `Moved ${taskTitle || 'task'} from ${previousStatus} to ${newStatus}`,
      taskId,
      previousStatus,
      newStatus,
      previousOrder,
      newOrder,
    };
    addToHistory(action);
  }, [addToHistory, generateId]);
  
  const undo = useCallback(() => {
    if (history.past.length === 0) {
      return null;
    }
    
    isUndoingRef.current = true;
    
    const action = history.past[history.past.length - 1];
    
    setHistory((prev) => ({
      ...prev,
      past: prev.past.slice(0, -1),
      future: [action, ...prev.future],
    }));
    
    setTimeout(() => {
      isUndoingRef.current = false;
    }, 0);
    
    return action;
  }, [history.past]);
  
  const redo = useCallback(() => {
    if (history.future.length === 0) {
      return null;
    }
    
    isRedoingRef.current = true;
    
    const action = history.future[0];
    
    setHistory((prev) => ({
      ...prev,
      past: [...prev.past, action],
      future: prev.future.slice(1),
    }));
    
    setTimeout(() => {
      isRedoingRef.current = false;
    }, 0);
    
    return action;
  }, [history.future]);
  
  const getUndoDescription = useCallback(() => {
    if (history.past.length === 0) return null;
    return history.past[history.past.length - 1].description;
  }, [history.past]);
  
  const getRedoDescription = useCallback(() => {
    if (history.future.length === 0) return null;
    return history.future[0].description;
  }, [history.future]);
  
  return {
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    historySize: history.past.length,
    undo,
    redo,
    recordCreate,
    recordUpdate,
    recordDelete,
    recordReorder,
    getUndoDescription,
    getRedoDescription,
  };
};
```

---

### 2. useVirtualization.ts

**Full Implementation:**
```typescript
interface VirtualizationConfig {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export const useVirtualization = ({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
}: VirtualizationConfig) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex + 1);
  
  // Calculate offset
  const offsetY = startIndex * itemHeight;
  
  // Total height
  const totalHeight = items.length * itemHeight;
  
  // Scroll handler with throttle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = throttle(() => {
      setScrollTop(container.scrollTop);
    }, 16); // ~60 FPS
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
  
  return {
    containerRef,
    visibleItems,
    offsetY,
    totalHeight,
    startIndex,
    endIndex,
  };
};

// Throttle utility
function throttle(func: Function, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  
  return function executedFunction(...args: any[]) {
    const now = Date.now();
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  };
}
```

---

### 3. useDebounce.ts

**Full Implementation:**
```typescript
export const useDebounce = <T,>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    // Set timeout to update after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    // Cleanup: cancel timeout if value changes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};
```

**Usage Example:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);

useEffect(() => {
  // This only runs 300ms after user stops typing
  const filtered = filterTasks(tasks, { search: debouncedSearch });
  setFilteredTasks(filtered);
}, [debouncedSearch, tasks]);
```

---

## 🎯 Key Algorithms

### 1. Fractional Ordering Algorithm

**Problem:** Insert task between two existing tasks without reordering all

**Solution:**
```typescript
function calculateNewOrder(
  columnTasks: Task[],
  targetIndex: number,
  dropPosition: 'before' | 'after'
): number {
  const targetTask = columnTasks[targetIndex];
  
  if (dropPosition === 'before') {
    // Insert before target
    const prevTask = targetIndex > 0 ? columnTasks[targetIndex - 1] : null;
    
    if (prevTask) {
      // Between prevTask and targetTask
      return (prevTask.order + targetTask.order) / 2;
    } else {
      // Before first task
      return targetTask.order - 1;
    }
  } else {
    // Insert after target
    const nextTask = targetIndex < columnTasks.length - 1 
      ? columnTasks[targetIndex + 1] 
      : null;
    
    if (nextTask) {
      // Between targetTask and nextTask
      return (targetTask.order + nextTask.order) / 2;
    } else {
      // After last task
      return targetTask.order + 1;
    }
  }
}
```

**Example:**
```
Initial: A(1), B(2), C(3)
Insert D between A and B:
  D.order = (1 + 2) / 2 = 1.5
Result: A(1), D(1.5), B(2), C(3)
```

---

### 2. Task Filtering Algorithm

**Implementation:**
```typescript
export function filterTasks(tasks: Task[], filters: FilterOptions): Task[] {
  return tasks.filter((task) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(searchLower);
      const matchesDescription = task.description?.toLowerCase().includes(searchLower);
      const matchesTags = task.tags?.some(tag => tag.toLowerCase().includes(searchLower));
      
      if (!matchesTitle && !matchesDescription && !matchesTags) {
        return false;
      }
    }
    
    // Assignee filter
    if (filters.assignees && filters.assignees.length > 0) {
      if (!task.assignee || !filters.assignees.includes(task.assignee)) {
        return false;
      }
    }
    
    // Priority filter
    if (filters.priorities && filters.priorities.length > 0) {
      if (!filters.priorities.includes(task.priority)) {
        return false;
      }
    }
    
    return true;
  });
}
```

---

### 3. Task Grouping Algorithm

**Implementation:**
```typescript
export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const grouped: Record<TaskStatus, Task[]> = {
    [TaskStatus.TODO]: [],
    [TaskStatus.IN_PROGRESS]: [],
    [TaskStatus.DONE]: [],
  };
  
  tasks.forEach((task) => {
    grouped[task.status].push(task);
  });
  
  // Sort by order within each group
  Object.keys(grouped).forEach((status) => {
    grouped[status as TaskStatus].sort((a, b) => a.order - b.order);
  });
  
  return grouped;
}
```

---

## 🎨 Styling Patterns

### 1. Responsive Design
```typescript
// Mobile-first approach
className="
  text-sm md:text-base lg:text-lg
  p-2 md:p-4 lg:p-6
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
"
```

### 2. Dark Mode
```typescript
className="
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-white
  border border-gray-200 dark:border-gray-700
"
```

### 3. Transitions
```typescript
className="
  transition-all duration-300
  hover:scale-105 hover:shadow-xl
  focus:ring-2 focus:ring-blue-500
"
```

### 4. Z-Index Hierarchy
```typescript
// Modals: z-200+
className="z-[210]"  // Modal content
className="z-[200]"  // Modal backdrop

// Navigation: z-150
className="z-[150]"  // Navbar

// Dropdowns: z-100
className="z-[100]"  // Filter dropdowns

// Content: auto
className="z-auto"   // Regular content
```

---

## 📊 Performance Monitoring

### 1. React Profiler
```typescript
import { Profiler } from 'react';

<Profiler id="TaskBoard" onRender={(id, phase, actualDuration) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}}>
  <TaskBoard />
</Profiler>
```

### 2. Custom Performance Tracking
```typescript
const startTime = performance.now();
// ... operation
const endTime = performance.now();
console.log(`Operation took ${endTime - startTime}ms`);
```

### 3. Memory Usage
```typescript
if (performance.memory) {
  console.log(`Memory: ${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
}
```

---

## 🧪 Testing Examples

### 1. Hook Testing
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );
    
    expect(result.current).toBe('initial');
    
    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');
    
    await waitFor(() => {
      expect(result.current).toBe('updated');
    }, { timeout: 600 });
  });
});
```

### 2. Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from './TaskCard';

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    order: 0,
  };
  
  it('should render task details', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
  
  it('should call onDragStart when dragging', () => {
    const onDragStart = jest.fn();
    render(<TaskCard task={mockTask} onDragStart={onDragStart} />);
    
    const card = screen.getByText('Test Task').closest('[draggable]');
    fireEvent.dragStart(card!);
    
    expect(onDragStart).toHaveBeenCalledWith('1');
  });
});
```

---

This completes the code deep dive! Use this document to understand the implementation details for your interview.
