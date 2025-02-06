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

export default function PostJob() {
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
    <div className="flex pb-10 justify-center items-center h-full bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
          Create a Job Post
        </h1>
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">
              Job Details
            </h2>
            <div className="mb-6">
              <label className="block text-gray-700">Job Title</label>
              <TextField
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                fullWidth
                className="focus:border-blue-500"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700">Job Description</label>
              <TextareaAutosize
                className="border border-gray-400 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-6 flex gap-x-4">
              <div className="w-1/2">
                <label className="block text-gray-700">Employment Type</label>
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
                <label className="block text-gray-700">Experience Level</label>
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
                <label className="block text-gray-700">Remote or Onsite</label>
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
                <label className="block text-gray-700">Location</label>
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
                <label className="block text-gray-700">
                  Salary Range (USD)
                </label>
                <TextField
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  fullWidth
                  className="focus:border-blue-500"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-gray-700">Equity</label>
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
              <label className="block text-gray-700">Sponsorship</label>
              <TextField
                name="sponsorship"
                value={formData.sponsorship}
                onChange={handleChange}
                fullWidth
                className="focus:border-blue-500"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700">Recruitment Process</label>
              <TextareaAutosize
                name="recruitmentProcess"
                className="border border-gray-400 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={formData.recruitmentProcess}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700">Responsibilities</label>
              <TextareaAutosize
                name="responsibilities"
                className="border border-gray-400 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={formData.responsibilities}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700">Skills</label>
              <TextareaAutosize
                name="skills"
                className="border border-gray-400 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={formData.skills}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700">Benefits</label>
              <TextareaAutosize
                name="benefits"
                className="border border-gray-400 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={formData.benefits}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700">Eligibility</label>
              <TextareaAutosize
                name="eligibility"
                className="border border-gray-400 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={formData.eligibility}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700">Company Description</label>
              <TextareaAutosize
                name="companyDescription"
                className="border border-gray-400 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={formData.companyDescription}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700">Additional Information</label>
              <TextareaAutosize
                name="additionalInformation"
                className="border border-gray-400 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={formData.additionalInformation}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700">Status</label>
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
              <label className="block text-gray-700">Number of Positions</label>
              <TextField
                name="numberOfPositions"
                value={formData.numberOfPositions}
                onChange={handleChange}
                fullWidth
                className="focus:border-blue-500"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700">Category</label>
              <TextField
                name="category"
                value={formData.category}
                onChange={handleChange}
                fullWidth
                className="focus:border-blue-500"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700">Tags</label>
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
            className="w-full bg-[#E82561] text-white p-4 rounded hover:bg-[#d71e55] transition duration-300"
          >Post Job</button>
            
        </form>
      </div>
    </div>
  );
}