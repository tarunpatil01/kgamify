import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronDown, FaChevronUp, FaUsers, FaBriefcase, FaMapMarkerAlt, FaClock, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';
import { adminListCompanyJobs, adminToggleJobStatus, adminDeleteJob } from '../api';
import { formatDateDDMMYYYY } from '../utils/date';

export default function AdminJobs({ isDarkMode, $isDarkMode }) {
  const dark = $isDarkMode ?? isDarkMode ?? false;
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [busy, setBusy] = useState({});
  const [expandedJobs, setExpandedJobs] = useState({});
  const [expandedApplicants, setExpandedApplicants] = useState({});

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await adminListCompanyJobs(companyId);
      setCompany(data.company);
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const toggleJobDetails = (jobId) => {
    setExpandedJobs(prev => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const toggleApplicants = (jobId) => {
    setExpandedApplicants(prev => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  async function onToggle(job) {
    setBusy(b => ({ ...b, [job._id]: true }));
    try {
      const next = !job.jobActive;
      await adminToggleJobStatus(job._id, next);
      setJobs(list => list.map(j => j._id === job._id ? { ...j, jobActive: next } : j));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update status');
    } finally {
      setBusy(b => ({ ...b, [job._id]: false }));
    }
  }

  async function onDelete(job) {
    if (!window.confirm('Delete this job permanently?')) return;
    setBusy(b => ({ ...b, [job._id]: true }));
    try {
      await adminDeleteJob(job._id);
      setJobs(list => list.filter(j => j._id !== job._id));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete job');
    } finally {
      setBusy(b => ({ ...b, [job._id]: false }));
    }
  }

  const totalApplicants = jobs.reduce((sum, job) => sum + (job.applicants?.length || 0), 0);

  return (
    <div className={`min-h-[60vh] px-4 py-6 ${dark ? 'text-white' : 'text-gray-900'}`}> 
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><FaBriefcase className="text-[#ff8200]" /> Company Jobs</h1>
            {company && (
              <div className="mt-2 space-y-1">
                <div className="text-lg font-semibold">{company.name}</div>
                <div className="text-sm opacity-80">{company.email}</div>
                {company.phone && <div className="text-sm opacity-70">Phone: {company.phone}</div>}
                {company.address && <div className="text-sm opacity-70">Address: {company.address}</div>}
                {company.subscriptionPlan && (
                  <div className="text-sm">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${company.subscriptionPlan === 'free' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'}`}>
                      {company.subscriptionPlan.toUpperCase()}
                    </span>
                    {company.subscriptionEndsAt && (
                      <span className="ml-2 text-xs opacity-70">Expires: {formatDateDDMMYYYY(company.subscriptionEndsAt)}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <button onClick={() => navigate(-1)} className={`px-4 py-2 rounded ${dark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Back</button>
            <div className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
              {jobs.length} Jobs • {totalApplicants} Total Applicants
            </div>
          </div>
        </div>

        {error && (
          <div className={`mb-4 p-3 rounded border ${dark ? 'bg-red-900/30 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>{error}</div>
        )}

        {loading ? (
          <div className="p-8 text-center opacity-70">Loading jobs…</div>
        ) : jobs.length === 0 ? (
          <div className={`p-8 rounded border text-center ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>No jobs found for this company.</div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => {
              const applicants = Array.isArray(job.applicants) ? job.applicants : [];
              return (
                <div key={job._id} className={`rounded border overflow-hidden ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  {/* Job Header */}
                  <div className={`p-4 ${dark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold">{job.jobTitle}</div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm opacity-70">
                          <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-[#ff8200]" /> {job.location || 'Not specified'}</span>
                          <span className="flex items-center gap-1"><FaClock /> {job.employmentType || 'Not specified'}</span>
                          <span className="flex items-center gap-1"><FaCalendarAlt /> Posted: {formatDateDDMMYYYY(job.createdAt || job.postedAt)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${job.jobActive ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>
                          {job.jobActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${dark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'}`}>
                          <FaUsers /> {applicants.length} Applicants
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <button
                        onClick={() => toggleJobDetails(job._id)}
                        className={`text-sm font-medium px-3 py-1.5 rounded ${dark ? 'bg-gray-700 hover:bg-gray-600 text-orange-300' : 'bg-gray-100 hover:bg-gray-200 text-[#ff8200]'}`}
                      >
                        {expandedJobs[job._id] ? <span className="flex items-center gap-1">Hide Details <FaChevronUp /></span> : <span className="flex items-center gap-1">View Details <FaChevronDown /></span>}
                      </button>
                      <button
                        onClick={() => toggleApplicants(job._id)}
                        className={`text-sm font-medium px-3 py-1.5 rounded ${dark ? 'bg-gray-700 hover:bg-gray-600 text-orange-300' : 'bg-gray-100 hover:bg-gray-200 text-[#ff8200]'}`}
                      >
                        {expandedApplicants[job._id] ? <span className="flex items-center gap-1">Hide Applicants <FaChevronUp /></span> : <span className="flex items-center gap-1">View Applicants ({applicants.length}) <FaChevronDown /></span>}
                      </button>
                      <button 
                        disabled={!!busy[job._id]} 
                        onClick={() => onToggle(job)} 
                        className={`px-3 py-1.5 rounded text-sm ${job.jobActive ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'} disabled:opacity-50`}
                      >
                        {job.jobActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        disabled={!!busy[job._id]} 
                        onClick={() => onDelete(job)} 
                        className="px-3 py-1.5 rounded text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Job Details Section */}
                  {expandedJobs[job._id] && (
                    <div className={`p-4 border-t ${dark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                      <h4 className="font-semibold mb-3 text-[#ff8200]">Job Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Description:</span>
                          <div 
                            className="mt-1 opacity-80 [&_p]:mb-2 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
                            dangerouslySetInnerHTML={{ __html: job.jobDescription || '<p>No description provided</p>' }}
                          />
                        </div>
                        <div className="space-y-2">
                          <div><span className="font-medium">Salary:</span> <span className="opacity-80">{job.salary || 'Not disclosed'}</span></div>
                          <div><span className="font-medium">Experience:</span> <span className="opacity-80">{job.experienceLevel || 'Not specified'}</span></div>
                          <div><span className="font-medium">Work Mode:</span> <span className="opacity-80">{job.remoteOrOnsite || 'Not specified'}</span></div>
                          <div><span className="font-medium">Valid Until:</span> <span className="opacity-80">{job.validUntil ? formatDateDDMMYYYY(job.validUntil) : 'Not specified'}</span></div>
                        </div>
                      </div>
                      {job.skills && (
                        <div className="mt-3">
                          <span className="font-medium text-sm">Skills Required:</span>
                          <p className="mt-1 text-sm opacity-80">{job.skills}</p>
                        </div>
                      )}
                      {job.benefits && (
                        <div className="mt-3">
                          <span className="font-medium text-sm">Benefits:</span>
                          <p className="mt-1 text-sm opacity-80">{job.benefits}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Applicants Section */}
                  {expandedApplicants[job._id] && (
                    <div className={`p-4 border-t ${dark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                      <h4 className="font-semibold mb-3 text-[#ff8200] flex items-center gap-2">
                        <FaUsers /> Applicants ({applicants.length})
                      </h4>
                      {applicants.length === 0 ? (
                        <div className="text-sm opacity-70 py-4 text-center">No applicants yet for this job.</div>
                      ) : (
                        <div className="space-y-3">
                          {applicants.map((app) => (
                            <div key={app._id || app.applicantEmail} className={`p-4 rounded border ${dark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                <div className="flex-1">
                                  <div className="font-semibold text-base">{app.applicantName || 'Unknown Applicant'}</div>
                                  <div className="text-sm opacity-70 mt-1">{app.applicantEmail || 'No email provided'}</div>
                                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                                    <span className="opacity-70">Applied: {formatDateDDMMYYYY(app.createdAt)}</span>
                                    {app.appName && <span className={`px-2 py-0.5 rounded ${dark ? 'bg-gray-700' : 'bg-gray-100'}`}>Via: {app.appName}</span>}
                                  </div>
                                  {app.skills && app.skills.length > 0 && (
                                    <div className="mt-2">
                                      <span className="text-xs opacity-70">Skills: </span>
                                      <span className="text-xs">{app.skills.join(', ')}</span>
                                    </div>
                                  )}
                                  {app.testScore && (
                                    <div className="mt-1 text-xs">
                                      <span className="opacity-70">Test Score: </span>
                                      <span className="font-medium">{app.testScore}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    app.status === 'shortlisted' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' 
                                    : app.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' 
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                  }`}>
                                    {app.status?.charAt(0).toUpperCase() + app.status?.slice(1) || 'New'}
                                  </span>
                                  {app.resume && (
                                    <a 
                                      href={app.resume} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="flex items-center gap-1 px-3 py-1.5 rounded text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                      <FaFileAlt /> View Resume
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

AdminJobs.propTypes = {
  isDarkMode: PropTypes.bool,
  $isDarkMode: PropTypes.bool,
};
