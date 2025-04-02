import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaSpinner, FaCloudUploadAlt } from "react-icons/fa"; // Add FaCloudUploadAlt
import { registerCompany } from "../api";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

function Register({ isDarkMode }) {
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    logo: null,
    website: "",
    industry: "",
    type: "",
    size: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    registrationNumber: "",
    yearEstablished: "",
    documents: null,
    description: "",
    socialMediaLinks: "",
    password: "",
  });
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState(""); // Add message state
  const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // Add severity state
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // Add uploading state

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setFormData((prevDetails) => ({
      ...prevDetails,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validate file types
    if (formData.logo && !formData.logo.type.startsWith('image/')) {
      setErrorMessage('Logo must be an image file');
      return;
    }

    if (formData.documents && formData.documents.type !== 'application/pdf') {
      setErrorMessage('Documents must be PDF files');
      return;
    }

    // Set loading state to true
    setIsSubmitting(true);

    const formDataToSend = new FormData();
    
    // Check if files are being uploaded
    const hasFiles = formData.logo || formData.documents;
    
    // If files are present, show uploading notification
    if (hasFiles) {
      setIsUploading(true);
      setSnackbarMessage("Uploading files... Please wait");
      setSnackbarSeverity("info");
      setOpenSnackbar(true);
    }
    
    // Append form data
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      const response = await registerCompany(formDataToSend);
      setErrorMessage('');
      // Update snackbar for success
      setIsUploading(false);
      setSnackbarMessage('Company registration request sent successfully!');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      
      setTimeout(() => {
        setOpenSnackbar(false);
        navigate("/");
      }, 3000);
    } catch (error) {
      // Update snackbar for error
      setIsUploading(false);
      setSnackbarSeverity('error');
      
      if (error.response?.data?.error === 'Email already registered') {
        setErrorMessage('This email is already registered. Please use a different email.');
        setSnackbarMessage('Email already registered');
      } else {
        setErrorMessage(error.response?.data?.error || 'Registration failed. Please try again.');
        setSnackbarMessage('Registration failed');
      }
      setOpenSnackbar(true);
      console.error("Error registering company:", error);
    } finally {
      setIsSubmitting(false); // Reset loading state regardless of outcome
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <div className={`flex p-4 sm:p-12 justify-center items-center h-full ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className={`p-4 sm:p-8 rounded-2xl shadow-lg w-full max-w-3xl ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
        <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-8 text-center">Company Registration</h1>
        
        {/* Show loading overlay when submitting */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className={`p-8 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} flex flex-col items-center`}>
              <FaSpinner className="animate-spin text-[#ff8200] text-4xl mb-4" />
              <p className={`text-lg ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                {isUploading ? "Uploading files and registering your company..." : "Registering your company..."}
              </p>
            </div>
          </div>
        )}
        
        <form className="space-y-4 sm:space-y-8" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-700">
              Basic Info
            </h2>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Logo</label>
                <input
                  type="file"
                  name="logo"
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Industry</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Type</label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Size</label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-700">
              Contact
            </h2>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Contact Name</label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-700">
              Registration
            </h2>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Year Established</label>
                <input
                  type="number"
                  name="yearEstablished"
                  value={formData.yearEstablished}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700">Documents</label>
              <input
                type="file"
                name="documents"
                onChange={handleChange}
                className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
              />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-700">Password</h2>
            <div className="mb-4 sm:mb-6 relative">
              <label className="block text-gray-700">Password</label>
              <input
                type={passwordVisible ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                title="Must contain at least one number, one uppercase and lowercase letter, and at least 8 or more characters"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-4 top-1/2 transform -translate-y-1/2"
              >
                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Password must contain at least one number, one uppercase and lowercase letter, and at least 8 or more characters.
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-700">Other</h2>
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
              ></textarea>
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700">Social Media Links</label>
              <input
                type="url"
                name="socialMediaLinks"
                value={formData.socialMediaLinks}
                onChange={handleChange}
                className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
              />
            </div>
          </div>
          {errorMessage && (
            <div className="mb-4 sm:mb-6">
              <p className="text-red-500">{errorMessage}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full p-4 rounded transition duration-300 ${
              isDarkMode 
                ? "bg-[#ff8200] text-white hover:bg-[#e57400]" 
                : "bg-[#ff8200] text-white hover:bg-[#e57400]"
            } ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                {isUploading ? (
                  <>
                    <FaCloudUploadAlt className="mr-2" />
                    Uploading & Registering...
                  </>
                ) : (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Registering...
                  </>
                )}
              </span>
            ) : (
              "Register"
            )}
          </button>
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
}

export default Register;