import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import DashboardImage from "../assets/dashboard.png";
import { getJobs } from "../api";

const Dashboard = ({ isDarkMode, email }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        console.log("Fetching jobs with email:", email);
        // Get all jobs
        const allJobsResponse = await getJobs();
        console.log("All jobs received:", allJobsResponse);
        setJobs(allJobsResponse || []);
        
        // If email is available, fetch company-specific jobs
        if (email) {
          console.log("Making API call to fetch jobs with company email:", email);
          const companyJobsResponse = await getJobs({email});
          console.log("Company jobs received:", companyJobsResponse);
          
          if (companyJobsResponse && companyJobsResponse.length > 0) {
            setError(null);
            setCompanyJobs(companyJobsResponse);
          } else {
            console.log("No jobs found for this company email");
            setCompanyJobs([]);
            setError("No listed jobs were found by your company");
          }
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        setError("Error connecting to server. Please try again.");
        setJobs([]);
        setCompanyJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [email]);

  const totalJobs = jobs.length;
  const totalApplications = (companyJobs.length > 0 ? companyJobs : jobs).reduce(
    (acc, job) => acc + (job.applicants?.length || 0), 
    0
  );

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
        <p className="text-xl">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col p-4 h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className={`flex-0`}>
        <div className={`rounded-lg flex flex-col md:flex-row justify-between items-center ${isDarkMode ? "bg-gray-800 text-white" : "bg-[#ff8200] text-white"}`}>
          <div className="ml-4 md:ml-10">
            <h1 className="text-2xl md:text-3xl font-light">Welcome To kgamify Job Portal</h1>
            <h1 className="text-2xl md:text-3xl font-light">Company Name</h1>
          </div>
          <img className="mr-4 md:mr-25 p-0 w-32 md:w-64 h-24 md:h-48 rounded-xl" src={DashboardImage} alt="Dashboard" />
        </div>
      </div>

      {/* Job Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-4 md:p-6 shadow rounded-lg ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
          <p className={`text-gray-600 ${isDarkMode ? "dark:text-gray-400" : ""}`}>Job Posts</p>
          <h2 className="text-2xl md:text-3xl font-bold">{totalJobs}</h2>
          {/* <p className="text-[#ff8200]">+2.5%</p> */}
        </div>
        <div className={`p-4 md:p-6 shadow rounded-lg ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
          <p className={`text-gray-600 ${isDarkMode ? "dark:text-gray-400" : ""}`}>Total Applications</p>
          <h2 className="text-2xl md:text-3xl font-bold">{totalApplications}</h2>
          {/* <p className="text-[#e74094]">-4.4%</p> */}
        </div>
      </div>

      {/* Recent Job Posts */}
      <div className={`mt-6 p-4 md:p-6 h-fit shadow rounded-lg ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
        <h2 className="text-lg md:text-xl font-bold">Recent Job Posts</h2>
        {error && (
          <div className="mt-4 p-4 rounded bg-red-100 dark:bg-gray-700">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            {error.includes("No listed jobs") && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  It appears that some jobs in the database may be missing the company email field.
                  Contact your administrator to run the fix-jobs script.
                </p>
                <div className="mt-2">
                  <Link to="/post-job">
                    <button className="px-4 py-2 bg-[#ff8200] text-white rounded hover:bg-[#e57400]">
                      Post a New Job
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
        {!error && jobs.length === 0 && (
          <p className="mt-4">No jobs posted yet.</p>
        )}
        {!error && jobs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full mt-4 border-collapse">
              <thead>
                <tr className={`${isDarkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                  <th className="p-2 md:p-3 text-left">Job Title</th>
                  <th className="p-2 md:p-3 text-left">Type</th>
                  <th className="p-2 md:p-3 text-left">Location</th>
                  <th className="p-2 md:p-3 text-left">Salary</th>
                  <th className="p-2 md:p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.slice(0, 5).map((job) => {
                  console.log("Rendering job:", job.jobTitle, "with ID:", job._id);
                  return (
                    <tr
                      key={`job-${job._id}`}
                      className={`border-t ${isDarkMode ? "bg-gray-700" : "bg-gray-50"} hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer`}
                      onClick={() => window.location.href = `/job/${job._id}`}
                    >
                      <td className="p-2 md:p-3">
                        <span className={`hover:underline ${isDarkMode ? "text-white" : "text-black"}`}>
                          {job.jobTitle}
                        </span>
                      </td>
                      <td className={`p-2 md:p-3 ${isDarkMode ? "text-white" : "text-gray-600"}`}>{job.employmentType}</td>
                      <td className={`p-2 md:p-3 ${isDarkMode ? "text-white" : "text-gray-600"}`}>{job.location}</td>
                      <td className="p-2 md:p-3">{job.salary}</td>
                      <td className="p-2 md:p-3">
                        {job.status === "active" ? (
                          <FaCheckCircle className="inline text-[#ff8200]" />
                        ) : (
                          <FaTimesCircle className="inline text-[#e74094]" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;