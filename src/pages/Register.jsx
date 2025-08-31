import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";
import { registerCompany } from "../api";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import QuillEditor from '../components/QuillEditor';
import backgroundImage from '../assets/background.jpg';
import PropTypes from 'prop-types';

// Three-step registration with progress stepper and summary

function Register({ isDarkMode }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    companyName: "",
    email: "",
    phone: "",
    // Step 2: Company Details
    companyType: "",
    website: "https://",
    description: "",
    // Auth fields
    username: "",
    password: "",
    confirmPassword: "",
    // Step 3: Address + Documents
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
    documents: null
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setFormData((prevDetails) => ({
      ...prevDetails,
      [name]: files ? files[0] : value,
    }));
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.companyName?.trim() || !formData.email?.trim() || !formData.phone?.trim()) {
        setSnackbarMessage("Please fill Company Name, Email, and Phone");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return false;
      }
      // Basic email shape check
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setSnackbarMessage("Please enter a valid email address");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!formData.companyType || !formData.username?.trim() || !formData.password || !formData.confirmPassword || !formData.website?.trim()) {
        setSnackbarMessage("Please complete company type, username, password, and website");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setSnackbarMessage("Passwords don't match");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!formData.addressLine1?.trim() || !formData.city?.trim() || !formData.state?.trim() || !formData.pinCode?.trim()) {
        setSnackbarMessage("Please complete the address fields");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return false;
      }
      if (!formData.documents) {
        setSnackbarMessage("Please upload the required PDF document");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };
  const handlePrevious = () => setCurrentStep((prev) => prev - 1);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate passwords match on final submission
      if (formData.password !== formData.confirmPassword) {
        setSnackbarMessage("Passwords don't match");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        setIsSubmitting(false);
        return;
      }

      // Prepare minimal form data for submission (with address + documents)
  const submissionData = new FormData();
  submissionData.append("companyName", formData.companyName);
  submissionData.append("website", formData.website);
  submissionData.append("type", formData.companyType);
  submissionData.append("email", formData.email);
  // Backend expects 'Username' with capital U
  submissionData.append("Username", formData.username);
  submissionData.append("yearEstablished", new Date().getFullYear().toString());
  submissionData.append("password", formData.password);
  const description = formData.description || "<p>No description provided</p>";
  submissionData.append("description", description);
  if (formData.phone) submissionData.append("phone", formData.phone);

      // Combine address fields into a single string
      const addressParts = [
        formData.addressLine1?.trim(),
        formData.addressLine2?.trim(),
        formData.city?.trim(),
        formData.state?.trim(),
        formData.pinCode?.trim(),
      ].filter(Boolean);
      const address = addressParts.join(", ");
      submissionData.append("address", address);

      // Documents upload (PDF)
      if (formData.documents) {
        submissionData.append("documents", formData.documents);
      }

  // Submit the form
  await registerCompany(submissionData);

      // Handle successful registration
      setSnackbarMessage("Registration successful! Waiting for admin approval.");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);

      // Redirect to login page after a delay
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      setSnackbarMessage(error.message || "Registration failed. Please try again.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const steps = useMemo(() => ([
    { key: 1, label: 'Company Registration' },
    { key: 2, label: 'Company Details' },
    { key: 3, label: 'Document Upload' }
  ]), []);

  const docRequirements = useMemo(() => ({
    'Private Limited': ['Certificate of Incorporation', 'Company PAN and GST Certificate', 'MOA/AOA'],
    'Public Limited': ['Certificate of Incorporation', 'Company PAN and GST Certificate', 'Prospectus'],
    'LLP': ['LLP Agreement', 'LLP Incorporation Certificate', 'PAN and GST Certificate'],
    'Partnership': ['Registered Partnership Deed', 'PAN of Firm and GST Certificate'],
    'Proprietorship': ['GST Registration Certificate', 'MSME/Udyam (if available)', 'Proprietor PAN'],
    'Startup': ['Startup India Recognition (if available)', 'Certificate of Incorporation', 'PAN & GST'],
    'NGO': ['Registration/Trust/Societies Certificate', '12A/80G (if applicable)', 'PAN of Organization']
  }), []);

  const fileDropRef = useRef(null);

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFormData(fd => ({ ...fd, documents: file }));
    }
  };

  const onDragOver = (e) => { e.preventDefault(); };

  return (
    <div
      className="min-h-screen flex p-4 sm:p-12 justify-center items-center relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-kgamify-500/20 via-transparent to-kgamify-pink-500/20"></div>
      
      {/* Content Container */}
      <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 p-4 sm:p-8 w-full max-w-3xl">
        {/* Stepper */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <div key={s.key} className="flex-1 flex items-center">
                <div className={`flex flex-col items-center text-center ${currentStep === s.key ? 'font-bold' : ''}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${currentStep >= s.key ? 'bg-[#ff8200] text-white' : 'bg-gray-300 text-gray-700'}`}>{s.key}</div>
                  <div className="mt-2 text-xs sm:text-sm max-w-[5.5rem] sm:max-w-none">
                    {s.label}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${currentStep > s.key ? 'bg-[#ff8200]' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-right text-xs opacity-70 mt-2">Step {Math.min(currentStep, steps.length)} of {steps.length}</div>
        </div>

        <form className="space-y-4 sm:space-y-8" onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800 border-b border-gray-200 pb-3">Basic Info</h2>
              <div className="mb-4 sm:mb-6">
                <label className="block">Company Name <span className="text-red-500">*</span></label>
                <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="input-kgamify" required />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">Email <span className="text-red-500">*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-kgamify" required />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">Phone <span className="text-red-500">*</span></label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-kgamify" required />
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800 border-b border-gray-200 pb-3">Company Details</h2>
              <div className="mb-4 sm:mb-6">
                <label className="block">Company Type <span className="text-red-500">*</span></label>
                <select
                  name="companyType"
                  value={formData.companyType}
                  onChange={handleChange}
                  className="input-kgamify"
                  required
                >
                  <option value="">Select Company Type</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="Public Limited">Public Limited</option>
                  <option value="LLP">LLP</option>
                  <option value="Startup">Startup</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Proprietorship">Proprietorship</option>
                  <option value="NGO">Non-Governmental Organization (NGO)</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="mb-4 sm:mb-6">
                  <label className="block">Username <span className="text-red-500">*</span></label>
                  <input type="text" name="username" value={formData.username} onChange={handleChange} className="input-kgamify" required />
                </div>
                <div className="mb-4 sm:mb-6">
                  <label className="block">Password <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-kgamify"
                    pattern="(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                    title="Must contain at least one number, one uppercase and lowercase letter, and at least 8 or more characters"
                    required
                  />
                </div>
                <div className="mb-4 sm:mb-6">
                  <label className="block">Confirm Password <span className="text-red-500">*</span></label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="input-kgamify" required />
                </div>
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">Website <span className="text-red-500">*</span></label>
                <input type="url" name="website" value={formData.website} onChange={handleChange} className="input-kgamify" required />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">Company Description</label>
                <QuillEditor
                  value={formData.description}
                  onChange={(content) => setFormData({ ...formData, description: content })}
                  isDarkMode={isDarkMode}
                />
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800 border-b border-gray-200 pb-3">Document Upload</h2>
              {/* Dynamic document guidance */}
              {formData.companyType && (
                <div className="mb-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="font-medium mb-2">Required documents for {formData.companyType}:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {(docRequirements[formData.companyType] || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-gray-600">Please upload a single PDF that includes the above documents.</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div>
                  <label className="block">Address Line 1 <span className="text-red-500">*</span></label>
                  <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} className="input-kgamify" required />
                </div>
                <div>
                  <label className="block">Address Line 2</label>
                  <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} className="input-kgamify" />
                </div>
                <div>
                  <label className="block">City <span className="text-red-500">*</span></label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className="input-kgamify" required />
                </div>
                <div>
                  <label className="block">State <span className="text-red-500">*</span></label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} className="input-kgamify" required />
                </div>
                <div>
                  <label className="block">Pin Code <span className="text-red-500">*</span></label>
                  <input type="text" name="pinCode" value={formData.pinCode} onChange={handleChange} className="input-kgamify" required />
                </div>
              </div>

              {/* Drag and drop */}
              <div
                ref={fileDropRef}
                onDragOver={onDragOver}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center ${isDarkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}`}
              >
                <p className="mb-2 font-medium">Drag & drop your PDF here, or click to select</p>
                <p className="text-xs opacity-70 mb-4">PDF only, up to 10MB</p>
                <input
                  type="file"
                  name="documents"
                  accept="application/pdf,.pdf"
                  onChange={handleChange}
                  className="input-kgamify"
                />
                {formData.documents && (
                  <div className="mt-3 text-sm">Selected: <span className="font-medium">{formData.documents.name}</span></div>
                )}
              </div>
              <div className="text-xs opacity-70 mt-2">Tip: Hover over document names to see help. Upload combined PDF with all required items.</div>
            </>
          )}

          {currentStep === 4 && (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800 border-b border-gray-200 pb-3">Summary</h2>
              <div className="space-y-3 text-sm">
                <div><span className="font-semibold">Company:</span> {formData.companyName}</div>
                <div><span className="font-semibold">Email:</span> {formData.email}</div>
                <div><span className="font-semibold">Phone:</span> {formData.phone}</div>
                <div><span className="font-semibold">Type:</span> {formData.companyType || '—'}</div>
                <div><span className="font-semibold">Website:</span> {formData.website}</div>
                <div><span className="font-semibold">Address:</span> {[formData.addressLine1, formData.addressLine2, formData.city, formData.state, formData.pinCode].filter(Boolean).join(', ')}</div>
                <div><span className="font-semibold">Documents:</span> {formData.documents?.name || '—'}</div>
              </div>
              <div className="mt-4 text-xs opacity-70">Please review your information before submission.</div>
            </>
          )}

          <div className="flex justify-between">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="btn-secondary half-width"
              >
                Previous
              </button>
            )}
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className={`btn-primary ${currentStep > 1 ? 'half-width' : ''}`}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className={`btn-primary ${currentStep > 1 ? 'half-width' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <FaSpinner className="animate-spin mr-2" /> Submitting...
                  </div>
                ) : (
                  "Submit"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ width: "100%" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{
            width: "100%",
            maxWidth: "600px",
            fontSize: "1.1rem",
            "& .MuiAlert-message": { fontSize: "1.1rem" },
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Register;

Register.propTypes = {
  isDarkMode: PropTypes.bool,
};
