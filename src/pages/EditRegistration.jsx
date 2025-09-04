import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { getCompanyInfo, updateCompanyProfile } from "../api";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import QuillEditor from '../components/QuillEditor'; // Replace ReactQuill import
import PropTypes from 'prop-types';

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
        let email = localStorage.getItem("rememberedEmail");
        // Fix: If not found in localStorage, try to get from companyData or session
        if (!email) {
          try {
            const cd = JSON.parse(localStorage.getItem("companyData") || "null");
            if (cd?.email) email = cd.email;
          } catch {
            // ignore
          }
        }
        if (!email) {
          setErrorMessage("Please login first");
          // Do NOT navigate away, just show error and let user login manually
          setLoading(false);
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
          } catch (error) { void error; }
        }
        
        // Parse socialMediaLinks if it exists
        let socialLinks = { instagram: '', twitter: '', linkedin: '', youtube: '' };
        if (companyData.socialMediaLinks) {
          try {
            socialLinks = typeof companyData.socialMediaLinks === 'string' 
              ? JSON.parse(companyData.socialMediaLinks)
              : companyData.socialMediaLinks;
          } catch (error) { void error; }
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
        void error;
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
        formData.addressLine2 ? `${formData.addressLine2  }, ` : ""
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

      await updateCompanyProfile(formData.email, formDataToSend);
      setErrorMessage('');
      setOpenSnackbar(true);
      // Refresh latest company data into local cache and UI state so form reflects updates
      try {
        const latest = await getCompanyInfo(formData.email);
        localStorage.setItem('companyData', JSON.stringify(latest));

        // Derive address fields from combined address
        let addressComponents = { addressLine1: '', addressLine2: '', city: '', state: '', pinCode: '' };
        if (latest.address) {
          try {
            const parts = latest.address.split(',').map(p => p.trim());
            if (parts.length >= 4) {
              addressComponents = {
                addressLine1: parts[0] || '',
                addressLine2: parts.length > 4 ? parts[1] : '',
                city: parts.length > 4 ? parts[2] : parts[1],
                state: parts.length > 4 ? parts[3] : parts[2],
                pinCode: parts[parts.length - 1] || ''
              };
            } else {
              addressComponents.addressLine1 = latest.address;
            }
          } catch (e) { void e; }
        }

        // Parse social links
        let socialLinks = { instagram: '', twitter: '', linkedin: '', youtube: '' };
        try {
          socialLinks = typeof latest.socialMediaLinks === 'string' ? JSON.parse(latest.socialMediaLinks) : (latest.socialMediaLinks || socialLinks);
        } catch (e) { void e; }

        setFormData(prev => ({
          ...prev,
          companyName: latest.companyName || '',
          website: latest.website || '',
          industry: latest.industry || '',
          type: latest.type || '',
          size: latest.size || '',
          contactName: latest.contactName || '',
          email: latest.email || prev.email,
          phone: latest.phone || '',
          addressLine1: addressComponents.addressLine1,
          addressLine2: addressComponents.addressLine2,
          city: addressComponents.city,
          state: addressComponents.state,
          pinCode: addressComponents.pinCode,
          username: latest.registrationNumber || prev.username,
          yearEstablished: latest.yearEstablished || '',
          description: latest.description || '',
          instagram: socialLinks.instagram || '',
          twitter: socialLinks.twitter || '',
          linkedin: socialLinks.linkedin || '',
          youtube: socialLinks.youtube || '',
          // keep password fields untouched
        }));

        if (latest.logo) setCurrentLogo(latest.logo);
        if (latest.documents) setCurrentDocuments(latest.documents);
      } catch { /* ignore refresh errors */ }
      
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
      void error;
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
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white" : "bg-gradient-to-br from-orange-50 via-white to-orange-100 text-black"}`}>
        <p className="text-xl font-bold">Loading company data...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={`flex flex-col justify-center items-center h-screen ${isDarkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white" : "bg-gradient-to-br from-orange-50 via-white to-orange-100 text-black"}`}>
        <p className="text-xl font-bold mb-4">{errorMessage}</p>
        <button
          className="px-6 py-3 rounded-xl font-bold text-base shadow transition bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white hover:from-[#e57400] hover:to-[#ffb347]"
          onClick={() => navigate('/')}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center py-8 px-2 sm:px-6 lg:px-8 relative overflow-hidden ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
          : "bg-gradient-to-br from-orange-50 via-white to-orange-100 text-black"
      }`}
    >
      <div
        className={`w-full max-w-3xl mx-auto rounded-3xl shadow-2xl border ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-orange-200"
        } p-6 sm:p-10 relative z-10`}
      >
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 text-center tracking-tight bg-gradient-to-r from-[#ff8200] to-[#ffb347] bg-clip-text text-transparent drop-shadow-lg">
          Edit Company Profile
        </h1>
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-6 border-b pb-2 border-dashed border-orange-300 text-black">
              Basic Info
            </h2>
            <div className="mb-6 flex flex-col sm:flex-row gap-x-6">
              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium text-black">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium text-black">Logo</label>
                {currentLogo && (
                  <div className="mb-2">
                    <img
                      src={currentLogo}
                      alt="Current Logo"
                      className="h-16 w-auto object-contain rounded-lg border"
                    />
                    <p className="text-sm text-gray-500 mt-1">Current logo</p>
                  </div>
                )}
                <input
                  type="file"
                  name="logo"
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
                />
              </div>
            </div>
            <div className="mb-6 flex flex-col sm:flex-row gap-x-6">
              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium text-black">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium text-black">Industry</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
                />
              </div>
            </div>
            <div className="mb-6 flex flex-col sm:flex-row gap-x-6">
              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium text-black">Type</label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium text-black">Size</label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-medium text-black">Description</label>
              <QuillEditor
                value={formData.description}
                onChange={(content) => setFormData({...formData, description: content})}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
          {/* Contact */}
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-6 border-b pb-2 border-dashed border-orange-300 text-black">
              Contact
            </h2>
            <div className="mb-6 flex flex-col sm:flex-row gap-x-6">
              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium text-black">Contact Name</label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium text-black">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-gray-100 text-gray-500 focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            </div>
            <div className="mb-6 flex flex-col sm:flex-row gap-x-6">
              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium text-black">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium text-black">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
                />
              </div>
            </div>
            {/* Address fields */}
            <div className="mb-6">
              <label className="block mb-2 font-medium text-black">Address Line 1</label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-medium text-black">Address Line 2</label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-medium text-black">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-medium text-black">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-medium text-black">Pin Code</label>
              <input
                type="text"
                name="pinCode"
                value={formData.pinCode}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
              />
            </div>
          </div>
          {/* Registration */}
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-6 border-b pb-2 border-dashed border-orange-300 text-black">
              Registration
            </h2>
            <div className="mb-6">
              <label className="block mb-2 font-medium text-black">Year Established</label>
              <input
                type="text"
                name="yearEstablished"
                value={formData.yearEstablished}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-medium text-black">Documents</label>
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
                className="w-full px-4 py-2 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
              />
            </div>
          </div>
          {/* Password */}
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-6 border-b pb-2 border-dashed border-orange-300 text-black">
              Password
            </h2>
            <div className="mb-6 relative">
              <label className="block mb-2 font-medium text-black">New Password</label>
              <input
                type={passwordVisible ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
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
            <div className="mb-6 relative">
              <label className="block mb-2 font-medium text-black">Confirm New Password</label>
              <input
                type={passwordVisible ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Enter a new password only if you want to change it. Leave blank to keep your current password.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Password must contain at least one number, one uppercase and lowercase letter, and at least 8 or more characters.
            </p>
          </div>
          {/* Other */}
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-6 border-b pb-2 border-dashed border-orange-300 text-black">
              Other
            </h2>
            <div className="mb-6">
              <label className="block mb-2 font-medium text-black">Social Media Links</label>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-black">Instagram</label>
                <input
                  type="url"
                  name="instagram"
                  value={formData.instagram || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-black">Twitter</label>
                <input
                  type="url"
                  name="twitter"
                  value={formData.twitter || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-black">LinkedIn</label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-black">YouTube</label>
                <input
                  type="url"
                  name="youtube"
                  value={formData.youtube || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-medium bg-white text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition shadow-sm"
                />
              </div>
            </div>
          </div>
          {errorMessage && (
            <div className="mb-6">
              <p className="text-red-500 font-semibold">{errorMessage}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition duration-300 bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white hover:from-[#e57400] hover:to-[#ffb347] flex items-center justify-center"
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
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ width: '100%', position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1400 }}
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

EditRegistration.propTypes = {
  isDarkMode: PropTypes.bool,
};