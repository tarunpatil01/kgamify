import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEdit, FaTrashAlt, FaEye } from "react-icons/fa";
import { getJobs, deleteJob } from "../api";

const JobPosted = ({ isDarkMode, email }) => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [notification, setNotification] = useState("");
  const [categories, setCategories] = useState(["All"]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        if (!email) {
          console.error("No email provided to fetch jobs");
          return;
        }
        
        console.log("Fetching jobs for company email:", email);
        const response = await getJobs({ email });
        console.log(`Received ${response.length} jobs for company:`, email);
        setJobs(response);
        setFilteredJobs(response);
        
        // Extract unique categories from jobs
        const uniqueCategories = ["All", ...new Set(response.map(job => job.category).filter(Boolean))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }
    };

    fetchJobs();
  }, [email]);

  const filterJobs = (type) => {
    setSelectedType(type);
    if (type === "All") {
      setFilteredJobs(jobs);
    } else {
      setFilteredJobs(jobs.filter((job) => job.category === type));
    }
  };

  const handleDelete = async (jobId) => {
    console.log('Attempting to delete job with ID:', jobId);
    if (window.confirm("Are you sure you want to delete this job?")) {
      await deleteJob(jobId);
      const updatedJobs = await getJobs({ email });
      setJobs(updatedJobs);
      setFilteredJobs(updatedJobs);
      
      // Update categories after job deletion
      const uniqueCategories = ["All", ...new Set(updatedJobs.map(job => job.category).filter(Boolean))];
      setCategories(uniqueCategories);
      
      setNotification("Job deleted successfully");
      setTimeout(() => setNotification(""), 3000);
    }
  };

  // Function to safely render HTML content
  const renderHTML = (htmlContent) => {
    return { __html: htmlContent };
  };

  return (
    <div className={`p-4 sm:p-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"} min-h-screen`}>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Posted Jobs</h1>
      
      {notification && (
        <div className="bg-green-500 text-white p-2 rounded mb-4">
          {notification}
        </div>
      )}
      <div className="mb-4 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`px-4 py-2 rounded whitespace-nowrap ${
                selectedType === category 
                  ? category === "All" 
                    ? "bg-[#ff8200] text-white" 
                    : "bg-[#e74094] text-white" 
                  : isDarkMode 
                    ? "bg-gray-700 text-white" 
                    : "bg-gray-300"
              }`}
              onClick={() => filterJobs(category)}
            >
              {category || "Uncategorized"}
            </button>
          ))}
        </div>
      </div>
      
      {filteredJobs.length === 0 ? (
        <div className={`p-10 text-center rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <p className="text-xl">No jobs found in this category</p>
          <button 
            onClick={() => navigate("/post-job")}
            className="mt-4 px-6 py-2 bg-[#ff8200] text-white rounded hover:bg-[#e57400]"
          >
            Post a New Job
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job, index) => (
            <div
              key={index}
              className={`shadow-lg rounded-lg p-4 border ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-black"}`}
            >
              <h2 className="text-xl font-bold mb-2 text-[#ff8200]">{job.jobTitle}</h2>
              {job.category && (
                <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 mb-2">
                  {job.category}
                </span>
              )}
              <p className="mb-1">{job.salary}</p>
              <p className="mb-1">{job.location}</p>
              <p className="mb-1">{job.experienceLevel}</p>
              <p className="mb-1">{job.employmentType}</p>
              <p className="mb-1">{job.remoteOrOnsite}</p>
              <p className="mb-2">Applicants: {job.applicants?.length || 0}</p>
              <p className="mb-2">Posted at: {new Date(job.postedAt).toLocaleString()}</p>
              <div className="flex justify-between mt-4">
                <Link to={`/job/${job._id}`}>
                  <button className="px-4 py-2 bg-[#ff8200] text-white rounded hover:bg-[#e57400] transition-colors">
                    View Details
                  </button>
                </Link>
                <Link to={`/edit-job/${job._id}`}>
                  <button className="px-4 py-2 bg-[#833f91] text-white rounded hover:bg-[#6a3274] transition-colors">
                    Edit
                  </button>
                </Link>
                <button 
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  onClick={() => handleDelete(job._id)}
                >
                  Delete
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
