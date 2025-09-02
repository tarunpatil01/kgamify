import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { useParams, useNavigate } from "react-router-dom";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaMapMarkerAlt,
  FaBriefcase,
  FaClock,
  FaMoneyBillWave,
  FaBuilding,
  FaGlobe,
  FaBookmark,
  FaShareAlt
} from "react-icons/fa";
import { getJobById, getApplicationsByJobId } from "../api";
import ResumeViewer from "../components/ResumeViewer";

const Job = ({ isDarkMode }) => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch job details
        const jobData = await getJobById(jobId);
        setJob(jobData);
        
        // Fetch applications for this job
        try {
          const applicationsData = await getApplicationsByJobId(jobId);
          setApplications(Array.isArray(applicationsData) ? applicationsData : []);
  } catch {
          setApplications([]);
        }
        
        setLoading(false);
      } catch (e) {
        setError(e?.message || "Failed to fetch job details");
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId, navigate]);

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="animate-pulse space-y-6">
            <div className={`h-8 w-1/3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            <div className={`h-4 w-1/5 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`h-64 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}></div>
              <div className={`h-64 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
          <p className="text-red-700 dark:text-red-200">Authentication Error</p>
          <p className="mt-2">You do not have permission to view this page.</p>
          <button 
            onClick={() => navigate("/login")}
            className={`mt-4 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${isDarkMode ? "bg-red-700 text-white hover:bg-red-600" : "bg-red-500 text-white hover:bg-red-400"}`}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
          <p className="text-red-700 dark:text-red-200">Error: {error}</p>
          <p className="mt-2">Please try again later or contact support.</p>
        </div>
      </div>
    );
  }

  // Function to safely render HTML content
  const renderHTML = (htmlContent) => {
    if (!htmlContent) return null;
    return { __html: htmlContent };
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{job.jobTitle}</h1>
          <div className="mt-2 flex items-center gap-2">
            <FaBuilding className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            <span className="text-[#ff8200] font-semibold">{job.companyName}</span>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job description */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
              <h2 className="text-xl font-semibold mb-3">Job Description</h2>
              <div
                className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}
                dangerouslySetInnerHTML={renderHTML(job.jobDescription)}
              />
            </div>

            {/* Details cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
                <h3 className="font-semibold mb-3">Role Details</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><FaBriefcase className="text-[#ff8200]" /> {job.employmentType || 'N/A'}</li>
                  <li className="flex items-center gap-2"><FaClock className="text-[#ff8200]" /> {job.experienceLevel || 'N/A'}</li>
                  <li className="flex items-center gap-2"><FaGlobe className="text-[#ff8200]" /> {job.remoteOrOnsite || 'N/A'}</li>
                </ul>
                {(Array.isArray(job.jdFiles) && job.jdFiles.length > 0) ? (
                  <div className="mt-3 space-y-1">
                    <div className="text-sm font-medium">JD Attachments</div>
                    <ul className="list-disc list-inside text-sm">
                      {job.jdFiles.map((u, i) => (
                        <li key={i}><a href={u} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Attachment {i + 1}</a></li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  job.jdPdfUrl ? (
                    <div className="mt-3">
                      <a
                        href={job.jdPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-sm text-blue-600 underline"
                      >
                        View JD
                      </a>
                    </div>
                  ) : null
                )}
                {job.skills && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Skills</div>
                    <div className="flex flex-wrap gap-2">
                      {String(job.skills).split(',').map((s, i) => (
                        <span key={i} className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
                <h3 className="font-semibold mb-3">Compensation & Location</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><FaMoneyBillWave className="text-[#ff8200]" /> {job.salary || 'Not specified'}</li>
                  <li className="flex items-center gap-2"><FaMapMarkerAlt className="text-[#ff8200]" /> {job.location || 'Not specified'}</li>
                  {job.equity && <li className="flex items-center gap-2"><FaBookmark className="text-[#ff8200]" /> Equity: {job.equity}</li>}
                  {job.sponsorship && <li className="flex items-center gap-2"><FaBookmark className="text-[#ff8200]" /> Sponsorship: {job.sponsorship}</li>}
                </ul>
              </div>
            </div>

            {/* Rich sections */}
            {job.responsibilities && (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
                <h3 className="font-semibold mb-2">Responsibilities</h3>
                <div dangerouslySetInnerHTML={renderHTML(job.responsibilities)} />
              </div>
            )}
            {job.eligibility && (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
                <h3 className="font-semibold mb-2">Eligibility</h3>
                <div dangerouslySetInnerHTML={renderHTML(job.eligibility)} />
              </div>
            )}
            {job.benefits && (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
                <h3 className="font-semibold mb-2">Benefits</h3>
                <div dangerouslySetInnerHTML={renderHTML(job.benefits)} />
              </div>
            )}

            {job.recruitmentProcess && (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
                <h3 className="font-semibold mb-2">Recruitment Process</h3>
                <div dangerouslySetInnerHTML={renderHTML(job.recruitmentProcess)} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6 sticky top-24`}>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate(`/apply/${job._id || job.id || jobId}`)}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold"
                >
                  Apply Now
                </button>
                <div className="flex gap-2">
                  <SaveButton isDarkMode={isDarkMode} />
                  <ShareButton isDarkMode={isDarkMode} />
                </div>
              </div>
              <div className="mt-5 border-t pt-5 space-y-3 text-sm">
                <div className="flex items-center gap-2"><FaBriefcase className="text-[#ff8200]" /> {job.employmentType || 'N/A'}</div>
                <div className="flex items-center gap-2"><FaClock className="text-[#ff8200]" /> {job.experienceLevel || 'N/A'}</div>
                <div className="flex items-center gap-2"><FaGlobe className="text-[#ff8200]" /> {job.remoteOrOnsite || 'N/A'}</div>
                <div className="flex items-center gap-2"><FaMapMarkerAlt className="text-[#ff8200]" /> {job.location || 'Not specified'}</div>
                <div className="flex items-center gap-2"><FaMoneyBillWave className="text-[#ff8200]" /> {job.salary || 'Not specified'}</div>
                {job.status && (
                  <div className="flex items-center gap-2">
                    {job.status === 'active' ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : (
                      <FaTimesCircle className="text-red-500" />
                    )}
                    <span className="capitalize">{job.status}</span>
                  </div>
                )}
                {job.numberOfPositions && (
                  <div className="flex items-center gap-2"><FaBookmark className="text-yellow-500" /> Positions: {job.numberOfPositions}</div>
                )}
                {job.category && (
                  <div className="flex items-center gap-2"><FaBookmark className="text-yellow-500" /> Category: {job.category}</div>
                )}
                {(Array.isArray(job.jdFiles) && job.jdFiles.length > 0) ? (
                  <div className="mt-2">
                    <a href={job.jdFiles[0]} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">View JD</a>
                  </div>
                ) : (
                  job.jdPdfUrl ? (
                    <div className="mt-2">
                      <a href={job.jdPdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">View JD</a>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Applicants section */}
        <div className="mt-10 pb-10">
          <div className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Applicants</div>
          {applications.length === 0 ? (
            <div className={`p-4 rounded-lg text-center ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'} shadow-sm`}>
              No applicants for this job yet
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((applicant) => (
                <div key={applicant._id} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-sm`}> 
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {applicant.applicantName}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Applied on: {new Date(applicant.createdAt).toLocaleDateString()}
                      </div>
                      {applicant.testScore && (
                        <div className="mt-1">
                          <span className="font-medium">Test Score: </span>
                          <span className={`${parseInt(applicant.testScore) >= 70 ? 'text-green-500' : 'text-red-500'}`}>{applicant.testScore}</span>
                        </div>
                      )}
                      {applicant.skills && applicant.skills.length > 0 && (
                        <div className="mt-2">
                          <span className="font-medium">Skills: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {applicant.skills.map((skill, index) => (
                              <span key={index} className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="md:min-w-[220px]">
                      {applicant.resume ? (
                        <ResumeViewer resumeUrl={applicant.resume} applicantName={applicant.applicantName} />
                      ) : (
                        <div className="text-gray-500">No resume provided</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Job;

Job.propTypes = {
  isDarkMode: PropTypes.bool
};

// Local UI components
function SaveButton({ isDarkMode }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      onClick={() => setSaved(!saved)}
      className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border ${
        isDarkMode
          ? `border-gray-600 ${saved ? 'bg-gray-700 text-yellow-400' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`
          : `border-gray-200 ${saved ? 'bg-yellow-50 text-yellow-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`
      }`}
      aria-pressed={saved}
    >
      <FaBookmark className={saved ? 'text-yellow-500' : ''} />
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}

function ShareButton({ isDarkMode }) {
  const [copied, setCopied] = useState(false);
  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // ignore
    }
  };
  return (
    <button
      onClick={onShare}
      className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border ${
        isDarkMode
          ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700'
          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      <FaShareAlt />
      {copied ? 'Link copied' : 'Share'}
    </button>
  );
}

SaveButton.propTypes = { isDarkMode: PropTypes.bool };
ShareButton.propTypes = { isDarkMode: PropTypes.bool };
