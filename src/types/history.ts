/**
 * History Types for Undo/Redo System
 * 
 * Defines the structure for tracking task changes
 */

import { Task } from './index';

/**
 * Types of actions that can be undone/redone
 */
export enum HistoryActionType {
  CREATE_TASK = 'CREATE_TASK',
  UPDATE_TASK = 'UPDATE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  REORDER_TASK = 'REORDER_TASK',
}

/**
 * Base history action interface
 */
export interface HistoryAction {
  id: string;
  type: HistoryActionType;
  timestamp: Date;
  description: string;
}

/**
 * Create task action
 */
export interface CreateTaskAction extends HistoryAction {
  type: HistoryActionType.CREATE_TASK;
  task: Task;
}

/**
 * Update task action
 */
export interface UpdateTaskAction extends HistoryAction {
  type: HistoryActionType.UPDATE_TASK;
  taskId: string;
  previousState: Partial<Task>;
  newState: Partial<Task>;
}

/**
 * Delete task action
 */
export interface DeleteTaskAction extends HistoryAction {
  type: HistoryActionType.DELETE_TASK;
  task: Task;
}

/**
 * Reorder task action
 */
export interface ReorderTaskAction extends HistoryAction {
  type: HistoryActionType.REORDER_TASK;
  taskId: string;
  previousStatus: string;
  newStatus: string;
  previousOrder: number;
  newOrder: number;
}

/**
 * Union type for all history actions
 */
export type HistoryActionUnion = 
  | CreateTaskAction 
  | UpdateTaskAction 
  | DeleteTaskAction 
  | ReorderTaskAction;

/**
 * History state interface
 */
export interface HistoryState {
  past: HistoryActionUnion[];
  future: HistoryActionUnion[];
  maxSize: number;
}
