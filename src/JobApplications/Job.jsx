import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaFileAlt, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { getJobById, getApplicationsByJobId } from "../api";

const Job = ({ isDarkMode }) => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch job details
        const jobData = await getJobById(jobId);
        setJob(jobData);
        
        // Fetch applications for this job separately
        try {
          const applicationsData = await getApplicationsByJobId(jobId);
          console.log("Applications data received:", applicationsData);
          setApplications(applicationsData);
        } catch (appError) {
          console.error("Error fetching applications:", appError);
          // Don't fail the whole page if just applications fail
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError(err.message || "Failed to fetch job details");
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId]);

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
        <p className="text-xl">Loading job details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
          <p className="text-red-700 dark:text-red-200">Error: {error}</p>
          <p className="mt-2">Please try again later or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className={`flex-1 p-6 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"} min-h-screen`}>
        <div className={`p-5 rounded-lg shadow-md ${isDarkMode ? "bg-gray-700" : "bg-[#F6C794]"}`}>
          <div className={`text-3xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-[#C30E59]"}`}>
            {job.title}
          </div>
          <div className="mb-6">
            <div>
              <strong>Job Title: </strong> {job.jobTitle}
            </div>
            <div>
              <strong>Description: </strong> {job.jobDescription}
            </div>
            <div>
              <strong>Category: </strong> {job.category}
            </div>
            <div>
              <strong>Employment Type: </strong> {job.employmentType}
            </div>
            <div>
              <strong>Experience Level: </strong> {job.experienceLevel}
            </div>
            <div>
              <strong className="flex ">Skills: </strong> {job.skills}
            </div>
            <div>
              <strong>Type: </strong>{job.remoteOrOnsite}
            </div>
            <div>
              <strong>Equity: </strong>{job.equity}
            </div>
            <div>
              <strong>Sponsorship: </strong>{job.sponsorship}
            </div>
            <div>
              <strong>Status:</strong>{" "}
              {job.status === "active" ? (
                <FaCheckCircle className="inline text-green-500" />
              ) : (
                <FaTimesCircle className="inline text-red-500" />
              )}
            </div>
            <div>
              <strong>Number Of Positions: </strong> {job.numberOfPositions}
            </div>
            <div>
              <strong>Salary:</strong> {job.salary}
            </div>
            <div>
              <strong>Location:</strong> {job.location}
            </div>
            <div>
              <strong className="flex ">Recruitment Process: </strong> {job.recruitmentProcess}
            </div>
            <div>
            <strong className="flex ">Responsibilities: </strong>  {job.responsibilities}
            </div>
            <div>
            <strong className="flex ">Eligibility: </strong> {job.eligibility}
            </div>
            <div>
            <strong className="flex ">Benefits: </strong>  {job.benefits}
            </div>
          </div>
        </div>

        <div className={`text-xl font-semibold mb-4 mt-6 ${isDarkMode ? "text-white" : "text-[#E82561]"}`}>
          Applicants
        </div>
        
        {applications.length === 0 ? (
          <div className={`p-4 rounded-lg text-center ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
            No applicants for this job yet
          </div>
        ) : (
          <table className={`w-full mt-4 border-collapse border ${isDarkMode ? "border-gray-700" : "border-gray-200"} shadow-lg rounded-lg`}>
            <thead>
              <tr className={`${isDarkMode ? "bg-gray-600" : "bg-[#F2AE66]"} rounded-t-lg`}>
                <th className={`border p-4 text-left ${isDarkMode ? "border-gray-600" : "border-gray-300"} rounded-tl-lg`}>
                  Name
                </th>
                <th className={`border p-4 text-left ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>Resume</th>
                <th className={`border p-4 text-left ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>Test Score</th>
                <th className={`border p-4 text-left ${isDarkMode ? "border-gray-600" : "border-gray-300"} rounded-tr-lg`}>
                  Skills
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.map((applicant, index) => (
                <tr
                  key={applicant._id || index}
                  className={`transition duration-300 ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-50"} ${
                    index === applications.length - 1 ? "rounded-b-lg" : ""
                  }`}
                >
                  <td className={`border p-4 ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>
                    {applicant.applicantName}
                  </td>
                  <td className={`border p-4 ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>
                    {applicant.resume ? (
                      <a 
                        href={applicant.resume} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`flex items-center ${isDarkMode ? "text-blue-400" : "text-blue-600"} hover:underline`}
                      >
                        <FaFileAlt className="mr-2" />
                        View Resume
                      </a>
                    ) : (
                      <span className="text-gray-500">No resume</span>
                    )}
                  </td>
                  <td className={`border p-4 ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>
                    {applicant.testScore || 'N/A'}
                  </td>
                  <td className={`border p-4 ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>
                    {applicant.skills && Array.isArray(applicant.skills)
                      ? applicant.skills.join(", ")
                      : 'No skills listed'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Job;