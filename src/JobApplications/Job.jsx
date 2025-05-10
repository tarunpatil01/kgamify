import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaFileAlt, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { getJobById, getApplicationsByJobId } from "../api";
import ResumeViewer from "../components/ResumeViewer";

const Job = ({ isDarkMode }) => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        const email = localStorage.getItem("rememberedEmail");
        if (!email) {
          console.log("Not authenticated. Redirecting to login page...");
          setAuthError(true);
          setTimeout(() => navigate("/", { state: { redirectTo: `/job/${jobId}` } }), 3000);
          return;
        }
        
        // Fetch job details
        console.log("Fetching job details for ID:", jobId);
        const jobData = await getJobById(jobId);
        console.log("Job data received:", jobData);
        setJob(jobData);
        
        // Fetch applications for this job
        try {
          console.log("Fetching applications for job ID:", jobId);
          const applicationsData = await getApplicationsByJobId(jobId);
          console.log("Applications data received:", applicationsData);
          setApplications(Array.isArray(applicationsData) ? applicationsData : []);
        } catch (appError) {
          console.error("Error fetching applications:", appError);
          
          if (appError.message === "Authentication required to view applications") {
            setAuthError(true);
          } else {
            setError("Could not load applications. Please try again later.");
          }
          setApplications([]);
        }
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError(err.message || "Failed to fetch job details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId, navigate]);

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
        <p className="text-xl">Loading job details...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className={`flex flex-col items-center justify-center h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
        <div className={`p-8 rounded-lg shadow-lg max-w-md text-center ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-6">You need to be logged in to view job applications.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
        <p className="text-xl text-red-500">Error: {error || "Job not found"}</p>
      </div>
    );
  }

  return (
    <div className={`flex h-full ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className={`flex-1 p-6 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"} min-h-screen`}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{job.jobTitle}</h1>
          <div className="mt-2 flex items-center">
            <span className={`mr-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>at</span>
            <span className="text-[#ff8200] font-semibold">{job.companyName}</span>
          </div>
          <div className="mt-2">
            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2">
              {job.employmentType}
            </span>
            <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
              {job.experienceLevel}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Job Description</h2>
          <p className={`whitespace-pre-wrap ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            {job.jobDescription}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Location</h3>
              <p>{job.location}</p>
            </div>
            <div>
              <h3 className="font-semibold">Salary Range</h3>
              <p>{job.salary}</p>
            </div>
            <div>
              <h3 className="font-semibold">Remote/Onsite</h3>
              <p>{job.remoteOrOnsite}</p>
            </div>
            <div>
              <h3 className="font-semibold">Number of Positions</h3>
              <p>{job.numberOfPositions || "Not specified"}</p>
            </div>
          </div>
        </div>

        {/* Show applications section */}
        <div className={`text-xl font-semibold mb-4 mt-6 ${isDarkMode ? "text-white" : "text-[#E82561]"}`}>
          Applicants
        </div>

        {applications.length === 0 ? (
          <div className={`p-4 rounded-lg text-center ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
            No applicants for this job yet
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((applicant) => (
              <div 
                key={applicant._id} 
                className={`p-4 rounded-lg shadow-md ${isDarkMode ? "bg-gray-700" : "bg-white"}`}
              >
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="mb-3 md:mb-0">
                    <h3 className="text-lg font-semibold">{applicant.applicantName}</h3>
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Applied on: {new Date(applicant.createdAt).toLocaleDateString()}
                    </p>
                    {applicant.testScore && (
                      <div className="mt-1">
                        <span className="font-medium">Test Score: </span>
                        <span className={`${parseInt(applicant.testScore) >= 70 ? "text-green-500" : "text-red-500"}`}>
                          {applicant.testScore}
                        </span>
                      </div>
                    )}
                    {applicant.skills && applicant.skills.length > 0 && (
                      <div className="mt-2">
                        <span className="font-medium">Skills: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {applicant.skills.map((skill, index) => (
                            <span 
                              key={index} 
                              className={`text-xs px-2 py-1 rounded ${
                                isDarkMode ? "bg-gray-600 text-white" : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 md:mt-0">
                    {applicant.resume ? (
                      <ResumeViewer resumeUrl={applicant.resume} applicantName={applicant.applicantName} />
                    ) : (
                      <div className="text-gray-500">No resume provided</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Job;