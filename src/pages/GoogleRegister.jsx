import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerCompany } from "../api"; // Remove registerGoogleCompany
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

function GoogleRegister() {
  const navigate = useNavigate();
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
    password: "", // Add password field (required for standard registration)
  });
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Get Google profile data from URL params or sessionStorage
    const params = new URLSearchParams(window.location.search);
    const googleId = params.get('googleId') || sessionStorage.getItem('googleId');
    const email = params.get('email') || sessionStorage.getItem('email');
    
    if (googleId && email) {
      setFormData(prev => ({
        ...prev,
        googleId,
        email
      }));
    }
  }, []);

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
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });
  
    try {
      // Use regular company registration instead of Google-specific
      const response = await registerCompany(formDataToSend);
      setErrorMessage('');
      setOpenSnackbar(true);
      setTimeout(() => {
        setOpenSnackbar(false);
        navigate("/");
      }, 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Registration failed. Please try again.');
      console.error("Error registering company:", error);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <div className="flex p-4 sm:p-12 justify-center items-center h-full bg-gray-100">
      <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-lg w-full max-w-3xl">
        <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-8 text-center text-[#ff8200]">
          Company Registration
        </h1>
        <form className="space-y-4 sm:space-y-8" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-[#ff8200]">
              Basic Info
            </h2>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-[#ff8200]">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-[#ff8200]">Logo</label>
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
                <label className="block text-[#ff8200]">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-[#ff8200]">Industry</label>
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
                <label className="block text-[#ff8200]">Type</label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-[#ff8200]">Size</label>
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
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-[#ff8200]">
              Contact
            </h2>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-[#ff8200]">Contact Name</label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-[#ff8200]">Email</label>
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
                <label className="block text-[#ff8200]">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-[#ff8200]">Address</label>
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
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-[#ff8200]">
              Registration
            </h2>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-[#ff8200]">Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-[#ff8200]">Year Established</label>
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
              <label className="block text-[#ff8200]">Documents</label>
              <input
                type="file"
                name="documents"
                onChange={handleChange}
                className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
              />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-[#ff8200]">Other</h2>
            <div className="mb-4 sm:mb-6">
              <label className="block text-[#ff8200]">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
              ></textarea>
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block text-[#ff8200]">Social Media Links</label>
              <input
                type="url"
                name="socialMediaLinks"
                value={formData.socialMediaLinks}
                onChange={handleChange}
                className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-[#ff8200] text-white p-4 rounded hover:bg-[#e57400] transition duration-300"
          >
            Register
          </button>
        </form>
      </div>
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Company registration request sent successfully!
        </Alert>
      </Snackbar>
    </div>
  );
}

export default GoogleRegister;