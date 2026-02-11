/**
 * FilterBar Component
 * 
 * Provides filtering controls for tasks by assignee, priority, and search.
 * Uses debouncing for search input to optimize performance.
 */

import React, { useState, useEffect } from 'react';
import { FilterOptions, TaskPriority } from '../types';
import { useDebounce } from '../hooks';

interface FilterBarProps {
  assignees: string[];
  onFilterChange: (filters: FilterOptions) => void;
  // Action buttons
  onCreateTask: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;
  // Statistics (always unfiltered counts)
  totalTasks?: number;
  todoTasks?: number;
  inProgressTasks?: number;
  completedTasks?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({ 
  assignees, 
  onFilterChange,
  onCreateTask,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  getUndoDescription,
  getRedoDescription,
  totalTasks = 0,
  todoTasks = 0,
  inProgressTasks = 0,
  completedTasks = 0
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<TaskPriority[]>([]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  
  // Refs for dropdown positioning
  const assigneeButtonRef = React.useRef<HTMLButtonElement>(null);
  const priorityButtonRef = React.useRef<HTMLButtonElement>(null);

  // Debounce search query for performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  /**
   * Close dropdowns when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside both dropdowns
      const assigneeDropdown = document.querySelector('.assignee-dropdown');
      const priorityDropdown = document.querySelector('.priority-dropdown');
      
      if (assigneeDropdown && !assigneeDropdown.contains(target)) {
        setShowAssigneeDropdown(false);
      }
      if (priorityDropdown && !priorityDropdown.contains(target)) {
        setShowPriorityDropdown(false);
      }
    };

    if (showAssigneeDropdown || showPriorityDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAssigneeDropdown, showPriorityDropdown]);

  /**
   * Update filters whenever any filter value changes
   */
  useEffect(() => {
    const filters: FilterOptions = {
      searchQuery: debouncedSearchQuery,
      assignee: selectedAssignees.length > 0 ? selectedAssignees : undefined,
      priority: selectedPriorities.length > 0 ? selectedPriorities : undefined,
    };

    onFilterChange(filters);
  }, [debouncedSearchQuery, selectedAssignees, selectedPriorities, onFilterChange]);

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedAssignees([]);
    setSelectedPriorities([]);
  };

