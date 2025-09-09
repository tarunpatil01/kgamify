import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FaCheckCircle, 
  FaTimesCircle,
  FaBriefcase,
  FaUsers,
  FaEye,
  FaMapMarkerAlt,
  FaDollarSign,
  FaCalendarAlt
} from "react-icons/fa";
import DashboardImage from "../assets/dashboard.png";
import { fetchJobs } from "../store/slices/jobsSlice";
import { 
  selectJobs, 
  selectJobsLoading, 
  selectJobsError
} from "../store/slices/jobsSlice";
import LoadingSpinner from "../components/LoadingSpinner";
import { getJobs } from "../api"; // Add direct API import for testing

const Dashboard = ({ isDarkMode, email = null, userCompany = null }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const jobs = useSelector(selectJobs);
  const loading = useSelector(selectJobsLoading);
  const error = useSelector(selectJobsError);
  // Local state
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [directAPIJobs, setDirectAPIJobs] = useState([]); // Test direct API like JobPosted
  const [initialWaitOver, setInitialWaitOver] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    // Fetch jobs when component mounts
    // If viewing a company dashboard, fetch only that company's jobs with a smaller limit for faster response
    const params = email
      ? { page: 1, limit: 12, filters: { email } }
      : { page: 1, limit: 50 };
    dispatch(fetchJobs(params));
  }, [dispatch, email]);

  // So the UI doesn't stay blocked by a slow request (new companies may have 0 jobs),
  // stop showing the initial full-screen loader after a short grace period
  useEffect(() => {
    const t = setTimeout(() => setInitialWaitOver(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Test direct API call like JobPosted does
  useEffect(() => {
    const testDirectAPI = async () => {
      try {
        // Try the same approach as JobPosted
        const response = await getJobs(email ? { email } : {});
        // Normalize to array regardless of API shape
        const normalized = Array.isArray(response?.jobs)
          ? response.jobs
          : Array.isArray(response)
            ? response
            : [];
        setDirectAPIJobs(normalized);
      } catch {
        // ignore
      }
    };
    testDirectAPI();
  }, [email]);

  useEffect(() => {
    // Filter company-specific jobs if email is provided
    if (email && jobs && jobs.length > 0) {
      const companySpecificJobs = jobs.filter(job => 
        job.company?.email === email || job.createdBy === email
      );
      setCompanyJobs(companySpecificJobs);
    }
  }, [jobs, email]);

  // Prepare list for display (no search/filters here)
  useEffect(() => {
    // Choose data source: use direct API if Redux is empty
    let baseJobs;
    
    if (email) {
      // For company dashboard, filter jobs by company email
      if (companyJobs && companyJobs.length > 0) {
        baseJobs = companyJobs;
      } else if (directAPIJobs && directAPIJobs.length > 0) {
        // Filter direct API jobs by company email - use correct field
        baseJobs = directAPIJobs.filter(job => {
          return job.companyEmail === email;
        });
      } else {
        baseJobs = [];
      }
    } else {
      // For general dashboard, show all jobs
      baseJobs = (jobs && jobs.length > 0) ? jobs : (directAPIJobs || []);
    }
    
    // Default sort: newest first by createdAt/datePosted
    const sorted = [...baseJobs].sort((a, b) => {
      const aDate = new Date(a.createdAt || a.datePosted || a.postedAt || 0);
      const bDate = new Date(b.createdAt || b.datePosted || b.postedAt || 0);
      return bDate - aDate;
    });

    setFilteredJobs(sorted);
  }, [jobs, companyJobs, directAPIJobs, email]);

  // Safety checks for arrays
  const safeFilteredJobs = filteredJobs || [];

  // Use filteredJobs as the primary source (now includes direct API fallback)
  const displayJobs = safeFilteredJobs;
  
  const totalJobs = displayJobs.length;

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentJobs = displayJobs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(displayJobs.length / itemsPerPage);
  
  // Only count applications for displayed jobs
  const totalApplications = displayJobs.reduce(
    (acc, job) => acc + (job.applicants?.length || 0), 
    0
  );

  // Calculate additional statistics
  const activeJobs = displayJobs.filter(job => job.status === "active").length;
  const recentJobs = displayJobs.filter(job => {
    const jobDate = new Date(job.createdAt || job.datePosted);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return jobDate >= weekAgo;
  }).length;

  // Only block the screen if we're still loading AND have no data yet AND grace period not over
  const hasAnyData = (jobs && jobs.length > 0) || (directAPIJobs && directAPIJobs.length > 0);
  const showSkeletons = loading && !hasAnyData && initialWaitOver;
  if (loading && !hasAnyData && !initialWaitOver) {
    return (
      <LoadingSpinner 
        fullScreen 
        text="Loading dashboard data..." 
        className={isDarkMode ? "bg-gray-900" : "bg-gray-100"} 
      />
    );
  }

  // Company banner colors and logo fallback
  const companyBannerBg = isDarkMode
    ? "bg-gradient-to-r from-gray-900 to-[#ff8200]"
    : "bg-gradient-to-r from-[#ff8200] to-[#ffb347]";
  const cleanDescription = userCompany?.description
    ? String(userCompany.description).replace(/<[^>]+>/g, '')
    : '';
  const companyLogo = userCompany?.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userCompany?.companyName || "Company")}&background=ff8200&color=fff&size=128`;

  return (
    <div
      className={`min-h-screen py-10 px-2 sm:px-6 lg:px-8 flex flex-col items-center ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
          : "bg-gradient-to-br from-orange-50 via-white to-orange-100 text-black"
      }`}
    >
      {/* Company Banner */}
      <div
        className={`w-full max-w-6xl mx-auto mb-8 rounded-3xl shadow-2xl border-0 ${companyBannerBg} flex flex-col md:flex-row items-center justify-between p-6 sm:p-8`}
      >
        <div className="flex items-center gap-6">
          <img
            src={companyLogo}
            alt="Company Logo"
            className="w-24 h-24 rounded-2xl shadow-lg border-4 border-white bg-white object-cover"
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-lg mb-1">
              {userCompany?.companyName || "Company Dashboard"}
            </h1>
            <div className="text-white/90 font-medium text-sm sm:text-base">
              {userCompany?.industry && ( 
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white font-semibold mr-2">
                  {userCompany.industry}
                </span>
              )}
              {userCompany?.location && (
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white font-semibold">
                  {userCompany.location}
                </span>
              )}
            </div>
            {cleanDescription && (
              <p className="mt-2 text-white/85 text-sm sm:text-base max-w-xl line-clamp-2">{cleanDescription}</p>
            )}
          </div>
        
        <img
          className="hidden md:block w-28 h-28 lg:w-44 lg:h-44 rounded-xl object-contain opacity-90"
          src={DashboardImage}
          alt="Dashboard"
        />
        </div>
      </div>

      {/* Account Status Banner (Approved) */}
      {(userCompany?.status === 'approved' || userCompany?.approved) && (
        <div className="w-full max-w-6xl mx-auto mb-8">
          <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-green-900/20 border-green-700 text-green-200' : 'bg-green-50 border-green-200 text-green-900'}`}>
            <div className="font-semibold">Account active</div>
            <div className="text-sm">Your company account is approved and in good standing. Need anything from admin? See <a href="/messages" className="underline text-[#ff8200]">Messages</a>.</div>
          </div>
        </div>
      )}

      {/* Job Statistics */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <div className={`rounded-2xl shadow-xl border p-8 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-orange-200'} flex flex-col items-center`}>
          <FaBriefcase className="text-4xl text-[#ff8200] mb-3" />
          <div className="text-base font-semibold mb-1">Total Jobs</div>
          <div className="text-3xl font-extrabold text-[#ff8200]">{totalJobs}</div>
        </div>
        <div className={`rounded-2xl shadow-xl border p-8 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-orange-200'} flex flex-col items-center`}>
          <FaUsers className="text-4xl text-blue-500 mb-3" />
          <div className="text-base font-semibold mb-1">Total Applications</div>
          <div className="text-3xl font-extrabold text-blue-500">{totalApplications}</div>
        </div>
        <div className={`rounded-2xl shadow-xl border p-8 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-orange-200'} flex flex-col items-center`}>
          <FaCheckCircle className="text-4xl text-[#ff8200] mb-3" />
          <div className="text-base font-semibold mb-1">Active Jobs</div>
          <div className="text-3xl font-extrabold text-[#ff8200]">{activeJobs}</div>
        </div>
        <div className={`rounded-2xl shadow-xl border p-8 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-orange-200'} flex flex-col items-center`}>
          <FaCalendarAlt className="text-4xl text-blue-500 mb-3" />
          <div className="text-base font-semibold mb-1">This Week</div>
          <div className="text-3xl font-extrabold text-blue-500">{recentJobs}</div>
        </div>
      </div>

      {/* Recent Job Posts */}
  <div className={`w-full max-w-6xl mx-auto rounded-3xl shadow-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-orange-200'} p-8 sm:p-12`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-[#ff8200] to-[#ffb347] bg-clip-text text-transparent drop-shadow-lg">
            Recent Job Posts
          </h2>
        </div>
        {/* Results Summary */}
        {!showSkeletons && (
          <div className="mb-6 text-base font-semibold">
            Showing {currentJobs.length} of {displayJobs.length} jobs
          </div>
        )}
        {error && !showSkeletons && (
          <div className="mt-3 sm:mt-4 p-4 rounded bg-red-100 dark:bg-red-900/20">
            <p className="text-red-500 dark:text-red-400 text-base">{error}</p>
            {error.includes("No listed jobs") && (
              <div className="mt-2">
                <p className="text-sm">
                  It appears that some jobs in the database may be missing the company email field.
                  Contact your administrator to run the fix-jobs script.
                </p>
                <div className="mt-2">
                  <Link to="/post-job">
                    <button className="btn-primary px-4 py-2 text-base">
                      Post a New Job
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Skeleton cards while loading */}
        {showSkeletons && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse p-8"
              >
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-blue-100 dark:bg-blue-900 rounded w-20 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            ))}
          </div>
        )}
        {!showSkeletons && !error && displayJobs.length === 0 && (
          <div className="text-center py-12">
            <FaBriefcase className="mx-auto h-16 w-16 text-gray-400 mb-6" />
            <p className="mb-6 font-semibold text-lg">No jobs posted yet.</p>
            <Link to="/post-job">
              <button className="btn-primary bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white px-8 py-4 rounded-xl font-bold shadow-lg text-xl hover:from-[#e57400] hover:to-[#ffb347]">
                Post Your First Job
              </button>
            </Link>
          </div>
        )}
        {!showSkeletons && !error && displayJobs.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {currentJobs.map((job) => (
                <div
                  key={`job-${job._id}`}
                  className={`rounded-2xl shadow-xl border ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-orange-200 bg-white'} transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 cursor-pointer p-8`}
                  onClick={() => navigate(`/job/${job._id}`)}
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-xl text-[#ff8200] dark:text-[#ff8200] hover:text-[#e57400] line-clamp-2">
                        {job.jobTitle}
                      </h3>
                      {job.category && (
                        <span className="inline-block px-3 py-1 text-sm rounded bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 mt-3">
                          {job.category}
                        </span>
                      )}
                    </div>
                    <div className="ml-4">
                      {job.status === "active" ? (
                        <span className="flex items-center text-[#ff8200]">
                          <FaCheckCircle className="h-6 w-6" />
                        </span>
                      ) : (
                        <span className="flex items-center text-gray-400">
                          <FaTimesCircle className="h-6 w-6" />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center font-medium">
                      <FaMapMarkerAlt className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                      <span className="text-base">{job.location}</span>
                    </div>
                    <div className="flex items-center font-medium">
                      <FaBriefcase className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                        {job.employmentType}
                      </span>
                    </div>
                    <div className="flex items-center font-medium">
                      <FaDollarSign className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                      <span className="text-base font-medium">{job.salary}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-5 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <FaUsers className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium">{job.applicants?.length || 0} applications</span>
                    </div>
                    <div className="flex items-center">
                      <FaCalendarAlt className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm">{new Date(job.createdAt || job.datePosted).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/job/${job._id}`);
                      }}
                      className="w-full px-5 py-3 bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white rounded-xl font-bold shadow hover:from-[#e57400] hover:to-[#ffb347] flex items-center justify-center text-base"
                    >
                      <FaEye className="h-5 w-5 mr-2" />
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination */}
            {!showSkeletons && totalPages > 1 && (
              <div className="mt-10 flex items-center justify-between">
                <div className="text-base text-gray-700 dark:text-gray-300 font-semibold">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, displayJobs.length)} of {displayJobs.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 text-gray-700 dark:text-gray-300"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-4 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md transition-all duration-200 ${
                            currentPage === pageNumber
                              ? 'bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white border-[#ff8200]'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return <span key={pageNumber} className="px-2">...</span>;
                    }
                    return null;
                  })}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 text-gray-700 dark:text-gray-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

Dashboard.propTypes = {
  isDarkMode: PropTypes.bool.isRequired,
  email: PropTypes.string,
  userCompany: PropTypes.object
};

export default Dashboard;