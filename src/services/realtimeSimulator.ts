/**
 * Real-Time Simulator Service
 * 
 * Simulates external user changes to tasks every 15-25 seconds.
 * Provides realistic collaborative editing scenarios.
 */

import { Task, TaskStatus, TaskPriority } from '../types';

/**
 * Simulated external users
 */
const EXTERNAL_USERS = [
  'Nikhil Nagar',
  'Sangamesh Sangalad',
  'Shirsha Chaudhuri',
  'Bob Johnson',
  'David Brown',
];

/**
 * Possible task updates from external users
 * Note: Only includes non-destructive updates that don't pollute data
 */
const UPDATE_TYPES = [
  'status_change',
  'priority_change',
  'assignee_change',
] as const;

type UpdateType = typeof UPDATE_TYPES[number];

/**
 * Get random item from array
 */
const randomItem = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Get random number between min and max (inclusive)
 */
const randomBetween = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Get random external user (not the current assignee)
 */
const getRandomExternalUser = (currentAssignee?: string): string => {
  const availableUsers = EXTERNAL_USERS.filter(u => u !== currentAssignee);
  return randomItem(availableUsers);
};

/**
 * Get random status (different from current)
 */
const getRandomStatus = (currentStatus: TaskStatus): TaskStatus => {
  const statuses = Object.values(TaskStatus).filter(s => s !== currentStatus);
  return randomItem(statuses);
};

/**
 * Get random priority (different from current)
 */
const getRandomPriority = (currentPriority: TaskPriority): TaskPriority => {
  const priorities = Object.values(TaskPriority).filter(p => p !== currentPriority);
  return randomItem(priorities);
};

/**
 * Generate a random task update
 */
export const generateRandomUpdate = (tasks: Task[]): {
  taskId: string;
  updates: Partial<Task>;
  updateType: UpdateType;
  externalUser: string;
} | null => {
  if (tasks.length === 0) return null;

  // Pick a random task
  const task = randomItem(tasks);
  const updateType = randomItem([...UPDATE_TYPES]);
  const externalUser = getRandomExternalUser(task.assignee);

  let updates: Partial<Task> = {
    updatedAt: new Date(),
  };

  switch (updateType) {
    case 'status_change':
      updates.status = getRandomStatus(task.status);
      break;

    case 'priority_change':
      updates.priority = getRandomPriority(task.priority);
      break;

    case 'assignee_change':
      updates.assignee = externalUser;
      break;
  }

  return {
    taskId: task.id,
    updates,
    updateType,
    externalUser,
  };
};

/**
 * Get human-readable description of update
 */
export const getUpdateDescription = (
  updateType: UpdateType,
  externalUser: string,
  updates: Partial<Task>
): string => {
  switch (updateType) {
    case 'status_change':
      return `${externalUser} moved a task to ${updates.status}`;
    
    case 'priority_change':
      return `${externalUser} changed task priority to ${updates.priority}`;
    
    case 'assignee_change':
      return `${externalUser} reassigned a task to ${updates.assignee}`;
    
    default:
      return `${externalUser} made changes to a task`;
  }
};

/**
 * Check if there's a conflict between local and external changes
 * A conflict occurs when:
 * 1. The same task is being edited locally
 * 2. The same field is being changed
 */
export const detectConflict = (
  taskId: string,
  externalUpdates: Partial<Task>,
  localEditingTaskId: string | null,
  localChanges: Partial<Task> | null
): boolean => {
  // No conflict if not editing the same task
  if (taskId !== localEditingTaskId || !localChanges) {
    return false;
  }

  // Check if any fields overlap
  const externalFields = Object.keys(externalUpdates);
  const localFields = Object.keys(localChanges);
  
  const hasOverlap = externalFields.some(field => localFields.includes(field));
  
  return hasOverlap;
};

/**
 * Merge strategy: Last Write Wins (LWW)
 * External changes take precedence, but preserve local changes to non-conflicting fields
 */
export const mergeChanges = (
  originalTask: Task,
  externalUpdates: Partial<Task>,
  localChanges: Partial<Task>
): Task => {
  // Start with original task
  let merged = { ...originalTask };

  // Apply local changes first
  merged = { ...merged, ...localChanges };

  // Apply external changes (overwrites conflicts)
  merged = { ...merged, ...externalUpdates };

  // Always use the latest timestamp
  merged.updatedAt = new Date();

  return merged;
};

/**
 * Real-Time Simulator Class
 * Manages the simulation of external user changes
 */
export class RealtimeSimulator {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private minDelay = 15000; // 15 seconds
  private maxDelay = 20000; // 20 seconds

  /**
   * Start the real-time simulation
   */
  start(
    getTasks: () => Task[],
    onUpdate: (taskId: string, updates: Partial<Task>, externalUser: string, updateType: UpdateType) => void
  ): void {
    if (this.isRunning) {
      console.warn('[RealtimeSimulator] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[RealtimeSimulator] Started');

    const scheduleNext = () => {
      const delay = randomBetween(this.minDelay, this.maxDelay);
      console.log(`[RealtimeSimulator] Next update in ${delay / 1000}s`);

      this.intervalId = setTimeout(() => {
        const tasks = getTasks();
        const update = generateRandomUpdate(tasks);

        if (update) {
          console.log('[RealtimeSimulator] Applying external update:', update);
          onUpdate(update.taskId, update.updates, update.externalUser, update.updateType);
        }

        // Schedule next update
        if (this.isRunning) {
          scheduleNext();
        }
      }, delay);
    };

    // Start first update
    scheduleNext();
  }

  /**
   * Stop the real-time simulation
   */
  stop(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[RealtimeSimulator] Stopped');
  }

  /**
   * Check if simulator is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Configure timing
   */
  setTiming(minDelay: number, maxDelay: number): void {
    this.minDelay = minDelay;
    this.maxDelay = maxDelay;
  }
}

/**
 * Singleton instance
 */
export const realtimeSimulator = new RealtimeSimulator();
