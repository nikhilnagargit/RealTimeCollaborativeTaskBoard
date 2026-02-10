import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Test Suite for useLocalStorage Hook
 * 
 * Tests the functionality of the useLocalStorage custom hook including:
 * - Initial value handling
 * - Setting and retrieving values
 * - Error handling
 */

describe('useLocalStorage Hook', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
  });

  test('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() =>
      useLocalStorage<string>('testKey', 'initialValue')
    );

    const [value] = result.current;
    expect(value).toBe('initialValue');
  });

  test('should update localStorage when value is set', () => {
    const { result } = renderHook(() =>
      useLocalStorage<string>('testKey', 'initialValue')
    );

    act(() => {
      const [, setValue] = result.current;
      setValue('newValue');
    });

    const [value] = result.current;
    expect(value).toBe('newValue');
    expect(localStorage.getItem('testKey')).toBe(JSON.stringify('newValue'));
  });

  test('should retrieve existing value from localStorage', () => {
    localStorage.setItem('testKey', JSON.stringify('existingValue'));

    const { result } = renderHook(() =>
      useLocalStorage<string>('testKey', 'initialValue')
    );

    const [value] = result.current;
    expect(value).toBe('existingValue');
  });

  test('should handle complex objects', () => {
    const complexObject = {
      name: 'Test',
      count: 42,
      nested: { value: true },
    };

    const { result } = renderHook(() =>
      useLocalStorage('testKey', complexObject)
    );

    act(() => {
      const [, setValue] = result.current;
      setValue({ ...complexObject, count: 100 });
    });

    const [value] = result.current;
    expect(value.count).toBe(100);
    expect(value.nested.value).toBe(true);
  });

  test('should handle function updates', () => {
    const { result } = renderHook(() =>
      useLocalStorage<number>('testKey', 0)
    );

    act(() => {
      const [, setValue] = result.current;
      setValue((prev) => prev + 1);
    });

    const [value] = result.current;
    expect(value).toBe(1);
  });
});
