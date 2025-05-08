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
<<<<<<< HEAD

    // Validate file types
    if (formData.logo && !formData.logo.type.startsWith("image/")) {
      setErrorMessage("Logo must be an image file");
      return;
    }

    if (formData.documents && formData.documents.type !== "application/pdf") {
      setErrorMessage("Documents must be PDF files");
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
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      const response = await registerCompany(formDataToSend);
      setErrorMessage("");
      // Update snackbar for success
      setIsUploading(false);
      setSnackbarMessage("Company registration request sent successfully!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);

      setTimeout(() => {
        setOpenSnackbar(false);
        navigate("/");
      }, 3000);
    } catch (error) {
      // Update snackbar for error
      setIsUploading(false);
      setSnackbarSeverity("error");

      if (error.response?.data?.error === "Email already registered") {
        setErrorMessage(
          "This email is already registered. Please use a different email."
        );
        setSnackbarMessage("Email already registered");
      } else {
        setErrorMessage(
          error.response?.data?.error ||
            "Registration failed. Please try again."
        );
        setSnackbarMessage("Registration failed");
      }
      setOpenSnackbar(true);
      console.error("Error registering company:", error);
    } finally {
      setIsSubmitting(false); // Reset loading state regardless of outcome
    }
=======
    // Add validation and submission logic here
>>>>>>> 5da1ec7d4d03b694050505cda0cd802a9782a0eb
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

<<<<<<< HEAD
        {/* Show loading overlay when submitting */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div
              className={`p-8 rounded-lg ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } flex flex-col items-center`}
            >
              <FaSpinner className="animate-spin text-[#ff8200] text-4xl mb-4" />
              <p
                className={`text-lg ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                {isUploading
                  ? "Uploading files and registering your company..."
                  : "Registering your company..."}
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
                <label className="block text-gray-700">Company Name*</label>
=======
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
>>>>>>> 5da1ec7d4d03b694050505cda0cd802a9782a0eb
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                />
              </div>
<<<<<<< HEAD
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">
                  Logo (.png/.jpg /.jpeg)*
=======
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Logo (PNG, JPEG) <span className="text-red-500">*</span>
>>>>>>> 5da1ec7d4d03b694050505cda0cd802a9782a0eb
                </label>
                <input
                  type="file"
                  name="logo"
                  accept=".png, .jpg, .jpeg"
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
<<<<<<< HEAD
                  required
                />
              </div>
            </div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Website*</label>
=======
                  accept=".png, .jpeg"
                  required
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Website <span className="text-red-500">*</span>
                </label>
>>>>>>> 5da1ec7d4d03b694050505cda0cd802a9782a0eb
                <input
                  type="url"
                  name="website"
                  placeholder="www.industry_name.com"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                />
              </div>
<<<<<<< HEAD
              {/* <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Industry*</label>
                <input
                  type="text"
=======
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Industry Type <span className="text-red-500">*</span>
                </label>
                <select
>>>>>>> 5da1ec7d4d03b694050505cda0cd802a9782a0eb
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
<<<<<<< HEAD
                />
              </div> */}
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Industry*</label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 bg-white"
                  required
                >
                  <option value="" disabled>
                    Select Industry
                  </option>
                  <option value="service">Service</option>
                  <option value="product">Product</option>
                  <option value="tech">Tech</option>
                  <option value="non-tech">Non-Tech</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="automobile">Automobile</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="retail">Retail</option>
                  <option value="media">Media</option>
                  <option value="telecommunication">Telecommunication</option>
                  <option value="hospitality">Hospitality</option>
                  <option value="agriculture">Agriculture</option>
                </select>
              </div>
            </div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Type*</label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Size*</label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
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
                <label className="block text-gray-700">Contact Name*</label>
=======
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
>>>>>>> 5da1ec7d4d03b694050505cda0cd802a9782a0eb
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                />
              </div>
<<<<<<< HEAD
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Email*</label>
=======
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Email <span className="text-red-500">*</span>
                </label>
>>>>>>> 5da1ec7d4d03b694050505cda0cd802a9782a0eb
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                />
              </div>
<<<<<<< HEAD
            </div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Phone*</label>
=======
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Phone <span className="text-red-500">*</span>
                </label>
>>>>>>> 5da1ec7d4d03b694050505cda0cd802a9782a0eb
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                />
              </div>
<<<<<<< HEAD
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Address*</label>
=======
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
>>>>>>> 5da1ec7d4d03b694050505cda0cd802a9782a0eb
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                />
              </div>
<<<<<<< HEAD
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-700">
              Registration
            </h2>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">
                  Registration Number*
                </label>
=======
              <div className="mb-4 sm:mb-6">
                <label className="block">Address Line 2</label>
>>>>>>> 5da1ec7d4d03b694050505cda0cd802a9782a0eb
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                />
              </div>
<<<<<<< HEAD
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Year Established*</label>
=======
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
>>>>>>> 5da1ec7d4d03b694050505cda0cd802a9782a0eb
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
                  Company Size <span className="text-red-500">*</span>
                </label>
                <select
                  name="companyType"
                  value={formData.companyType}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                  required
                >
                  <option value="">Select Company Size</option>
                  <option value="10 - 50  ">10 - 50 </option>
                  <option value="50 - 100">50 - 100</option>
                  <option value="100 - 150  ">100 - 150 </option>
                  <option value="150 - 200 ">150 - 200 </option>
                  <option value="200 - 250 ">200 - 250 </option>
                  <option value="250 - 300 ">250 - 300 </option>
                  <option value="300 - 350 ">300 - 350 </option>
                  <option value="350 - 400 ">350 - 400 </option>
                  <option value="400 - 450 ">400 - 450 </option>
                  <option value="450 - 500 ">450 - 500 </option>
                  <option value="500 - 550 ">500 - 550 </option>
                  <option value="550 - 600">550 - 600</option>
                  <option value="500-600">550 - 600</option>
                  <option value="600 - 650">600 - 650</option>
                  <option value="650 - 700">650 - 700</option>
                  <option value="700 - 750">700 - 750</option>
                  <option value="750 - 800">750 - 800</option>
                  <option value="800 - 850">800 - 850</option>
                  <option value="850 - 900">850 - 900</option>
                  <option value="900 - 950">900 - 950</option>
                  <option value="950 - 1000">950 - 1000</option>
                  <option value="1000 - 1500">1000 - 1500</option>
                </select>
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
                  required
                />
              </div>
<<<<<<< HEAD
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700">Documents*</label>
              <input
                type="file"
                name="documents"
                onChange={handleChange}
                className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                required
              />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-700">
              Password
            </h2>
            <div className="mb-4 sm:mb-6 relative">
              <label className="block text-gray-700">Password*</label>
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
=======
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
>>>>>>> 5da1ec7d4d03b694050505cda0cd802a9782a0eb
              <button
                type="button"
                onClick={handlePrevious}
                className="p-2 sm:p-4 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Previous
              </button>
<<<<<<< HEAD
              <p className="text-sm text-gray-600 mt-2">
                Password must contain at least one number, one uppercase and
                lowercase letter, and at least 8 or more characters.
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-700">
              Other
            </h2>
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
=======
>>>>>>> 5da1ec7d4d03b694050505cda0cd802a9782a0eb
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
