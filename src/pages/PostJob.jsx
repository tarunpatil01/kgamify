import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Select,
  MenuItem,
  Autocomplete,
  Snackbar,
  Alert,
  TextareaAutosize,
} from "@mui/material";
import { createJob, getCompanyInfo } from "../api";
import QuillEditor from '../components/QuillEditor'; // Added import for QuillEditor
import PropTypes from 'prop-types';

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

export default function PostJob({ isDarkMode, email, userCompany }) {
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

  // Cities selection not used currently
  const [openSnackbar, setOpenSnackbar] = useState(false); // State for Snackbar
  const [jdFiles, setJdFiles] = useState([]);
  const [jdError, setJdError] = useState("");
  const [planMeta, setPlanMeta] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = userCompany || JSON.parse(localStorage.getItem('companyData') || 'null');
        const emailToUse = stored?.email || email;
        if (!emailToUse) return;
        const fresh = await getCompanyInfo(emailToUse);
        const plan = fresh.subscriptionPlan || 'free';
        const limits = { free: 1, silver: 5, gold: 20 };
        const limit = limits[plan] ?? 0;
        const remaining = Math.max(0, (limit - (fresh.activeJobCount || 0)));
        setPlanMeta({ plan, limit, remaining, status: fresh.subscriptionStatus });
      } catch { /* ignore */ }
    })();
  }, [email, userCompany]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email) {
      alert("You must be logged in to post a job");
      navigate("/");
      return;
    }

    try {
      // Validate file if present
      if (jdFiles && jdFiles.length) {
        for (const f of jdFiles) {
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

      // Build payload: use FormData when file is present
  let payload;
  const headers = {};
      if (jdFiles && jdFiles.length) {
        payload = new FormData();
        Object.entries({ ...formData, companyEmail: email }).forEach(([k, v]) => {
          if (typeof v !== 'undefined' && v !== null) payload.append(k, v);
        });
        jdFiles.forEach(file => payload.append('jdFiles', file));
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        payload = { ...formData, companyEmail: email };
        headers['Content-Type'] = 'application/json';
      }

      await createJob(payload, { headers });
      setOpenSnackbar(true);

      // Add navigation after successful post
      setTimeout(() => {
        navigate("/job-posted");
      }, 2000);
  } catch {
      // Silent
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // Custom styling for Material-UI components in dark mode
  // Styles handled inline in components

  return (
    <div
      className={`min-h-screen flex items-center justify-center py-8 px-2 sm:px-6 lg:px-8 ${
        isDarkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white" : "bg-gradient-to-br from-orange-50 via-white to-orange-100 text-black"
      }`}
    >
      {(userCompany?.status === 'hold' || userCompany?.status === 'pending') && (
        <div className={`w-full max-w-3xl mx-auto mb-6 p-4 rounded border ${userCompany.status === 'hold' ? 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-700' : 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-700'}`}>
          <div className="font-semibold mb-1">Posting disabled</div>
          <div className="text-sm">Your account is {userCompany.status}. You can edit registration, but posting is disabled. See <a href="/messages" className="underline text-[#ff8200]">Messages</a>.</div>
        </div>
      )}
      <div
        className={`w-full max-w-3xl mx-auto rounded-3xl shadow-2xl border ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-orange-200"
        } p-6 sm:p-10`}
      >
        <div className="flex flex-col items-center mb-8 gap-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center tracking-tight bg-gradient-to-r from-[#ff8200] to-[#ffb347] bg-clip-text text-transparent drop-shadow-lg">
            Create a Job Post
          </h1>
          {planMeta && (
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className={`px-2 py-1 rounded-full border ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-orange-300 text-orange-800'} bg-white/10`}>{planMeta.plan} plan</span>
              <span className={`px-2 py-1 rounded-full ${planMeta.remaining>0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{planMeta.remaining} / {planMeta.limit} posts remaining</span>
            </div>
          )}
        </div>
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-6 border-b pb-2 border-dashed border-orange-300">
              Job Details
            </h2>
            <div className="mb-6">
              <label className="block mb-2 font-medium">Job Title</label>
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
                    inputProps={{
                      ...params.inputProps,
                      style: { color: isDarkMode ? 'white' : 'inherit' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                        },
                        '&:hover fieldset': {
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.23)',
                        }
                      }
                    }}
                  />
                )}
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-medium">Job Description</label>
              <QuillEditor
                value={formData.jobDescription}
                onChange={(content) => setFormData({...formData, jobDescription: content})}
                isDarkMode={isDarkMode}
                placeholder="Enter detailed job description..."
              />
            </div>
            <div className="mb-6 flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium">Employment Type</label>
                <Select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  fullWidth
                  sx={{
                    color: isDarkMode ? 'white' : 'inherit',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                    },
                    '& .MuiSvgIcon-root': {
                      color: isDarkMode ? 'white' : 'inherit',
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: { backgroundColor: 'white' } // White background for dropdown
                    }
                  }}
                >
                  <MenuItem value="">Select Employment Type</MenuItem>
                  <MenuItem value="freelance">Freelance</MenuItem>
                  <MenuItem value="full-time">Full-time</MenuItem>
                  <MenuItem value="part-time">Part-time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                </Select>
              </div>

              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium">Experience Level</label>
                <Select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                  fullWidth
                  sx={{
                    color: isDarkMode ? 'white' : 'inherit',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                    },
                    '& .MuiSvgIcon-root': {
                      color: isDarkMode ? 'white' : 'inherit',
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: { backgroundColor: 'white' } // White background for dropdown
                    }
                  }}
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
            <div className="mb-6 flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium">Remote or Onsite</label>
                <Select
                  name="remoteOrOnsite"
                  value={formData.remoteOrOnsite}
                  onChange={handleChange}
                  fullWidth
                  sx={{
                    color: isDarkMode ? 'white' : 'inherit',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                    },
                    '& .MuiSvgIcon-root': {
                      color: isDarkMode ? 'white' : 'inherit',
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: { backgroundColor: 'white' }
                    }
                  }}
                >
                  <MenuItem value="">Select Option</MenuItem>
                  <MenuItem value="remote">Remote</MenuItem>
                  <MenuItem value="onsite">Onsite</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </Select>
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium">Location</label>
                <TextField
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{
                    style: { color: isDarkMode ? 'white' : 'inherit' }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                      }
                    }
                  }}
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-medium">Salary Range ₹(INR)</label>
              <Select
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                fullWidth
                sx={{
                  color: isDarkMode ? 'white' : 'inherit',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                  },
                  '& .MuiSvgIcon-root': {
                    color: isDarkMode ? 'white' : 'inherit',
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: { backgroundColor: 'white' }
                  }
                }}
              >
                <MenuItem value="">Select Salary Range</MenuItem>
                {salaryOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-medium">Relocation Benefits</label>
              <TextField
                name="relocationBenefits"
                value={formData.relocationBenefits}
                onChange={handleChange}
                fullWidth
                inputProps={{
                  style: { color: isDarkMode ? 'white' : 'inherit' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                    }
                  }
                }}
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-medium">Recruitment Process</label>
              <QuillEditor
                value={formData.recruitmentProcess}
                onChange={(content) => setFormData({ ...formData, recruitmentProcess: content })}
                isDarkMode={isDarkMode}
                placeholder="Describe the recruitment process (stages, rounds, timelines)..."
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-medium">Responsibilities</label>
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
            <div className="mb-6">
              <label className="block mb-2 font-medium">Skills</label>
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
            <div className="mb-6">
              <label className="block mb-2 font-medium">Benefits</label>
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
            <div className="mb-6">
              <label className="block mb-2 font-medium">Eligibility</label>
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
            <div className="mb-6">
              <label className="block mb-2 font-medium">Company Description</label>
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
            <div className="mb-6">
              <label className="block mb-2 font-medium">Additional Information</label>
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
            {/* JD attachments upload */}
            <div className="mb-6">
              <label className="block mb-2 font-medium">Attach JD files (PDF/DOC/DOCX, optional)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setJdError("");
                  setJdFiles(files);
                }}
                className="block w-full text-sm text-gray-900 bg-white border border-gray-300 rounded-lg cursor-pointer focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#ff8200] file:text-white hover:file:bg-[#e57400] transition"
              />
              {jdFiles && jdFiles.length > 0 && (
                <ul className="mt-2 text-sm list-disc list-inside">
                  {jdFiles.map((f, i) => (
                    <li key={i}>{f.name}</li>
                  ))}
                </ul>
              )}
              {jdError && (
                <p className="mt-1 text-sm text-red-500">{jdError}</p>
              )}
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-medium">Status</label>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                fullWidth
                sx={{
                  color: isDarkMode ? 'white' : 'inherit',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                  },
                  '& .MuiSvgIcon-root': {
                    color: isDarkMode ? 'white' : 'inherit',
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: { backgroundColor: 'white' }
                  }
                }}
              >
                <MenuItem value="">Select Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-medium">Number of Positions</label>
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
                inputProps={{
                  style: { color: isDarkMode ? 'white' : 'inherit' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                    }
                  }
                }}
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-medium">Category</label>
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
                    inputProps={{
                      ...params.inputProps,
                      style: { color: isDarkMode ? 'white' : 'inherit' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                        }
                      }
                    }}
                  />
                )}
                componentsProps={{
                  paper: { sx: { backgroundColor: 'white' } } // White background for dropdown
                }}
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-medium">Tags</label>
              <TextField
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                fullWidth
                inputProps={{
                  style: { color: isDarkMode ? 'white' : 'inherit' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                    }
                  }
                }}
              />
            </div>
          </div>
          <button
            type="submit"
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition duration-300 ${
              isDarkMode
                ? "bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white hover:from-[#e57400] hover:to-[#ffb347]"
                : "bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white hover:from-[#e57400] hover:to-[#ffb347]"
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
              borderRadius: "12px",
              background: isDarkMode
                ? "linear-gradient(90deg, #232526 0%, #ff8200 100%)"
                : "linear-gradient(90deg, #fffbe6 0%, #ffb347 100%)",
              color: isDarkMode ? "white" : "#232526",
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
PostJob.propTypes = {
  isDarkMode: PropTypes.bool,
  email: PropTypes.string,
  userCompany: PropTypes.object
};
