import { useState, useRef, useEffect } from 'react';

/**
 * Performance monitoring hook for expensive operations
 */
export const usePerformanceMonitor = (name, dependencies) => {
  const renderStartTime = useRef(null);
  const renderCount = useRef(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;
  });

  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      
      if (renderTime > 16) { // More than one frame (16ms)
        // Performance warning for development
        if (import.meta.env.MODE === 'development') {
          // eslint-disable-next-line no-console
          console.warn(
            `${name} render took ${renderTime.toFixed(2)}ms (render #${renderCount.current})`
          );
        }
      }
    }
  }, [name, ...(dependencies || [])]);

  return {
    renderCount: renderCount.current,
  };
};

/**
 * Hook for debouncing expensive operations
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

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
 * Hook for throttling expensive operations
 */
export const useThrottle = (value, limit) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};
