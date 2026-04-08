import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaRedo, FaBrain, FaChartBar, FaFileAlt, FaUserCheck, FaExclamationTriangle } from 'react-icons/fa';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { getJobById, getRecommendationInsightsForJob, shortlistApplication, rejectApplication } from '../api';
import ResumeViewer from '../components/ResumeViewer';

const JobRecommendationInsights = ({ isDarkMode }) => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [topN, setTopN] = useState(10);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [processingIds, setProcessingIds] = useState(new Set());

  const loadData = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError('');

      const [jobData, insights] = await Promise.all([
        getJobById(jobId),
        getRecommendationInsightsForJob(jobId, topN),
      ]);

      setJob(jobData);
      setData(insights);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load recommendation insights');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, topN]);

  const handleAction = async (applicationId, action) => {
    try {
      setProcessingIds(prev => new Set(prev).add(applicationId));
      if (action === 'shortlist') {
        await shortlistApplication(applicationId);
      } else {
        await rejectApplication(applicationId);
      }
      setSnack({
        open: true,
        message: `Application ${action}ed successfully`,
        severity: 'success'
      });
      await loadData({ silent: true });
    } catch (e) {
      setSnack({
        open: true,
        message: e?.response?.data?.error || e?.message || `Failed to ${action} application`,
        severity: 'error'
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(applicationId);
        return next;
      });
    }
  };

  const summary = data?.summary || {};
  const recommendations = Array.isArray(data?.recommendations) ? data.recommendations : [];
  const vectorData = data?.vectorData || {};

  if (loading) {
    return (
      <div className={`min-h-screen px-4 py-10 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-6xl mx-auto animate-pulse space-y-6">
          <div className={`h-10 w-72 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
          <div className={`h-40 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} />
          <div className={`h-80 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen px-4 py-10 flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`max-w-xl w-full rounded-2xl p-6 border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-3 text-red-500 font-semibold mb-3">
            <FaExclamationTriangle /> Recommendation insights unavailable
          </div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{error}</p>
          <button
            onClick={() => navigate(`/job/${jobId}`)}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff8200] text-white font-medium"
          >
            <FaArrowLeft /> Back to job
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-4 py-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate(`/job/${jobId}`)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-800'}`}
            >
              <FaArrowLeft /> Back to job
            </button>
            <div className="mt-4 flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#ff8200] to-[#ffb347] text-white shadow-lg">
                <FaBrain className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">AI Recommendation Insights</h1>
                <p className={isDarkMode ? 'text-gray-300 mt-1' : 'text-gray-600 mt-1'}>
                  {job?.jobTitle || 'Job'} · ranked applicants, vector signals, and Gemini summary
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Top N</span>
              <input
                type="number"
                min={1}
                max={50}
                value={topN}
                onChange={(e) => setTopN(Math.min(50, Math.max(1, parseInt(e.target.value || '10', 10) || 10)))}
                className={`w-24 px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </label>
            <button
              onClick={() => loadData({ silent: true })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff8200] text-white font-semibold"
              disabled={refreshing}
            >
              <FaRedo className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-1 xl:grid-cols-3 gap-6`}>
          <section className={`xl:col-span-2 rounded-3xl border shadow-sm p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-4 text-lg font-semibold">
              <FaChartBar className="text-[#ff8200]" /> Gemini hiring summary
            </div>
            <p className={`text-base leading-7 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{summary.summary || 'No summary available.'}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-orange-50 border-orange-100'}`}>
                <div className="font-semibold mb-2">Top strengths</div>
                <ul className="space-y-2 text-sm">
                  {(summary.topStrengths || []).map((item, index) => (
                    <li key={index} className={`rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-red-50 border-red-100'}`}>
                <div className="font-semibold mb-2">Review risks</div>
                <ul className="space-y-2 text-sm">
                  {(summary.topRisks || []).map((item, index) => (
                    <li key={index} className={`rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={`mt-4 rounded-2xl p-4 border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="font-semibold mb-2">Hiring recommendation</div>
              <p className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{summary.hiringRecommendation || 'No hiring recommendation available.'}</p>
            </div>
          </section>

          <section className={`rounded-3xl border shadow-sm p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-4 text-lg font-semibold">
              <FaFileAlt className="text-[#ff8200]" /> Vector data
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Job skills</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(vectorData.jobSkills || []).slice(0, 16).map((skill) => (
                    <span key={skill} className={`px-2 py-1 rounded-full text-xs ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-orange-50 text-orange-700'}`}>{skill}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Candidates scored</div>
                <div className="text-2xl font-bold mt-1">{data?.count || recommendations.length}</div>
              </div>
              <div>
                <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Source</div>
                <div className="mt-1 text-sm font-medium">{data?.source || 'unknown'}</div>
              </div>
              {data?.fallbackUsed ? (
                <div className={`rounded-xl p-3 border ${isDarkMode ? 'border-yellow-700 bg-yellow-900/20 text-yellow-200' : 'border-yellow-200 bg-yellow-50 text-yellow-800'}`}>
                  Fallback ranking used because the AI service was unavailable.
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <section className={`rounded-3xl border shadow-sm p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-5 text-lg font-semibold">
            <FaUserCheck className="text-[#ff8200]" /> Ranked applicants
          </div>

          {recommendations.length === 0 ? (
            <div className={`rounded-2xl p-6 text-center ${isDarkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
              No ranked applicants returned for this job.
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {recommendations.map((candidate, index) => {
                const featureVector = candidate.vectorData?.featureVector || [];
                const signal = candidate.vectorData?.signals || {};
                const score = Number(candidate.score || 0);
                const primarySkills = Array.isArray(candidate.skills) ? candidate.skills : [];
                const matched = Array.isArray(candidate.matched_skills || candidate.matchedSkills) ? (candidate.matched_skills || candidate.matchedSkills) : [];

                return (
                  <article
                    key={candidate.application_id || candidate.applicantEmail || index}
                    className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-widest opacity-60 mb-1">Rank #{index + 1}</div>
                        <h3 className="text-xl font-bold">{candidate.applicantName || candidate.name || 'Unknown'}</h3>
                        <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{candidate.applicantEmail || candidate.email || 'No email'}</div>
                      </div>
                      <div className={`px-3 py-2 rounded-xl text-sm font-bold ${isDarkMode ? 'bg-orange-900/40 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                        {score.toFixed(1)}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Fit score</span>
                        <span>{Math.max(0, Math.min(100, score)).toFixed(0)}%</span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <div className="h-full rounded-full bg-gradient-to-r from-[#ff8200] to-[#ffb347]" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className={`rounded-xl p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="opacity-60 text-xs">Skill vector</div>
                        <div className="font-semibold mt-1">{(signal.skill_score ?? featureVector[0] ?? 0).toFixed ? Number(signal.skill_score ?? featureVector[0] ?? 0).toFixed(2) : 'N/A'}</div>
                      </div>
                      <div className={`rounded-xl p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="opacity-60 text-xs">Experience vector</div>
                        <div className="font-semibold mt-1">{(signal.experience_score ?? featureVector[1] ?? 0).toFixed ? Number(signal.experience_score ?? featureVector[1] ?? 0).toFixed(2) : 'N/A'}</div>
                      </div>
                      <div className={`rounded-xl p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="opacity-60 text-xs">Projects vector</div>
                        <div className="font-semibold mt-1">{(signal.project_score ?? featureVector[2] ?? 0).toFixed ? Number(signal.project_score ?? featureVector[2] ?? 0).toFixed(2) : 'N/A'}</div>
                      </div>
                      <div className={`rounded-xl p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="opacity-60 text-xs">Academic vector</div>
                        <div className="font-semibold mt-1">{(signal.academic_score ?? featureVector[3] ?? 0).toFixed ? Number(signal.academic_score ?? featureVector[3] ?? 0).toFixed(2) : 'N/A'}</div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div>
                        <div className="font-semibold mb-1">Matched skills</div>
                        <div className="flex flex-wrap gap-2">
                          {(matched.length > 0 ? matched : primarySkills).slice(0, 10).map((skill) => (
                            <span key={skill} className={`px-2 py-1 rounded-full text-xs ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'}`}>{skill}</span>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <div className="font-semibold mb-1">Experience</div>
                          <div className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{candidate.experience || 'Not detected'}</div>
                        </div>
                        <div>
                          <div className="font-semibold mb-1">Projects</div>
                          <div className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{candidate.projects || 'Not detected'}</div>
                        </div>
                        <div>
                          <div className="font-semibold mb-1">Education</div>
                          <div className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{candidate.education || 'Not detected'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      {candidate.resume_url ? (
                        <ResumeViewer resumeUrl={candidate.resume_url} applicantName={candidate.applicantName} variant="inline" />
                      ) : null}
                      {candidate.application_id ? (
                        <>
                          <button
                            type="button"
                            disabled={processingIds.has(candidate.application_id)}
                            onClick={() => handleAction(candidate.application_id, 'shortlist')}
                            className={`px-4 py-2 rounded-lg font-semibold text-white ${processingIds.has(candidate.application_id) ? 'opacity-60 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'}`}
                          >
                            Shortlist
                          </button>
                          <button
                            type="button"
                            disabled={processingIds.has(candidate.application_id)}
                            onClick={() => handleAction(candidate.application_id, 'reject')}
                            className={`px-4 py-2 rounded-lg font-semibold text-white ${processingIds.has(candidate.application_id) ? 'opacity-60 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500'}`}
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Source: {candidate.source || data?.source || 'n/a'}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snack.severity} onClose={() => setSnack(prev => ({ ...prev, open: false }))} variant="filled">
            {snack.message}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

JobRecommendationInsights.propTypes = {
  isDarkMode: PropTypes.bool,
};

export default JobRecommendationInsights;
