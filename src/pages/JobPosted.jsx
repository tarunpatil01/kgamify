import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getJobs } from "../api"; // Import getJobs function

const JobPosted = ({ isDarkMode }) => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedType, setSelectedType] = useState("All");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await getJobs();
        setJobs(response);
        setFilteredJobs(response);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }
    };

    fetchJobs();
  }, []);

  const filterJobs = (type) => {
    setSelectedType(type);
    if (type === "All") {
      setFilteredJobs(jobs);
    } else {
      setFilteredJobs(jobs.filter((job) => job.category === type));
    }
  };

  return (
    <div className={`flex flex-col p-4 sm:p-6 h-full ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className="mb-4">
        <button
          className={`px-4 py-2 rounded mr-2 ${selectedType === "All" ? "bg-[#E82561] text-white" : isDarkMode ? "bg-gray-700 text-white" : "bg-gray-300"}`}
          onClick={() => filterJobs("All")}
        >
          All
        </button>
        <button
          className={`px-4 py-2 rounded mr-2 ${selectedType === "Engineering" ? "bg-[#E82561] text-white" : isDarkMode ? "bg-gray-700 text-white" : "bg-gray-300"}`}
          onClick={() => filterJobs("Engineering")}
        >
          Engineering
        </button>
        <button
          className={`px-4 py-2 rounded mr-2 ${selectedType === "Data" ? "bg-[#E82561] text-white" : isDarkMode ? "bg-gray-700 text-white" : "bg-gray-300"}`}
          onClick={() => filterJobs("Data")}
        >
          Data
        </button>
        <button
          className={`px-4 py-2 rounded mr-2 ${selectedType === "Design" ? "bg-[#E82561] text-white" : isDarkMode ? "bg-gray-700 text-white" : "bg-gray-300"}`}
          onClick={() => filterJobs("Design")}
        >
          Design
        </button>
        <button
          className={`px-4 py-2 rounded ${selectedType === "Product" ? "bg-[#E82561] text-white" : isDarkMode ? "bg-gray-700 text-white" : "bg-gray-300"}`}
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
            <h2 className="text-xl font-bold mb-2 text-[#C30E59]">{job.jobTitle}</h2>
            <p className="mb-1">{job.salary}</p>
            <p className="mb-1">{job.location}</p>
            <p className="mb-1">{job.experienceLevel}</p>
            <p className="mb-1">{job.employmentType}</p>
            <p className="mb-1">{job.remoteOrOnsite}</p>
            <p className="mb-2">Applicants: {job.applicants}</p>
            <Link to={`/job/${job._id}`}>
              <button className="px-4 py-2 bg-[#E82561] text-white rounded">View Job Description</button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobPosted;
