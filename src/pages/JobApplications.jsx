import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getApplicationsByJobId } from "../api"; // Import getApplicationsByJobId function

const JobApplications = ({ isDarkMode, email }) => {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await getApplicationsByJobId(jobId, email);
        setApplications(response);
      } catch (error) {
        console.error("Error fetching applications:", error);
      }
    };

    fetchApplications();
  }, [jobId, email]);

  return (
    <div className={`p-4 sm:p-6 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">Job Applications</h1>
      {applications.length === 0 ? (
        <p>No applications found.</p>
      ) : (
        <ul>
          {applications.map((application) => (
            <li key={application._id} className="mb-4">
              <p className="text-lg sm:text-xl">Applicant Name: {application.applicantName}</p>
              <p className="text-lg sm:text-xl">Skills: {application.skills.join(", ")}</p>
              <p className="text-lg sm:text-xl">Test Score: {application.testScore}</p>
              <p className="text-lg sm:text-xl">Resume: <a href={application.resume} target="_blank" rel="noopener noreferrer">View</a></p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default JobApplications;
