/**
 * useOptimisticUpdate Hook
 * 
 * Handles optimistic updates with automatic rollback on failure.
 * Provides loading states and error handling.
 */

import { useState, useCallback, useRef } from 'react';

interface OptimisticUpdateOptions<T> {
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
  onRollback?: () => void;
}

interface OptimisticUpdateState {
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for optimistic updates with rollback
 * 
 * @example
 * const { execute, isLoading } = useOptimisticUpdate({
 *   onSuccess: () => showSuccess('Updated!'),
 *   onError: () => showError('Failed!'),
 *   onRollback: () => revertChanges()
 * });
 * 
 * // Optimistic update
 * updateUIImmediately();
 * execute(apiCall());
 */
export const useOptimisticUpdate = <T = any>(
  options: OptimisticUpdateOptions<T> = {}
) => {
  const [state, setState] = useState<OptimisticUpdateState>({
    isLoading: false,
    error: null,
  });

  // Track pending requests to handle race conditions
  const pendingRequestRef = useRef<Promise<T> | null>(null);
  const requestIdRef = useRef<number>(0);

  /**
   * Execute optimistic update
   */
  const execute = useCallback(
    async (promise: Promise<T>): Promise<T | null> => {
      // Generate unique request ID
      const currentRequestId = ++requestIdRef.current;
      
      // Store pending request
      pendingRequestRef.current = promise;
      
      // Set loading state
      setState({ isLoading: true, error: null });

      try {
        const result = await promise;

        // Check if this is still the latest request (race condition handling)
        if (currentRequestId !== requestIdRef.current) {
          console.warn('[OptimisticUpdate] Stale request, ignoring result');
          return null;
        }

        // Success
        setState({ isLoading: false, error: null });
        pendingRequestRef.current = null;
        
        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (error) {
        // Check if this is still the latest request
        if (currentRequestId !== requestIdRef.current) {
          console.warn('[OptimisticUpdate] Stale request, ignoring error');
          return null;
        }

        const err = error instanceof Error ? error : new Error(String(error));
        
        // Error - trigger rollback
        setState({ isLoading: false, error: err });
        pendingRequestRef.current = null;

        if (options.onRollback) {
          options.onRollback();
        }

        if (options.onError) {
          options.onError(err);
        }

        return null;
      }
    },
    [options]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({ isLoading: false, error: null });
    pendingRequestRef.current = null;
  }, []);

  /**
   * Check if there's a pending request
   */
  const isPending = useCallback(() => {
    return pendingRequestRef.current !== null;
  }, []);

  return {
    execute,
    reset,
    isPending,
    isLoading: state.isLoading,
    error: state.error,
  };
};

/**
 * Hook for managing multiple optimistic updates
 * Useful for tracking loading state of individual items
 */
export const useOptimisticUpdates = () => {
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, Error>>(new Map());

  const startLoading = useCallback((id: string) => {
    setLoadingItems((prev) => new Set(prev).add(id));
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const stopLoading = useCallback((id: string) => {
    setLoadingItems((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const setError = useCallback((id: string, error: Error) => {
    setErrors((prev) => new Map(prev).set(id, error));
    stopLoading(id);
  }, [stopLoading]);

  const clearError = useCallback((id: string) => {
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isLoading = useCallback((id: string) => {
    return loadingItems.has(id);
  }, [loadingItems]);

  const getError = useCallback((id: string) => {
    return errors.get(id) || null;
  }, [errors]);

  return {
    startLoading,
    stopLoading,
    setError,
    clearError,
    isLoading,
    getError,
    loadingItems,
    errors,
  };
};
