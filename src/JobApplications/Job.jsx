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
        
        // Fetch job details
        console.log("Fetching job details for ID:", jobId);
        const jobData = await getJobById(jobId);
        console.log("Job data received:", jobData);
        setJob(jobData);
        
        // Fetch applications for this job
        console.log("Fetching applications for job ID:", jobId);
        try {
          const applicationsData = await getApplicationsByJobId(jobId);
          console.log("Applications data received:", applicationsData);
          setApplications(Array.isArray(applicationsData) ? applicationsData : []);
        } catch (appError) {
          console.error("Error fetching applications:", appError);
          setApplications([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError(err.message || "Failed to fetch job details");
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId, navigate]);

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
        <p className="text-xl">Loading job details...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
          <p className="text-red-700 dark:text-red-200">Authentication Error</p>
          <p className="mt-2">You do not have permission to view this page.</p>
          <button 
            onClick={() => navigate("/login")}
            className={`mt-4 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${isDarkMode ? "bg-red-700 text-white hover:bg-red-600" : "bg-red-500 text-white hover:bg-red-400"}`}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
          <p className="text-red-700 dark:text-red-200">Error: {error}</p>
          <p className="mt-2">Please try again later or contact support.</p>
        </div>
      </div>
    );
  }

  // Function to safely render HTML content
  const renderHTML = (htmlContent) => {
    if (!htmlContent) return null;
    return { __html: htmlContent };
  };

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

        {/* Job Description with HTML rendering */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Job Description</h2>
          <div 
            className={`job-description-content ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            dangerouslySetInnerHTML={renderHTML(job.jobDescription)}
          />
        </div>

        {/* Detailed Job Information - Preserved as requested by the user */}
        <div className="mb-6">
          <div>
            <strong>Job Title: </strong> {job.jobTitle}
          </div>
          <div>
            <strong>Description: </strong> 
            <div dangerouslySetInnerHTML={renderHTML(job.jobDescription)}></div>
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
            <strong className="flex ">Recruitment Process: </strong> 
            <div dangerouslySetInnerHTML={renderHTML(job.recruitmentProcess)}></div>
          </div>
          <div>
            <strong className="flex ">Responsibilities: </strong>
            <div dangerouslySetInnerHTML={renderHTML(job.responsibilities)}></div>
          </div>
          <div>
            <strong className="flex ">Eligibility: </strong> 
            <div dangerouslySetInnerHTML={renderHTML(job.eligibility)}></div>
          </div>
          <div>
            <strong className="flex ">Benefits: </strong>
            <div dangerouslySetInnerHTML={renderHTML(job.benefits)}></div>
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
                    {/* Fix: Wrap the adjacent JSX elements with a fragment or div */}
                    <div>
                      <div className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                        {applicant.applicantName}
                      </div>
                      <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Applied on: {new Date(applicant.createdAt).toLocaleDateString()}
                      </div>
                    </div>
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