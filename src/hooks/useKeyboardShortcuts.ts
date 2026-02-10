/**
 * useKeyboardShortcuts Hook
 * 
 * Manages keyboard shortcuts for the application.
 * Provides a clean API for registering and handling keyboard events.
 */

import { useEffect, useCallback } from 'react';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (e: KeyboardEvent) => void;
  description?: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  ignoreInputs?: boolean;
}

/**
 * Check if the event target is an input element
 */
const isInputElement = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof HTMLElement)) return false;
  
  const tagName = target.tagName.toLowerCase();
  const isContentEditable = target.contentEditable === 'true';
  
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    isContentEditable
  );
};

/**
 * Check if keyboard event matches the shortcut configuration
 */
const matchesShortcut = (
  event: KeyboardEvent,
  config: ShortcutConfig
): boolean => {
  const key = event.key.toLowerCase();
  const configKey = config.key.toLowerCase();
  
  // Check key match
  if (key !== configKey) return false;
  
  // Check modifiers
  if (config.ctrl && !event.ctrlKey) return false;
  if (config.shift && !event.shiftKey) return false;
  if (config.alt && !event.altKey) return false;
  if (config.meta && !event.metaKey) return false;
  
  // Check that no extra modifiers are pressed (unless specified)
  if (!config.ctrl && event.ctrlKey) return false;
  if (!config.shift && event.shiftKey) return false;
  if (!config.alt && event.altKey) return false;
  if (!config.meta && event.metaKey) return false;
  
  return true;
};

/**
 * Hook to register keyboard shortcuts
 * 
 * @param shortcuts - Array of shortcut configurations
 * @param options - Hook options
 * 
 * @example
 * useKeyboardShortcuts([
 *   { key: 'n', handler: () => openNewTask(), description: 'New Task' },
 *   { key: 'Escape', handler: () => closeModal(), description: 'Close Modal' }
 * ]);
 */
export const useKeyboardShortcuts = (
  shortcuts: ShortcutConfig[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enabled = true, ignoreInputs = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if disabled
      if (!enabled) return;

      // Skip if focus is in an input element (unless explicitly allowed)
      if (ignoreInputs && isInputElement(event.target)) return;

      // Find matching shortcut
      const matchingShortcut = shortcuts.find((shortcut) =>
        matchesShortcut(event, shortcut)
      );

      if (matchingShortcut) {
        // Prevent default if specified (default: true)
        if (matchingShortcut.preventDefault !== false) {
          event.preventDefault();
        }
        
        // Call handler
        matchingShortcut.handler(event);
      }
    },
    [shortcuts, enabled, ignoreInputs]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
};

/**
 * Format shortcut for display
 * 
 * @example
 * formatShortcut({ key: 'n', ctrl: true }) // "Ctrl+N"
 * formatShortcut({ key: 'Escape' }) // "Esc"
 */
export const formatShortcut = (config: ShortcutConfig): string => {
  const parts: string[] = [];
  
  // Add modifiers (Mac style)
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  if (config.ctrl) parts.push(isMac ? '⌃' : 'Ctrl');
  if (config.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (config.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (config.meta) parts.push(isMac ? '⌘' : 'Win');
  
  // Add key (with special formatting)
  const keyMap: Record<string, string> = {
    'escape': 'Esc',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
    'delete': 'Del',
    'backspace': '⌫',
    'enter': '↵',
    ' ': 'Space',
  };
  
  const key = config.key.toLowerCase();
  const displayKey = keyMap[key] || config.key.toUpperCase();
  parts.push(displayKey);
  
  return parts.join(isMac ? '' : '+');
};
