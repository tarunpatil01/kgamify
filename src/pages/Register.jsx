import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaSpinner, FaCloudUploadAlt } from "react-icons/fa";
import { registerCompany } from "../api";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

// List of Indian states and cities
const statesAndCities = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur"],
  Bihar: ["Patna", "Gaya", "Bhagalpur"],
  Delhi: ["New Delhi"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi"],
  "West Bengal": ["Kolkata", "Darjeeling", "Siliguri"],
  // Add more states and cities as needed
};

function Register({ isDarkMode }) {
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    logo: null,
    website: "www.",
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
    companyType: "",
    documents: null,
    username: "",
    password: "",
    confirmPassword: "",
    description: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    youtube: "",
    state: "",
    city: "",
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [cities, setCities] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStateChange = (event) => {
    const selectedState = event.target.value;
    setFormData((prev) => ({ ...prev, state: selectedState, city: "" }));
    setCities(statesAndCities[selectedState] || []);
  };

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setFormData((prevDetails) => ({
      ...prevDetails,
      [name]: files ? files[0] : value,
    }));
  };

  const handleNext = () => setCurrentStep((prev) => prev + 1);
  const handlePrevious = () => setCurrentStep((prev) => prev - 1);

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Add validation and submission logic here
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <div
      className={`flex p-4 sm:p-12 justify-center items-center h-full ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div
        className={`p-4 sm:p-8 rounded-2xl shadow-lg w-full max-w-3xl ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
        }`}
      >
        <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-8 text-center">
          Company Registration
        </h1>

        <form className="space-y-4 sm:space-y-8" onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
                Basic Info
              </h2>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Logo (PNG, JPEG) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  name="logo"
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  accept=".png, .jpeg"
                  required
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Website <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Industry Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                >
                  <option value="">Select Industry</option>
                  <option value="IT">IT</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                </select>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
                Contact Person Details
              </h2>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">Address Line 2</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleStateChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                >
                  <option value="">Select State</option>
                  {Object.keys(statesAndCities).map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  City <span className="text-red-500">*</span>
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                  disabled={!formData.state}
                >
                  <option value="">Select City</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Pin Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                />
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
                Company Details
              </h2>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Company Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="companyType"
                  value={formData.companyType}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                >
                  <option value="">Select Company Type</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="Public Limited">Public Limited</option>
                </select>
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Documents (PDF) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  name="documents"
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  accept=".pdf"
                  required
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Password <span className="text-red-500">*</span>
                </label>
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
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type={passwordVisible ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">Instagram</label>
                <input
                  type="url"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">Twitter</label>
                <input
                  type="url"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">LinkedIn</label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">YouTube</label>
                <input
                  type="url"
                  name="youtube"
                  value={formData.youtube}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </>
          )}

          <div className="flex justify-between">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="p-2 sm:p-4 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Previous
              </button>
            )}
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="p-2 sm:p-4 bg-[#ff8200] text-white rounded hover:bg-[#e57400]"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="p-2 sm:p-4 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Submit
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
