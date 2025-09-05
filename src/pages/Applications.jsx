import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FaFileAlt, FaSearch } from 'react-icons/fa';
import {
  getApplicationsForCompany,
  shortlistApplication,
  rejectApplication,
} from '../api';

export default function Applications({ isDarkMode }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('dateDesc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [skillQuery, setSkillQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [minScore, setMinScore] = useState('');

  // Infinite scroll
  const [itemsToShow, setItemsToShow] = useState(20);
  const pageSize = 20;
  const sentinelRef = useRef(null);
  const scrollRootRef = useRef(null);

  // Table / Card toggle
  const [view, setView] = useState('table');
  // AI recommendations moved to Job detail page

  useEffect(() => {
    let email = '';
    try {
      const cd = JSON.parse(localStorage.getItem('companyData') || 'null');
      if (cd?.email) email = cd.email;
  } catch { /* ignore */ }
    if (!email) email = localStorage.getItem('rememberedEmail') || '';

    if (!email) {
      setError('No company email found');
      setLoading(false);
      return;
    }

     (async () => {
      try {
        const data = await getApplicationsForCompany(email);
        const list = Array.isArray(data.applications) ? data.applications : [];
        setApps(list);
  // AI recommendations are fetched on the Job page
      } catch (e) {
        setError(
          e?.response?.data?.error || e.message || 'Failed to load applications'
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // (Loading/Error UI moved below to keep all hooks unconditionally called)

  // Sorting helpers
  const handleSort = (column) => {
    setItemsToShow(pageSize);
    setSortBy(prev => {
      if (column === 'name') {
        return prev === 'nameAsc' ? 'nameDesc' : 'nameAsc';
      }
      if (column === 'date') {
        return prev === 'dateAsc' ? 'dateDesc' : 'dateAsc';
      }
      return prev;
    });
  };

  const filtered = apps
    .filter(a => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        a.applicantName?.toLowerCase().includes(q) ||
        a.jobTitle?.toLowerCase().includes(q) ||
        a.companyName?.toLowerCase().includes(q)
      );
    })
    .filter(a =>
      statusFilter === 'all' ? true : (a.status || 'new') === statusFilter
    )
    .filter(a => {
      // Date range filter
      if (dateRange === 'all') return true;
      const applied = new Date(a.appliedAt || a.createdAt);
      if (Number.isNaN(applied.getTime())) return true;
      const now = new Date();
      const ranges = { '7d': 7, '30d': 30, '90d': 90 };
      const days = ranges[dateRange];
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      return applied >= cutoff;
    })
    .filter(a => {
      // Skills filter (selected skills OR skillQuery substring)
      const skills = (a.skills || []).map(s => String(s).toLowerCase());
      if (selectedSkills.length > 0) {
        const sel = selectedSkills.map(s => s.toLowerCase());
        const anyMatch = sel.some(s => skills.includes(s));
        if (!anyMatch) return false;
      }
      if (skillQuery.trim()) {
        const sq = skillQuery.toLowerCase();
        const anyTextMatch = skills.some(s => s.includes(sq));
        if (!anyTextMatch) return false;
      }
      return true;
    })
    .filter(a => {
      // Test score min filter
      if (minScore === '' || minScore === null) return true;
      const n = parseFloat(a.testScore);
      const min = parseFloat(minScore);
      if (Number.isNaN(min)) return true;
      if (Number.isNaN(n)) return false;
      return n >= min;
    });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'nameAsc':
        return (a.applicantName || '').localeCompare(b.applicantName || '');
      case 'nameDesc':
        return (b.applicantName || '').localeCompare(a.applicantName || '');
      case 'dateAsc':
        return (
          new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()
        );
      case 'dateDesc':
      default:
        return (
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
        );
    }
  });

  // Reset infinite list when filters/sort change
  useEffect(() => {
    setItemsToShow(pageSize);
  }, [
    query,
  sortBy,
    statusFilter,
    dateRange,
    skillQuery,
    selectedSkills,
    minScore,
  ]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setItemsToShow(prev => Math.min(prev + pageSize, sorted.length));
        }
      },
      { root: scrollRootRef.current || null, rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [sorted.length]);

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'
            : 'bg-gradient-to-br from-orange-50 via-white to-orange-100 text-black'
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
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'
            : 'bg-gradient-to-br from-orange-50 via-white to-orange-100 text-black'
        }`}
      >
        <div className="text-lg font-semibold text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen py-8 px-3 sm:px-6 lg:px-8 flex flex-col items-center ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'
          : 'bg-gradient-to-br from-orange-50 via-white to-orange-100 text-black'
      }`}
    >
  {/* Search + View toggle */}
      <div className="w-full max-w-6xl sticky top-0 z-20 bg-inherit/80 backdrop-blur-md rounded-xl shadow-sm mb-4">
        <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Search */}
          <div className="relative w-full max-w-md">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <input
              className="w-full rounded-lg border px-10 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[#ff8200] focus:border-[#ff8200] transition"
              placeholder="Search by applicant or job title"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">View:</span>
            {['table', 'cards'].map(mode => (
              <button
                key={mode}
                className={`px-3 py-1.5 rounded-lg border text-sm transition ${
                  view === mode
                    ? 'bg-[#ff8200] text-white border-[#ff8200] shadow'
                    : isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                }`}
                onClick={() => setView(mode)}
              >
                {mode[0].toUpperCase() + mode.slice(1)}
              </button>
            ))}
            {/* AI toggle removed (moved to Job page) */}
          </div>
        </div>

        {/* Active filter chips */}
        {Boolean(
          statusFilter !== 'all' ||
          dateRange !== 'all' ||
          minScore !== '' ||
          (skillQuery.trim().length > 0) ||
          (selectedSkills.length > 0)
        ) && (
          <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
            {statusFilter !== 'all' && (
              <button className="chip" onClick={() => setStatusFilter('all')}>
                Status: {statusFilter} ×
              </button>
            )}
            {dateRange !== 'all' && (
              <button className="chip" onClick={() => setDateRange('all')}>
                Date: {dateRange} ×
              </button>
            )}
            {minScore !== '' && (
              <button className="chip" onClick={() => setMinScore('')}>
                Min score: {minScore} ×
              </button>
            )}
            {skillQuery.trim() && (
              <button className="chip" onClick={() => setSkillQuery('')}>
                Skill: {skillQuery} ×
              </button>
            )}
            {selectedSkills.map(sk => (
              <button
                key={sk}
                className="chip"
                onClick={() =>
                  setSelectedSkills(prev => prev.filter(s => s !== sk))
                }
              >
                {sk} ×
              </button>
            ))}
            <button
              className="ml-auto text-xs px-3 py-1.5 rounded-lg border bg-white/60  "
              onClick={() => {
                setStatusFilter('all');
                setDateRange('all');
                setMinScore('');
                setSkillQuery('');
                setSelectedSkills([]);
              }}
            >
              Reset
            </button>
          </div>
        )}

        {/* Mobile actions: Sort | Filter */}
  {/* Mobile actions reserved */}
      </div>

      {/* Layout: List + Sidebar */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-5">
  {/* Main Section */}
  <section className="md:col-span-8 xl:col-span-9 space-y-4">
          {/* Company summary removed as per request */}

          {/* Table / Cards */}
          {sorted.length === 0 ? (
            <div className="card-kgamify p-10 text-center">
              <FaFileAlt className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <div className="font-medium">No applications found</div>
              <p className="text-sm opacity-70 mt-1">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div
              ref={scrollRootRef}
              className="md:max-h-[calc(100vh-260px)] overflow-auto pr-1"
            >
              {view === 'table' ? (
                <table className="w-full border-collapse text-sm rounded-xl overflow-hidden">
                  <thead className={`sticky top-0 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} shadow-sm`}>
                    <tr>
                      <th
                        className={`px-3 py-2 text-left select-none cursor-pointer ${sortBy.startsWith('name') ? 'text-[#ff8200]' : ''}`}
                        onClick={() => handleSort('name')}
                        title="Sort by name"
                      >
                        Name {sortBy === 'nameAsc' ? '▲' : sortBy === 'nameDesc' ? '▼' : ''}
                      </th>
                      <th className="px-3 py-2 text-left">Role</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th
                        className={`px-3 py-2 text-left select-none cursor-pointer ${sortBy.startsWith('date') ? 'text-[#ff8200]' : ''}`}
                        onClick={() => handleSort('date')}
                        title="Sort by date"
                      >
                        Date {sortBy === 'dateAsc' ? '▲' : sortBy === 'dateDesc' ? '▼' : ''}
                      </th>
                      <th className="px-3 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.slice(0, itemsToShow).map(app => {
                      const status = (app.status || 'new').toLowerCase();
                      const statusStyles = status === 'shortlisted'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : status === 'rejected'
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200';
                      const dateText = app.appliedAt || app.createdAt || app.date;
                      return (
                        <tr
                          key={app.id || app._id}
                          className={`align-middle transition-colors border-b last:border-0 ${isDarkMode ? 'border-gray-700 hover:bg-gray-700 odd:bg-gray-900 even:bg-gray-800' : 'border-gray-200 hover:bg-orange-50 odd:bg-white even:bg-gray-50'}`}
                        >
                          <td className="px-3 py-2 whitespace-nowrap font-medium">{app.applicantName || app.name}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center justify-between gap-2">
                              <span>{app.jobTitle || app.role}</span>
                              {/* AI Top button removed (moved to Job page) */}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${statusStyles}`}>
                              {status === 'shortlisted' ? 'Shortlisted' : status === 'rejected' ? 'Rejected' : 'New'}
                            </span>
                          </td>
                          <td className={`px-3 py-2 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{new Date(dateText).toLocaleDateString()}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                className="text-xs px-3 py-1 rounded border bg-white hover:bg-gray-50 text-gray-900"
                                onClick={async () => {
                                  try {
                                    await shortlistApplication(app._id || app.id);
                                    setApps(prev => prev.map(x => (x._id === (app._id || app.id) || x.id === (app._id || app.id)) ? { ...x, status: 'shortlisted' } : x));
                                  } catch { /* ignore */ }
                                }}
                              >
                                Shortlist
                              </button>
                              <button
                                className="text-xs px-3 py-1 rounded border bg-white hover:bg-gray-50 text-red-600 border-red-300"
                                onClick={async () => {
                                  const ok = window.confirm('Reject this applicant?');
                                  if (!ok) return;
                                  try {
                                    await rejectApplication(app._id || app.id);
                                    setApps(prev => prev.map(x => (x._id === (app._id || app.id) || x.id === (app._id || app.id)) ? { ...x, status: 'rejected' } : x));
                                  } catch { /* ignore */ }
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.slice(0, itemsToShow).map(app => (
                    <div
                      key={app.id || app._id}
            className={`rounded-xl border p-4 shadow-sm ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
                    >
                      <div className="font-medium">{app.applicantName || app.name}</div>
                      <div className="text-sm opacity-70">{app.jobTitle || app.role}</div>
                      <div className="mt-2 flex justify-between items-center">
                        <span className={`px-2 py-1 rounded text-xs border ${
                          (app.status || 'new').toLowerCase() === 'shortlisted' ? 'bg-green-100 text-green-700 border-green-200' :
                          (app.status || 'new').toLowerCase() === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                          'bg-blue-100 text-blue-700 border-blue-200'
                        }`}>
                          {(app.status || 'New')}
                        </span>
                        <span className="text-xs opacity-70">{new Date(app.appliedAt || app.createdAt || app.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs mt-2 flex gap-2">
                        <button
                          className="text-xs px-3 py-1 rounded border bg-white hover:bg-gray-50 text-gray-900"
                          onClick={async () => {
                            try {
                              await shortlistApplication(app._id || app.id);
                              setApps(prev => prev.map(x => (x._id === (app._id || app.id) || x.id === (app._id || app.id)) ? { ...x, status: 'shortlisted' } : x));
                            } catch { /* ignore */ }
                          }}
                        >
                          Shortlist
                        </button>
                        <button
                          className="text-xs px-3 py-1 rounded border bg-white hover:bg-gray-50 text-red-600 border-red-300"
                          onClick={async () => {
                            const ok = window.confirm('Reject this applicant?');
                            if (!ok) return;
                            try {
                              await rejectApplication(app._id || app.id);
                              setApps(prev => prev.map(x => (x._id === (app._id || app.id) || x.id === (app._id || app.id)) ? { ...x, status: 'rejected' } : x));
                            } catch { /* ignore */ }
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* AI recommendation panels removed (now on Job page) */}
        </section>

        {/* Sidebar */}
        <aside className="hidden md:block md:col-span-4 xl:col-span-3">
          <div className="sticky top-20 space-y-4">
            {/* Filters */}
            <div className={`p-3 space-y-3 rounded-xl border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
              <div className="text-sm font-semibold">Filters</div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className={`px-2 py-1.5 rounded border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  className={`px-2 py-1.5 rounded border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  value={dateRange}
                  onChange={e => setDateRange(e.target.value)}
                >
                  <option value="all">All Dates</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>
              {/* Company filter removed by request */}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

Applications.propTypes = {
  isDarkMode: PropTypes.bool,
};
