import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';

const JobCard = memo(({ job, isDarkMode, onEdit, onDelete, showActions = false }) => {
  // Memoize the formatted date
  const formattedDate = useMemo(() => {
    return new Date(job.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [job.createdAt]);

  // Memoize the salary display
  const salaryDisplay = useMemo(() => {
    if (!job.salary) return 'Not specified';
    return `$${job.salary.toLocaleString()}`;
  }, [job.salary]);

  // Memoize the experience level display
  const experienceDisplay = useMemo(() => {
    const levels = {
      'entry': 'Entry Level',
      'mid': 'Mid Level',
      'senior': 'Senior Level',
      'executive': 'Executive'
    };
    return levels[job.experience] || job.experience;
  }, [job.experience]);

  // Memoize the job type display
  const typeDisplay = useMemo(() => {
    const types = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      'contract': 'Contract',
      'internship': 'Internship'
    };
    return types[job.type] || job.type;
  }, [job.type]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 ${
      isDarkMode ? 'border border-gray-700' : 'border border-gray-200'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            <Link 
              to={`/job/${job._id}`}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {job.title}
            </Link>
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
            {job.companyName}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            📍 {job.location}
          </p>
        </div>
        
        {showActions && (
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => onEdit(job._id)}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              aria-label="Edit job"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(job._id)}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              aria-label="Delete job"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
        {job.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          job.type === 'full-time' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : job.type === 'part-time'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            : job.type === 'contract'
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
            : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
        }`}>
          {typeDisplay}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          {experienceDisplay}
        </span>
        {job.salary && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            {salaryDisplay}
          </span>
        )}
      </div>

      {job.skills && job.skills.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Required Skills:</p>
          <div className="flex flex-wrap gap-1">
            {job.skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded">
                +{job.skills.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <span>Posted: {formattedDate}</span>
        <Link
          to={`/job/${job._id}`}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
});

JobCard.displayName = 'JobCard';

export default JobCard; 