import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { getCompanyInfo, updateCompanyProfile } from "../api";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import QuillEditor from '../components/QuillEditor'; // Replace ReactQuill import

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
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
    username: "", // Added username field
    yearEstablished: "",
    documents: null,
    description: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    youtube: "",
    password: "", // Password will be empty initially
    newPassword: "", // Add field for new password
    confirmPassword: "" // For password confirmation
  });
  const [currentLogo, setCurrentLogo] = useState(null);
  const [currentDocuments, setCurrentDocuments] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        
        // Parse address into components
        let addressComponents = {
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          pinCode: ""
        };
        
        if (companyData.address) {
          try {
            // Split address by commas and trim each part
            const parts = companyData.address.split(',').map(part => part.trim());
            
            if (parts.length >= 4) {
              // If we have enough parts, try to reconstruct the address components
              addressComponents = {
                addressLine1: parts[0] || "",
                addressLine2: parts.length > 4 ? parts[1] : "",
                city: parts.length > 4 ? parts[2] : parts[1],
                state: parts.length > 4 ? parts[3] : parts[2],
                pinCode: parts[parts.length-1] || ""
              };
            } else {
              // If address doesn't have enough parts, use the whole address as addressLine1
              addressComponents.addressLine1 = companyData.address;
            }
          } catch (error) {
            console.error("Error parsing address:", error);
          }
        }
        
        // Parse socialMediaLinks if it exists
        let socialLinks = { instagram: '', twitter: '', linkedin: '', youtube: '' };
        if (companyData.socialMediaLinks) {
          try {
            socialLinks = typeof companyData.socialMediaLinks === 'string' 
              ? JSON.parse(companyData.socialMediaLinks)
              : companyData.socialMediaLinks;
          } catch (error) {
            console.error("Error parsing social media links:", error);
          }
        }
        
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
          // Use parsed address components
          addressLine1: addressComponents.addressLine1,
          addressLine2: addressComponents.addressLine2,
          city: addressComponents.city,
          state: addressComponents.state,
          pinCode: addressComponents.pinCode,
          username: companyData.registrationNumber || "", // Use registration number as username
          yearEstablished: companyData.yearEstablished || "",
          description: companyData.description || "",
          instagram: socialLinks.instagram || "",
          twitter: socialLinks.twitter || "",
          linkedin: socialLinks.linkedin || "",
          youtube: socialLinks.youtube || "",
          password: "", // Don't set password from server response
          newPassword: "", // Initialize new password field
          confirmPassword: "", // Initialize confirm password field
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
    setErrorMessage("");
    
    // Validate file types if files are selected
    if (formData.logo && !formData.logo.type?.startsWith('image/')) {
      setErrorMessage('Logo must be an image file');
      return;
    }

    if (formData.documents && !formData.documents.type?.includes('pdf')) {
      setErrorMessage('Documents must be PDF files');
      return;
    }
    
    // Check if password fields match if a new password is provided
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setErrorMessage("New passwords don't match");
      return;
    }

    const formDataToSend = new FormData();
    setIsSubmitting(true);
    
    try {
      // Combine address components into a single address string
      const combinedAddress = `${formData.addressLine1}, ${
        formData.addressLine2 ? formData.addressLine2 + ", " : ""
      }${formData.city}, ${formData.state}, ${formData.pinCode}`;
      
      // Append form data
      Object.keys(formData).forEach(key => {
        // Skip fields that should not be sent
        if (['password', 'confirmPassword', 'newPassword', 'addressLine1', 'addressLine2', 'city', 'state', 'pinCode'].includes(key)) {
          return;
        }
        
        if (key === 'logo' || key === 'documents') {
          // Only append files if they've been changed
          if (formData[key] && formData[key] instanceof File) {
            formDataToSend.append(key, formData[key]);
          }
        } else if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add the combined address
      formDataToSend.append('address', combinedAddress);
      
      // Send username as registrationNumber for backend compatibility
      formDataToSend.append('registrationNumber', formData.username);
      
      // Handle password separately
      if (formData.newPassword) {
        formDataToSend.append('password', formData.newPassword);
      }

      const response = await updateCompanyProfile(formData.email, formDataToSend);
      setErrorMessage('');
      setOpenSnackbar(true);
      
      // Check if password was changed
      const wasPasswordChanged = formData.newPassword && formData.newPassword.trim().length > 0;
      
      setTimeout(() => {
        setOpenSnackbar(false);
        // If password was changed, redirect to login page
        if (wasPasswordChanged) {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('companyType');
          localStorage.removeItem('companyData');
          navigate('/');
        }
      }, 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.error || error.message || 'Update failed. Please try again.');
      console.error("Error updating company:", error);
    } finally {
      setIsSubmitting(false);
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
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700 dark:text-gray-300">Description</label>
              <QuillEditor
                value={formData.description}
                onChange={(content) => setFormData({...formData, description: content})}
                isDarkMode={isDarkMode}
              />
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
                <label className="block text-gray-700 dark:text-gray-300">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                />
              </div>
            </div>
            {/* Address fields */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700 dark:text-gray-300">Address Line 1</label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
              />
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700 dark:text-gray-300">Address Line 2</label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
              />
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700 dark:text-gray-300">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
              />
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700 dark:text-gray-300">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
              />
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700 dark:text-gray-300">Pin Code</label>
              <input
                type="text"
                name="pinCode"
                value={formData.pinCode}
                onChange={handleChange}
                className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
              />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-[#ff8200]">
              Registration
            </h2>
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700 dark:text-gray-300">Year Established</label>
              <input
                type="text"
                name="yearEstablished"
                value={formData.yearEstablished}
                onChange={handleChange}
                className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
              />
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
              <label className="block text-gray-700 dark:text-gray-300">New Password</label>
              <input
                type={passwordVisible ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
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
            </div>
            
            <div className="mb-4 sm:mb-6 relative">
              <label className="block text-gray-700 dark:text-gray-300">Confirm New Password</label>
              <input
                type={passwordVisible ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword || ""}
                onChange={handleChange}
                className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
              />
            </div>
            
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} mt-1`}>
              Enter a new password only if you want to change it. Leave blank to keep your current password.
            </p>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} mt-1`}>
              Password must contain at least one number, one uppercase and lowercase letter, and at least 8 or more characters.
            </p>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-[#ff8200]">Other</h2>
            
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700 dark:text-gray-300">Social Media Links</label>
              <div className="mb-4 sm:mb-6">
                <label className="block text-gray-700 dark:text-gray-300">Instagram</label>
                <input
                  type="url"
                  name="instagram"
                  value={formData.instagram || ""}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block text-gray-700 dark:text-gray-300">Twitter</label>
                <input
                  type="url"
                  name="twitter"
                  value={formData.twitter || ""}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block text-gray-700 dark:text-gray-300">LinkedIn</label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin || ""}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block text-gray-700 dark:text-gray-300">YouTube</label>
                <input
                  type="url"
                  name="youtube"
                  value={formData.youtube || ""}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                />
              </div>
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
            className={`w-full p-4 rounded transition duration-300 bg-[#ff8200] text-white hover:bg-[#e57400]`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <span className="mr-2 animate-spin">⟳</span> Updating...
              </div>
            ) : (
              "Update Profile"
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
          severity="success" 
          sx={{ width: '100%', maxWidth: '600px', fontSize: '1.1rem', '& .MuiAlert-message': { fontSize: '1.1rem' } }}
        >
          Company information updated successfully!
        </Alert>
      </Snackbar>
    </div>
  );
}

export default EditRegistration;