/**
 * VirtualizedTaskColumn Component
 * 
 * High-performance virtualized column that only renders visible tasks.
 * Supports drag-and-drop with auto-scrolling near edges.
 * Optimized for handling 10,000+ tasks smoothly.
 * 
 * Uses a custom virtualization implementation for better drag-and-drop support.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { getStatusDisplayName } from '../utils/taskHelpers';
import { useTasks } from '../context/TaskContext';
import { useAutoScroll } from '../hooks/useVirtualization';

interface VirtualizedTaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onDrop: (
    taskId: string,
    newStatus: TaskStatus,
    dropTargetId?: string,
    dropPosition?: 'before' | 'after'
  ) => void;
}

// Constants for virtualization
const TASK_HEIGHT = 170; // Approximate height of each task card + margin (adjust based on actual card height)
const COLUMN_HEIGHT = 800; // Height of the scrollable area (increased to show 4 complete cards)

export const VirtualizedTaskColumn: React.FC<VirtualizedTaskColumnProps> = ({ 
  status, 
  tasks, 
  onDrop 
}) => {
  const { isTaskLoading } = useTasks();
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('after');
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when dragging near edges
  const { 
    handleDragOver: handleAutoScrollDragOver, 
    handleDragLeave: handleAutoScrollDragLeave,
    handleDrop: handleAutoScrollDrop 
  } = useAutoScroll(containerRef, isDragOver);

  /**
   * Handle drag start event
   */
  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', taskId);
  }, []);

  /**
   * Handle drag end event
   */
  const handleDragEnd = useCallback(() => {
    // Cleanup if needed
  }, []);

  /**
   * Handle drag over event (required for drop to work)
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    handleAutoScrollDragOver(e);
  }, [handleAutoScrollDragOver]);

  /**
   * Handle drag leave event
   */
  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
    setDragOverTaskId(null);
    handleAutoScrollDragLeave();
  }, [handleAutoScrollDragLeave]);

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
    handleAutoScrollDrop();
  }, [status, onDrop, dragOverTaskId, dropPosition, handleAutoScrollDrop]);

  /**
   * Handle drag over a specific task to detect drop position
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

  /**
   * Calculate visible range based on scroll position
   */
  const visibleRange = useMemo(() => {
    const overscan = 3;
    const startIndex = Math.max(0, Math.floor(scrollTop / TASK_HEIGHT) - overscan);
    const endIndex = Math.min(
      tasks.length - 1,
      Math.ceil((scrollTop + COLUMN_HEIGHT) / TASK_HEIGHT) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, tasks.length]);

  /**
   * Handle scroll event
   */
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  /**
   * Get visible tasks
   */
  const visibleTasks = useMemo(() => {
    return tasks.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [tasks, visibleRange]);

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

        {/* Virtualized Column Content - Drop Zone */}
        <div
          ref={containerRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onScroll={handleScroll}
          className={`rounded-lg transition-colors duration-200 overflow-y-auto ${
            isDragOver ? 'bg-blue-100 dark:bg-blue-800 border-2 border-dashed border-blue-400 dark:border-blue-500' : ''
          } scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent`}
          style={{ height: COLUMN_HEIGHT }}
          role="region"
          aria-label={`${getStatusDisplayName(status)} tasks`}
        >
          {tasks.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-8">
              <p>No tasks</p>
              <p className="text-sm mt-1">Drag tasks here</p>
            </div>
          ) : (
            <div style={{ height: tasks.length * TASK_HEIGHT, position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: visibleRange.startIndex * TASK_HEIGHT,
                  left: 0,
                  right: 0,
                }}
              >
                {visibleTasks.map((task) => {
                  return (
                    <div
                      key={task.id}
                      className={`relative mb-4 transition-all duration-200 ${
                        dragOverTaskId === task.id && dropPosition === 'before' ? 'mt-6 mb-2' : ''
                      } ${
                        dragOverTaskId === task.id && dropPosition === 'after' ? 'mt-2 mb-6' : ''
                      }`}
                    >
                      <div className="relative">
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Performance indicator for large lists */}
        {tasks.length > 100 && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Virtualized ({tasks.length} tasks)
          </div>
        )}
      </div>
    </div>
  );
};
