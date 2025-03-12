import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
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
  const [errorMessage, setErrorMessage] = useState("");

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

    const formDataToSend = new FormData();
    
    // Append form data
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      const response = await registerCompany(formDataToSend);
      setErrorMessage('');
      setOpenSnackbar(true);
      setTimeout(() => {
        setOpenSnackbar(false);
        navigate("/");
      }, 3000);
    } catch (error) {
      if (error.response?.data?.error === 'Email already registered') {
        setErrorMessage('This email is already registered. Please use a different email.');
      } else {
        setErrorMessage(error.response?.data?.error || 'Registration failed. Please try again.');
      }
      console.error("Error registering company:", error);
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
            className={`w-full p-4 rounded transition duration-300 ${isDarkMode ? "bg-[#ff8200] text-white hover:bg-[#e57400]" : "bg-[#ff8200] text-white hover:bg-[#e57400]"}`}
          >
            Register
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
          Company registration request sent successfully!
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Register;