import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { FaCalendarAlt, FaFileAlt, FaSearch, FaUserTie } from 'react-icons/fa';
import { getApplicationsForCompany } from '../api';

export default function Applications({ isDarkMode }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  // Derive company info from localStorage (used for subtitle)
  const companyInfo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('companyData') || 'null') || {};
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    let email = localStorage.getItem('rememberedEmail');
    if (!email) {
      try {
        const cd = JSON.parse(localStorage.getItem('companyData') || 'null');
        if (cd?.email) email = cd.email;
      } catch {
        /* ignore */
      }
    }

    if (!email) {
      setError('No company email found');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await getApplicationsForCompany(email);
        setApps(Array.isArray(data.applications) ? data.applications : []);
      } catch (e) {
        setError(
          e?.response?.data?.error || e.message || 'Failed to load applications'
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = apps.filter(a => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      a.applicantName?.toLowerCase().includes(q) ||
      a.jobTitle?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div
        className={`p-4 ${isDarkMode ? 'text-gray-100 bg-gray-900' : 'text-gray-800 bg-gray-100'}`}
      >
        Loading applications...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-4 ${isDarkMode ? 'text-red-300 bg-gray-900' : 'text-red-600 bg-gray-100'}`}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-2 sm:p-4 md:p-6 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}
    >
      {/* Search */}
      <div className="card-kgamify p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="relative w-full max-w-md">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
          <input
            className="input-kgamify pl-10"
            placeholder="Search by applicant or job title"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card-kgamify p-8 text-center">
          <FaFileAlt className="mx-auto h-10 w-10 text-gray-400 mb-3" />
          <div className="font-medium">No applications found</div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filtered.map(app => (
            <div
              key={app.id}
              className="card-kgamify p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-kgamify-500 text-sm sm:text-base">
                    {app.jobTitle}
                  </div>
                  <div
                    className={`text-sm mt-1 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}
                  >
                    Applicant:{' '}
                    <span
                      className={`font-medium ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-900'
                      }`}
                    >
                      {app.applicantName}
                    </span>
                  </div>
                  {app.resume && (
                    <div className="mt-2">
                      <a
                        href={app.resume}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm underline hover:text-kgamify-500 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-900'
                      }"
                      >
                        View Resume
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex items-center text-xs sm:text-sm ml-4 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }">
                  <FaCalendarAlt className="h-4 w-4 mr-2" />
                  <span>{new Date(app.appliedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Applications.propTypes = {
  isDarkMode: PropTypes.bool,
};
