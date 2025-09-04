import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FaCalendarAlt, FaFileAlt, FaSearch, FaSortAlphaDown, FaSortAmountDown, FaUser } from 'react-icons/fa';
import { getApplicationsForCompany, shortlistApplication, rejectApplication } from '../api';

export default function Applications({ isDarkMode }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('dateDesc'); // dateDesc | dateAsc | nameAsc | nameDesc
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // new | shortlisted | rejected | all
  const [dateRange, setDateRange] = useState('all'); // all | 7d | 30d | 90d
  const [skillQuery, setSkillQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [minScore, setMinScore] = useState('');

  // Infinite scroll / pagination
  const [itemsToShow, setItemsToShow] = useState(20);
  const pageSize = 20;
  const sentinelRef = useRef(null);
  const [view, setView] = useState('table'); // 'table' | 'cards'
  const scrollRootRef = useRef(null); // scrollable container for applicants
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileSheetTab, setMobileSheetTab] = useState('sort'); // 'sort' | 'filters'

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

  // Aggregate skills and status stats
  const { companies, topSkills, statusStats } = useMemo(() => {
    const companyMap = new Map();
    const skillMap = new Map();
    const statCounts = { total: 0, new: 0, shortlisted: 0, rejected: 0 };

    for (const a of apps) {
      const c = a.companyName || 'Unknown';
      companyMap.set(c, (companyMap.get(c) || 0) + 1);

      const sarr = Array.isArray(a.skills) ? a.skills : [];
      sarr.forEach(s => {
        const key = String(s || '').trim();
        if (!key) return;
        skillMap.set(key, (skillMap.get(key) || 0) + 1);
      });

      statCounts.total += 1;
      const st = a.status || 'new';
      if (st === 'shortlisted') statCounts.shortlisted += 1;
      else if (st === 'rejected') statCounts.rejected += 1;
      else statCounts.new += 1;
    }

    const companiesArr = Array.from(companyMap.entries()).sort((a, b) => b[1] - a[1]);
    const topSkillsArr = Array.from(skillMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12);
    return { companies: companiesArr, topSkills: topSkillsArr, statusStats: statCounts };
  }, [apps]);

  const filtered = apps.filter(a => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      a.applicantName?.toLowerCase().includes(q) ||
      a.jobTitle?.toLowerCase().includes(q) ||
      a.companyName?.toLowerCase().includes(q)
    );
  }).filter(a => (companyFilter === 'all' ? true : (a.companyName || '').toLowerCase() === companyFilter.toLowerCase()))
    .filter(a => (statusFilter === 'all' ? true : (a.status || 'new') === statusFilter))
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
        return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
      case 'dateDesc':
      default:
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    }
  });

  // Reset infinite list when filters/sort change
  useEffect(() => {
    setItemsToShow(pageSize);
  }, [query, sortBy, companyFilter, statusFilter, dateRange, skillQuery, selectedSkills, minScore]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
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
 
  {/* Quick Stats moved to right sidebar */}
      {/* Search row (separate) */}
      <div className="w-full max-w-6xl sticky top-4 z-10">
        <div className="card-kgamify p-3 sm:p-4 flex flex-col gap-3 items-start max-w-3xl">
          <div className="relative w-full max-w-md">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <input
              className="input-kgamify pl-10"
              placeholder="Search by applicant or job title"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">View:</span>
            <button
              className={`px-3 py-1 rounded border text-sm ${view === 'table' ? 'bg-[#ff8200] text-white border-[#ff8200]' : (isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')}`}
              onClick={() => setView('table')}
            >
              Table
            </button>
            <button
              className={`px-3 py-1 rounded border text-sm ${view === 'cards' ? 'bg-[#ff8200] text-white border-[#ff8200]' : (isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')}`}
              onClick={() => setView('cards')}
            >
              Cards
            </button>
          </div>
          {/* Active filter chips */}
          {(companyFilter !== 'all' || statusFilter !== 'all' || dateRange !== 'all' || minScore !== '' || skillQuery.trim() || selectedSkills.length) && (
            <div className="w-full flex flex-wrap items-center gap-2 pt-1">
              {companyFilter !== 'all' && (
                <button className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700" onClick={() => setCompanyFilter('all')}>Company: {companyFilter} ×</button>
              )}
              {statusFilter !== 'all' && (
                <button className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700" onClick={() => setStatusFilter('all')}>Status: {statusFilter} ×</button>
              )}
              {dateRange !== 'all' && (
                <button className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700" onClick={() => setDateRange('all')}>Date: {dateRange} ×</button>
              )}
              {minScore !== '' && (
                <button className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700" onClick={() => setMinScore('')}>Min score: {minScore} ×</button>
              )}
              {skillQuery.trim() && (
                <button className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700" onClick={() => setSkillQuery('')}>Skill text: {skillQuery} ×</button>
              )}
              {selectedSkills.map(sk => (
                <button key={sk} className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700" onClick={() => setSelectedSkills(prev => prev.filter(s => s !== sk))}>{sk} ×</button>
              ))}
              <button className="ml-auto text-xs px-2 py-1 rounded border" onClick={() => { setCompanyFilter('all'); setStatusFilter('all'); setDateRange('all'); setMinScore(''); setSkillQuery(''); setSelectedSkills([]); }}>Reset</button>
            </div>
          )}
          {/* Mobile actions: Sort | Filter */}
          <div className="w-full flex items-center gap-2 md:hidden">
            <button className="flex-1 px-3 py-2 rounded border bg-white dark:bg-gray-800" onClick={() => { setMobileSheetTab('sort'); setMobileSheetOpen(true); }}>Sort</button>
            <button className="flex-1 px-3 py-2 rounded border bg-white dark:bg-gray-800" onClick={() => { setMobileSheetTab('filters'); setMobileSheetOpen(true); }}>Filter</button>
          </div>
        </div>
      </div>

      {/* Layout: List + Sidebar */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-4 mt-3">
        {/* Main content */}
        <section className="md:col-span-8 xl:col-span-9 space-y-3">

          {/* Company-level summary */}
          {companyFilter !== 'all' && (
            <div className="mb-1 text-sm opacity-80">
              {companyFilter} – {sorted.length} applicant{sorted.length === 1 ? '' : 's'}
            </div>
          )}

          {/* List */}
          {sorted.length === 0 ? (
            <div className="card-kgamify p-8 text-center">
              <FaFileAlt className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <div className="font-medium">No applications found</div>
            </div>
          ) : (
            <div ref={scrollRootRef} className="md:max-h-[calc(100vh-260px)] overflow-auto pr-1">
              {view === 'table' ? (
        <div className="card-kgamify p-0 overflow-x-auto max-w-3xl">
                  <table className="w-full table-auto text-sm">
                    <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                      <tr>
                        <th className="text-left py-2 px-3">Name</th>
                        <th className="text-left py-2 px-3">Role</th>
                        <th className="text-left py-2 px-3">Status</th>
                        <th className="text-right py-2 px-3">Date</th>
                        <th className="text-right py-2 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.slice(0, itemsToShow).map(app => (
                        <tr key={app.id} className={isDarkMode ? 'border-t border-gray-800' : 'border-t border-gray-200'}>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2"><FaUser /> {app.applicantName}</div>
                          </td>
                          <td className="py-2 px-3">{app.jobTitle}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-xs ${app.status === 'shortlisted' ? 'bg-green-100 text-green-700' : app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{app.status || 'new'}</span>
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap">{new Date(app.appliedAt || app.createdAt).toLocaleDateString()}</td>
                          <td className="py-2 px-3 text-right">
                            <div className="inline-flex gap-2">
                              {app.resume && (
                                <a href={app.resume} target="_blank" rel="noreferrer" className="px-2 py-1 rounded border hover:bg-gray-50 dark:hover:bg-gray-800">View</a>
                              )}
                              <button
                                className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                                onClick={async () => {
                                  try {
                                    await shortlistApplication(app.id);
                                    setApps(prev => prev.map(x => x.id === app.id ? { ...x, status: 'shortlisted' } : x));
                                  } catch (e) { void e; }
                                }}
                              >
                                Shortlist
                              </button>
                              <button
                                className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                                onClick={async () => {
                                  try {
                                    if (!window.confirm('Reject this applicant?')) return;
                                    await rejectApplication(app.id);
                                    setApps(prev => prev.map(x => x.id === app.id ? { ...x, status: 'rejected' } : x));
                                  } catch (e) { void e; }
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sorted.length > itemsToShow && (
                    <div ref={sentinelRef} className="py-4 text-center opacity-70">Loading more…</div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 max-w-3xl">
                  {sorted.slice(0, itemsToShow).map(app => (
                    <div key={app.id} className="card-kgamify p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                              <FaUser /> <span>{app.applicantName}</span>
                            </div>
                            <div className="text-sm opacity-80">applied for</div>
                            <div className="text-sm sm:text-base font-medium">{app.jobTitle}</div>
                            {/* Removed 'at Company' per request */}
                          </div>
                          {Array.isArray(app.skills) && app.skills.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {app.skills.slice(0, 6).map((sk, idx) => (
                                <span key={idx} className="text-xxs sm:text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-200/60">{sk}</span>
                              ))}
                              {app.skills.length > 6 && (
                                <span className="text-xxs sm:text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 border border-gray-200/60">+{app.skills.length - 6}</span>
                              )}
                            </div>
                          )}
                          {app.resume && (
                            <div className="mt-1">
                              <a href={app.resume} target="_blank" rel="noreferrer" className="text-sm underline hover:text-kgamify-500">View Resume</a>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs sm:text-sm opacity-80">
                          <FaCalendarAlt className="h-4 w-4" />
                          <span>{new Date(app.appliedAt || app.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs sm:text-sm flex items-center gap-3">
                          <span>
                            Status: <span className={`px-2 py-0.5 rounded ${app.status === 'shortlisted' ? 'bg-green-100 text-green-700' : app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{app.status || 'new'}</span>
                          </span>
                          {app.testScore && (
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700">Score: {app.testScore}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700" onClick={async () => {
                            try { await shortlistApplication(app.id); setApps(prev => prev.map(x => x.id === app.id ? { ...x, status: 'shortlisted' } : x)); } catch (e) { void e; }
                          }}>Shortlist</button>
                          <button className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700" onClick={async () => {
                            try { if (!window.confirm('Reject this applicant?')) return; await rejectApplication(app.id); setApps(prev => prev.map(x => x.id === app.id ? { ...x, status: 'rejected' } : x)); } catch (e) { void e; }
                          }}>Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {sorted.length > itemsToShow && (
                    <div ref={sentinelRef} className="py-6 text-center opacity-70">Loading more...</div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Sidebar Filters (right) */}
  <aside className="hidden md:block md:col-span-4 xl:col-span-3">
          <div className="sticky top-4 space-y-3">
            {/* Quick Stats */}
            <div className="card-kgamify p-3 sm:p-4 max-w-xs ml-auto">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Total</span>
                  <span className="font-semibold">{statusStats.total}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">New</span>
                  <span>{statusStats.new}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded bg-green-100 text-green-800">Shortlisted</span>
                  <span>{statusStats.shortlisted}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-800">Rejected</span>
                  <span>{statusStats.rejected}</span>
                </div>
              </div>
            </div>
            <div className="card-kgamify p-3 sm:p-4 max-w-xs ml-auto">
              <div className="grid grid-cols-1 gap-3">
                <div className="max-w-[220px]">
                  <label className="block text-xs mb-1">Sort by</label>
                  <div className="flex gap-2 flex-wrap text-xs">
                    <button className={`px-2 py-1 rounded border ${sortBy === 'nameAsc' ? 'bg-[#ff8200] text-white border-[#ff8200]' : (isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')}`} onClick={() => setSortBy('nameAsc')}>
                      <FaSortAlphaDown className="inline mr-1" /> A–Z
                    </button>
                    <button className={`px-2 py-1 rounded border ${sortBy === 'nameDesc' ? 'bg-[#ff8200] text-white border-[#ff8200]' : (isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')}`} onClick={() => setSortBy('nameDesc')}>
                      <FaSortAmountDown className="inline mr-1" /> Z–A
                    </button>
                    <button className={`px-2 py-1 rounded border ${sortBy === 'dateDesc' ? 'bg-[#ff8200] text-white border-[#ff8200]' : (isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')}`} onClick={() => setSortBy('dateDesc')}>Newest</button>
                    <button className={`px-2 py-1 rounded border ${sortBy === 'dateAsc' ? 'bg-[#ff8200] text-white border-[#ff8200]' : (isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')}`} onClick={() => setSortBy('dateAsc')}>Oldest</button>
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
                <div>
                  <label className="block text-xs mb-1">Date range</label>
                  <select value={dateRange} onChange={e => setDateRange(e.target.value)} className={`w-full py-2 px-3 rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                    <option value="all">All time</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1">Min test score</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={minScore}
                    onChange={e => setMinScore(e.target.value)}
                    className={`w-full py-2 px-3 rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="e.g. 70"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Skills (text)</label>
                  <input
                    value={skillQuery}
                    onChange={e => setSkillQuery(e.target.value)}
                    className={`w-full py-2 px-3 rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="e.g. React, Node"
                  />
                </div>
              </div>
            </div>
            {topSkills.length > 0 && (
              <div className="card-kgamify p-3 sm:p-4 max-w-xs ml-auto">
                <div className="text-xs mb-2">Top skills</div>
                <div className="flex flex-wrap gap-2">
                  {topSkills.map(([skill, count]) => {
                    const active = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        className={`text-xs px-2 py-1 rounded border ${active ? 'bg-[#ff8200] text-white border-[#ff8200]' : (isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')}`}
                        onClick={() => {
                          setSelectedSkills(prev => active ? prev.filter(s => s !== skill) : [...prev, skill]);
                        }}
                        title={`${count} applicant${count === 1 ? '' : 's'}`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                  {selectedSkills.length > 0 && (
                    <button
                      className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700"
                      onClick={() => setSelectedSkills([])}
                    >
                      Clear skills
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

      </div>

      {/* Mobile Sort/Filter Sheet */}
      {mobileSheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSheetOpen(false)} />
          <div className={`absolute bottom-0 left-0 right-0 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'} rounded-t-2xl p-4 max-h-[85vh] overflow-auto shadow-2xl`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <button className={`px-3 py-1 rounded border ${mobileSheetTab === 'sort' ? 'bg-[#ff8200] text-white border-[#ff8200]' : ''}`} onClick={() => setMobileSheetTab('sort')}>Sort</button>
                <button className={`px-3 py-1 rounded border ${mobileSheetTab === 'filters' ? 'bg-[#ff8200] text-white border-[#ff8200]' : ''}`} onClick={() => setMobileSheetTab('filters')}>Filters</button>
              </div>
              <button className="px-3 py-1 rounded border" onClick={() => setMobileSheetOpen(false)}>Close</button>
            </div>
            {mobileSheetTab === 'sort' ? (
              <div className="grid grid-cols-2 gap-2">
                <button className={`px-3 py-2 rounded border ${sortBy === 'nameAsc' ? 'bg-[#ff8200] text-white border-[#ff8200]' : ''}`} onClick={() => setSortBy('nameAsc')}>A–Z</button>
                <button className={`px-3 py-2 rounded border ${sortBy === 'nameDesc' ? 'bg-[#ff8200] text-white border-[#ff8200]' : ''}`} onClick={() => setSortBy('nameDesc')}>Z–A</button>
                <button className={`px-3 py-2 rounded border ${sortBy === 'dateDesc' ? 'bg-[#ff8200] text-white border-[#ff8200]' : ''}`} onClick={() => setSortBy('dateDesc')}>Newest</button>
                <button className={`px-3 py-2 rounded border ${sortBy === 'dateAsc' ? 'bg-[#ff8200] text-white border-[#ff8200]' : ''}`} onClick={() => setSortBy('dateAsc')}>Oldest</button>
              </div>
            ) : (
              <div className="space-y-3">
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
                <div>
                  <label className="block text-xs mb-1">Date range</label>
                  <select value={dateRange} onChange={e => setDateRange(e.target.value)} className={`w-full py-2 px-3 rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                    <option value="all">All time</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1">Min test score</label>
                  <input type="number" min="0" max="100" step="1" value={minScore} onChange={e => setMinScore(e.target.value)} className={`w-full py-2 px-3 rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} placeholder="e.g. 70" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Skills (text)</label>
                  <input value={skillQuery} onChange={e => setSkillQuery(e.target.value)} className={`w-full py-2 px-3 rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} placeholder="e.g. React, Node" />
                </div>
                {topSkills.length > 0 && (
                  <div>
                    <div className="text-xs mb-2">Top skills</div>
                    <div className="flex flex-wrap gap-2">
                      {topSkills.map(([skill, count]) => {
                        const active = selectedSkills.includes(skill);
                        return (
                          <button key={skill} className={`text-xs px-2 py-1 rounded border ${active ? 'bg-[#ff8200] text-white border-[#ff8200]' : (isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')}`} onClick={() => setSelectedSkills(prev => active ? prev.filter(s => s !== skill) : [...prev, skill])} title={`${count} applicant${count === 1 ? '' : 's'}`}>
                            {skill}
                          </button>
                        );
                      })}
                      {selectedSkills.length > 0 && (
                        <button className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700" onClick={() => setSelectedSkills([])}>Clear skills</button>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button className="px-3 py-2 rounded border" onClick={() => setMobileSheetOpen(false)}>Done</button>
                  <button className="px-3 py-2 rounded border" onClick={() => { setSelectedSkills([]); setSkillQuery(''); setCompanyFilter('all'); setStatusFilter('all'); setDateRange('all'); setMinScore(''); }}>Clear</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

Applications.propTypes = {
  isDarkMode: PropTypes.bool,
};
