import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getJobs, editJob, deleteJob } from "../api"; // Import getJobs, editJob, and deleteJob functions

const JobPosted = ({ isDarkMode, email }) => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [notification, setNotification] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await getJobs({ email });
        setJobs(response);
        setFilteredJobs(response);
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

  const handleEdit = async (jobId) => {
    const newJobData = prompt('Enter new job data'); // Replace with a proper form
    if (newJobData) {
      await editJob(jobId, { description: newJobData });
      const updatedJobs = await getJobs({ email });
      setJobs(updatedJobs);
      setFilteredJobs(updatedJobs);
    }
  };

  const handleDelete = async (jobId) => {
    console.log('Attempting to delete job with ID:', jobId); // Log the job ID
    if (window.confirm("Are you sure you want to delete this job?")) {
      await deleteJob(jobId);
      const updatedJobs = await getJobs({ email });
      setJobs(updatedJobs);
      setFilteredJobs(updatedJobs);
      setNotification("Job deleted successfully");
      setTimeout(() => setNotification(""), 3000); // Clear notification after 3 seconds
    }
  };

  return (
    <div className={`flex flex-col p-4 sm:p-6 h-full ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      {notification && (
        <div className="bg-green-500 text-white p-2 rounded mb-4">
          {notification}
        </div>
      )}
      <div className="mb-4">
        <button
          className={`px-4 py-2 rounded mr-2 ${selectedType === "All" ? "bg-[#ff8200] text-white" : isDarkMode ? "bg-gray-700 text-white" : "bg-gray-300"}`}
          onClick={() => filterJobs("All")}
        >
          All
        </button>
        <button
          className={`px-4 py-2 rounded mr-2 ${selectedType === "Engineering" ? "bg-[#e74094] text-white" : isDarkMode ? "bg-gray-700 text-white" : "bg-gray-300"}`}
          onClick={() => filterJobs("Engineering")}
        >
          Engineering
        </button>
        <button
          className={`px-4 py-2 rounded mr-2 ${selectedType === "Data" ? "bg-[#e74094] text-white" : isDarkMode ? "bg-gray-700 text-white" : "bg-gray-300"}`}
          onClick={() => filterJobs("Data")}
        >
          Data
        </button>
        <button
          className={`px-4 py-2 rounded mr-2 ${selectedType === "Design" ? "bg-[#e74094] text-white" : isDarkMode ? "bg-gray-700 text-white" : "bg-gray-300"}`}
          onClick={() => filterJobs("Design")}
        >
          Design
        </button>
        <button
          className={`px-4 py-2 rounded ${selectedType === "Product" ? "bg-[#e74094] text-white" : isDarkMode ? "bg-gray-700 text-white" : "bg-gray-300"}`}
          onClick={() => filterJobs("Product")}
        >
          Product
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.map((job, index) => (
          <div
            key={index}
            className={`shadow-lg rounded-lg p-4 border ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-black"}`}
          >
            <h2 className="text-xl font-bold mb-2 text-[#ff8200]">{job.jobTitle}</h2>
            <p className="mb-1">{job.salary}</p>
            <p className="mb-1">{job.location}</p>
            <p className="mb-1">{job.experienceLevel}</p>
            <p className="mb-1">{job.employmentType}</p>
            <p className="mb-1">{job.remoteOrOnsite}</p>
            <p className="mb-2">Applicants: {job.applicants}</p>
            <p className="mb-2">Posted at: {new Date(job.postedAt).toLocaleString()}</p>
            <Link to={`/job/${job._id}`}>
              <button className="px-4 py-2 bg-[#ff8200] text-white rounded">View Job Description</button>
            </Link>
            <button className="mx-2 px-4 py-2 bg-[#833f91] text-white rounded mt-2" onClick={() => handleEdit(job._id)}>Edit</button>
            <button className="px-4 py-2 bg-[#ff8200] text-white rounded mt-2" onClick={() => handleDelete(job._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobPosted;
