import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  TextField,
  Select,
  MenuItem,
  Autocomplete,
  Snackbar,
  Alert,
  TextareaAutosize,
} from "@mui/material";
import { getJobById, editJob } from "../api";
import QuillEditor from '../components/QuillEditor'; // Added import for QuillEditor

const jobTitles = ["Software Engineer", "Product Manager", "Designer", "Data Scientist", "Project Manager", "QA Engineer"];

export default function EditJob({ isDarkMode }) {
  const navigate = useNavigate();
  const { jobId } = useParams();
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
    companyEmail: ""
  });
  const [loading, setLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const jobData = await getJobById(jobId);
        setFormData(jobData);
      } catch (error) {
        console.error("Error fetching job:", error);
        setError("Failed to load job data");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await editJob(jobId, formData);
      setOpenSnackbar(true);
      setTimeout(() => {
        navigate("/job-posted");
      }, 2000);
    } catch (error) {
      console.error("Error updating job:", error);
      setError("Failed to update job");
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100"}`}>
        <p className="text-xl">Loading job data...</p>
      </div>
    );
  }

  return (
    <div className={`flex p-4 sm:p-10 justify-center items-center h-fit ${
      isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
    }`}>
      <div className={`p-4 sm:p-8 rounded-2xl shadow-lg w-full max-w-4xl ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
      }`}>
        <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-8 text-center">
          Edit Job Post
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
                    size="small"
                    required
                  />
                )}
              />
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block">Job Description</label>
              <QuillEditor
                value={formData.jobDescription}
                onChange={(content) => setFormData({...formData, jobDescription: content})}
                isDarkMode={isDarkMode}
                placeholder="Enter detailed job description..."
              />
            </div>
            <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block">Employment Type</label>
                <Select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  fullWidth
                  className="focus:border-blue-500"
                  size="small"
                  required
                >
                  <MenuItem value="">Select Employment Type</MenuItem>
                  <MenuItem value="full-time">Full-time</MenuItem>
                  <MenuItem value="part-time">Part-time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="internship">Internship</MenuItem>
                </Select>
              </div>
              <div>
                <label className="block">Experience Level</label>
                <Select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                  fullWidth
                  className="focus:border-blue-500"
                  size="small"
                  required
                >
                  <MenuItem value="">Select Experience Level</MenuItem>
                  <MenuItem value="entry">Entry Level</MenuItem>
                  <MenuItem value="junior">Junior</MenuItem>
                  <MenuItem value="mid">Mid-Level</MenuItem>
                  <MenuItem value="senior">Senior</MenuItem>
                  <MenuItem value="executive">Executive</MenuItem>
                </Select>
              </div>
            </div>
            
            {/* Remaining form fields */}
            <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block">Remote or Onsite</label>
                <Select
                  name="remoteOrOnsite"
                  value={formData.remoteOrOnsite}
                  onChange={handleChange}
                  fullWidth
                  className="focus:border-blue-500"
                  size="small"
                  required
                >
                  <MenuItem value="">Select Option</MenuItem>
                  <MenuItem value="remote">Remote</MenuItem>
                  <MenuItem value="onsite">Onsite</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </Select>
              </div>
              <div>
                <label className="block">Location</label>
                <TextField
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  fullWidth
                  className="focus:border-blue-500"
                  size="small"
                  required
                />
              </div>
            </div>
            
            {/* Rest of form fields... */}
            <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block">Salary Range ₹(INR)</label>
                <TextField
                  name="salary"
                  value={formData.salary}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only update if the input is a number or empty
                    if (value === "" || /^[\d,-]+$/.test(value)) {
                      setFormData({ ...formData, salary: value });
                    }
                  }}
                  fullWidth
                  className="focus:border-blue-500"
                  size="small"
                  required
                />
              </div>
              <div>
                <label className="block">Equity</label>
                <TextField
                  name="equity"
                  value={formData.equity}
                  onChange={handleChange}
                  fullWidth
                  className="focus:border-blue-500"
                  size="small"
                />
              </div>
            </div>
            
            <div className="mb-4 sm:mb-6">
              <label className="block">Sponsorship</label>
              <TextField
                name="sponsorship"
                value={formData.sponsorship}
                onChange={handleChange}
                fullWidth
                className="focus:border-blue-500"
                size="small"
              />
            </div>
            
            <div className="mb-4 sm:mb-6">
              <label className="block">Recruitment Process</label>
              <TextareaAutosize
                name="recruitmentProcess"
                className={`border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 text-sm sm:text-base w-full ${isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-400"}`}
                value={formData.recruitmentProcess}
                onChange={handleChange}
                minRows={2}
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
                size="small"
                required
              >
                <MenuItem value="">Select Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
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
                  if (value === "" || /^[\d,-]+$/.test(value)) {
                    setFormData({ ...formData, numberOfPositions: value });
                  }
                }}
                fullWidth
                className="focus:border-blue-500"
                size="small"
                type="number"
                required
              />
            </div>
            
            <div className="mb-4 sm:mb-6">
              <label className="block">Category</label>
              <Autocomplete
                freeSolo
                options={["Engineering", "Data", "Design", "Product", "Marketing", "Sales", "HR", "Finance"]}
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
                    size="small"
                  />
                )}
              />
            </div>
            
            <div className="mb-4 sm:mb-6">
              <label className="block">Tags (comma separated)</label>
              <TextField
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                fullWidth
                className="focus:border-blue-500"
                size="small"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
            <button
              type="button"
              onClick={() => navigate("/job-posted")}
              className="order-2 sm:order-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`order-1 sm:order-2 px-4 sm:px-6 py-2 sm:py-3 rounded transition duration-300 text-sm sm:text-base ${isDarkMode ? "bg-[#ff8200] text-white hover:bg-[#e57400]" : "bg-[#ff8200] text-white hover:bg-[#e57400]"}`}
            >
              Update Job
            </button>
          </div>
        </form>
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={() => setOpenSnackbar(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setOpenSnackbar(false)}
            severity="success"
            sx={{ width: '100%' }}
          >
            Job updated successfully!
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
}
