import React, { useState } from 'react';
import { FaFilePdf, FaDownload, FaExternalLinkAlt } from 'react-icons/fa';

const ResumeViewer = ({ resumeUrl, applicantName }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  if (!resumeUrl) {
    return (
      <div className="flex items-center justify-center p-4 border border-gray-300 rounded-lg bg-gray-50">
        <p className="text-gray-500">No resume available</p>
      </div>
    );
  }

  const handleViewResume = () => {
    setIsLoading(true);
    window.open(resumeUrl, '_blank', 'noopener,noreferrer');
    setIsLoading(false);
  };

  // Determine file type (PDF or other)
  const isPDF = resumeUrl.toLowerCase().includes('.pdf') || resumeUrl.toLowerCase().includes('pdf');
  
  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
          <FaFilePdf className="w-6 h-6 text-red-500" />
        </div>
        
        <div className="flex-grow text-center sm:text-left">
          <h3 className="font-medium">{applicantName}'s Resume</h3>
          <p className="text-sm text-gray-500 truncate max-w-xs">
            {resumeUrl.split('/').pop()}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleViewResume}
            disabled={isLoading}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            <FaExternalLinkAlt className="mr-2" /> View
          </button>
          
          <a
            href={resumeUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors text-sm"
          >
            <FaDownload className="mr-2" /> Download
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResumeViewer;
