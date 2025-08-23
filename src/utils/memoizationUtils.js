import { memo } from 'react';

/**
 * Higher-Order Component for memoizing expensive components
 * with custom comparison functions
 */
export const withMemoization = (Component, customCompare = null) => {
  const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
    if (customCompare) {
      return customCompare(prevProps, nextProps);
    }

    // Default shallow comparison with special handling for common props
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    if (prevKeys.length !== nextKeys.length) {
      return false;
    }

    for (const key of prevKeys) {
      if (key === 'children' && typeof prevProps[key] === 'function') {
        // Skip function children comparison as they often change reference
        continue;
      }
      
      if (key === 'style' && typeof prevProps[key] === 'object') {
        // Deep compare style objects
        const areEqual = JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key]);
        if (!areEqual) return false;
      } else if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }

    return true;
  });

  MemoizedComponent.displayName = `Memoized(${Component.displayName || Component.name || 'Component'})`;
  return MemoizedComponent;
};

// Helper functions for search
export function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
}

export function calculateRelevance(item, searchTerm) {
  const term = searchTerm.toLowerCase();
  let score = 0;
  
  // Title matches get highest score
  if (item.title.toLowerCase().includes(term)) {
    score += 10;
  }
  
  // Company matches get medium score
  if (item.company.toLowerCase().includes(term)) {
    score += 5;
  }
  
  // Description matches get lower score
  if (item.description.toLowerCase().includes(term)) {
    score += 2;
  }
  
  // Skills matches get medium score
  if (item.skills?.some(skill => skill.toLowerCase().includes(term))) {
    score += 7;
  }
  
  return score;
}
