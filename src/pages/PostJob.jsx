import React, { useState } from "react";
import {
  Button,
  TextField,
  TextareaAutosize,
  Select,
  MenuItem,
  Card,
  CardContent,
} from "@mui/material";

export default function PostJob({ isDarkMode }) {
  const [formData, setFormData] = useState({
    jobTitle: "",
    jobDescription: "",
    employmentType: "",
    experienceLevel: "",
    remoteOrOnsite: "",
    location: "",
    salary: "",
    equity: "",
    sponsorship: "",
    recruitmentProcess: "",
    responsibilities: "",
    skills: "",
    benefits: "",
    eligibility: "",
    companyDescription: "",
    additionalInformation: "",
    status: "",
    numberOfPositions: "",
    category: "",
    tags: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Add your form submission logic here
  };

  return (
    <div className={`flex p-10 justify-center items-center h-fit ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className={`p-8 rounded-2xl shadow-lg w-full max-w-4xl ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
        <h1 className="text-4xl font-bold mb-8 text-center">Create a Job Post</h1>
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-2xl font-semibold mb-6">Job Details</h2>
            <div className="mb-6">
              <label className="block">Job Title</label>
              <TextField
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                fullWidth
                className="focus:border-blue-500"
              />
            </div>
            <div className="mb-6">
              <label className="block">Job Description</label>
              <TextareaAutosize
                className={`border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 ${isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-400"}`}
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-6 flex gap-x-4">
              <div className="w-1/2">
                <label className="block">Employment Type</label>
                <Select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  fullWidth
                  className="focus:border-blue-500"
                >
                  <MenuItem value="">Select Employment Type</MenuItem>
                  <MenuItem value="full-time">Full-time</MenuItem>
                  <MenuItem value="part-time">Part-time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                </Select>
              </div>
              <div className="w-1/2">
                <label className="block">Experience Level</label>
                <Select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                  fullWidth
                  className="focus:border-blue-500"
                >
                  <MenuItem value="">Select Experience Level</MenuItem>
                  <MenuItem value="junior">Junior</MenuItem>
                  <MenuItem value="mid">Mid-Level</MenuItem>
                  <MenuItem value="senior">Senior</MenuItem>
                </Select>
              </div>
            </div>
            <div className="mb-6 flex gap-x-4">
              <div className="w-1/2">
                <label className="block">Remote or Onsite</label>
                <Select
                  name="remoteOrOnsite"
                  value={formData.remoteOrOnsite}
                  onChange={handleChange}
                  fullWidth
                  className="focus:border-blue-500"
                >
                  <MenuItem value="">Select Option</MenuItem>
                  <MenuItem value="remote">Remote</MenuItem>
                  <MenuItem value="onsite">Onsite</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </Select>
              </div>
              <div className="w-1/2">
                <label className="block">Location</label>
                <TextField
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  fullWidth
                  className="focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mb-6 flex gap-x-4">
              <div className="w-1/2">
                <label className="block">Salary Range (USD)</label>
                <TextField
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  fullWidth
                  className="focus:border-blue-500"
                />
              </div>
              <div className="w-1/2">
                <label className="block">Equity</label>
                <TextField
                  name="equity"
                  value={formData.equity}
                  onChange={handleChange}
                  fullWidth
                  className="focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block">Sponsorship</label>
              <TextField
                name="sponsorship"
                value={formData.sponsorship}
                onChange={handleChange}
                fullWidth
                className="focus:border-blue-500"
              />
            </div>
            <div className="mb-6">
              <label className="block">Recruitment Process</label>
              <TextareaAutosize
                name="recruitmentProcess"
                className={`border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 ${isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-400"}`}
                value={formData.recruitmentProcess}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-6">
              <label className="block">Responsibilities</label>
              <TextareaAutosize
                name="responsibilities"
                className={`border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 ${isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-400"}`}
                value={formData.responsibilities}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-6">
              <label className="block">Skills</label>
              <TextareaAutosize
                name="skills"
                className={`border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 ${isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-400"}`}
                value={formData.skills}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-6">
              <label className="block">Benefits</label>
              <TextareaAutosize
                name="benefits"
                className={`border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 ${isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-400"}`}
                value={formData.benefits}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-6">
              <label className="block">Eligibility</label>
              <TextareaAutosize
                name="eligibility"
                className={`border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 ${isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-400"}`}
                value={formData.eligibility}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-6">
              <label className="block">Company Description</label>
              <TextareaAutosize
                name="companyDescription"
                className={`border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 ${isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-400"}`}
                value={formData.companyDescription}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-6">
              <label className="block">Additional Information</label>
              <TextareaAutosize
                name="additionalInformation"
                className={`border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 ${isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-400"}`}
                value={formData.additionalInformation}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-6">
              <label className="block">Status</label>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                fullWidth
                className="focus:border-blue-500"
              >
                <MenuItem value="">Select Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </div>
            <div className="mb-6">
              <label className="block">Number of Positions</label>
              <TextField
                name="numberOfPositions"
                value={formData.numberOfPositions}
                onChange={handleChange}
                fullWidth
                className="focus:border-blue-500"
              />
            </div>
            <div className="mb-6">
              <label className="block">Category</label>
              <TextField
                name="category"
                value={formData.category}
                onChange={handleChange}
                fullWidth
                className="focus:border-blue-500"
              />
            </div>
            <div className="mb-6">
              <label className="block">Tags</label>
              <TextField
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                fullWidth
                className="focus:border-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className={`w-full p-4 rounded transition duration-300 ${isDarkMode ? "bg-[#E82561] text-white hover:bg-[#d71e55]" : "bg-[#E82561] text-white hover:bg-[#d71e55]"}`}
          >Post Job</button>
        </form>
      </div>
    </div>
  );
}