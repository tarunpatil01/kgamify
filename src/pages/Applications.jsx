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
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
            : "bg-gradient-to-br from-orange-50 via-white to-orange-100 text-black"
        }`}
      >
        <div className="text-lg font-semibold">Loading applications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
            : "bg-gradient-to-br from-orange-50 via-white to-orange-100 text-black"
        }`}
      >
        <div className="text-lg font-semibold text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen py-8 px-2 sm:px-6 lg:px-8 flex flex-col items-center ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
          : "bg-gradient-to-br from-orange-50 via-white to-orange-100 text-black"
      }`}
    >
      <div
        className={`w-full max-w-5xl mx-auto rounded-3xl shadow-2xl border ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-orange-200"
        } p-6 sm:p-10`}
      >
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 text-center tracking-tight bg-gradient-to-r from-[#ff8200] to-[#ffb347] bg-clip-text text-transparent drop-shadow-lg">
          Applications
        </h1>

        {/* Search */}
        <div className="mb-6">
          <div className="relative w-full max-w-md mx-auto">
            <FaSearch className="absolute left-3 top-2/3 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <input
              className={`pl-10 pr-3 py-2 w-full rounded-xl border font-medium ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:ring-2 focus:ring-[#ff8200] outline-none transition`}
              placeholder="Search by applicant or job title"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs mb-1 font-semibold">Sort by</label>
            <div className="flex gap-2 flex-wrap">
              <button className={`px-4 py-2 rounded-xl border font-medium ${sortBy === 'nameAsc' ? 'bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white border-[#ff8200]' : (isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')}`} onClick={() => setSortBy('nameAsc')}>
                <FaSortAlphaDown className="inline mr-1" /> A–Z
              </button>
              <button className={`px-4 py-2 rounded-xl border font-medium ${sortBy === 'nameDesc' ? 'bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white border-[#ff8200]' : (isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')}`} onClick={() => setSortBy('nameDesc')}>
                <FaSortAmountDown className="inline mr-1" /> Z–A
              </button>
              <button className={`px-4 py-2 rounded-xl border font-medium ${sortBy === 'dateDesc' ? 'bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white border-[#ff8200]' : (isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')}`} onClick={() => setSortBy('dateDesc')}>Newest</button>
              <button className={`px-4 py-2 rounded-xl border font-medium ${sortBy === 'dateAsc' ? 'bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white border-[#ff8200]' : (isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')}`} onClick={() => setSortBy('dateAsc')}>Oldest</button>
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1 font-semibold">Company</label>
            <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className={`w-full py-2 px-3 rounded-xl border font-medium ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-[#ff8200] outline-none transition`}>
              <option value="all">All</option>
              {companies.map(([name, count]) => (
                <option key={name} value={name}>{name} ({count})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1 font-semibold">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`w-full py-2 px-3 rounded-xl border font-medium ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-[#ff8200] outline-none transition`}>
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* List */}
        {sorted.length === 0 ? (
          <div className={`p-10 text-center rounded-2xl flex flex-col items-center justify-center ${isDarkMode ? "bg-gray-800" : "bg-white"} border ${isDarkMode ? "border-gray-700" : "border-gray-200"} shadow-lg`}>
            <FaFileAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-xl font-semibold mb-2">No applications found</div>
          </div>
        ) : (
          <div className="space-y-6">
            {sorted.map(app => (
              <div
                key={app.id}
                className={`rounded-2xl shadow-xl border p-6 transition-all group ${
                  isDarkMode
                    ? "bg-gray-900 border-gray-700 text-white"
                    : "bg-white border-orange-200 text-black"
                } hover:shadow-2xl hover:-translate-y-1`}
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
                        <a href={app.resume} target="_blank" rel="noreferrer" className="text-sm underline hover:text-[#ff8200]">View Resume</a>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs sm:text-sm opacity-80">
                    <FaCalendarAlt className="h-4 w-4" />
                    <span>{new Date(app.appliedAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-xs sm:text-sm">
                    Status:{" "}
                    <span
                      className={`px-2 py-0.5 rounded font-semibold ${
                        app.status === "shortlisted"
                          ? "bg-green-100 text-green-700"
                          : app.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {app.status || "new"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-400 text-white hover:from-green-700 hover:to-green-500 font-semibold shadow"
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
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-400 text-white hover:from-red-700 hover:to-red-500 font-semibold shadow"
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
    </div>
  );
}

Applications.propTypes = {
  isDarkMode: PropTypes.bool,
};
