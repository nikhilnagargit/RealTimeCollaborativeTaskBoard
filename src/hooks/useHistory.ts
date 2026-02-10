/**
 * useHistory Hook
 * 
 * Manages undo/redo functionality for task operations
 * Maintains a history stack with max 50 actions
 */

import { useState, useCallback, useRef } from 'react';
import { Task } from '../types';
import { 
  HistoryActionUnion, 
  HistoryActionType, 
  CreateTaskAction,
  UpdateTaskAction,
  DeleteTaskAction,
  ReorderTaskAction,
  HistoryState 
} from '../types/history';

const MAX_HISTORY_SIZE = 50;

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    future: [],
    maxSize: MAX_HISTORY_SIZE,
  });

  // Use ref to track if we're in the middle of undo/redo
  const isUndoingRef = useRef(false);
  const isRedoingRef = useRef(false);

  /**
   * Generate unique ID for history actions
   */
  const generateId = useCallback(() => {
    return `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Add action to history
   */
  const addToHistory = useCallback((action: HistoryActionUnion) => {
    // Don't add to history if we're undoing/redoing
    if (isUndoingRef.current || isRedoingRef.current) {
      return;
    }

    setHistory((prev) => {
      const newPast = [...prev.past, action];
      
      // Limit history size
      if (newPast.length > prev.maxSize) {
        newPast.shift(); // Remove oldest action
      }

      return {
        ...prev,
        past: newPast,
        future: [], // Clear future when new action is added
      };
    });
  }, []);

  /**
   * Record task creation
   */
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

  /**
   * Record task update
   */
  const recordUpdate = useCallback((
    taskId: string,
    previousState: Partial<Task>,
    newState: Partial<Task>,
    taskTitle?: string
  ) => {
    // Generate description based on what changed
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

  /**
   * Record task deletion
   */
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

  /**
   * Record task reorder
   */
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

  /**
   * Undo last action
   */
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

    // Reset flag after state update
    setTimeout(() => {
      isUndoingRef.current = false;
    }, 0);

    return action;
  }, [history.past]);

  /**
   * Redo last undone action
   */
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

    // Reset flag after state update
    setTimeout(() => {
      isRedoingRef.current = false;
    }, 0);

    return action;
  }, [history.future]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory({
      past: [],
      future: [],
      maxSize: MAX_HISTORY_SIZE,
    });
  }, []);

  /**
   * Get description of next undo action
   */
  const getUndoDescription = useCallback(() => {
    if (history.past.length === 0) return null;
    return history.past[history.past.length - 1].description;
  }, [history.past]);

  /**
   * Get description of next redo action
   */
  const getRedoDescription = useCallback(() => {
    if (history.future.length === 0) return null;
    return history.future[0].description;
  }, [history.future]);

  return {
    // State
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    historySize: history.past.length,
    
    // Actions
    undo,
    redo,
    clearHistory,
    
    // Recording functions
    recordCreate,
    recordUpdate,
    recordDelete,
    recordReorder,
    
    // Descriptions
    getUndoDescription,
    getRedoDescription,
    
    // Full history (for debugging)
    history,
  };
};
