/**
 * MultiSelect Component
 * 
 * Reusable multi-select dropdown component with dark mode support.
 * Used for filtering by assignees, priorities, or any other multi-value selection.
 */

import React, { useRef, useEffect } from 'react';

interface MultiSelectProps<T extends string> {
  options: T[];
  selectedValues: T[];
  onChange: (values: T[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  dropdownClassName?: string;
}

export function MultiSelect<T extends string>({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select...',
  label,
  className = '',
  dropdownClassName = ''
}: MultiSelectProps<T>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggle = (value: T) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const displayText = selectedValues.length === 0 
    ? placeholder 
    : `${selectedValues.length} selected`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-1.5 text-sm text-left border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 flex items-center justify-between"
        aria-label={label || placeholder}
        aria-expanded={isOpen}
      >
        <span className="truncate">{displayText}</span>
        <svg 
          className={`w-4 h-4 ml-1 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className={`absolute z-[100] mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-xl max-h-48 overflow-y-auto ${dropdownClassName}`}>
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              No options available
            </div>
          ) : (
            options.map((option) => (
              <label
                key={option}
                className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors duration-150"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => handleToggle(option)}
                  className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-900 dark:text-gray-100 select-none">
                  {option}
                </span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
