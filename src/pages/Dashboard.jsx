import React from "react";
import { Link } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import DashboardImage from "../assets/dashboard.png";
import { jobs } from "./JobPosted"; // Import jobs data directly

const Dashboard = ({ isDarkMode }) => {
  const totalJobs = jobs.length;
  const totalApplications = jobs.reduce((acc, job) => acc + job.applicants, 0);

  return (
    <div className={`flex flex-col p-4 h-fit ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className={`flex-0`}>
        <div className={`rounded-lg flex justify-between items-center ${isDarkMode ? "bg-gray-800 text-white" : "bg-[#C30E59] text-white"}`}>
          <div className="ml-10">
            <h1 className="text-3xl font-light">Welcome To kgamify Job Portal</h1>
            <h1 className="text-3xl font-light">Company Name</h1>
          </div>
          <img className="mr-25 p-0 w-64 h-48 rounded-xl" src={DashboardImage} alt="Dashboard" />
        </div>
      </div>

      {/* Job Statistics */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className={`p-6 shadow rounded-lg ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
          <p className={`text-gray-600 ${isDarkMode ? "dark:text-gray-400" : ""}`}>Job Posts</p>
          <h2 className="text-3xl font-bold">{totalJobs}</h2>
          <p className="text-green-500">+2.5%</p>
        </div>
        <div className={`p-6 shadow rounded-lg ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
          <p className={`text-gray-600 ${isDarkMode ? "dark:text-gray-400" : ""}`}>Total Applications</p>
          <h2 className="text-3xl font-bold">{totalApplications}</h2>
          <p className="text-red-500">-4.4%</p>
        </div>
      </div>

      {/* Recent Job Posts */}
      <div className={`mt-6 p-6 h-fit shadow rounded-lg ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
        <h2 className="text-xl font-bold">Recent Job Posts</h2>
        <table className="w-full mt-4 border-collapse">
          <thead>
            <tr className={`${isDarkMode ? "bg-gray-700" : "bg-blue-50"}`}>
              <th className="p-3 text-left">Job Title</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Location</th>
              <th className="p-3 text-left">Salary</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.slice(0, 5).map((job) => (
              <tr
                key={job.id}
                className={`border-t ${isDarkMode ? "bg-gray-700" : "bg-gray-50"} hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer`}
                onClick={() => window.location.href = `/job/${job.id}`}
              >
                <td className="p-3">
                  <span className={`hover:underline ${isDarkMode ? "text-white" : "text-black"}`}>
                    {job.title}
                  </span>
                </td>
                <td className={`p-3 ${isDarkMode ? "text-white" : "text-gray-600"}`}>{job.type}</td>
                <td className={`p-3 ${isDarkMode ? "text-white" : "text-gray-600"}`}>{job.location}</td>
                <td className="p-3">{job.salary}</td>
                <td className="p-3">
                  {job.status === "Active" ? (
                    <FaCheckCircle className="inline text-green-500" />
                  ) : (
                    <FaTimesCircle className="inline text-red-500" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;