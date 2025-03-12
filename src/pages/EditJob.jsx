import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  TextField,
  TextareaAutosize,
  Select,
  MenuItem,
  Autocomplete,
  Snackbar,
  Alert,
} from "@mui/material";
import { getJobById, editJob } from "../api";

const jobTitles = ["Software Engineer", "Product Manager", "Designer", "Data Scientist", "Project Manager", "QA Engineer"];

const EditJob = ({ isDarkMode }) => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  
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

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const jobData = await getJobById(jobId);
        
        // Map job data to form fields
        setFormData({
          jobTitle: jobData.jobTitle || "",
          jobDescription: jobData.jobDescription || "",
          employmentType: jobData.employmentType || "",
          experienceLevel: jobData.experienceLevel || "",
          remoteOrOnsite: jobData.remoteOrOnsite || "",
          location: jobData.location || "",
          salary: jobData.salary || "",
          equity: jobData.equity || "",
          sponsorship: jobData.sponsorship || "",
          recruitmentProcess: jobData.recruitmentProcess || "",
          responsibilities: jobData.responsibilities || "",
          skills: jobData.skills || "",
          benefits: jobData.benefits || "",
          eligibility: jobData.eligibility || "",
          companyDescription: jobData.companyDescription || "",
          additionalInformation: jobData.additionalInformation || "",
          status: jobData.status || "",
          numberOfPositions: jobData.numberOfPositions || "",
          category: jobData.category || "",
          tags: jobData.tags || "",
          companyEmail: jobData.companyEmail || "" // Preserve companyEmail
        });
      } catch (error) {
        console.error("Error fetching job details:", error);
        setError("Failed to load job details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      // Validate required fields
      if (!formData.jobTitle || !formData.employmentType || !formData.location) {
        setSnackbarMessage("Please fill all required fields");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }

      // Ensure we're not losing the companyEmail when updating
      const updatedJobData = { ...formData };

      const response = await editJob(jobId, updatedJobData);
      setSnackbarMessage("Job updated successfully!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      
      // Redirect after successful update after a short delay
      setTimeout(() => {
        navigate("/job-posted");
      }, 2000);
    } catch (error) {
      console.error("Error updating job:", error);
      setSnackbarMessage("Failed to update job. Please try again.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
        <p className="text-xl">Loading job details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button 
            onClick={() => navigate("/job-posted")} 
            className="px-4 py-2 bg-[#ff8200] text-white rounded hover:bg-[#e57400]"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex p-4 sm:p-10 justify-center items-center h-fit ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className={`p-4 sm:p-8 rounded-2xl shadow-lg w-full max-w-4xl ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
        <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-8 text-center">Edit Job Post</h1>
        <form className="space-y-4 sm:space-y-8" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Job Details</h2>
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
                    required
                  />
                )}
              />
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block">Job Description</label>
              <TextareaAutosize
                className={`border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 ${isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-400"}`}
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleChange}
                minRows={3}
                style={{ width: "100%" }}
                required
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
                  required
                >
                  <MenuItem value="">Select Employment Type</MenuItem>
                  <MenuItem value="full-time">Full-time</MenuItem>
                  <MenuItem value="part-time">Part-time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="internship">Internship</MenuItem>
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
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block">Remote or Onsite</label>
                <Select
                  name="remoteOrOnsite"
                  value={formData.remoteOrOnsite}
                  onChange={handleChange}
                  fullWidth
                  className="focus:border-blue-500"
                  required
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
                  required
                />
              </div>
            </div>
            
            {/* Rest of form fields... */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block">Salary Range ₹(INR)</label>
                <TextField
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  fullWidth
                  className="focus:border-blue-500"
                  required
                />
              </div>
              <div className="w-full sm:w-1/2">
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
            
            {/* Continue with all the fields from PostJob.jsx */}
            <div className="mb-4 sm:mb-6">
              <label className="block">Sponsorship</label>
              <TextField
                name="sponsorship"
                value={formData.sponsorship}
                onChange={handleChange}
                fullWidth
                className="focus:border-blue-500"
              />
            </div>
            
            <div className="mb-4 sm:mb-6">
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
            
            <div className="mb-4 sm:mb-6">
              <label className="block">Status</label>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                fullWidth
                className="focus:border-blue-500"
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
                onChange={handleChange}
                fullWidth
                className="focus:border-blue-500"
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
              />
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => navigate("/job-posted")}
              className="px-6 py-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-3 rounded transition duration-300 ${isDarkMode ? "bg-[#ff8200] text-white hover:bg-[#e57400]" : "bg-[#ff8200] text-white hover:bg-[#e57400]"}`}
            >
              Update Job
            </button>
          </div>
        </form>
      </div>
      
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ width: '100%' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ width: '100%', maxWidth: '600px', fontSize: '1.1rem', '& .MuiAlert-message': { fontSize: '1.1rem' } }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default EditJob;
