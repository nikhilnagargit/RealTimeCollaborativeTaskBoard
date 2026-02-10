import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from './useDebounce';

/**
 * Test Suite for useDebounce Hook
 * 
 * Tests the functionality of the useDebounce custom hook including:
 * - Debouncing behavior
 * - Delay timing
 * - Value updates
 */

describe('useDebounce Hook', () => {
  // Use fake timers for testing
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  test('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    // Update the value
    rerender({ value: 'updated', delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time by 500ms
    jest.advanceTimersByTime(500);

    // Now the value should be updated
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  test('should cancel previous timeout on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      {
        initialProps: { value: 'first' },
      }
    );

    // Rapid changes
    rerender({ value: 'second' });
    jest.advanceTimersByTime(200);
    
    rerender({ value: 'third' });
    jest.advanceTimersByTime(200);
    
    rerender({ value: 'fourth' });
    
    // Fast-forward past the delay
    jest.advanceTimersByTime(500);

    // Should only have the last value
    await waitFor(() => {
      expect(result.current).toBe('fourth');
    });
  });

  test('should work with custom delay', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 1000 },
      }
    );

    rerender({ value: 'updated', delay: 1000 });

    // Should not update after 500ms
    jest.advanceTimersByTime(500);
    expect(result.current).toBe('initial');

    // Should update after 1000ms
    jest.advanceTimersByTime(500);
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });
});
