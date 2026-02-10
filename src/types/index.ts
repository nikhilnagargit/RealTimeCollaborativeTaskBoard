/**
 * Type Definitions for the Task Board Application
 * 
 * This file contains all TypeScript interfaces and types used throughout the application.
 */

/**
 * Task Status Enum
 * Represents the possible states of a task
 */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

/**
 * Task Priority Enum
 * Represents the priority level of a task
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Task Interface
 * Represents a single task in the task board
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  createdAt: Date | string; // Can be string when retrieved from localStorage
  updatedAt: Date | string; // Can be string when retrieved from localStorage
  dueDate?: Date | string;   // Can be string when retrieved from localStorage
  tags?: string[];
  order: number; // Position within status column for drag-and-drop ordering
}

/**
 * Filter Options Interface
 * Represents the available filter options for tasks
 */
export interface FilterOptions {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignee?: string[];
  tags?: string[];
  searchQuery?: string;
}

/**
 * Sort Options Interface
 * Represents the available sort options for tasks
 */
export interface SortOptions {
  field: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title';
  order: 'asc' | 'desc';
}

/**
 * User Interface
 * Represents a user in the system
 */
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
