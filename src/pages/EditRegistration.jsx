import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { getCompanyInfo, updateCompanyProfile } from "../api";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

function EditRegistration({ isDarkMode }) {
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
  const [currentLogo, setCurrentLogo] = useState(null);
  const [currentDocuments, setCurrentDocuments] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch company data on component mount
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const email = localStorage.getItem("rememberedEmail");
        if (!email) {
          setErrorMessage("Please login first");
          navigate("/");
          return;
        }

        setLoading(true);
        const companyData = await getCompanyInfo(email);
        
        // Set the form data with the fetched company information
        setFormData({
          companyName: companyData.companyName || "",
          website: companyData.website || "",
          industry: companyData.industry || "",
          type: companyData.type || "",
          size: companyData.size || "",
          contactName: companyData.contactName || "",
          email: companyData.email || "",
          phone: companyData.phone || "",
          address: companyData.address || "",
          registrationNumber: companyData.registrationNumber || "",
          yearEstablished: companyData.yearEstablished || "",
          description: companyData.description || "",
          socialMediaLinks: companyData.socialMediaLinks || "",
          password: companyData.password || "",
        });
        
        // Store the current logo and documents URLs
        if (companyData.logo) {
          setCurrentLogo(companyData.logo);
        }
        
        if (companyData.documents) {
          setCurrentDocuments(companyData.documents);
        }
        
      } catch (error) {
        console.error("Error fetching company data:", error);
        setErrorMessage("Failed to load company data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validate file types if files are selected
    if (formData.logo && !formData.logo.type?.startsWith('image/')) {
      setErrorMessage('Logo must be an image file');
      return;
    }

    if (formData.documents && !formData.documents.type?.includes('pdf')) {
      setErrorMessage('Documents must be PDF files');
      return;
    }

    const formDataToSend = new FormData();
    
    // Append form data
    Object.keys(formData).forEach(key => {
      if (key === 'logo' || key === 'documents') {
        // Only append files if they've been changed
        if (formData[key] && formData[key] instanceof File) {
          formDataToSend.append(key, formData[key]);
        }
      } else if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      const response = await updateCompanyProfile(formData.email, formDataToSend);
      setErrorMessage('');
      setOpenSnackbar(true);
      setTimeout(() => {
        setOpenSnackbar(false);
      }, 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Update failed. Please try again.');
      console.error("Error updating company:", error);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
        <p className="text-xl">Loading company data...</p>
      </div>
    );
  }

  return (
    <div className={`flex p-4 sm:p-12 justify-center items-center h-full ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className={`p-4 sm:p-8 rounded-2xl shadow-lg w-full max-w-3xl ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
        <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-8 text-center">Edit Company Profile</h1>
        <form className="space-y-4 sm:space-y-8" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-[#ff8200]">
              Basic Info
            </h2>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700 dark:text-gray-300">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700 dark:text-gray-300">Logo</label>
                {currentLogo && (
                  <div className="mb-2">
                    <img 
                      src={currentLogo} 
                      alt="Current Logo" 
                      className="h-16 w-auto object-contain"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Current logo</p>
                  </div>
                )}
                <input
                  type="file"
                  name="logo"
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                />
              </div>
            </div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700 dark:text-gray-300">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700 dark:text-gray-300">Industry</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                />
              </div>
            </div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700 dark:text-gray-300">Type</label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700 dark:text-gray-300">Size</label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-[#ff8200]">
              Contact
            </h2>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700 dark:text-gray-300">Contact Name</label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                  className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 bg-gray-100 ${isDarkMode ? "bg-gray-600 text-gray-300 border-gray-600" : ""}`}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
              </div>
            </div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700 dark:text-gray-300">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700 dark:text-gray-300">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-[#ff8200]">
              Registration
            </h2>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700 dark:text-gray-300">Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700 dark:text-gray-300">Year Established</label>
                <input
                  type="text"
                  name="yearEstablished"
                  value={formData.yearEstablished}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                />
              </div>
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700 dark:text-gray-300">Documents</label>
              {currentDocuments && (
                <div className="mb-2">
                  <a 
                    href={currentDocuments} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#ff8200] hover:underline"
                  >
                    View Current Documents
                  </a>
                </div>
              )}
              <input
                type="file"
                name="documents"
                onChange={handleChange}
                className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
              />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-[#ff8200]">Password</h2>
            <div className="mb-4 sm:mb-6 relative">
              <label className="block text-gray-700 dark:text-gray-300">Password</label>
              <input
                type={passwordVisible ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                title="Must contain at least one number, one uppercase and lowercase letter, and at least 8 or more characters"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-4 top-[60%] transform -translate-y-1/2"
              >
                {passwordVisible ? <FaEyeSlash className={`${isDarkMode ? "text-white" : ""}`} /> : <FaEye className={`${isDarkMode ? "text-white" : ""}`} />}
              </button>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} mt-2`}>
                Password must contain at least one number, one uppercase and lowercase letter, and at least 8 or more characters.
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-[#ff8200]">Other</h2>
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                rows={4}
              ></textarea>
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700 dark:text-gray-300">Social Media Links</label>
              <input
                type="url"
                name="socialMediaLinks"
                value={formData.socialMediaLinks}
                onChange={handleChange}
                className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
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
            className={`w-full p-4 rounded transition duration-300 bg-[#ff8200] text-white hover:bg-[#e57400]`}
          >
            Update Profile
          </button>
        </form>
      </div>
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Company information updated successfully!
        </Alert>
      </Snackbar>
    </div>
  );
}

export default EditRegistration;