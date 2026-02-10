# Drag & Drop Reordering Implementation 🎯

## 📊 Current Status: In Progress

### ✅ Completed Steps:

1. **Added `order` field to Task type** ✓
2. **Created helper functions** ✓
   - `ensureTasksHaveOrder()` - Auto-assigns orders to existing tasks
   - `groupTasksByStatus()` - Now sorts by order
3. **Updated TaskContext** ✓
   - Auto-assigns orders to mock data on load
   - Handles tasks from localStorage without orders

### 🚧 Remaining Implementation:

## The Complete Approach

### **How Reordering Works:**

```
SCENARIO: User drags Task D between Task A and Task B

Before:
Column: [Task A (order: 0), Task B (order: 1), Task C (order: 2)]

Action:
1. User starts dragging Task D
2. Hovers over Task B
3. Drops Task D

Calculation:
- Task B has order: 1
- Previous task (A) has order: 0
- New order = (0 + 1) / 2 = 0.5

After:
Column: [Task A (0), Task D (0.5), Task B (1), Task C (2)]
Display: A → D → B → C ✓
```

---

## Implementation Steps

### Step 4: Update addTask to Include Order

```typescript
const addTask = useCallback(
  (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
    // Get max order in the target status
    const tasksInStatus = tasks.filter(t => t.status === taskData.status);
    const maxOrder = tasksInStatus.length > 0
      ? Math.max(...tasksInStatus.map(t => t.order || 0))
      : -1;

    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      order: maxOrder + 1, // Add to end
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);
  },
  [tasks, setTasks]
);
```

### Step 5: Add Reorder Function to TaskContext

```typescript
/**
 * Reorder a task within its column or move to new column
 */
const reorderTask = useCallback(
  (taskId: string, newStatus: TaskStatus, newOrder: number) => {
    setTasks((prevTasks) => {
      return prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus, order: newOrder, updatedAt: new Date() }
          : task
      );
    });
  },
  [setTasks]
);
```

### Step 6: Detect Drop Position in TaskColumn

```typescript
// In TaskColumn.tsx

const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

const handleDragOverTask = (e: React.DragEvent, taskId: string) => {
  e.preventDefault();
  setDragOverTaskId(taskId);
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  const taskId = e.dataTransfer.getData('taskId');
  
  if (dragOverTaskId) {
    // Dropped on a specific task - insert before/after it
    const targetTask = tasks.find(t => t.id === dragOverTaskId);
    const targetIndex = tasks.findIndex(t => t.id === dragOverTaskId);
    
    // Calculate new order (between previous and target)
    const prevTask = tasks[targetIndex - 1];
    const prevOrder = prevTask ? prevOrder.order : 0;
    const targetOrder = targetTask.order;
    const newOrder = (prevOrder + targetOrder) / 2;
    
    onTaskDrop(taskId, status, newOrder);
  } else {
    // Dropped in empty space - add to end
    const maxOrder = Math.max(...tasks.map(t => t.order || 0), -1);
    onTaskDrop(taskId, status, maxOrder + 1);
  }
  
  setDragOverTaskId(null);
};
```

### Step 7: Update TaskCard for Drop Detection

```typescript
// In TaskCard.tsx

<div
  draggable
  onDragStart={onDragStart}
  onDragEnd={onDragEnd}
  onDragOver={(e) => {
    e.preventDefault();
    onDragOver?.(e, task.id); // New prop
  }}
  className="..."
>
```

### Step 8: Visual Drop Indicators

```typescript
// Show line where task will be inserted

{dragOverTaskId === task.id && (
  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
)}
```

---

## Key Concepts

### **1. Order Values**
- Tasks have decimal `order` values (0, 1, 2, 3...)
- When inserting between tasks, use average: `(prevOrder + nextOrder) / 2`
- This avoids reordering all tasks

### **2. Why Decimals?**
```
Insert between 1 and 2:
- New order = (1 + 2) / 2 = 1.5
- Result: [0, 1, 1.5, 2, 3]
- No need to update other tasks!
```

### **3. Order Normalization**
After many operations, orders might become:
```
[0, 0.5, 0.75, 0.875, 0.9375...]
```

Periodically normalize:
```typescript
const normalizeOrders = (tasks: Task[], status: TaskStatus) => {
  const statusTasks = tasks
    .filter(t => t.status === status)
    .sort((a, b) => a.order - b.order);
  
  return tasks.map(task => {
    if (task.status !== status) return task;
    const index = statusTasks.indexOf(task);
    return { ...task, order: index };
  });
};
```

---

## Benefits of This Approach

✅ **Simple** - Easy to understand and implement  
✅ **Efficient** - Only updates one task on drop  
✅ **Persistent** - Orders saved to localStorage  
✅ **Flexible** - Works with filtering and search  
✅ **Scalable** - Handles any number of tasks  

---

## Testing Checklist

- [ ] Drag task within same column
- [ ] Drag task to different column
- [ ] Drop at top of column
- [ ] Drop at bottom of column
- [ ] Drop between two tasks
- [ ] Order persists after refresh
- [ ] Works with filtered tasks
- [ ] Visual feedback during drag
- [ ] Smooth animations

---

## Next Steps

1. Update `addTask` to include order
2. Add `reorderTask` function to context
3. Update TaskColumn to detect drop position
4. Add visual drop indicators
5. Test thoroughly
6. Add order normalization (optional)

---

**This implementation provides precise control over task positioning with minimal complexity!** 🎯
