import { useState } from 'react';

/**
 * Hook for managing virtual scroll state
 */
export const useVirtualScroll = ({
  items,
  itemHeight = 50,
  containerHeight = 400,
  overscan = 5,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  const visibleItems = items.slice(startIndex, endIndex).map((item, index) => ({
    item,
    index: startIndex + index,
  }));

  return {
    scrollTop,
    setScrollTop,
    totalHeight,
    startIndex,
    endIndex,
    visibleItems,
    offsetY: startIndex * itemHeight,
  };
};
