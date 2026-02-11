/**
 * TaskBoard Component
 * 
 * Main task board component that displays tasks in columns and handles filtering.
 * Integrates TaskColumn, FilterBar, and TaskModal components.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { TaskStatus, FilterOptions } from '../types';
import { useTasks } from '../context/TaskContext';
import { filterTasks, groupTasksByStatus } from '../utils/taskHelpers';
import { mockAssignees } from '../utils/mockData';
import { useDarkMode } from '../hooks';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { TaskColumn } from './TaskColumn';
import { VirtualizedTaskColumn } from './VirtualizedTaskColumn';
import { FilterBar } from './FilterBar';
import { TaskModal } from './TaskModal';
import { ShortcutsHelp } from './ShortcutsHelp';
import { ThomsonReutersLogo } from './ThomsonReutersLogo';

export const TaskBoard: React.FC = () => {
  const { 
    tasks, 
    addTask, 
    reorderTask,
    undo,
    redo,
    canUndo,
    canRedo,
    getUndoDescription,
    getRedoDescription 
  } = useTasks();
  const [filters, setFilters] = useState<FilterOptions>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [isDark, toggleDarkMode] = useDarkMode();
  const [isVirtualizationEnabled, setIsVirtualizationEnabled] = useState(false);

  /**
   * Group all tasks by status (unfiltered) for statistics
   */
  const allGroupedTasks = useMemo(() => {
    return groupTasksByStatus(tasks);
  }, [tasks]);

  /**
   * Filter and group tasks by status
   * Uses useMemo for performance optimization
   */
  const groupedTasks = useMemo(() => {
    const filtered = filterTasks(tasks, filters);
    return groupTasksByStatus(filtered);
  }, [tasks, filters]);

  /**
   * Handle task drop with position calculation
   * Memoized to prevent TaskColumn re-renders
   */
  const handleTaskDrop = useCallback((
    taskId: string,
    newStatus: TaskStatus,
    dropTargetId?: string,
    dropPosition?: 'before' | 'after'
  ) => {
    // Prevent dropping on itself
    if (dropTargetId === taskId) {
      return;
    }

    // Get the dragged task to check if it's same column reordering
    const draggedTask = tasks.find((t) => t.id === taskId);
    const isSameColumn = draggedTask?.status === newStatus;
    
    // Filter out the dragged task if reordering within same column
    const columnTasks = isSameColumn
      ? groupedTasks[newStatus].filter((t) => t.id !== taskId)
      : groupedTasks[newStatus];
    
    if (!dropTargetId || columnTasks.length === 0) {
      // Dropped in empty space - add to end
      const maxOrder = columnTasks.length > 0
        ? Math.max(...columnTasks.map((t) => t.order || 0))
        : -1;
      reorderTask(taskId, newStatus, maxOrder + 1);
      return;
    }

    // Find target task and calculate new order
    const targetIndex = columnTasks.findIndex((t) => t.id === dropTargetId);
    if (targetIndex === -1) {
      // Target not found, add to end
      const maxOrder = Math.max(...columnTasks.map((t) => t.order || 0));
      reorderTask(taskId, newStatus, maxOrder + 1);
      return;
    }

    const targetTask = columnTasks[targetIndex];
    let newOrder: number;

    if (dropPosition === 'before') {
      // Insert before target
      const prevTask = targetIndex > 0 ? columnTasks[targetIndex - 1] : null;
      if (prevTask) {
        // Insert between prevTask and targetTask
        newOrder = (prevTask.order + targetTask.order) / 2;
      } else {
        // Inserting before first task
        // Find the minimum order in the column to avoid issues
        const minOrder = Math.min(...columnTasks.map(t => t.order || 0));
        newOrder = minOrder - 1;
      }
    } else {
      // Insert after target
      const nextTask = targetIndex < columnTasks.length - 1 ? columnTasks[targetIndex + 1] : null;
      newOrder = nextTask
        ? (targetTask.order + nextTask.order) / 2
        : targetTask.order + 1;
    }

    reorderTask(taskId, newStatus, newOrder);
  }, [tasks, groupedTasks, reorderTask]);

  /**
   * Handle filter changes from FilterBar
   */
  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
  }, []);

  /**
   * Handle new task creation
   */
  const handleCreateTask = (taskData: any) => {
    addTask(taskData);
  };

  // Get unique assignees from tasks
  const assignees = useMemo(() => {
    const uniqueAssignees = new Set(tasks.map((task) => task.assignee).filter(Boolean));
    return Array.from(uniqueAssignees) as string[];
  }, [tasks]);

  // Use mock assignees if no tasks exist yet
  const availableAssignees = assignees.length > 0 ? assignees : mockAssignees;

  /**
   * Keyboard Shortcuts
   */
  useKeyboardShortcuts([
    {
      key: 'n',
      handler: () => setIsModalOpen(true),
      description: 'New Task',
    },
    {
      key: 'z',
      ctrl: true,
      shift: false,
      handler: undo,
      description: 'Undo',
      preventDefault: true,
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      handler: redo,
      description: 'Redo',
      preventDefault: true,
    },
    {
      key: 'Escape',
      handler: () => {
        if (isModalOpen) setIsModalOpen(false);
        if (isShortcutsHelpOpen) setIsShortcutsHelpOpen(false);
      },
      description: 'Close Modal',
    },
    {
      key: '?',
      handler: () => setIsShortcutsHelpOpen(true),
      description: 'Show Keyboard Shortcuts',
      preventDefault: true,
    },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EFE7] to-[#E8DED0] dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Thomson Reuters Navbar - Sticky */}
      <nav className="sticky top-0 z-[150] bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-md border-b border-gray-200 dark:border-gray-700 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Thomson Reuters Logo */}
          <ThomsonReutersLogo size="md" />
          
          {/* Right Side: Help, Dark Mode, Profile */}
          <div className="flex items-center gap-3">
              {/* Keyboard Shortcuts Help Button */}
              <button
                onClick={() => setIsShortcutsHelpOpen(true)}
                className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                aria-label="Show keyboard shortcuts"
                title="Keyboard Shortcuts (?)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Virtualization Toggle */}
              <button
                onClick={() => setIsVirtualizationEnabled(!isVirtualizationEnabled)}
                className={`px-4 py-3 font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
                  isVirtualizationEnabled
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                aria-label={isVirtualizationEnabled ? 'Disable virtualization' : 'Enable virtualization'}
                title={isVirtualizationEnabled ? 'Disable Virtualization' : 'Enable Virtualization'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm">Virtualize</span>
              </button>

              {/* Profile Icon */}
              <div className="ml-2 flex items-center">
                <button
                  className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  aria-label="User profile"
                  title="Nikhil Nagar"
                >
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Dark Green Hero Section - Thomson Reuters Style - Compact */}
        <div className="relative z-[100] bg-[#113022] dark:bg-[#0a1f16] pt-6 pb-4 border-b border-transparent dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-6">
            {/* Page Header */}
            <header className="mb-4 animate-fade-in">
              {/* Main heading with author in Thomson Reuters orange */}
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
                Task Board <span className="text-sm font-normal text-[#FF4F00]">by Nikhil Nagar</span>
              </h1>
              
              {/* App description */}
              <p className="text-sm text-white/80 dark:text-white/70">
                Manage tasks efficiently with drag-and-drop, real-time collaboration, and optimistic UI updates
              </p>
            </header>
          </div>
        </div>

        {/* Beige Content Area */}
        <div className="bg-[#FDF2DA] dark:bg-gray-900 min-h-screen">
          <div className="max-w-7xl mx-auto px-6 pt-6 pb-6">
            
            {/* Filter Bar with inline statistics - Always show unfiltered counts */}
            <FilterBar 
              assignees={availableAssignees} 
              onFilterChange={handleFilterChange}
              onCreateTask={() => setIsModalOpen(true)}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              getUndoDescription={getUndoDescription}
              getRedoDescription={getRedoDescription}
              totalTasks={tasks.length}
              todoTasks={allGroupedTasks[TaskStatus.TODO].length}
              inProgressTasks={allGroupedTasks[TaskStatus.IN_PROGRESS].length}
              completedTasks={allGroupedTasks[TaskStatus.DONE].length}
            />

            {/* Task Columns - Toggle between regular and virtualized columns */}
            <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-4 mt-6">
          {isVirtualizationEnabled ? (
            <VirtualizedTaskColumn
              status={TaskStatus.TODO}
              tasks={groupedTasks[TaskStatus.TODO]}
              onDrop={handleTaskDrop}
            />
          ) : (
            <TaskColumn
              status={TaskStatus.TODO}
              tasks={groupedTasks[TaskStatus.TODO]}
              onDrop={handleTaskDrop}
            />
          )}
          
          {isVirtualizationEnabled ? (
            <VirtualizedTaskColumn
              status={TaskStatus.IN_PROGRESS}
              tasks={groupedTasks[TaskStatus.IN_PROGRESS]}
              onDrop={handleTaskDrop}
            />
          ) : (
            <TaskColumn
              status={TaskStatus.IN_PROGRESS}
              tasks={groupedTasks[TaskStatus.IN_PROGRESS]}
              onDrop={handleTaskDrop}
            />
          )}
          
          {isVirtualizationEnabled ? (
            <VirtualizedTaskColumn
              status={TaskStatus.DONE}
              tasks={groupedTasks[TaskStatus.DONE]}
              onDrop={handleTaskDrop}
            />
          ) : (
            <TaskColumn
              status={TaskStatus.DONE}
              tasks={groupedTasks[TaskStatus.DONE]}
              onDrop={handleTaskDrop}
            />
          )}
        </div>
          </div>
        </div>

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
        assignees={availableAssignees}
      />

      {/* Keyboard Shortcuts Help */}
      <ShortcutsHelp
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />
    </div>
  );
};
