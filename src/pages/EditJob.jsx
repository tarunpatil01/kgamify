import { useState, useEffect } from "react";
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
import PropTypes from 'prop-types';

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
  const [jdFilesNew, setJdFilesNew] = useState([]);
  const [jdError, setJdError] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const jobData = await getJobById(jobId);
        // Map legacy experience values to new human-readable labels for backward compatibility
        const legacyToLabel = {
          'entry': 'Entry Level',
          'entry ': 'Entry Level',
          'junior': 'Junior',
          'mid': 'Mid Level',
          'mid-level': 'Mid Level',
          'mid level': 'Mid Level',
          'senior': 'Senior',
          'executive': 'Executive'
        };
        const normalized = {
          ...jobData,
          experienceLevel: legacyToLabel[String(jobData.experienceLevel || '').trim().toLowerCase()] || jobData.experienceLevel || ''
        };
        setFormData(normalized);
  } catch {
        // Silent
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
      // Validate file if present
      if (jdFilesNew && jdFilesNew.length) {
        for (const f of jdFilesNew) {
          const name = f.name.toLowerCase();
          const valid = name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx');
          if (!valid) {
            setJdError('Only PDF, DOC, DOCX are allowed');
            return;
          }
          if (f.size > 10 * 1024 * 1024) {
            setJdError('Each file must be less than 10MB');
            return;
          }
        }
      }

      // Prepare payload
      let payload;
      const existingList = Array.isArray(formData.jdFiles) ? formData.jdFiles : (formData.jdPdfUrl ? [formData.jdPdfUrl] : []);
      if (jdFilesNew && jdFilesNew.length) {
        payload = new FormData();
        // Include current explicit jdFiles if present; otherwise include existing list to preserve
        const toSend = Array.isArray(formData.jdFiles) ? formData.jdFiles : existingList;
        Object.entries({ ...formData, jdFiles: toSend }).forEach(([k, v]) => {
          if (k === 'jdFiles' && Array.isArray(v)) {
            v.forEach(val => payload.append('jdFiles', val));
          } else if (typeof v !== 'undefined' && v !== null) {
            payload.append(k, v);
          }
        });
        jdFilesNew.forEach(f => payload.append('jdFiles', f));
      } else {
        payload = { ...formData };
        // Ensure jdFiles stays an array in JSON case if present
        if (Array.isArray(payload.jdFiles)) {
          payload.jdFiles = payload.jdFiles.filter(Boolean);
        }
      }

      await editJob(jobId, payload);
  // Navigate with success message state so JobPosted can show it
  navigate("/job-posted", { state: { notification: "Job updated successfully" } });
  } catch {
      // Silent
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
              <label className="block mb-2 sm:mb-3">Job Title</label>
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
                    InputProps={{
                      ...params.InputProps,
                      style: isDarkMode ? { color: '#e5e7eb' } : undefined
                    }}
                    InputLabelProps={{ style: isDarkMode ? { color: '#9ca3af' } : undefined }}
                    size="small"
                    required
                  />
                )}
              />
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block mb-2 sm:mb-3">Job Description</label>
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
                  sx={isDarkMode ? {
                    color: '#e5e7eb',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#4b5563' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6b7280' },
                    '.MuiSvgIcon-root': { color: '#9ca3af' }
                  } : {}}
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
                  sx={isDarkMode ? {
                    color: '#e5e7eb',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#4b5563' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6b7280' },
                    '.MuiSvgIcon-root': { color: '#9ca3af' }
                  } : {}}
                >
                  <MenuItem value="">Select Experience Level</MenuItem>
                  <MenuItem value="Entry Level">Entry Level</MenuItem>
                  <MenuItem value="Junior">Junior</MenuItem>
                  <MenuItem value="Mid Level">Mid Level</MenuItem>
                  <MenuItem value="Senior">Senior</MenuItem>
                  <MenuItem value="Executive">Executive</MenuItem>
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
                  sx={isDarkMode ? {
                    color: '#e5e7eb',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#4b5563' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6b7280' },
                    '.MuiSvgIcon-root': { color: '#9ca3af' }
                  } : {}}
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
                  InputProps={{ style: isDarkMode ? { color: '#e5e7eb' } : undefined }}
                  InputLabelProps={{ style: isDarkMode ? { color: '#9ca3af' } : undefined }}
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
                  InputProps={{ style: isDarkMode ? { color: '#e5e7eb' } : undefined }}
                  InputLabelProps={{ style: isDarkMode ? { color: '#9ca3af' } : undefined }}
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
                  InputProps={{ style: isDarkMode ? { color: '#e5e7eb' } : undefined }}
                  InputLabelProps={{ style: isDarkMode ? { color: '#9ca3af' } : undefined }}
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
                InputProps={{ style: isDarkMode ? { color: '#e5e7eb' } : undefined }}
                InputLabelProps={{ style: isDarkMode ? { color: '#9ca3af' } : undefined }}
                size="small"
              />
            </div>
            
            <div className="mb-4 sm:mb-6">
              <label className="block">Recruitment Process</label>
              <QuillEditor
                value={formData.recruitmentProcess}
                onChange={(content) => setFormData({ ...formData, recruitmentProcess: content })}
                isDarkMode={isDarkMode}
                placeholder="Describe the recruitment process (stages, rounds, timelines)..."
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
                sx={isDarkMode ? {
                  color: '#e5e7eb',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: '#4b5563' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6b7280' },
                  '.MuiSvgIcon-root': { color: '#9ca3af' }
                } : {}}
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
                InputProps={{ style: isDarkMode ? { color: '#e5e7eb' } : undefined }}
                InputLabelProps={{ style: isDarkMode ? { color: '#9ca3af' } : undefined }}
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
                    InputProps={{
                      ...params.InputProps,
                      style: isDarkMode ? { color: '#e5e7eb' } : undefined
                    }}
                    InputLabelProps={{ style: isDarkMode ? { color: '#9ca3af' } : undefined }}
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
                InputProps={{ style: isDarkMode ? { color: '#e5e7eb' } : undefined }}
                InputLabelProps={{ style: isDarkMode ? { color: '#9ca3af' } : undefined }}
                size="small"
              />
            </div>
            {/* JD attachments management */}
            <div className="mb-4 sm:mb-6">
              <label className="block mb-2">Attach JD files (PDF/DOC/DOCX, optional)</label>
              {/* Existing attachments list */}
              <div className="mb-2">
                {Array.isArray(formData.jdFiles) && formData.jdFiles.length > 0 ? (
                  <ul className="list-disc list-inside text-sm">
                    {formData.jdFiles.map((url, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Attachment {i + 1}</a>
                        <button type="button" className="text-red-600 underline" onClick={() => setFormData({ ...formData, jdFiles: formData.jdFiles.filter((u, idx) => idx !== i) })}>Remove</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  formData.jdPdfUrl ? (
                    <div className="text-sm flex items-center gap-3">
                      <a href={formData.jdPdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View current JD</a>
                      <button type="button" className="text-red-600 underline" onClick={() => setFormData({ ...formData, jdPdfUrl: '' })}>Remove</button>
                    </div>
                  ) : null
                )}
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setJdError("");
                  setJdFilesNew(files);
                }}
                className="block w-full text-sm text-gray-900 bg-white border border-gray-300 rounded-lg cursor-pointer focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#ff8200] file:text-white hover:file:bg-[#e57400]"
              />
              {jdFilesNew && jdFilesNew.length > 0 && (
                <ul className="mt-2 text-sm list-disc list-inside">
                  {jdFilesNew.map((f, i) => (
                    <li key={i}>{f.name}</li>
                  ))}
                </ul>
              )}
              {jdError && (
                <p className="mt-1 text-sm text-red-500">{jdError}</p>
              )}
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
EditJob.propTypes = {
  isDarkMode: PropTypes.bool
};
