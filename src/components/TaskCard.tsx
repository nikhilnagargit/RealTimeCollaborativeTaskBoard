/**
 * TaskCard Component
 * 
 * Displays an individual task card with drag-and-drop support.
 * Shows task details including title, description, priority, assignee, and dates.
 */

import React from 'react';
import { Task } from '../types';
import { getPriorityColor, getPriorityBorderColor, formatDate } from '../utils/taskHelpers';

interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent, taskId: string) => void;
  isDropTarget?: boolean;
  isLoading?: boolean;
}

/**
 * TaskCard is memoized to prevent unnecessary re-renders
 * Only re-renders when props actually change
 * Performance optimization for large task lists
 */
export const TaskCard: React.FC<TaskCardProps> = React.memo(({ 
  task, 
  onDragStart, 
  onDragEnd, 
  onDragOver,
  isDropTarget = false,
  isLoading = false
}) => {
  return (
    <div
      draggable={!isLoading}
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver ? (e) => onDragOver(e, task.id) : undefined}
      className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-3 cursor-move hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 border-l-4 ${getPriorityBorderColor(task.priority)} animate-fade-in ${
        isDropTarget ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''
      } ${isLoading ? 'opacity-90 cursor-wait' : ''}`}
      role="article"
      aria-label={`Task: ${task.title}`}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex-1 pr-2">
          {task.title}
        </h3>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(
            task.priority
          )}`}
          aria-label={`Priority: ${task.priority}`}
        >
          {task.priority}
        </span>
      </div>

      {/* Task Description */}
      <p 
        className="text-sm text-gray-600 dark:text-gray-300 mb-3 overflow-hidden cursor-help" 
        style={{ 
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}
        title={task.description}
      >
        {task.description}
      </p>

      {/* Task Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Task Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span>{task.assignee || 'Unassigned'}</span>
        </div>
        <div className="flex items-center">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{formatDate(task.createdAt)}</span>
        </div>
      </div>

      {/* Due Date (if exists) */}
      {task.dueDate && (
        <div className="mt-2 text-xs text-orange-600 flex items-center">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Due: {formatDate(task.dueDate)}
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 rounded-lg flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <svg
              className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm text-gray-600 dark:text-gray-400">Updating...</span>
          </div>
        </div>
      )}
    </div>
  );
});
