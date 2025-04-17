import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  Autocomplete,
  Snackbar,
  Alert,
  TextareaAutosize, // Add this import
} from "@mui/material";
import { createJob } from "../api";
import ReactQuill from "react-quill"; // Import ReactQuill for HTML editor
import "react-quill/dist/quill.snow.css"; // Import Quill styles

const jobTitles = [
  "Software Engineer",
  "Product Manager",
  "Designer",
  "Data Scientist",
];
const salaryOptions = [
  "20,000-30,000",
  "30,000-50,000",
  "50,000-70,000",
  "70,000+",
];

export default function PostJob({ isDarkMode, email }) {
  // Add email prop
  const navigate = useNavigate();
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
    postedAt: new Date().toISOString(), // Set the real-time date
    companyEmail: email, // Add company email to form data
  });

  // Update companyEmail whenever the email prop changes
  useEffect(() => {
    if (email) {
      setFormData((prev) => ({
        ...prev,
        companyEmail: email,
      }));
    }
  }, [email]);

  const [cities, setCities] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false); // State for Snackbar

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuillChange = (value) => {
    setFormData({ ...formData, jobDescription: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email) {
      alert("You must be logged in to post a job");
      navigate("/");
      return;
    }

    try {
      // Ensure companyEmail is explicitly set to the current user's email
      const jobDataToSubmit = {
        ...formData,
        companyEmail: email, // Ensure this is always set
      };

      console.log("Submitting job with email:", email);
      const response = await createJob(jobDataToSubmit);
      console.log("Job posted successfully:", response);
      setOpenSnackbar(true);

      // Add navigation after successful post
      setTimeout(() => {
        navigate("/job-posted");
      }, 2000);
    } catch (error) {
      console.error("Error posting job:", error);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <div
      className={`flex p-4 sm:p-10 justify-center items-center h-fit ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div
        className={`p-4 sm:p-8 rounded-2xl shadow-lg w-full max-w-4xl ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
        }`}
      >
        <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-8 text-center">
          Create a Job Post
        </h1>
        <form className="space-y-4 sm:space-y-8" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
              Job Details
            </h2>
            <div className="mb-4 sm:mb-6">
              <label className="block">Job Title</label>
              <Autocomplete
                freeSolo
                options={jobTitles}
                value={formData.jobTitle}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, jobTitle: newValue });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    fullWidth
                    className="focus:border-blue-500"
                  />
                )}
              />
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block">Job Description</label>
              <ReactQuill
                theme="snow"
                value={formData.jobDescription}
                onChange={handleQuillChange}
                className="bg-white text-black"
              />
            </div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block">Employment Type</label>
                <Select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  fullWidth
                  className="focus:border-blue-500"
                >
                  <MenuItem value="">Select Employment Type</MenuItem>
                  <MenuItem value="freelance">Freelance</MenuItem>
                  <MenuItem value="full-time">Full-time</MenuItem>
                  <MenuItem value="part-time">Part-time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                </Select>
              </div>

              <div className="w-full sm:w-1/2">
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
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
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
              <div className="w-full sm:w-1/2">
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
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="mb-4 sm:mb-6">
                <label className="block">Salary Range ₹(INR)</label>
                <Select
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  fullWidth
                  className="focus:border-blue-500"
                >
                  <MenuItem value="">Select Salary Range</MenuItem>
                  {salaryOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </div>
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block">Relocation Benefits</label>
              <TextField
                name="relocationBenefits"
                value={formData.relocationBenefits}
                onChange={handleChange}
                fullWidth
                className="focus:border-blue-500"
              />
            </div>
            {/* Other fields remain unchanged */}

            <div className="mb-4 sm:mb-6">
              <label className="block">Recruitment Process</label>
              <TextareaAutosize
                name="recruitmentProcess"
                className={`border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700 text-white"
                    : "border-gray-400"
                }`}
                value={formData.recruitmentProcess}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block">Responsibilities</label>
              <TextareaAutosize
                name="responsibilities"
                className={`border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700 text-white"
                    : "border-gray-400"
                }`}
                value={formData.responsibilities}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block">Skills</label>
              <TextareaAutosize
                name="skills"
                className={`border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700 text-white"
                    : "border-gray-400"
                }`}
                value={formData.skills}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block">Benefits</label>
              <TextareaAutosize
                name="benefits"
                className={`border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700 text-white"
                    : "border-gray-400"
                }`}
                value={formData.benefits}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block">Eligibility</label>
              <TextareaAutosize
                name="eligibility"
                className={`border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700 text-white"
                    : "border-gray-400"
                }`}
                value={formData.eligibility}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block">Company Description</label>
              <TextareaAutosize
                name="companyDescription"
                className={`border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700 text-white"
                    : "border-gray-400"
                }`}
                value={formData.companyDescription}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block">Additional Information</label>
              <TextareaAutosize
                name="additionalInformation"
                className={`border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700 text-white"
                    : "border-gray-400"
                }`}
                value={formData.additionalInformation}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
              />
            </div>
            <div className="mb-4 sm:mb-6">
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
            <div className="mb-4 sm:mb-6">
              <label className="block">Number of Positions</label>
              <TextField
                name="numberOfPositions"
                value={formData.numberOfPositions}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only update if the input is a number or empty
                  if (value === "" || /^\d+$/.test(value)) {
                    setFormData({ ...formData, numberOfPositions: value });
                  }
                }}
                fullWidth
                className="focus:border-blue-500"
              />
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block">Category</label>
              <Autocomplete
                freeSolo
                options={[
                  "Engineering",
                  "Data",
                  "Design",
                  "Product",
                  "Marketing",
                  "Sales",
                  "HR",
                  "Finance",
                ]}
                value={formData.category}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, category: newValue });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    name="category"
                    placeholder="Select or type a category"
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormData({ ...formData, category: e.target.value });
                      }
                    }}
                    fullWidth
                    className="focus:border-blue-500"
                  />
                )}
              />
            </div>
            <div className="mb-4 sm:mb-6">
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
            className={`w-full p-4 rounded transition duration-300 ${
              isDarkMode
                ? "bg-[#ff8200] text-white hover:bg-[#e57400]"
                : "bg-[#ff8200] text-white hover:bg-[#e57400]"
            }`}
          >
            Post Job
          </button>
        </form>
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{ width: "100%" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity="success"
            sx={{
              width: "100%",
              maxWidth: "600px",
              fontSize: "1.1rem",
              "& .MuiAlert-message": { fontSize: "1.1rem" },
            }}
          >
            Job posted successfully
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
}
