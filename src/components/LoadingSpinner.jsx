// React import not required with automatic JSX runtime

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  text = 'Loading...', 
  fullScreen = false,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
    white: 'text-white',
    kgamify: 'text-kgamify-500',
    'kgamify-pink': 'text-kgamify-pink-500'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-current ${sizeClasses[size]} ${colorClasses[color]}`} />
      {text && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Skeleton loading component
export const Skeleton = ({ 
  className = '', 
  lines = 1, 
  height = 'h-4' 
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-300 dark:bg-gray-600 rounded ${height} mb-2 ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};

// Card skeleton for job listings
export const CardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
    <div className="flex items-center space-x-4 mb-4">
      <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full" />
      <div className="flex-1">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full" />
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6" />
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6" />
    </div>
    <div className="flex space-x-2 mt-4">
      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16" />
      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20" />
    </div>
  </div>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="animate-pulse">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <div
              key={index}
              className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1"
            />
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className={`h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1 ${
                  colIndex === columns - 1 ? 'w-1/4' : ''
                }`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default LoadingSpinner; 