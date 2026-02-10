/**
 * Task Context
 * 
 * Global state management for tasks using React Context API.
 * Provides task CRUD operations and state to all components.
 */

import React, { createContext, useContext, useCallback, ReactNode, useState, useRef } from 'react';
import { Task, TaskStatus } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useHistory } from '../hooks/useHistory';
import { mockTasks } from '../utils/mockData';
import { generateId, normalizeTaskOrders } from '../utils/taskHelpers';
import * as taskApi from '../services/taskApi';
import { useToast } from './ToastContext';
import { useRealTimeSync } from '../hooks/useRealTimeSync';
import { HistoryActionType } from '../types/history';

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, newStatus: TaskStatus) => void;
  reorderTask: (id: string, newStatus: TaskStatus, newOrder: number) => void;
  // Optimistic update support
  isTaskLoading: (taskId: string) => boolean;
  loadingTasks: Set<string>;
  // Undo/Redo support
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

interface TaskProviderProps {
  children: ReactNode;
}

/**
 * Task Provider Component
 * Wraps the application to provide task state and operations
 */
export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  // Use localStorage to persist tasks (mockTasks already have order values)
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', mockTasks);
  
  // Toast notifications
  const { showError } = useToast();
  
  // History management for undo/redo
  const history = useHistory();
  
  // Track loading states for optimistic updates
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());
  
  // Store snapshots for rollback
  const snapshotsRef = useRef<Map<string, Task[]>>(new Map());

  /**
   * Check if orders need normalization
   * Only called when reordering, not on every task change
   */
  const shouldNormalizeOrders = useCallback((tasks: Task[]): boolean => {
    // Check for negative orders
    const hasNegativeOrders = tasks.some(t => (t.order || 0) < 0);
    if (hasNegativeOrders) return true;

    // Check for very small decimals (< 0.001)
    const hasVerySmallDecimals = tasks.some(t => {
      const order = t.order || 0;
      return order > 0 && order < 0.001;
    });
    
    return hasVerySmallDecimals;
  }, []);

  /**
   * Add a new task
   */
  const addTask = useCallback(
    (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
      // Calculate order: add to end of the status column
      const tasksInStatus = tasks.filter((t) => t.status === taskData.status);
      const maxOrder = tasksInStatus.length > 0
        ? Math.max(...tasksInStatus.map((t) => t.order || 0))
        : -1;

      const newTask: Task = {
        ...taskData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        order: maxOrder + 1,
      };

      setTasks((prevTasks) => [...prevTasks, newTask]);
      
      // Record in history
      history.recordCreate(newTask);
    },
    [tasks, setTasks, history]
  );

  /**
   * Update an existing task
   */
  const updateTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      // Get previous state for history
      const task = tasks.find(t => t.id === id);
      if (task) {
        const previousState: Partial<Task> = {};
        Object.keys(updates).forEach(key => {
          (previousState as any)[key] = (task as any)[key];
        });
        
        // Record in history
        history.recordUpdate(id, previousState, updates, task.title);
      }
      
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id
            ? { ...task, ...updates, updatedAt: new Date() }
            : task
        )
      );
    },
    [tasks, setTasks, history]
  );

  /**
   * Delete a task
   */
  const deleteTask = useCallback(
    (id: string) => {
      // Get task for history before deleting
      const task = tasks.find(t => t.id === id);
      
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
      
      // Record in history
      if (task) {
        history.recordDelete(task);
      }
    },
    [tasks, setTasks, history]
  );

  /**
   * Move a task to a different status column
   */
  const moveTask = useCallback(
    (id: string, newStatus: TaskStatus) => {
      updateTask(id, { status: newStatus });
    },
    [updateTask]
  );

  /**
   * Helper: Start loading state for a task
   */
  const startTaskLoading = useCallback((taskId: string) => {
    setLoadingTasks(prev => new Set(prev).add(taskId));
  }, []);

  /**
   * Helper: Stop loading state for a task
   */
  const stopTaskLoading = useCallback((taskId: string) => {
    setLoadingTasks(prev => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  }, []);

  /**
   * Helper: Check if task is loading
   */
  const isTaskLoading = useCallback((taskId: string) => {
    return loadingTasks.has(taskId);
  }, [loadingTasks]);

  /**
   * Helper: Save snapshot for rollback
   */
  const saveSnapshot = useCallback((key: string) => {
    snapshotsRef.current.set(key, [...tasks]);
  }, [tasks]);

  /**
   * Helper: Rollback to snapshot
   */
  const rollbackToSnapshot = useCallback((key: string) => {
    const snapshot = snapshotsRef.current.get(key);
    if (snapshot) {
      setTasks(snapshot);
      snapshotsRef.current.delete(key);
    }
  }, [setTasks]);

  /**
   * Reorder a task within or between columns
   * Uses optimistic updates with API call and rollback on failure
   */
  const reorderTask = useCallback(
    async (id: string, newStatus: TaskStatus, newOrder: number) => {
      // Save snapshot for potential rollback
      const snapshotKey = `reorder-${id}-${Date.now()}`;
      saveSnapshot(snapshotKey);
      
      // Get previous state for history
      const task = tasks.find(t => t.id === id);
      const previousStatus = task?.status || '';
      const previousOrder = task?.order || 0;
      
      // Start loading
      startTaskLoading(id);

      // Optimistic update: Update UI immediately
      setTasks((prevTasks) => {
        const updatedTasks = prevTasks.map((task) =>
          task.id === id
            ? { ...task, status: newStatus, order: newOrder, updatedAt: new Date() }
            : task
        );

        // Check if normalization is needed
        if (shouldNormalizeOrders(updatedTasks)) {
          console.log('🔄 Normalizing task orders...');
          return normalizeTaskOrders(updatedTasks);
        }

        return updatedTasks;
      });

      try {
        // Call API (2s delay, 10% failure rate)
        await taskApi.reorderTask(id, newStatus, newOrder);
        
        // Success!
        stopTaskLoading(id);
        snapshotsRef.current.delete(snapshotKey);
        
        // Record in history
        if (task) {
          history.recordReorder(
            id,
            previousStatus,
            newStatus,
            previousOrder,
            newOrder,
            task.title
          );
        }
        // Don't show success toast for drag-drop (too noisy)
      } catch (error) {
        // Failure: Rollback changes
        console.error('[TaskContext] Reorder failed, rolling back', error);
        rollbackToSnapshot(snapshotKey);
        stopTaskLoading(id);
        showError(error instanceof Error ? error.message : 'Failed to reorder task');
      }
    },
    [tasks, setTasks, shouldNormalizeOrders, startTaskLoading, stopTaskLoading, saveSnapshot, rollbackToSnapshot, showError, history]
  );

  /**
   * Real-Time Synchronization
   * Simulates external user changes every 15-25 seconds
   */
  useRealTimeSync(tasks, updateTask, {
    enabled: true,
    onConflict: (taskId, externalUpdates, localChanges) => {
      console.log('[TaskContext] Conflict resolved:', {
        taskId,
        externalUpdates,
        localChanges,
      });
    },
  });

  /**
   * Undo last action
   */
  const handleUndo = useCallback(() => {
    const action = history.undo();
    if (!action) return;

    console.log('[TaskContext] Undoing action:', action);

    switch (action.type) {
      case HistoryActionType.CREATE_TASK:
        // Undo create = delete the task
        setTasks(prev => prev.filter(t => t.id !== action.task.id));
        break;

      case HistoryActionType.UPDATE_TASK:
        // Undo update = restore previous state
        setTasks(prev => prev.map(t => 
          t.id === action.taskId 
            ? { ...t, ...action.previousState, updatedAt: new Date() }
            : t
        ));
        break;

      case HistoryActionType.DELETE_TASK:
        // Undo delete = restore the task
        setTasks(prev => [...prev, action.task]);
        break;

      case HistoryActionType.REORDER_TASK:
        // Undo reorder = move back to previous position
        setTasks(prev => prev.map(t =>
          t.id === action.taskId
            ? { ...t, status: action.previousStatus as TaskStatus, order: action.previousOrder }
            : t
        ));
        break;
    }
  }, [history, setTasks]);

  /**
   * Redo last undone action
   */
  const handleRedo = useCallback(() => {
    const action = history.redo();
    if (!action) return;

    console.log('[TaskContext] Redoing action:', action);

    switch (action.type) {
      case HistoryActionType.CREATE_TASK:
        // Redo create = add the task back
        setTasks(prev => [...prev, action.task]);
        break;

      case HistoryActionType.UPDATE_TASK:
        // Redo update = apply new state
        setTasks(prev => prev.map(t =>
          t.id === action.taskId
            ? { ...t, ...action.newState, updatedAt: new Date() }
            : t
        ));
        break;

      case HistoryActionType.DELETE_TASK:
        // Redo delete = remove the task
        setTasks(prev => prev.filter(t => t.id !== action.task.id));
        break;

      case HistoryActionType.REORDER_TASK:
        // Redo reorder = move to new position
        setTasks(prev => prev.map(t =>
          t.id === action.taskId
            ? { ...t, status: action.newStatus as TaskStatus, order: action.newOrder }
            : t
        ));
        break;
    }
  }, [history, setTasks]);

  const value: TaskContextType = {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    reorderTask,
    isTaskLoading,
    loadingTasks,
    // Undo/Redo
    undo: handleUndo,
    redo: handleRedo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    getUndoDescription: history.getUndoDescription,
    getRedoDescription: history.getRedoDescription,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

/**
 * Custom hook to use Task Context
 * Throws error if used outside TaskProvider
 */
export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
