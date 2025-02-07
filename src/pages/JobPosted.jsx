import React, { useState } from "react";
import { Link } from "react-router-dom";

export const jobs = [
  {
    id: 1,
    title: "Senior Software Engineer",
    salary: "₹150K - ₹220K",
    location: "Bengaluru - In Office",
    type: "Engineering",
    applicants: 90,
  },
  {
    id: 2,
    title: "Machine Learning Engineer",
    salary: "₹160K - ₹220K",
    location: "Remote",
    type: "Engineering",
    applicants: 90,
  },
  {
    id: 3,
    title: "Data Scientist",
    salary: "₹140K - ₹180K",
    location: "Bengaluru - In Office",
    type: "Data",
    applicants: 90,
  },
  {
    id: 4,
    title: "UX Designer",
    salary: "$120K - $160K",
    location: "Remote",
    type: "Design",
    applicants: 90,
  },
  {
    id: 5,
    title: "Product Manager",
    salary: "$130K - $170K",
    location: "Chennai - In Office",
    type: "Product",
    applicants: 90,
  },
  {
    id: 6,
    title: "Site Reliability Engineer",
    salary: "$140K - $190K",
    location: "Remote",
    type: "Engineering",
    applicants: 90,
  },
  {
    id: 7,
    title: "Technical Writer",
    salary: "$100K - $140K",
    location: "Bengaluru - In Office",
    type: "Product",
    applicants: 90,
  },
  {
    id: 8,
    title: "Security Engineer",
    salary: "$130K - $180K",
    location: "Remote",
    type: "Engineering",
    applicants: 90,
  },
];

const JobPosted = ({ isDarkMode }) => {
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [selectedType, setSelectedType] = useState("All");

  const filterJobs = (type) => {
    setSelectedType(type);
    if (type === "All") {
      setFilteredJobs(jobs);
    } else {
      setFilteredJobs(jobs.filter((job) => job.type === type));
    }
  };

  return (
    <div className={`flex h-screen mb-20 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className={`flex-1 p-6 min-h-screen ${isDarkMode ? "bg-gray-800 text-white" : "bg-gray-50 text-black"}`}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job, index) => (
            <div
              key={index}
              className={`shadow-lg rounded-lg p-4 border ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-black"}`}
            >
              <h2 className="text-xl font-bold mb-2 text-[#C30E59]">{job.title}</h2>
              <p className="mb-1">{job.salary}</p>
              <p className="mb-1">{job.location}</p>
              <p className="mb-1">{job.type}</p>
              <p className="mb-2">Applicants: {job.applicants}</p>
              <Link to={`/job/${job.id}`}>
                <button className="px-4 py-2 bg-[#E82561] text-white rounded">
                  View Job Description
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JobPosted;