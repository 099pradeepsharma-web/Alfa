import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for managing abortable async tasks with loading states
 * Prevents memory leaks and provides better UX with automatic cleanup
 */
export const useAbortableTask = <T>() => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const execute = useCallback(async (
        taskFn: (signal: AbortSignal) => Promise<T>,
        onSuccess?: (data: T) => void,
        onError?: (error: Error) => void
    ) => {
        // Cancel any existing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            setLoading(true);
            setError(null);
            
            const result = await taskFn(signal);
            
            // Only update state if component is still mounted and request wasn't aborted
            if (mountedRef.current && !signal.aborted) {
                setData(result);
                onSuccess?.(result);
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Task was aborted');
                return; // Don't treat abort as an error
            }
            
            if (mountedRef.current) {
                const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
                setError(errorMessage);
                onError?.(err instanceof Error ? err : new Error(errorMessage));
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, []);

    const abort = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
        abort();
    }, [abort]);

    return {
        data,
        loading,
        error,
        execute,
        abort,
        reset,
        isAborted: abortControllerRef.current?.signal.aborted || false
    };
};

/**
 * Hook for managing multiple concurrent abortable tasks
 */
export const useAbortableTaskManager = () => {
    const tasksRef = useRef<Map<string, AbortController>>(new Map());

    const startTask = useCallback((taskId: string): AbortSignal => {
        // Abort existing task with same ID
        const existingController = tasksRef.current.get(taskId);
        if (existingController) {
            existingController.abort();
        }

        // Create new controller
        const controller = new AbortController();
        tasksRef.current.set(taskId, controller);

        return controller.signal;
    }, []);

    const abortTask = useCallback((taskId: string) => {
        const controller = tasksRef.current.get(taskId);
        if (controller) {
            controller.abort();
            tasksRef.current.delete(taskId);
        }
    }, []);

    const abortAllTasks = useCallback(() => {
        tasksRef.current.forEach(controller => controller.abort());
        tasksRef.current.clear();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            abortAllTasks();
        };
    }, [abortAllTasks]);

    return {
        startTask,
        abortTask,
        abortAllTasks
    };
};

/**
 * Hook for debouncing expensive operations
 */
export const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Hook for progressive data loading with retry logic
 */
export const useProgressiveLoading = <T>({
    loadFn,
    dependencies = [],
    retryCount = 3,
    retryDelay = 1000
}: {
    loadFn: (signal: AbortSignal) => Promise<T>;
    dependencies?: any[];
    retryCount?: number;
    retryDelay?: number;
}) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);

    const load = useCallback(async (retryAttempt = 0) => {
        if (!mountedRef.current) return;

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            setLoading(true);
            setError(null);
            setAttempt(retryAttempt);

            const result = await loadFn(signal);
            
            if (mountedRef.current && !signal.aborted) {
                setData(result);
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                return; // Ignore aborted requests
            }

            if (mountedRef.current) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
                
                if (retryAttempt < retryCount) {
                    console.log(`Retrying in ${retryDelay}ms... (attempt ${retryAttempt + 1}/${retryCount})`);
                    setTimeout(() => {
                        load(retryAttempt + 1);
                    }, retryDelay * (retryAttempt + 1)); // Exponential backoff
                } else {
                    setError(errorMessage);
                }
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [loadFn, retryCount, retryDelay]);

    const retry = useCallback(() => {
        load(0);
    }, [load]);

    useEffect(() => {
        load(0);
        
        return () => {
            mountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, dependencies);

    return { 
        data, 
        loading, 
        error, 
        retry, 
        attempt,
        canRetry: attempt < retryCount
    };
};

/**
 * Hook for optimistic updates with rollback capability
 */
export const useOptimisticUpdate = <T>(initialValue: T) => {
    const [optimisticValue, setOptimisticValue] = useState<T>(initialValue);
    const [actualValue, setActualValue] = useState<T>(initialValue);
    const [isPending, setIsPending] = useState(false);

    const updateOptimistically = useCallback(async (
        newValue: T,
        persistFn: (value: T) => Promise<void>
    ) => {
        const previousValue = actualValue;
        
        try {
            // Apply optimistic update immediately
            setOptimisticValue(newValue);
            setIsPending(true);
            
            // Persist the change
            await persistFn(newValue);
            
            // Update actual value on success
            setActualValue(newValue);
        } catch (error) {
            // Rollback on failure
            setOptimisticValue(previousValue);
            console.error('Optimistic update failed, rolling back:', error);
            throw error;
        } finally {
            setIsPending(false);
        }
    }, [actualValue]);

    return {
        value: optimisticValue,
        actualValue,
        isPending,
        updateOptimistically
    };
};

export default useAbortableTask;