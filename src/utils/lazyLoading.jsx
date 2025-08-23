import React, { Suspense } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Higher-order component for lazy loading with error boundary
 */
export const withLazyLoading = (importFunc, fallback = null) => {
  const LazyComponent = React.lazy(importFunc);
  
  return function WrappedComponent(props) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
};

/**
 * Pre-configured loading states for different page types
 */
export const PageLoadingFallback = ({ type = 'default' }) => {
  const loadingStates = {
    default: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    ),
    dashboard: (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200 dark:bg-gray-800 mb-4"></div>
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    form: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md animate-pulse">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  };

  return loadingStates[type] || loadingStates.default;
};

// Pre-configured lazy loading for common page types
export const createLazyPage = (importFunc, fallbackType = 'default') => {
  return withLazyLoading(importFunc, <PageLoadingFallback type={fallbackType} />);
};
