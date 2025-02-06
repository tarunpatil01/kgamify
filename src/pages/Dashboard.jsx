import React from "react";
import { Link } from "react-router-dom";
import DashboardImage from "../assets/dashboard.png";
import { jobs } from "./JobPosted"; // Import jobs data directly

const Dashboard = () => {
  const totalJobs = jobs.length;
  const totalApplications = jobs.reduce((acc, job) => acc + job.applicants, 0);

  return (
    <div className="flex flex-col p-4 h-full bg-gray-100">
      <div className="flex-1">
        <div className="bg-[#C30E59] text-white rounded-lg flex justify-between items-center">
          <div className="ml-10">
            <h1 className="text-3xl font-light">Welcome To kgamify Job Portal</h1>
            <h1 className="text-3xl font-light">Company Name</h1>
          </div>
          <img className="mr-25 p-0 w-64 h-48 rounded-xl" src={DashboardImage} alt="Dashboard" />
        </div>
      </div>

      {/* Job Statistics */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="bg-white p-6 shadow rounded-lg">
          <p className="text-gray-600">Job Posts</p>
          <h2 className="text-3xl font-bold">{totalJobs}</h2>
          <p className="text-green-500">+2.5%</p>
        </div>
        <div className="bg-white p-6 shadow rounded-lg">
          <p className="text-gray-600">Total Applications</p>
          <h2 className="text-3xl font-bold">{totalApplications}</h2>
          <p className="text-red-500">-4.4%</p>
        </div>
      </div>

      {/* Recent Job Posts */}
      <div className="mt-6 bg-white p-6 h-full  shadow rounded-lg">
        <h2 className="text-xl font-bold">Recent Job Posts</h2>
        <table className="w-full mt-4 border-collapse">
          <thead>
            <tr className="bg-blue-50">
              <th className="p-3 text-left">Job Title</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Openings</th>
              <th className="p-3 text-left">Applications</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-t bg-gray-50">
                <td className="p-3">
                  <Link to={`/job/${job.id}`} className="text-blue-500 hover:underline">
                    {job.title}
                  </Link>
                </td>
                <td className="p-3">{job.category}</td>
                <td className="p-3">{job.openings}</td>
                <td className="p-3">{job.applicants}</td>
                <td className="p-3">
                  <span className={`px-3 py-1 text-white text-sm rounded ${job.status === "Active" ? "bg-green-500" : "bg-orange-500"}`}>
                    {job.status}
                  </span>
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