import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FaCheckCircle, 
  FaTimesCircle,
  FaSearch,
  FaFilter,
  FaBriefcase,
  FaUsers,
  FaEye,
  FaMapMarkerAlt,
  FaDollarSign,
  FaCalendarAlt
} from "react-icons/fa";
import DashboardImage from "../assets/dashboard.png";
import { fetchJobs, setSortBy } from "../store/slices/jobsSlice";
import { 
  selectJobs, 
  selectJobsLoading, 
  selectJobsError,
  selectSortBy,
  selectSortOrder
} from "../store/slices/jobsSlice";
import LoadingSpinner from "../components/LoadingSpinner";
import { getJobs } from "../api"; // Add direct API import for testing

const Dashboard = ({ isDarkMode, email = null, userCompany = null }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const jobs = useSelector(selectJobs);
  const loading = useSelector(selectJobsLoading);
  const error = useSelector(selectJobsError);
  const sortBy = useSelector(selectSortBy);
  const sortOrder = useSelector(selectSortOrder);
  
  // Local state for filtering and search
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [directAPIJobs, setDirectAPIJobs] = useState([]); // Test direct API like JobPosted

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    // Fetch jobs when component mounts
    dispatch(fetchJobs({ page: 1, limit: 50 }));
  }, [dispatch]);

  // Test direct API call like JobPosted does
  useEffect(() => {
    const testDirectAPI = async () => {
      try {
        // Try the same approach as JobPosted
        const response = await getJobs(email ? { email } : {});
        setDirectAPIJobs(response || []);
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

  // Filter and search logic
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
    
    let filtered = [...baseJobs]; // Always start with base jobs

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.employmentType?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(job => job.employmentType === typeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "datePosted":
          aValue = new Date(a.createdAt || a.datePosted);
          bValue = new Date(b.createdAt || b.datePosted);
          break;
        case "title":
          aValue = a.jobTitle?.toLowerCase();
          bValue = b.jobTitle?.toLowerCase();
          break;
        case "location":
          aValue = a.location?.toLowerCase();
          bValue = b.location?.toLowerCase();
          break;
        case "applications":
          aValue = a.applicants?.length || 0;
          bValue = b.applicants?.length || 0;
          break;
        default:
          aValue = a.jobTitle?.toLowerCase();
          bValue = b.jobTitle?.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredJobs(filtered);
  }, [jobs, companyJobs, directAPIJobs, email, searchQuery, statusFilter, typeFilter, sortBy, sortOrder]);

  // Safety checks for arrays
  const safeFilteredJobs = filteredJobs || [];
  const safeJobs = jobs || [];
  const safeCompanyJobs = companyJobs || [];

  // Get unique employment types for filter dropdown
  const employmentTypes = [...new Set((email ? safeCompanyJobs : safeJobs).map(job => job.employmentType).filter(Boolean))];

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

  if (loading) {
    return (
      <LoadingSpinner 
        fullScreen 
        text="Loading dashboard data..." 
        className={isDarkMode ? "bg-gray-900" : "bg-gray-100"} 
      />
    );
  }

  return (
    <div
      className={`flex flex-col p-1 sm:p-2 md:p-4 min-h-screen dashboard-spacing ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div className="flex-0">
  <div className={`rounded-lg flex md:flex-row justify-between items-center p-2 sm:p-3 md:p-5 ${isDarkMode ? "bg-gray-800 text-white" : "bg-kgamify-500 text-white"}`}>
          <div className="flex flex-col text-center md:text-left mb-2 md:mb-0 md:ml-5">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light">Welcome To kgamify Job Portal</h1>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light">
              {userCompany?.companyName || "Company Dashboard"}
            </h1>
          </div>
          <img className="w-20 sm:w-24 md:w-32 lg:w-64 h-16 sm:h-20 md:h-24 lg:h-48 rounded-xl md:mr-5" src={DashboardImage} alt="Dashboard" />
        </div>
      </div>

      {/* Job Statistics */}
      <div className="mt-2 sm:mt-4 md:mt-6 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
        <div className="card-kgamify p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className=" text-xs sm:text-sm font-semibold">Total Jobs</p>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-kgamify-500">{totalJobs}</h2>
            </div>
            <div className="p-2 sm:p-3 bg-kgamify-100 dark:bg-kgamify-900 rounded-full">
              <FaBriefcase className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-kgamify-500" />
            </div>
          </div>
        </div>

        <div className="card-kgamify p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold">Total Applications</p>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-kgamify-pink-500">{totalApplications}</h2>
            </div>
            <div className="p-2 sm:p-3 bg-kgamify-pink-100 dark:bg-kgamify-pink-900 rounded-full">
              <FaUsers className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-kgamify-pink-500" />
            </div>
          </div>
        </div>

        <div className="card-kgamify p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold">Active Jobs</p>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-green-500">{activeJobs}</h2>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <FaCheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="card-kgamify p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold">This Week</p>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-blue-500">{recentJobs}</h2>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <FaCalendarAlt className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Job Posts */}
      <div className="card-kgamify mt-2 sm:mt-4 md:mt-6 p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-0 ">Recent Job Posts</h2>
          
          {/* Search and Filter Controls */}
          <div className="pt-5 flex sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-kgamify pl-10 pr-4 py-2 text-sm w-full sm:w-64"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary px-3 py-2 text-sm flex items-center ${showFilters ? 'bg-kgamify-100 dark:bg-kgamify-900' : ''}`}
            >
              <FaFilter className="mr-2 h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-kgamify w-full text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Employment Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="input-kgamify w-full text-sm"
                >
                  <option value="all">All Types</option>
                  {employmentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    dispatch(setSortBy({ sortBy: field, sortOrder: order }));
                  }}
                  className="input-kgamify w-full text-sm"
                >
                  <option value="datePosted-desc">Newest First</option>
                  <option value="datePosted-asc">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="applications-desc">Most Applications</option>
                  <option value="applications-asc">Least Applications</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                  dispatch(setSortBy({ sortBy: "datePosted", sortOrder: "desc" }));
                }}
                className="text-sm text-kgamify-500 hover:text-kgamify-600"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Results Summary */}
  <div className="mb-4 text-sm font-semibold">
          Showing {currentJobs.length} of {displayJobs.length} jobs
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
        {error && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded bg-red-100 dark:bg-red-900/20">
            <p className="text-red-500 dark:text-red-400 text-sm sm:text-base">{error}</p>
            {error.includes("No listed jobs") && (
              <div className="mt-2">
                <p className="text-xs sm:text-sm ">
                  It appears that some jobs in the database may be missing the company email field.
                  Contact your administrator to run the fix-jobs script.
                </p>
                <div className="mt-2">
                  <Link to="/post-job">
                    <button className="btn-primary px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base">
                      Post a New Job
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {!error && displayJobs.length === 0 && !searchQuery && statusFilter === "all" && typeFilter === "all" && (
          <div className="text-center py-8">
            <FaBriefcase className="mx-auto h-12 w-12 text-gray-500 dark:text-gray-400 mb-4" />
            <p className=" mb-4 font-medium">No jobs posted yet.</p>
            <Link to="/post-job">
              <button className="btn-primary">Post Your First Job</button>
            </Link>
          </div>
        )}

        {!error && displayJobs.length === 0 && (searchQuery || statusFilter !== "all" || typeFilter !== "all") && (
          <div className="text-center py-8">
            <FaSearch className="mx-auto h-12 w-12 text-gray-500 dark:text-gray-400 mb-4" />
            <p className="text-gray-700 dark:text-gray-300 mb-2 font-medium">No jobs match your search criteria</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setTypeFilter("all");
              }}
              className="text-kgamify-500 hover:text-kgamify-600 text-sm"
            >
              Clear filters to see all jobs
            </button>
          </div>
        )}

        {!error && displayJobs.length > 0 && (
          <>
            {/* Unified responsive grid so laptop and mobile both show jobs */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              {currentJobs.map((job) => (
                <div
                  key={`job-${job._id}`}
                  className="card-kgamify transition-all duration-200 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-kgamify-300 dark:hover:border-kgamify-600 hover:shadow-md md:hover:shadow-lg cursor-pointer p-4 md:p-6 bg-white hover:bg-gray-50 dark:bg-gray-800/95 dark:hover:bg-gray-800"
                  onClick={() => navigate(`/job/${job._id}`)}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base md:text-lg text-kgamify-500 dark:text-kgamify-500 hover:text-kgamify-600 line-clamp-2">
                        {job.jobTitle}
                      </h3>
                      {job.category && (
                        <span className="inline-block px-2 py-1 text-[11px] md:text-xs rounded bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 mt-2">
                          {job.category}
                        </span>
                      )}
                    </div>
                    <div className="ml-4">
                      {job.status === "active" ? (
                        <span className="flex items-center text-green-600 dark:text-green-400">
                          <FaCheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600 dark:text-red-400">
                          <FaTimesCircle className="h-4 w-4 md:h-5 md:w-5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
                    <div className="flex items-center font-medium">
                      <FaMapMarkerAlt className="h-3 w-3 md:h-4 md:w-4 mr-2 md:mr-3 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm">{job.location}</span>
                    </div>
                    <div className="flex items-center font-medium">
                      <FaBriefcase className="h-3 w-3 md:h-4 md:w-4 mr-2 md:mr-3 text-gray-600 dark:text-gray-400" />
                      <span className="px-2 py-0.5 md:py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-[11px] md:text-xs">
                        {job.employmentType}
                      </span>
                    </div>
                    <div className="flex items-center font-medium">
                      <FaDollarSign className="h-3 w-3 md:h-4 md:w-4 mr-2 md:mr-3 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium">{job.salary}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <FaUsers className="h-3 w-3 md:h-4 md:w-4 mr-2 text-gray-600 dark:text-gray-400" />
                      <span className="text-xs md:text-sm font-medium">{job.applicants?.length || 0} applications</span>
                    </div>
                    <div className="flex items-center">
                      <FaCalendarAlt className="h-3 w-3 mr-2 text-gray-600 dark:text-gray-400" />
                      <span className="text-xs">{new Date(job.createdAt || job.datePosted).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-3 md:mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/job/${job._id}`);
                      }}
                      className="w-full px-4 py-2 bg-kgamify-500 hover:bg-kgamify-600 text-white rounded-md transition-colors duration-200 flex items-center justify-center"
                    >
                      <FaEye className="h-4 w-4 mr-2" />
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/apply/${job._id}`);
                      }}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, displayJobs.length)} of {displayJobs.length} results
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 text-gray-700 dark:text-gray-300"
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
                          className={`px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md transition-all duration-200 ${
                            currentPage === pageNumber
                              ? 'bg-kgamify-500 text-white border-kgamify-500'
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
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 text-gray-700 dark:text-gray-300"
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