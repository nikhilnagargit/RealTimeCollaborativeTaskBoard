/**
 * TaskColumn Component
 * 
 * Represents a single column in the task board (Todo, In Progress, Done).
 * Handles drag-and-drop events for tasks.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { getStatusDisplayName } from '../utils/taskHelpers';
import { useTasks } from '../context/TaskContext';

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onDrop: (
    taskId: string,
    newStatus: TaskStatus,
    dropTargetId?: string,
    dropPosition?: 'before' | 'after'
  ) => void;
}

export const TaskColumn: React.FC<TaskColumnProps> = ({ status, tasks, onDrop }) => {
  const { isTaskLoading } = useTasks();
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('after');

  /**
   * Handle drag start event
   * Memoized to prevent TaskCard re-renders
   */
  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', taskId);
  }, []);

  /**
   * Handle drag end event
   * Memoized to prevent TaskCard re-renders
   */
  const handleDragEnd = useCallback(() => {
    // Drag ended - can be used for cleanup if needed
  }, []);

  /**
   * Handle drag over event (required for drop to work)
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  /**
   * Handle drag leave event
   */
  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
    setDragOverTaskId(null);
  }, []);

  /**
   * Handle drop event
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onDrop(taskId, status, dragOverTaskId || undefined, dropPosition);
    }
    
    setDragOverTaskId(null);
  }, [status, onDrop, dragOverTaskId, dropPosition]);

  /**
   * Handle drag over a specific task to detect drop position
   * Memoized to prevent TaskCard re-renders
   */
  const handleTaskDragOver = useCallback((e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate if hovering over top or bottom half of task
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'before' : 'after';
    
    setDragOverTaskId(taskId);
    setDropPosition(position);
  }, []);

  /**
   * Get column-specific styling
   * Memoized since it only depends on status
   */
  const columnColor = useMemo(() => {
    switch (status) {
      case TaskStatus.TODO:
        return 'border-blue-300 bg-blue-50';
      case TaskStatus.IN_PROGRESS:
        return 'border-yellow-300 bg-yellow-50';
      case TaskStatus.DONE:
        return 'border-green-300 bg-green-50';
      default:
        return 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900';
    }
  }, [status]);

  return (
    <div className="flex-1 min-w-[300px] animate-slide-in">
      <div className="bg-gray-50 dark:bg-gray-800 dark:border dark:border-gray-700 rounded-lg p-4 transition-colors duration-300 shadow-sm">
        {/* Column Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
            <span className={`w-3 h-3 rounded-full mr-2 ${columnColor}`} />
            {getStatusDisplayName(status)}
          </h2>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>

        {/* Column Content - Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`min-h-[500px] rounded-lg transition-colors duration-200 ${
            isDragOver ? 'bg-blue-100 dark:bg-blue-800 border-2 border-dashed border-blue-400 dark:border-blue-500' : ''
          }`}
          role="region"
          aria-label={`${getStatusDisplayName(status)} tasks`}
        >
          {tasks.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 mt-8">
              <p>No tasks</p>
              <p className="text-sm mt-1">Drag tasks here</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id} 
                className={`relative transition-all duration-200 ${
                  dragOverTaskId === task.id && dropPosition === 'before' ? 'mt-6 mb-2' : ''
                } ${
                  dragOverTaskId === task.id && dropPosition === 'after' ? 'mt-2 mb-6' : ''
                }`}
              >
                {/* Drop indicator - Before */}
                {dragOverTaskId === task.id && dropPosition === 'before' && (
                  <div className="absolute -top-6 left-0 right-0 h-6 flex items-center justify-center z-20">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent dark:via-blue-400 rounded-full shadow-lg shadow-blue-500/50 animate-pulse" />
                  </div>
                )}
                
                <TaskCard
                  task={task}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleTaskDragOver}
                  isDropTarget={dragOverTaskId === task.id}
                  isLoading={isTaskLoading(task.id)}
                />
                
                {/* Drop indicator - After */}
                {dragOverTaskId === task.id && dropPosition === 'after' && (
                  <div className="absolute -bottom-6 left-0 right-0 h-6 flex items-center justify-center z-20">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent dark:via-blue-400 rounded-full shadow-lg shadow-blue-500/50 animate-pulse" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
