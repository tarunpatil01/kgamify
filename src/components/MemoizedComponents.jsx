import { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Higher-Order Component for memoizing expensive components
 * with custom comparison functions and performance monitoring
 */
export const withMemoization = (Component, customCompare = null, options = {}) => {
  const {
    displayName = Component.displayName || Component.name || 'Component',
    debug = false,
  } = options;

  const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
    if (debug) {
      console.time(`${displayName} comparison`);
    }

    let areEqual = true;

    if (customCompare) {
      areEqual = customCompare(prevProps, nextProps);
    } else {
      // Default shallow comparison with special handling for common props
      const prevKeys = Object.keys(prevProps);
      const nextKeys = Object.keys(nextProps);

      if (prevKeys.length !== nextKeys.length) {
        areEqual = false;
      } else {
        for (const key of prevKeys) {
          if (key === 'children' && typeof prevProps[key] === 'function') {
            // Skip function children comparison as they often change reference
            continue;
          }
          
          if (key === 'style' && typeof prevProps[key] === 'object') {
            // Deep compare style objects
            areEqual = JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key]);
            if (!areEqual) break;
          } else if (prevProps[key] !== nextProps[key]) {
            areEqual = false;
            break;
          }
        }
      }
    }

    if (debug) {
      console.timeEnd(`${displayName} comparison`);
      // Debug logging removed for production
    }

    return areEqual;
  });

  MemoizedComponent.displayName = `Memoized(${displayName})`;
  return MemoizedComponent;
};

/**
 * Memoized JobCard component optimized for large lists
 */
export const MemoizedJobCard = memo(({ job, onApply, onSave, isApplied = false, isSaved = false }) => {
  const handleApply = useCallback(() => {
    onApply(job.id);
  }, [onApply, job.id]);

  const handleSave = useCallback(() => {
    onSave(job.id);
  }, [onSave, job.id]);

  // Memoize expensive calculations
  const formattedSalary = useMemo(() => {
    if (!job.salary) return 'Salary not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(job.salary);
  }, [job.salary]);

  const timeAgo = useMemo(() => {
    const now = new Date();
    const postDate = new Date(job.createdAt);
    const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  }, [job.createdAt]);

  const skillTags = useMemo(() => {
    if (!job.skills) return [];
    return job.skills.slice(0, 5); // Limit to 5 skills for performance
  }, [job.skills]);

  return (
    <div className="job-card bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
          <p className="text-gray-600">{job.company}</p>
        </div>
        <span className="text-sm text-gray-500">{timeAgo}</span>
      </div>

      <div className="mb-4">
        <p className="text-gray-700 line-clamp-3">{job.description}</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-bold text-green-600">{formattedSalary}</span>
        <span className="text-sm text-gray-500">{job.location}</span>
      </div>

      {skillTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {skillTags.map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleApply}
          disabled={isApplied}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            isApplied
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isApplied ? 'Applied' : 'Apply Now'}
        </button>
        
        <button
          onClick={handleSave}
          className={`p-2 rounded-md border transition-colors ${
            isSaved
              ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
              : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isSaved ? '★' : '☆'}
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for JobCard - only re-render if meaningful data changes
  return (
    prevProps.job.id === nextProps.job.id &&
    prevProps.job.title === nextProps.job.title &&
    prevProps.job.company === nextProps.job.company &&
    prevProps.job.salary === nextProps.job.salary &&
    prevProps.job.location === nextProps.job.location &&
    prevProps.isApplied === nextProps.isApplied &&
    prevProps.isSaved === nextProps.isSaved
  );
});

MemoizedJobCard.displayName = 'MemoizedJobCard';

MemoizedJobCard.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired,
    description: PropTypes.string,
    salary: PropTypes.number,
    location: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
  onApply: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  isApplied: PropTypes.bool,
  isSaved: PropTypes.bool,
};

/**
 * Performance monitoring hook for expensive operations
 */
export const usePerformanceMonitor = (name, dependencies = []) => {
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
        console.warn(
          `${name} render took ${renderTime.toFixed(2)}ms (render #${renderCount.current})`
        );
      }
    }
  }, dependencies);

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

/**
 * Memoized search results component
 */
export const MemoizedSearchResults = memo(({ 
  results, 
  searchTerm, 
  filters, 
  onResultClick,
  loading = false 
}) => {
  // Memoize filtered and sorted results
  const processedResults = useMemo(() => {
    if (!results || results.length === 0) return [];

    let filtered = results;

    // Apply filters
    if (filters.location) {
      filtered = filtered.filter(item => 
        item.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.salaryMin) {
      filtered = filtered.filter(item => item.salary >= filters.salaryMin);
    }

    if (filters.jobType) {
      filtered = filtered.filter(item => item.type === filters.jobType);
    }

    // Apply search term highlighting
    if (searchTerm) {
      filtered = filtered.map(item => ({
        ...item,
        highlightedTitle: highlightSearchTerm(item.title, searchTerm),
        highlightedDescription: highlightSearchTerm(item.description, searchTerm),
      }));
    }

    // Sort by relevance/date
    filtered.sort((a, b) => {
      if (searchTerm) {
        // Sort by search relevance
        const aRelevance = calculateRelevance(a, searchTerm);
        const bRelevance = calculateRelevance(b, searchTerm);
        if (aRelevance !== bRelevance) {
          return bRelevance - aRelevance;
        }
      }
      // Fall back to date sorting
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return filtered;
  }, [results, searchTerm, filters]);

  const handleResultClick = useCallback((result) => {
    onResultClick(result);
  }, [onResultClick]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (processedResults.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No results found for your search.
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="mb-4 text-sm text-gray-600">
        {processedResults.length} results found
      </div>
      <div className="space-y-4">
        {processedResults.map((result) => (
          <div
            key={result.id}
            className="result-item border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => handleResultClick(result)}
          >
            <h3 
              className="font-semibold text-lg mb-2"
              dangerouslySetInnerHTML={{ 
                __html: result.highlightedTitle || result.title 
              }}
            />
            <p 
              className="text-gray-600 mb-2"
              dangerouslySetInnerHTML={{ 
                __html: result.highlightedDescription || result.description 
              }}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{result.company}</span>
              <span>{result.location}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for search results
  return (
    prevProps.searchTerm === nextProps.searchTerm &&
    prevProps.loading === nextProps.loading &&
    JSON.stringify(prevProps.filters) === JSON.stringify(nextProps.filters) &&
    prevProps.results?.length === nextProps.results?.length &&
    prevProps.results?.every((item, index) => 
      item.id === nextProps.results[index]?.id &&
      item.updatedAt === nextProps.results[index]?.updatedAt
    )
  );
});

MemoizedSearchResults.displayName = 'MemoizedSearchResults';

MemoizedSearchResults.propTypes = {
  results: PropTypes.array.isRequired,
  searchTerm: PropTypes.string,
  filters: PropTypes.object.isRequired,
  onResultClick: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

// Helper functions
function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
}

function calculateRelevance(item, searchTerm) {
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
