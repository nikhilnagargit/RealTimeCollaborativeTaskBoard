/**
 * useRealTimeSync Hook
 * 
 * Manages real-time synchronization with simulated external changes.
 * Handles conflict detection and resolution.
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { Task } from '../types';
import { realtimeSimulator, getUpdateDescription, detectConflict, mergeChanges } from '../services/realtimeSimulator';
import { useToast } from '../context/ToastContext';

interface UseRealTimeSyncOptions {
  enabled?: boolean;
  onConflict?: (taskId: string, externalUpdates: Partial<Task>, localChanges: Partial<Task>) => void;
}

/**
 * Hook to enable real-time synchronization
 * 
 * @example
 * useRealTimeSync({
 *   enabled: true,
 *   onConflict: (taskId, external, local) => {
 *     console.log('Conflict detected!', taskId);
 *   }
 * });
 */
export const useRealTimeSync = (
  tasks: Task[],
  updateTask: (id: string, updates: Partial<Task>) => void,
  options: UseRealTimeSyncOptions = {}
) => {
  const { enabled = true, onConflict } = options;
  const { showInfo, showWarning } = useToast();
  
  // Track if user is currently editing a task
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [localChanges, setLocalChanges] = useState<Partial<Task> | null>(null);
  
  // Use ref to avoid stale closure in setTimeout
  const tasksRef = useRef<Task[]>(tasks);
  const updateTaskRef = useRef(updateTask);

  // Update refs when values change
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    updateTaskRef.current = updateTask;
  }, [updateTask]);

  /**
   * Handle external update from simulator
   */
  const handleExternalUpdate = useCallback(
    (taskId: string, updates: Partial<Task>, externalUser: string, updateType: string) => {
      const currentTasks = tasksRef.current;
      const task = currentTasks.find(t => t.id === taskId);
      
      if (!task) {
        console.warn('[RealTimeSync] Task not found:', taskId);
        return;
      }

      // Check for conflicts
      const hasConflict = detectConflict(taskId, updates, editingTaskId, localChanges);

      if (hasConflict) {
        console.warn('[RealTimeSync] Conflict detected!', {
          taskId,
          externalUpdates: updates,
          localChanges,
        });

        // Notify about conflict
        showWarning(`Conflict: ${externalUser} also edited this task. External changes applied.`);

        // Merge changes (Last Write Wins - external takes precedence)
        const merged = mergeChanges(task, updates, localChanges!);
        updateTaskRef.current(taskId, merged);

        // Notify conflict handler
        if (onConflict) {
          onConflict(taskId, updates, localChanges!);
        }

        // Clear local editing state
        setEditingTaskId(null);
        setLocalChanges(null);
      } else {
        // No conflict - apply external changes directly
        console.log('[RealTimeSync] Applying external update:', {
          taskId,
          updates,
          externalUser,
        });

        updateTaskRef.current(taskId, updates);

        // Show notification
        const description = getUpdateDescription(updateType as any, externalUser, updates);
        showInfo(description);
      }
    },
    [editingTaskId, localChanges, showInfo, showWarning, onConflict]
  );

  /**
   * Start editing a task (to track conflicts)
   */
  const startEditing = useCallback((taskId: string, changes: Partial<Task>) => {
    setEditingTaskId(taskId);
    setLocalChanges(changes);
  }, []);

  /**
   * Stop editing a task
   */
  const stopEditing = useCallback(() => {
    setEditingTaskId(null);
    setLocalChanges(null);
  }, []);

  /**
   * Start/stop real-time sync
   */
  useEffect(() => {
    if (!enabled) return;

    // Start simulator
    realtimeSimulator.start(
      () => tasksRef.current,
      handleExternalUpdate
    );

    return () => {
      // Stop simulator on unmount
      realtimeSimulator.stop();
    };
  }, [enabled, handleExternalUpdate]);

  return {
    isActive: realtimeSimulator.isActive(),
    startEditing,
    stopEditing,
    editingTaskId,
  };
};
