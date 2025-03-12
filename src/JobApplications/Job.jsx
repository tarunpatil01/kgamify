import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaFileAlt, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import axios from "axios";

const Job = ({ isDarkMode }) => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/job/${jobId}`);
        setJob(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
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
            {job.applicants.map((applicant, index) => (
              <tr
                key={index}
                className={`transition duration-300 ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-50"} ${
                  index === job.applicants.length - 1 ? "rounded-b-lg" : ""
                }`}
              >
                <td className={`border p-4 ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>{applicant.name}</td>
                <td className={`border p-4 ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>
                  <FaFileAlt className="inline mr-2" />
                  {applicant.resume}
                </td>
                <td className={`border p-4 ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>{applicant.testScore}</td>
                <td className={`border p-4 ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>{applicant.skills.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Job;