import React from "react";
import { Link } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

const JobPosted = () => {
  const jobs = [
    {
      title: "Senior Software Engineer",
      salary: "₹150K - ₹220K",
      location: "Bengaluru - In Office",
      type: "Engineering",
      applicants: 90,
    },
    {
      title: "Machine Learning Engineer",
      salary: "₹160K - ₹220K",
      location: "Remote",
      type: "Engineering",
      applicants: 90,
    },
    {
      title: "Data Scientist",
      salary: "₹140K - ₹180K",
      location: "Bengaluru - In Office",
      type: "Data",
      applicants: 90,
    },
    {
      title: "UX Designer",
      salary: "$120K - $160K",
      location: "Remote",
      type: "Design",
      applicants: 90,
    },
    {
      title: "Product Manager",
      salary: "$130K - $170K",
      location: "Chennai - In Office",
      type: "Product",
      applicants: 90,
    },
    {
      title: "Site Reliability Engineer",
      salary: "$140K - $190K",
      location: "Remote",
      type: "Engineering",
      applicants: 90,
    },
    {
      title: "Technical Writer",
      salary: "$100K - $140K",
      location: "Bengaluru - In Office",
      type: "Product",
      applicants: 90,
    },
    {
      title: "Security Engineer",
      salary: "$130K - $180K",
      location: "Remote",
      type: "Engineering",
      applicants: 90,
    },
  ];

  return (
    <div className="flex h-screen mb-20 bg-gray-100">
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <div className="mb-4">
          <button className="px-4 py-2 bg-gray-300 rounded mr-2">All</button>
          <button className="px-4 py-2 bg-[#E82561] text-white rounded mr-2">Engineering</button>
          <button className="px-4 py-2 bg-gray-300 rounded mr-2">Data</button>
          <button className="px-4 py-2 bg-gray-300 rounded mr-2">Design</button>
          <button className="px-4 py-2 bg-gray-300 rounded">Product</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job, index) => (
            <div
              key={index}
              className="bg-white shadow-lg rounded-lg p-4 border border-gray-200"
            >
              <h2 className="text-xl font-bold mb-2 text-[#C30E59]">{job.title}</h2>
              <p className="text-gray-600 mb-1">{job.salary}</p>
              <p className="text-gray-600 mb-1">{job.location}</p>
              <p className="text-gray-600 mb-1">{job.type}</p>
              <p className="text-gray-600 mb-2">Applicants: {job.applicants}</p>
              <button className="px-4 py-2 bg-[#E82561] text-white rounded">
                View Job Description
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JobPosted;