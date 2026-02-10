/**
 * Task Helper Functions
 * 
 * Utility functions for task filtering, sorting, and manipulation.
 */

import { Task, FilterOptions, TaskStatus, TaskPriority } from '../types';

/**
 * Filter tasks based on provided filter options
 */
export const filterTasks = (tasks: Task[], filters: FilterOptions): Task[] => {
  let filtered = [...tasks];

  // Filter by status
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter((task) => filters.status!.includes(task.status));
  }

  // Filter by priority
  if (filters.priority && filters.priority.length > 0) {
    filtered = filtered.filter((task) => filters.priority!.includes(task.priority));
  }

  // Filter by assignee
  if (filters.assignee && filters.assignee.length > 0) {
    filtered = filtered.filter((task) => 
      task.assignee && filters.assignee!.includes(task.assignee)
    );
  }

  // Filter by tags
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((task) =>
      task.tags?.some((tag) => filters.tags!.includes(tag))
    );
  }

  // Search by title or description
  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query)
    );
  }

  return filtered;
};

/**
 * Group tasks by status and sort by order
 */
export const groupTasksByStatus = (tasks: Task[]): Record<TaskStatus, Task[]> => {
  const sortByOrder = (a: Task, b: Task) => (a.order || 0) - (b.order || 0);
  
  return {
    [TaskStatus.TODO]: tasks
      .filter((task) => task.status === TaskStatus.TODO)
      .sort(sortByOrder),
    [TaskStatus.IN_PROGRESS]: tasks
      .filter((task) => task.status === TaskStatus.IN_PROGRESS)
      .sort(sortByOrder),
    [TaskStatus.DONE]: tasks
      .filter((task) => task.status === TaskStatus.DONE)
      .sort(sortByOrder),
  };
};

/**
 * Auto-assign order values to tasks that don't have them
 * Useful for migrating existing tasks
 */
export const ensureTasksHaveOrder = (tasks: Task[]): Task[] => {
  // Group by status
  const grouped = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  // Assign orders within each status group
  return tasks.map((task) => {
    if (task.order !== undefined) return task;
    
    const statusTasks = grouped[task.status];
    const index = statusTasks.indexOf(task);
    return { ...task, order: index };
  });
};

/**
 * Normalize task orders to sequential integers
 * Call this when orders become negative or too fragmented
 */
export const normalizeTaskOrders = (tasks: Task[]): Task[] => {
  // Group by status
  const grouped = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  // Sort each group by current order
  Object.keys(grouped).forEach((status) => {
    grouped[status as TaskStatus].sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  // Reassign sequential orders
  return tasks.map((task) => {
    const statusTasks = grouped[task.status];
    const index = statusTasks.indexOf(task);
    return { ...task, order: index };
  });
};

/**
 * Get priority color class for Tailwind
 */
export const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.HIGH:
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700';
    case TaskPriority.MEDIUM:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
    case TaskPriority.LOW:
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
  }
};

/**
 * Get priority border color for task card left border (Jira-style)
 * Using softer colors for a more elegant look
 */
export const getPriorityBorderColor = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.HIGH:
      return 'border-l-red-400 dark:border-l-red-500';
    case TaskPriority.MEDIUM:
      return 'border-l-yellow-400 dark:border-l-yellow-500';
    case TaskPriority.LOW:
      return 'border-l-green-400 dark:border-l-green-500';
    default:
      return 'border-l-gray-300 dark:border-l-gray-600';
  }
};

/**
 * Get status display name
 */
export const getStatusDisplayName = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.TODO:
      return 'To Do';
    case TaskStatus.IN_PROGRESS:
      return 'In Progress';
    case TaskStatus.DONE:
      return 'Done';
    default:
      return status;
  }
};

/**
 * Format date for display
 * Handles both Date objects and date strings (from localStorage)
 */
export const formatDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
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

/**
 * Generate unique ID for new tasks
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
