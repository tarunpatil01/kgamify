import React from "react";

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-5 font-bold text-lg">Dashboard</div>
        <nav className="mt-5">
          <ul>
            <li className="bg-red-500 text-white p-3 rounded">Dashboard</li>
            <li className="p-3">Post Job</li>
            <li className="p-3">Job Posted</li>
            <li className="p-3">Application</li>
            <li className="p-3">Company Registration</li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="bg-red-500 text-white p-6 rounded-lg flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Welcome To kgamify Job Portal Company Name</h1>
          <div className="w-24 h-24 bg-white rounded-full"></div>
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
              <tr className="bg-gray-200">
                <th className="p-3 text-left">Job Title</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Openings</th>
                <th className="p-3 text-left">Applications</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { title: "UI UX Designer", category: "Full Time", openings: 12, applications: 135, status: "Active" },
                { title: "Full Stack Dev", category: "Full Time", openings: 8, applications: 100, status: "Inactive" },
                { title: "DevOps", category: "Internship", openings: 12, applications: 5, status: "Active" },
                { title: "Android Dev", category: "Full Time", openings: 4, applications: 45, status: "Active" },
                { title: "IOS Developer", category: "Full Time", openings: 18, applications: 96, status: "Inactive" }
              ].map((job, index) => (
                <tr key={index} className="border-t">
                  <td className="p-3">{job.title}</td>
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
    </div>
  );
};

export default Dashboard;
