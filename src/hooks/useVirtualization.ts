/**
 * useVirtualization Hook
 * 
 * Custom hook for managing virtualized list rendering with drag-and-drop support.
 * Provides utilities for calculating visible items and handling scroll events.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Number of extra items to render above/below viewport
}

export interface VirtualizationResult {
  visibleStartIndex: number;
  visibleEndIndex: number;
  totalHeight: number;
  offsetY: number;
  scrollToIndex: (index: number) => void;
}

/**
 * Hook for managing virtualized list rendering
 * 
 * @param itemCount - Total number of items in the list
 * @param config - Virtualization configuration
 * @returns Virtualization state and utilities
 */
export const useVirtualization = (
  itemCount: number,
  config: VirtualizationConfig
): VirtualizationResult => {
  const { itemHeight, containerHeight, overscan = 3 } = config;
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLElement | null>(null);

  // Calculate visible range
  const visibleStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleEndIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Calculate total height and offset
  const totalHeight = itemCount * itemHeight;
  const offsetY = visibleStartIndex * itemHeight;

  /**
   * Scroll to a specific index
   */
  const scrollToIndex = useCallback((index: number) => {
    if (scrollElementRef.current) {
      const targetScrollTop = index * itemHeight;
      scrollElementRef.current.scrollTop = targetScrollTop;
      setScrollTop(targetScrollTop);
    }
  }, [itemHeight]);

  /**
   * Handle scroll event
   */
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    setScrollTop(target.scrollTop);
  }, []);

  /**
   * Attach scroll listener
   */
  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  return {
    visibleStartIndex,
    visibleEndIndex,
    totalHeight,
    offsetY,
    scrollToIndex,
  };
};

/**
 * Hook for managing scroll position during drag operations
 * Automatically scrolls when dragging near edges
 */
export const useAutoScroll = (
  containerRef: React.RefObject<HTMLElement>,
  isEnabled: boolean = false
) => {
  const scrollIntervalRef = useRef<number | null>(null);

  const startAutoScroll = useCallback((direction: 'up' | 'down', speed: number = 5) => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }

    scrollIntervalRef.current = window.setInterval(() => {
      if (containerRef.current) {
        const delta = direction === 'up' ? -speed : speed;
        containerRef.current.scrollTop += delta;
      }
    }, 16); // ~60fps
  }, [containerRef]);

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isEnabled || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const threshold = 50; // pixels from edge to trigger scroll
    const y = e.clientY - rect.top;

    if (y < threshold) {
      // Near top edge
      const speed = Math.max(1, (threshold - y) / 10);
      startAutoScroll('up', speed);
    } else if (y > rect.height - threshold) {
      // Near bottom edge
      const speed = Math.max(1, (y - (rect.height - threshold)) / 10);
      startAutoScroll('down', speed);
    } else {
      stopAutoScroll();
    }
  }, [isEnabled, containerRef, startAutoScroll, stopAutoScroll]);

  const handleDragLeave = useCallback(() => {
    stopAutoScroll();
  }, [stopAutoScroll]);

  const handleDrop = useCallback(() => {
    stopAutoScroll();
  }, [stopAutoScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  return {
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};
