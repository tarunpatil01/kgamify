import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  FaCalendarAlt,
  FaFileAlt,
  FaSearch,
  FaSortAlphaDown,
  FaSortAmountDown,
  FaUser,
} from 'react-icons/fa';
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

    const companiesArr = Array.from(companyMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const topSkillsArr = Array.from(skillMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
    return {
      companies: companiesArr,
      topSkills: topSkillsArr,
      statusStats: statCounts,
    };
  }, [apps]);

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
      companyFilter === 'all'
        ? true
        : (a.companyName || '').toLowerCase() === companyFilter.toLowerCase()
    )
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
    companyFilter,
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
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
        : "bg-gradient-to-br from-orange-50 via-white to-orange-100 text-black"
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
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-70">View:</span>
          {["table", "cards"].map((mode) => (
            <button
              key={mode}
              className={`px-3 py-1.5 rounded-lg border text-sm transition ${
                view === mode
                  ? "bg-[#ff8200] text-white border-[#ff8200] shadow"
                  : isDarkMode
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              onClick={() => setView(mode)}
            >
              {mode[0].toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Active filter chips */}
      {(companyFilter !== "all" ||
        statusFilter !== "all" ||
        dateRange !== "all" ||
        minScore !== "" ||
        skillQuery.trim() ||
        selectedSkills.length) && (
        <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
          {companyFilter !== "all" && (
            <button className="chip" onClick={() => setCompanyFilter("all")}>
              Company: {companyFilter} ×
            </button>
          )}
          {statusFilter !== "all" && (
            <button className="chip" onClick={() => setStatusFilter("all")}>
              Status: {statusFilter} ×
            </button>
          )}
          {dateRange !== "all" && (
            <button className="chip" onClick={() => setDateRange("all")}>
              Date: {dateRange} ×
            </button>
          )}
          {minScore !== "" && (
            <button className="chip" onClick={() => setMinScore("")}>
              Min score: {minScore} ×
            </button>
          )}
          {skillQuery.trim() && (
            <button className="chip" onClick={() => setSkillQuery("")}>
              Skill: {skillQuery} ×
            </button>
          )}
          {selectedSkills.map((sk) => (
            <button
              key={sk}
              className="chip"
              onClick={() =>
                setSelectedSkills((prev) => prev.filter((s) => s !== sk))
              }
            >
              {sk} ×
            </button>
          ))}
          <button
            className="ml-auto text-xs px-3 py-1.5 rounded-lg border bg-white/60 dark:bg-gray-800"
            onClick={() => {
              setCompanyFilter("all");
              setStatusFilter("all");
              setDateRange("all");
              setMinScore("");
              setSkillQuery("");
              setSelectedSkills([]);
            }}
          >
            Reset
          </button>
        </div>
      )}

      {/* Mobile actions: Sort | Filter */}
      <div className="w-full flex items-center gap-2 md:hidden px-4 pb-3">
        <button
          className="flex-1 px-3 py-2 rounded border bg-white dark:bg-gray-800"
          onClick={() => {
            setMobileSheetTab("sort");
            setMobileSheetOpen(true);
          }}
        >
          Sort
        </button>
        <button
          className="flex-1 px-3 py-2 rounded border bg-white dark:bg-gray-800"
          onClick={() => {
            setMobileSheetTab("filters");
            setMobileSheetOpen(true);
          }}
        >
          Filter
        </button>
      </div>
    </div>

    {/* Layout: List + Sidebar */}
    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-5">
      {/* Main Section */}
      <section className="md:col-span-8 xl:col-span-9 space-y-4">
        {/* Company summary */}
        {companyFilter !== "all" && (
          <div className="text-sm opacity-80">
            {companyFilter} – {sorted.length} applicant
            {sorted.length === 1 ? "" : "s"}
          </div>
        )}

        {/* Table / Cards */}
        {sorted.length === 0 ? (
          <div className="card-kgamify p-10 text-center">
            <FaFileAlt className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <div className="font-medium">No applications found</div>
          </div>
        ) : (
          <div
            ref={scrollRootRef}
            className="md:max-h-[calc(100vh-260px)] overflow-auto pr-1"
          >
            {view === "table" ? (
              /* keep your table code here */
              <></>
            ) : (
              /* keep your card view code here */
              <></>
            )}
          </div>
        )}
      </section>

      {/* Sidebar */}
      <aside className="hidden md:block md:col-span-4 xl:col-span-3">
        <div className="sticky top-20 space-y-4">
          {/* keep your sidebar filters + stats code here */}
        </div>
      </aside>
    </div>
  </div>
)};
