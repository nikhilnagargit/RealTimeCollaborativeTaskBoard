/**
 * Task API Service
 * 
 * Mock API service that simulates backend calls with:
 * - 2-second delay
 * - 10% random failure rate
 * - Realistic error responses
 */

import { Task, TaskStatus } from '../types';

/**
 * Simulate network delay
 */
const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Simulate random API failure (10% chance)
 */
const shouldFail = (): boolean => {
  return Math.random() < 0.1; // 10% failure rate
};

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'API_ERROR'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Update task (optimistic update scenario)
 */
export const updateTask = async (
  taskId: string,
  updates: Partial<Task>
): Promise<Task> => {
  console.log(`[API] Updating task ${taskId}...`, updates);
  
  // Simulate 2-second network delay
  await delay(2000);
  
  // Simulate 10% failure rate
  if (shouldFail()) {
    console.error(`[API] Failed to update task ${taskId}`);
    throw new ApiError(
      'Failed to update task. Please try again.',
      500,
      'UPDATE_FAILED'
    );
  }
  
  console.log(`[API] Successfully updated task ${taskId}`);
  
  // Return updated task (in real app, this would come from server)
  return {
    ...updates,
    id: taskId,
    updatedAt: new Date(),
  } as Task;
};

/**
 * Move task to different status (common optimistic update)
 */
export const moveTask = async (
  taskId: string,
  newStatus: TaskStatus
): Promise<Task> => {
  console.log(`[API] Moving task ${taskId} to ${newStatus}...`);
  
  await delay(2000);
  
  if (shouldFail()) {
    console.error(`[API] Failed to move task ${taskId}`);
    throw new ApiError(
      'Failed to move task. The task has been restored.',
      500,
      'MOVE_FAILED'
    );
  }
  
  console.log(`[API] Successfully moved task ${taskId} to ${newStatus}`);
  
  return {
    id: taskId,
    status: newStatus,
    updatedAt: new Date(),
  } as Task;
};

/**
 * Reorder task (drag and drop)
 */
export const reorderTask = async (
  taskId: string,
  newStatus: TaskStatus,
  newOrder: number
): Promise<Task> => {
  console.log(`[API] Reordering task ${taskId} to ${newStatus} at position ${newOrder}...`);
  
  await delay(2000);
  
  if (shouldFail()) {
    console.error(`[API] Failed to reorder task ${taskId}`);
    throw new ApiError(
      'Failed to reorder task. Changes have been reverted.',
      500,
      'REORDER_FAILED'
    );
  }
  
  console.log(`[API] Successfully reordered task ${taskId}`);
  
  return {
    id: taskId,
    status: newStatus,
    order: newOrder,
    updatedAt: new Date(),
  } as Task;
};

/**
 * Create new task
 */
export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
  console.log('[API] Creating new task...', taskData);
  
  await delay(2000);
  
  if (shouldFail()) {
    console.error('[API] Failed to create task');
    throw new ApiError(
      'Failed to create task. Please try again.',
      500,
      'CREATE_FAILED'
    );
  }
  
  const newTask: Task = {
    ...taskData,
    id: `task-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  console.log('[API] Successfully created task', newTask.id);
  
  return newTask;
};

/**
 * Delete task
 */
export const deleteTask = async (taskId: string): Promise<void> => {
  console.log(`[API] Deleting task ${taskId}...`);
  
  await delay(2000);
  
  if (shouldFail()) {
    console.error(`[API] Failed to delete task ${taskId}`);
    throw new ApiError(
      'Failed to delete task. Please try again.',
      500,
      'DELETE_FAILED'
    );
  }
  
  console.log(`[API] Successfully deleted task ${taskId}`);
};

/**
 * Batch update tasks (for real-time sync)
 */
export const batchUpdateTasks = async (updates: Partial<Task>[]): Promise<Task[]> => {
  console.log(`[API] Batch updating ${updates.length} tasks...`);
  
  await delay(2000);
  
  if (shouldFail()) {
    console.error('[API] Failed to batch update tasks');
    throw new ApiError(
      'Failed to sync tasks. Some changes may not have been saved.',
      500,
      'BATCH_UPDATE_FAILED'
    );
  }
  
  console.log('[API] Successfully batch updated tasks');
  
  return updates.map(update => ({
    ...update,
    updatedAt: new Date(),
  })) as Task[];
};
