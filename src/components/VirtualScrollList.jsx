import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Virtual scrolling component for efficiently rendering large lists
 * Only renders items that are currently visible in the viewport
 */
const VirtualScrollList = ({
  items,
  itemHeight,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  estimatedItemHeight,
  getItemHeight,
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  // Calculate dynamic item heights if provided
  const itemHeights = useMemo(() => {
    if (getItemHeight) {
      return items.map((item, index) => getItemHeight(item, index));
    }
    return items.map(() => itemHeight || estimatedItemHeight || 50);
  }, [items, itemHeight, estimatedItemHeight, getItemHeight]);

  // Calculate total height and item positions
  const { totalHeight, itemPositions } = useMemo(() => {
    let runningHeight = 0;
    const positions = itemHeights.map((height) => {
      const position = runningHeight;
      runningHeight += height;
      return position;
    });
    
    return {
      totalHeight: runningHeight,
      itemPositions: positions,
    };
  }, [itemHeights]);

  // Find the range of visible items
  const visibleRange = useMemo(() => {
    if (items.length === 0) {
      return { start: 0, end: 0 };
    }

    // Binary search for start index
    let start = 0;
    let end = items.length - 1;
    
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const itemTop = itemPositions[mid];
      const itemBottom = itemTop + itemHeights[mid];
      
      if (itemBottom < scrollTop) {
        start = mid + 1;
      } else if (itemTop > scrollTop + containerHeight) {
        end = mid - 1;
      } else {
        // Found an item that intersects with viewport
        // Find the actual start
        while (start > 0 && itemPositions[start - 1] + itemHeights[start - 1] >= scrollTop) {
          start--;
        }
        break;
      }
    }

    // Find end index
    let visibleEnd = start;
    while (
      visibleEnd < items.length &&
      itemPositions[visibleEnd] < scrollTop + containerHeight
    ) {
      visibleEnd++;
    }

    // Add overscan
    const overscanStart = Math.max(0, start - overscan);
    const overscanEnd = Math.min(items.length, visibleEnd + overscan);

    return {
      start: overscanStart,
      end: overscanEnd,
    };
  }, [scrollTop, containerHeight, items.length, itemPositions, itemHeights, overscan]);

  // Generate visible items
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      if (items[i]) {
        result.push({
          index: i,
          item: items[i],
          top: itemPositions[i],
          height: itemHeights[i],
        });
      }
    }
    return result;
  }, [visibleRange, items, itemPositions, itemHeights]);

  // Handle scroll events
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    
    // Track scrolling state for performance optimizations
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    onScroll?.(e);
  }, [onScroll]);

  // Scroll to specific item
  const scrollToItem = useCallback((index, align = 'auto') => {
    if (!scrollElementRef.current || index < 0 || index >= items.length) {
      return;
    }

    const itemTop = itemPositions[index];
    const itemHeight = itemHeights[index];
    let scrollTo = itemTop;

    if (align === 'center') {
      scrollTo = itemTop - (containerHeight - itemHeight) / 2;
    } else if (align === 'end') {
      scrollTo = itemTop - containerHeight + itemHeight;
    } else if (align === 'auto') {
      const currentScrollTop = scrollElementRef.current.scrollTop;
      const itemBottom = itemTop + itemHeight;
      
      if (itemTop < currentScrollTop) {
        // Item is above viewport
        scrollTo = itemTop;
      } else if (itemBottom > currentScrollTop + containerHeight) {
        // Item is below viewport
        scrollTo = itemBottom - containerHeight;
      } else {
        // Item is already visible
        return;
      }
    }

    scrollElementRef.current.scrollTo({
      top: Math.max(0, Math.min(scrollTo, totalHeight - containerHeight)),
      behavior: 'smooth',
    });
  }, [itemPositions, itemHeights, containerHeight, totalHeight, items.length]);

  // Expose scroll methods
  useEffect(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollToItem = scrollToItem;
    }
  }, [scrollToItem]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={scrollElementRef}
      className={`virtual-scroll-container ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
      {...props}
    >
      {/* Total height container to maintain scrollbar */}
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {/* Rendered items */}
        {visibleItems.map(({ index, item, top, height }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top,
              height,
              width: '100%',
            }}
            data-index={index}
          >
            {renderItem(item, index, {
              isScrolling,
              isVisible: true,
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

VirtualScrollList.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  itemHeight: PropTypes.number,
  containerHeight: PropTypes.number,
  overscan: PropTypes.number,
  className: PropTypes.string,
  onScroll: PropTypes.func,
  estimatedItemHeight: PropTypes.number,
  getItemHeight: PropTypes.func,
};

export default VirtualScrollList;
