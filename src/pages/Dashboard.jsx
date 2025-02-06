import React from "react";
import { Link } from "react-router-dom";
import DashboardImage from "../assets/dashboard.png";

const Dashboard = () => {
  const jobs = [
    { id: "1", title: "UI UX Designer", category: "Full Time", openings: 12, applications: 135, status: "Active" },
    { id: "2", title: "Full Stack Dev", category: "Full Time", openings: 8, applications: 100, status: "Inactive" },
    { id: "3", title: "DevOps", category: "Internship", openings: 12, applications: 5, status: "Active" },
    { id: "4", title: "Android Dev", category: "Full Time", openings: 4, applications: 45, status: "Active" },
    { id: "5", title: "IOS Developer", category: "Full Time", openings: 18, applications: 96, status: "Inactive" }
  ];

  return (
    <div className="flex flex-col p-4 h-screen bg-gray-100">
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
          <h2 className="text-3xl font-bold">2,456</h2>
          <p className="text-green-500">+2.5%</p>
        </div>
        <div className="bg-white p-6 shadow rounded-lg">
          <p className="text-gray-600">Total Application</p>
          <h2 className="text-3xl font-bold">4,561</h2>
          <p className="text-red-500">-4.4%</p>
        </div>
      </div>

      {/* Recent Job Posts */}
      <div className="mt-6 bg-white p-6 shadow rounded-lg">
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
                <td className="p-3">{job.applications}</td>
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