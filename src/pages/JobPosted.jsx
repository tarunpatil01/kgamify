import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaEdit,
  FaTrashAlt,
  FaEye,
  FaList,
  FaUsers,
  FaPlus,
  FaFilter,
  FaBriefcase,
  FaMapMarkerAlt,
  FaMoneyBill,
  FaClock,
  FaUserTie,
  FaLaptopHouse,
  FaCheck,
} from 'react-icons/fa';
import { getJobs, deleteJob } from '../api';

const JobPosted = ({ isDarkMode, email }) => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedType, setSelectedType] = useState('All');
  const [notification, setNotification] = useState('');
  const [categories, setCategories] = useState(['All']);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        if (!email) {
          console.error('No email provided to fetch jobs');
          return;
        }
        const response = await getJobs({ email });
        setJobs(response);
        setFilteredJobs(response);
        // Extract unique categories from jobs
        const uniqueCategories = [
          'All',
          ...new Set(response.map(job => job.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    };
    fetchJobs();
  }, [email]);

  const filterJobs = type => {
    setSelectedType(type);
    if (type === 'All') {
      setFilteredJobs(jobs);
    } else {
      setFilteredJobs(jobs.filter(job => job.category === type));
    }
  };

  const handleDelete = async jobId => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      await deleteJob(jobId);
      const updatedJobs = await getJobs({ email });
      setJobs(updatedJobs);
      setFilteredJobs(
        selectedType === 'All'
          ? updatedJobs
          : updatedJobs.filter(job => job.category === selectedType)
      );
      // Update categories after job deletion
      const uniqueCategories = [
        'All',
        ...new Set(updatedJobs.map(job => job.category).filter(Boolean)),
      ];
      setCategories(uniqueCategories);
      setNotification('Job deleted successfully');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  // Job stats for summary
  const totalJobs = jobs.length;
  const totalApplicants = jobs.reduce(
    (acc, job) => acc + (job.applicants?.length || 0),
    0
  );
  const jobsByCategory = categories.slice(1).map(cat => ({
    name: cat,
    count: jobs.filter(j => j.category === cat).length,
  }));

  return (
    <div
      className={`p-4 sm:p-8 min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}
    >
      {/* Header with stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <FaList className="text-[#ff8200]" /> Posted Jobs
          </h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm">
            <span
              className={`flex items-center gap-1 rounded px-3 py-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <FaBriefcase className="text-[#ff8200]" /> Total:{' '}
              <b>{totalJobs}</b>
            </span>
            <span
              className={`flex items-center gap-1 rounded px-3 py-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <FaUsers className="text-[#e74094]" /> Applicants:{' '}
              <b>{totalApplicants}</b>
            </span>
            {jobsByCategory.map(cat => (
              <span
                key={cat.name}
                className={`flex items-center gap-1 rounded px-3 py-1 ${
                  isDarkMode
                    ? 'bg-blue-900 text-blue-200'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                <FaFilter className="text-blue-400" /> {cat.name}:{' '}
                <b>{cat.count}</b>
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => navigate('/post-job')}
          className="flex items-center gap-2 px-5 py-2 bg-[#ff8200] text-white rounded shadow hover:bg-[#e57400] transition-colors font-semibold"
        >
          <FaPlus /> Post New Job
        </button>
      </div>

      {notification && (
        <div className="bg-green-500 text-white p-2 rounded mb-4 shadow flex items-center gap-2">
          <FaCheck /> {notification}
        </div>
      )}

      {/* Category filter */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`flex items-center gap-2 px-4 py-2 rounded whitespace-nowrap border transition-colors font-medium shadow-sm ${
                selectedType === category
                  ? category === 'All'
                    ? 'bg-[#ff8200] text-white border-[#ff8200]'
                    : 'bg-[#e74094] text-white border-[#e74094]'
                  : isDarkMode
                    ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300'
              }`}
              onClick={() => filterJobs(category)}
              aria-pressed={selectedType === category}
              title={
                category === 'All' ? 'Show all jobs' : `Filter by ${category}`
              }
            >
              <FaFilter className="text-xs" />
              {category || 'Uncategorized'}
            </button>
          ))}
        </div>
      </div>

      {/* Job cards or empty state */}
      {filteredJobs.length === 0 ? (
        <div
          className={`p-10 text-center rounded-lg flex flex-col items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <FaBriefcase
            className={`text-6xl mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}
          />
          <p className="text-xl font-semibold mb-2">
            No jobs found in this category
          </p>
          <p
            className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}
          >
            Try posting a new job or changing the filter above.
          </p>
          <button
            onClick={() => navigate('/post-job')}
            className="mt-2 px-6 py-2 bg-[#ff8200] text-white rounded hover:bg-[#e57400] font-semibold shadow"
          >
            <FaPlus className="inline mr-1" /> Post a New Job
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job, index) => (
            <div
              key={index}
              className={`shadow-lg rounded-xl p-6 border flex flex-col h-full transition-all group ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-black'} hover:shadow-2xl hover:-translate-y-1`}
            >
              <div className="flex items-center gap-3 mb-2">
                <FaBriefcase className="text-2xl text-[#ff8200]" />
                <h2
                  className="text-xl font-bold flex-1 truncate"
                  title={job.jobTitle}
                >
                  {job.jobTitle}
                </h2>
              </div>
              {job.category && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded mb-2 ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}
                >
                  <FaFilter className="text-blue-400" /> {job.category}
                </span>
              )}
              <div className="flex flex-wrap gap-2 mb-2 text-sm">
                <span
                  className={`flex items-center gap-1 rounded px-2 py-0.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <FaMoneyBill className="text-green-500" /> {job.salary}
                </span>
                <span
                  className={`flex items-center gap-1 rounded px-2 py-0.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <FaMapMarkerAlt className="text-blue-500" /> {job.location}
                </span>
                <span
                  className={`flex items-center gap-1 rounded px-2 py-0.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <FaUserTie className="text-purple-500" />{' '}
                  {job.experienceLevel}
                </span>
                <span
                  className={`flex items-center gap-1 rounded px-2 py-0.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <FaClock className="text-yellow-500" /> {job.employmentType}
                </span>
                <span
                  className={`flex items-center gap-1 rounded px-2 py-0.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <FaLaptopHouse className="text-pink-500" />{' '}
                  {job.remoteOrOnsite}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2 text-sm">
                <FaUsers className="text-[#e74094]" /> Applicants:{' '}
                <b>{job.applicants?.length || 0}</b>
              </div>
              <div
                className={`mb-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Posted at: {new Date(job.postedAt).toLocaleString()}
              </div>
              <div className="flex justify-between items-center mt-auto pt-4 gap-2">
                <Link to={`/job/${job._id}`} title="View Details">
                  <button
                    className="flex items-center gap-1 px-3 py-2 bg-[#ff8200] text-white rounded hover:bg-[#e57400] transition-colors font-medium shadow"
                    aria-label="View Details"
                  >
                    <FaEye /> <span className="hidden sm:inline">View</span>
                  </button>
                </Link>
                <Link to={`/edit-job/${job._id}`} title="Edit Job">
                  <button
                    className="flex items-center gap-1 px-3 py-2 bg-[#833f91] text-white rounded hover:bg-[#6a3274] transition-colors font-medium shadow"
                    aria-label="Edit Job"
                  >
                    <FaEdit /> <span className="hidden sm:inline">Edit</span>
                  </button>
                </Link>
                <button
                  className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium shadow"
                  onClick={() => handleDelete(job._id)}
                  aria-label="Delete Job"
                  title="Delete Job"
                >
                  <FaTrashAlt />{' '}
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobPosted;