  const hasActiveFilters = searchQuery || selectedAssignees.length > 0 || selectedPriorities.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 border border-transparent dark:border-gray-600 rounded-lg shadow-md p-3 transition-colors duration-300">
      {/* Compact Single Row Layout */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 relative">
        {/* Left: Action Buttons (Compact) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Create Task Button - Compact */}
          <button
            onClick={onCreateTask}
            className="px-4 py-2 bg-[#FF4F00] hover:bg-[#E64500] text-white font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5 text-sm"
            aria-label="Create new task"
            title="Create new task (N)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Create</span>
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

          {/* Undo Button - Icon Only */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-2 rounded-md transition-all duration-200 ${
              canUndo 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
            aria-label="Undo"
            title={getUndoDescription() || 'Nothing to undo (Ctrl+Z)'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>

          {/* Redo Button - Icon Only */}
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-2 rounded-md transition-all duration-200 ${
              canRedo 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
            aria-label="Redo"
            title={getRedoDescription() || 'Nothing to redo (Ctrl+Shift+Z)'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="hidden lg:block h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

        {/* Right: Filters (Compact) */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input - Compact */}
          <div className="flex-1 min-w-[180px]">
            <div className="relative">
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full px-3 py-1.5 pl-8 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                aria-label="Search tasks"
              />
              <svg
                className="absolute left-2.5 top-2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

          {/* Assignee Filter - Custom Multi-Select */}
          <div className="relative w-full sm:w-48 assignee-dropdown">
            <button
              ref={assigneeButtonRef}
              type="button"
              onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
              className="w-full px-3 py-1.5 text-sm text-left border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 flex items-center justify-between"
              aria-label="Filter by assignees"
            >
              <span className="truncate">
                {selectedAssignees.length === 0 ? 'Assignees' : `${selectedAssignees.length} selected`}
              </span>
              <svg className="w-4 h-4 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showAssigneeDropdown && (
              <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-xl max-h-48 overflow-y-auto">
                {assignees.map((assignee) => (
                  <label
                    key={assignee}
                    className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors duration-150"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssignees.includes(assignee)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssignees([...selectedAssignees, assignee]);
                        } else {
                          setSelectedAssignees(selectedAssignees.filter(a => a !== assignee));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-gray-900 dark:text-gray-100 select-none">{assignee}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Priority Filter - Custom Multi-Select */}
          <div className="relative w-full sm:w-36 priority-dropdown">
            <button
              ref={priorityButtonRef}
              type="button"
              onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
              className="w-full px-3 py-1.5 text-sm text-left border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 flex items-center justify-between"
              aria-label="Filter by priorities"
            >
              <span className="truncate">
                {selectedPriorities.length === 0 ? 'Priorities' : `${selectedPriorities.length} selected`}
              </span>
              <svg className="w-4 h-4 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showPriorityDropdown && (
              <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-xl max-h-48 overflow-y-auto">
                {[TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH].map((priority) => (
                  <label
                    key={priority}
                    className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors duration-150"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPriorities.includes(priority)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPriorities([...selectedPriorities, priority]);
                        } else {
                          setSelectedPriorities(selectedPriorities.filter(p => p !== priority));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-gray-900 dark:text-gray-100 capitalize select-none">{priority}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Statistics Badges - Compact on right */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          {/* Label to clarify these are total statistics (unfiltered) */}
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1" title="These counts don't change with filters">
            Total:
          </span>
          
          {/* Total Tasks */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md cursor-help transition-all duration-200 hover:bg-blue-100 dark:hover:bg-blue-900/50"
            title="Total Tasks (all statuses, unfiltered)"
            aria-label={`Total tasks: ${totalTasks}`}
          >
            <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{totalTasks}</span>
          </div>

          {/* TODO Tasks */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md cursor-help transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="TODO: Total tasks in To Do status (unfiltered)"
            aria-label={`TODO tasks: ${todoTasks}`}
          >
            <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{todoTasks}</span>
          </div>

          {/* In Progress */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-md cursor-help transition-all duration-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
            title="In Progress: Total tasks in progress (unfiltered)"
            aria-label={`In progress tasks: ${inProgressTasks}`}
          >
            <svg className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">{inProgressTasks}</span>
          </div>

          {/* Completed */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-md cursor-help transition-all duration-200 hover:bg-green-100 dark:hover:bg-green-900/50"
            title="Done: Total completed tasks (unfiltered)"
            aria-label={`Completed tasks: ${completedTasks}`}
          >
            <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">{completedTasks}</span>
          </div>
        </div>
      </div>

      {/* Active Filters Row - Always Below */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">Active:</span>
          
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              "{searchQuery.length > 20 ? searchQuery.substring(0, 20) + '...' : searchQuery}"
              <button
                onClick={() => setSearchQuery('')}
                className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                aria-label="Remove search filter"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          
          {/* Assignee Chips - Multiple */}
          {selectedAssignees.map((assignee) => (
            <span key={assignee} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-md">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {assignee}
              <button
                onClick={() => setSelectedAssignees(prev => prev.filter(a => a !== assignee))}
                className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                aria-label={`Remove ${assignee} filter`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          
          {/* Priority Chips - Multiple */}
          {selectedPriorities.map((priority) => (
            <span key={priority} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-md">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {priority}
              <button
                onClick={() => setSelectedPriorities(prev => prev.filter(p => p !== priority))}
                className="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5"
                aria-label={`Remove ${priority} priority filter`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          
          {/* Clear All Button */}
          <button
            onClick={handleClearFilters}
            className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline flex-shrink-0"
            aria-label="Clear all filters"
          >
            Clear all
          </button>
          </div>
        </div>
      )}
    </div>
  );
};
