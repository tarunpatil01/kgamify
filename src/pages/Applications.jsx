import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { FaCalendarAlt, FaFileAlt, FaSearch, FaSortAlphaDown, FaSortAmountDown, FaBuilding, FaUser } from 'react-icons/fa';
import { getApplicationsForCompany, shortlistApplication, rejectApplication } from '../api';

export default function Applications({ isDarkMode }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('dateDesc'); // dateDesc | dateAsc | nameAsc | nameDesc
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // new | shortlisted | rejected | all

  // Company email for status updates
  // company email is resolved in API helpers

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
      a.jobTitle?.toLowerCase().includes(q) ||
      a.companyName?.toLowerCase().includes(q)
    );
  }).filter(a => (companyFilter === 'all' ? true : (a.companyName || '').toLowerCase() === companyFilter.toLowerCase()))
    .filter(a => (statusFilter === 'all' ? true : (a.status || 'new') === statusFilter));

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'nameAsc':
        return (a.applicantName || '').localeCompare(b.applicantName || '');
      case 'nameDesc':
        return (b.applicantName || '').localeCompare(a.applicantName || '');
      case 'dateAsc':
        return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
      case 'dateDesc':
      default:
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    }
  });

  const companies = useMemo(() => {
    const map = new Map();
    for (const a of apps) {
      const c = a.companyName || 'Unknown';
      map.set(c, (map.get(c) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [apps]);

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

      {/* Filters */}
      <div className="card-kgamify p-3 sm:p-4 mb-3 sm:mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs mb-1">Sort by</label>
          <div className="flex gap-2 flex-wrap">
            <button className={`px-3 py-1 rounded border ${sortBy === 'nameAsc' ? 'bg-[#ff8200] text-white border-[#ff8200]' : (isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')}`} onClick={() => setSortBy('nameAsc')}>
              <FaSortAlphaDown className="inline mr-1" /> A–Z
            </button>
            <button className={`px-3 py-1 rounded border ${sortBy === 'nameDesc' ? 'bg-[#ff8200] text-white border-[#ff8200]' : (isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')}`} onClick={() => setSortBy('nameDesc')}>
              <FaSortAmountDown className="inline mr-1" /> Z–A
            </button>
            <button className={`px-3 py-1 rounded border ${sortBy === 'dateDesc' ? 'bg-[#ff8200] text-white border-[#ff8200]' : (isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')}`} onClick={() => setSortBy('dateDesc')}>Newest</button>
            <button className={`px-3 py-1 rounded border ${sortBy === 'dateAsc' ? 'bg-[#ff8200] text-white border-[#ff8200]' : (isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')}`} onClick={() => setSortBy('dateAsc')}>Oldest</button>
          </div>
        </div>
        <div>
          <label className="block text-xs mb-1">Company</label>
          <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className={`w-full py-2 px-3 rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
            <option value="all">All</option>
            {companies.map(([name, count]) => (
              <option key={name} value={name}>{name} ({count})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`w-full py-2 px-3 rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="card-kgamify p-8 text-center">
          <FaFileAlt className="mx-auto h-10 w-10 text-gray-400 mb-3" />
          <div className="font-medium">No applications found</div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {sorted.map(app => (
            <div
              key={app.id}
              className="card-kgamify p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                      <FaUser /> <span>{app.applicantName}</span>
                    </div>
                    <div className="text-sm opacity-80">applied for</div>
                    <div className="text-sm sm:text-base font-medium">{app.jobTitle}</div>
                    <div className="text-sm opacity-80">at</div>
                    <div className="flex items-center gap-2 text-sm sm:text-base">
                      <FaBuilding /> <span>{app.companyName || 'Unknown'}</span>
                    </div>
                  </div>
                  {app.resume && (
                    <div className="mt-1">
                      <a href={app.resume} target="_blank" rel="noreferrer" className="text-sm underline hover:text-kgamify-500">View Resume</a>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs sm:text-sm opacity-80">
                  <FaCalendarAlt className="h-4 w-4" />
                  <span>{new Date(app.appliedAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs sm:text-sm">
                  Status: <span className={`px-2 py-0.5 rounded ${app.status === 'shortlisted' ? 'bg-green-100 text-green-700' : app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{app.status || 'new'}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                    onClick={async () => {
                      try {
                        await shortlistApplication(app.id);
                        setApps(prev => prev.map(x => x.id === app.id ? { ...x, status: 'shortlisted' } : x));
                      } catch { /* noop */ }
                    }}
                  >
                    Shortlist
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                    onClick={async () => {
                      try {
                        await rejectApplication(app.id);
                        setApps(prev => prev.map(x => x.id === app.id ? { ...x, status: 'rejected' } : x));
                      } catch { /* noop */ }
                    }}
                  >
                    Reject
                  </button>
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
