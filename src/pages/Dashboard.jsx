import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';
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
  FaCalendarAlt,
  FaSortUp,
  FaSortDown,
  FaSort
} from "react-icons/fa";
import DashboardImage from "../assets/dashboard.png";
import { getJobs } from "../api";

const Dashboard = ({ isDarkMode, email = null }) => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("datePosted");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        console.log("Fetching jobs with email:", email);
        
        // If email is available, fetch company-specific jobs first
        if (email) {
          console.log("Making API call to fetch jobs with company email:", email);
          const companyJobsResponse = await getJobs({email});
          console.log("Company jobs received:", companyJobsResponse);
          
          if (companyJobsResponse && companyJobsResponse.length > 0) {
            setError(null);
            setCompanyJobs(companyJobsResponse);
            // Also set these as general jobs for the recent jobs list
            setJobs(companyJobsResponse);
          } else {
            console.log("No jobs found for this company email");
            setCompanyJobs([]);
            setError("No listed jobs were found by your company");
            
            // Get all jobs for the recent jobs list if no company jobs
            const allJobsResponse = await getJobs();
            console.log("All jobs received:", allJobsResponse);
            setJobs(allJobsResponse || []);
          }
        } else {
          // No email - get all jobs
          const allJobsResponse = await getJobs();
          console.log("All jobs received:", allJobsResponse);
          setJobs(allJobsResponse || []);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        setError("Error connecting to server. Please try again.");
        setJobs([]);
        setCompanyJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [email]);

  // Filter and search logic
  useEffect(() => {
    let filtered = email ? companyJobs : jobs;

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
  }, [jobs, companyJobs, email, searchQuery, statusFilter, typeFilter, sortBy, sortOrder]);

  // Get unique employment types for filter dropdown
  const employmentTypes = [...new Set((email ? companyJobs : jobs).map(job => job.employmentType).filter(Boolean))];

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="ml-1 opacity-50" />;
    return sortOrder === "asc" ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />;
  };

  // Use filteredJobs for statistics when search/filter is active
  const displayJobs = filteredJobs.length > 0 || searchQuery || statusFilter !== "all" || typeFilter !== "all" ? filteredJobs : (email ? companyJobs : jobs);
  const totalJobs = displayJobs.length;
  
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
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
        <p className="text-xl">Loading dashboard data...</p>
      </div>
    );
  }

  return (

    
    <div className={`flex flex-col p-1 sm:p-2 md:p-4 min-h-screen dashboard-spacing ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className="flex-0">
        <div className={`rounded-lg flex flex-col md:flex-row justify-between items-center p-2 sm:p-3 md:p-5 ${isDarkMode ? "bg-gray-800 text-white" : "bg-kgamify-500 text-white"}`}>
          <div className="text-center md:text-left mb-2 md:mb-0 md:ml-5">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light">Welcome To kgamify Job Portal</h1>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light">Company Name</h1>
          </div>
          <img className="w-20 sm:w-24 md:w-32 lg:w-64 h-16 sm:h-20 md:h-24 lg:h-48 rounded-xl md:mr-5" src={DashboardImage} alt="Dashboard" />
        </div>
      </div>

      {/* Job Statistics */}
      <div className="mt-2 sm:mt-4 md:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
        <div className="card-kgamify p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total Jobs</p>
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
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total Applications</p>
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
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Active Jobs</p>
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
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">This Week</p>
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
          <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-0">Recent Job Posts</h2>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                    setSortBy(field);
                    setSortOrder(order);
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
                  setSortBy("datePosted");
                  setSortOrder("desc");
                }}
                className="text-sm text-kgamify-500 hover:text-kgamify-600"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {currentJobs.length} of {filteredJobs.length} jobs
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
        {error && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded bg-red-100 dark:bg-red-900/20">
            <p className="text-red-500 dark:text-red-400 text-sm sm:text-base">{error}</p>
            {error.includes("No listed jobs") && (
              <div className="mt-2">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
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

        {!error && filteredJobs.length === 0 && !searchQuery && statusFilter === "all" && typeFilter === "all" && (
          <div className="text-center py-8">
            <FaBriefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No jobs posted yet.</p>
            <Link to="/post-job">
              <button className="btn-primary">Post Your First Job</button>
            </Link>
          </div>
        )}

        {!error && filteredJobs.length === 0 && (searchQuery || statusFilter !== "all" || typeFilter !== "all") && (
          <div className="text-center py-8">
            <FaSearch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No jobs match your search criteria</p>
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

        {!error && filteredJobs.length > 0 && (
          <>
            {/* Mobile view - Enhanced card layout */}
            <div className="lg:hidden space-y-2 sm:space-y-3">
              {currentJobs.map((job) => (
                <div 
                  key={`job-mobile-${job._id}`} 
                  className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-kgamify-300 dark:hover:border-kgamify-600 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/job/${job._id}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm sm:text-base text-kgamify-500 dark:text-kgamify-500">{job.jobTitle}</h3>
                    <span className="flex items-center">
                      {job.status === "active" ? (
                        <FaCheckCircle className="text-green-500 h-4 w-4" />
                      ) : (
                        <FaTimesCircle className="text-red-500 h-4 w-4" />
                      )}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="h-3 w-3 mr-2" />
                      <span>{job.location}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <FaBriefcase className="h-3 w-3 mr-2" />
                      <span>{job.employmentType}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <FaDollarSign className="h-3 w-3 mr-2" />
                      <span>{job.salary}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FaUsers className="h-3 w-3 mr-2" />
                        <span>{job.applicants?.length || 0} applications</span>
                      </div>
                      <div className="flex items-center">
                        <FaCalendarAlt className="h-3 w-3 mr-2" />
                        <span>{new Date(job.createdAt || job.datePosted).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop view - Enhanced table layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th 
                      className="text-left p-3 font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center">
                        Job Title
                        {getSortIcon('title')}
                      </div>
                    </th>
                    <th className="text-left p-3 font-medium text-gray-900 dark:text-white">Type</th>
                    <th 
                      className="text-left p-3 font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('location')}
                    >
                      <div className="flex items-center">
                        Location
                        {getSortIcon('location')}
                      </div>
                    </th>
                    <th className="text-left p-3 font-medium text-gray-900 dark:text-white">Salary</th>
                    <th 
                      className="text-left p-3 font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('applications')}
                    >
                      <div className="flex items-center">
                        Applications
                        {getSortIcon('applications')}
                      </div>
                    </th>
                    <th className="text-left p-3 font-medium text-gray-900 dark:text-white">Status</th>
                    <th 
                      className="text-left p-3 font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('datePosted')}
                    >
                      <div className="flex items-center">
                        Date Posted
                        {getSortIcon('datePosted')}
                      </div>
                    </th>
                    <th className="text-left p-3 font-medium text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentJobs.map((job) => (
                    <tr
                      key={`job-${job._id}`}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-medium text-kgamify-500 dark:text-kgamify-500 hover:text-kgamify-600 cursor-pointer"
                             onClick={() => window.location.href = `/job/${job._id}`}>
                          {job.jobTitle}
                        </div>
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                          {job.employmentType}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <FaMapMarkerAlt className="h-3 w-3 mr-2" />
                          {job.location}
                        </div>
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <FaDollarSign className="h-3 w-3 mr-2" />
                          {job.salary}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <FaUsers className="h-3 w-3 mr-2 text-gray-400" />
                          <span className="text-gray-900 dark:text-white font-medium">
                            {job.applicants?.length || 0}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        {job.status === "active" ? (
                          <span className="flex items-center text-green-600 dark:text-green-400">
                            <FaCheckCircle className="h-4 w-4 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600 dark:text-red-400">
                            <FaTimesCircle className="h-4 w-4 mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400 text-sm">
                        {new Date(job.createdAt || job.datePosted).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <button 
                          onClick={() => window.location.href = `/job/${job._id}`}
                          className="text-kgamify-500 hover:text-kgamify-600 p-1"
                          title="View Details"
                        >
                          <FaEye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredJobs.length)} of {filteredJobs.length} results
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
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
                          className={`px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md ${
                            currentPage === pageNumber
                              ? 'bg-kgamify-500 text-white border-kgamify-500'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
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
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
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
  email: PropTypes.string
};

export default Dashboard;