/**
 * useVirtualization Hook Tests
 * 
 * Simple tests for the custom virtualization hook
 */

import { renderHook } from '@testing-library/react';
import { useVirtualization } from './useVirtualization';

describe('useVirtualization Hook', () => {
  const ITEM_HEIGHT = 170;
  const CONTAINER_HEIGHT = 800;
  const OVERSCAN = 3;

  describe('Basic Functionality', () => {
    test('initializes with correct values for empty list', () => {
      const { result } = renderHook(() =>
        useVirtualization(0, {
          itemHeight: ITEM_HEIGHT,
          containerHeight: CONTAINER_HEIGHT,
          overscan: OVERSCAN,
        })
      );

      expect(result.current.visibleStartIndex).toBe(0);
      expect(result.current.visibleEndIndex).toBe(-1);
      expect(result.current.totalHeight).toBe(0);
      expect(result.current.offsetY).toBe(0);
    });

    test('calculates correct total height', () => {
      const itemCount = 100;
      const { result } = renderHook(() =>
        useVirtualization(itemCount, {
          itemHeight: ITEM_HEIGHT,
          containerHeight: CONTAINER_HEIGHT,
          overscan: OVERSCAN,
        })
      );

      expect(result.current.totalHeight).toBe(itemCount * ITEM_HEIGHT);
    });

    test('calculates visible range at scroll position 0', () => {
      const itemCount = 100;
      const { result } = renderHook(() =>
        useVirtualization(itemCount, {
          itemHeight: ITEM_HEIGHT,
          containerHeight: CONTAINER_HEIGHT,
          overscan: OVERSCAN,
        })
      );

      // At scroll 0, should start from index 0 (accounting for overscan)
      expect(result.current.visibleStartIndex).toBe(0);
      
      // Should show enough items to fill viewport + overscan
      const visibleCount = Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT) + OVERSCAN;
      expect(result.current.visibleEndIndex).toBeGreaterThan(0);
      expect(result.current.visibleEndIndex).toBeLessThanOrEqual(visibleCount);
    });

    test('includes overscan in calculations', () => {
      const itemCount = 100;
      const { result } = renderHook(() =>
        useVirtualization(itemCount, {
          itemHeight: ITEM_HEIGHT,
          containerHeight: CONTAINER_HEIGHT,
          overscan: OVERSCAN,
        })
      );

      const visibleInViewport = Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT);
      const endIndex = result.current.visibleEndIndex;
      
      // End index should include overscan
      expect(endIndex).toBeGreaterThanOrEqual(visibleInViewport);
    });
  });

  describe('Performance', () => {
    test('renders constant number of items for large lists', () => {
      const itemCounts = [100, 1000, 10000];
      
      itemCounts.forEach(count => {
        const { result } = renderHook(() =>
          useVirtualization(count, {
            itemHeight: ITEM_HEIGHT,
            containerHeight: CONTAINER_HEIGHT,
            overscan: OVERSCAN,
          })
        );

        const visibleCount = result.current.visibleEndIndex - result.current.visibleStartIndex + 1;
        const maxVisible = Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT) + (OVERSCAN * 2);
        
        // Should always render similar number of items
        expect(visibleCount).toBeLessThanOrEqual(maxVisible + 5); // Small buffer for rounding
      });
    });

    test('does not render all items for large lists', () => {
      const itemCount = 10000;
      const { result } = renderHook(() =>
        useVirtualization(itemCount, {
          itemHeight: ITEM_HEIGHT,
          containerHeight: CONTAINER_HEIGHT,
          overscan: OVERSCAN,
        })
      );

      const visibleCount = result.current.visibleEndIndex - result.current.visibleStartIndex + 1;
      
      // Should only render a small fraction
      expect(visibleCount).toBeLessThan(itemCount * 0.01);
    });
  });

  describe('Edge Cases', () => {
    test('handles single item', () => {
      const { result } = renderHook(() =>
        useVirtualization(1, {
          itemHeight: ITEM_HEIGHT,
          containerHeight: CONTAINER_HEIGHT,
          overscan: OVERSCAN,
        })
      );

      expect(result.current.visibleStartIndex).toBe(0);
      expect(result.current.visibleEndIndex).toBe(0);
      expect(result.current.totalHeight).toBe(ITEM_HEIGHT);
    });

    test('handles zero height container', () => {
      const { result } = renderHook(() =>
        useVirtualization(100, {
          itemHeight: ITEM_HEIGHT,
          containerHeight: 0,
          overscan: OVERSCAN,
        })
      );

      // Should still work
      expect(result.current.visibleStartIndex).toBeGreaterThanOrEqual(0);
      expect(result.current.totalHeight).toBe(100 * ITEM_HEIGHT);
    });

    test('handles very small items', () => {
      const { result } = renderHook(() =>
        useVirtualization(1000, {
          itemHeight: 10,
          containerHeight: CONTAINER_HEIGHT,
          overscan: OVERSCAN,
        })
      );

      // Should show many more items with smaller height
      const visibleCount = result.current.visibleEndIndex - result.current.visibleStartIndex + 1;
      expect(visibleCount).toBeGreaterThan(50);
    });
  });

  describe('Utilities', () => {
    test('provides scrollToIndex function', () => {
      const { result } = renderHook(() =>
        useVirtualization(100, {
          itemHeight: ITEM_HEIGHT,
          containerHeight: CONTAINER_HEIGHT,
          overscan: OVERSCAN,
        })
      );

      expect(result.current.scrollToIndex).toBeDefined();
      expect(typeof result.current.scrollToIndex).toBe('function');
    });

    test('calculates correct offsetY', () => {
      const { result } = renderHook(() =>
        useVirtualization(100, {
          itemHeight: ITEM_HEIGHT,
          containerHeight: CONTAINER_HEIGHT,
          overscan: OVERSCAN,
        })
      );

      // At scroll 0, offset should be 0 (or close to it, accounting for overscan)
      expect(result.current.offsetY).toBeGreaterThanOrEqual(0);
      expect(result.current.offsetY).toBeLessThan(ITEM_HEIGHT * OVERSCAN);
    });
  });
});
