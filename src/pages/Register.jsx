import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaSpinner, FaCloudUploadAlt } from "react-icons/fa";
import { registerCompany } from "../api";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import QuillEditor from '../components/QuillEditor'; // Replace ReactQuill import
import backgroundImage from '../assets/background.jpg';

// Expanded list of Indian states and cities
const statesAndCities = {
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Nellore",
    "Kurnool",
    "Rajahmundry",
    "Tirupati",
  ],
  Assam: [
    "Guwahati",
    "Silchar",
    "Dibrugarh",
    "Jorhat",
    "Nagaon",
    "Tinsukia",
    "Tezpur",
  ],
  Bihar: [
    "Patna",
    "Gaya",
    "Bhagalpur",
    "Muzaffarpur",
    "Darbhanga",
    "Purnia",
    "Arrah",
    "Begusarai",
  ],
  Chhattisgarh: [
    "Raipur",
    "Bhilai",
    "Bilaspur",
    "Korba",
    "Durg",
    "Rajnandgaon",
    "Jagdalpur",
  ],
  Delhi: [
    "New Delhi",
    "Old Delhi",
    "South Delhi",
    "North Delhi",
    "East Delhi",
    "West Delhi",
  ],
  Goa: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim"],
  Gujarat: [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Bhavnagar",
    "Jamnagar",
    "Gandhinagar",
    "Anand",
  ],
  Haryana: [
    "Gurgaon",
    "Faridabad",
    "Chandigarh",
    "Ambala",
    "Panipat",
    "Karnal",
    "Hisar",
    "Rohtak",
  ],
  "Himachal Pradesh": [
    "Shimla",
    "Manali",
    "Dharamshala",
    "Solan",
    "Mandi",
    "Kullu",
    "Chamba",
  ],
  Jharkhand: [
    "Ranchi",
    "Jamshedpur",
    "Dhanbad",
    "Bokaro",
    "Hazaribagh",
    "Deoghar",
    "Dumka",
  ],
  Karnataka: [
    "Bengaluru",
    "Mysuru",
    "Mangaluru",
    "Hubli-Dharwad",
    "Belagavi",
    "Shivamogga",
    "Tumakuru",
    "Davanagere",
  ],
  Kerala: [
    "Thiruvananthapuram",
    "Kochi",
    "Kozhikode",
    "Thrissur",
    "Kollam",
    "Palakkad",
    "Kannur",
    "Alappuzha",
  ],
  "Madhya Pradesh": [
    "Bhopal",
    "Indore",
    "Jabalpur",
    "Gwalior",
    "Ujjain",
    "Sagar",
    "Dewas",
    "Satna",
  ],
  Maharashtra: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Thane",
    "Nashik",
    "Aurangabad",
    "Solapur",
    "Navi Mumbai",
    "Kolhapur",
  ],
  Odisha: [
    "Bhubaneswar",
    "Cuttack",
    "Rourkela",
    "Brahmapur",
    "Sambalpur",
    "Puri",
    "Balasore",
  ],
  Punjab: [
    "Ludhiana",
    "Amritsar",
    "Jalandhar",
    "Patiala",
    "Bathinda",
    "Mohali",
    "Pathankot",
    "Hoshiarpur",
  ],
  Rajasthan: [
    "Jaipur",
    "Jodhpur",
    "Udaipur",
    "Kota",
    "Ajmer",
    "Bikaner",
    "Alwar",
    "Bharatpur",
  ],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
    "Tirunelveli",
    "Erode",
    "Vellore",
  ],
  Telangana: [
    "Hyderabad",
    "Warangal",
    "Nizamabad",
    "Karimnagar",
    "Khammam",
    "Ramagundam",
    "Mahbubnagar",
  ],
  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur",
    "Varanasi",
    "Agra",
    "Prayagraj",
    "Meerut",
    "Bareilly",
    "Aligarh",
    "Moradabad",
  ],
  Uttarakhand: [
    "Dehradun",
    "Haridwar",
    "Roorkee",
    "Haldwani",
    "Rudrapur",
    "Kashipur",
    "Rishikesh",
  ],
  "West Bengal": [
    "Kolkata",
    "Asansol",
    "Siliguri",
    "Durgapur",
    "Bardhaman",
    "Malda",
    "Baharampur",
    "Howrah",
  ],
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
    companyType: "", // Company type (e.g. Private Limited)
    companySize: "", // Company size (e.g. 10-50 employees)
    documents: null,
    username: "",
    password: "",
    confirmPassword: "",
    description: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    youtube: "",
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
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setSnackbarMessage("Passwords don't match");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        setIsSubmitting(false);
        return;
      }

      // Prepare form data for submission
      const submissionData = new FormData();

      // Add regular fields to form data
      submissionData.append("companyName", formData.companyName);
      submissionData.append("website", formData.website);
      submissionData.append("industry", formData.industry);
      submissionData.append("type", formData.companyType);
      submissionData.append("size", formData.companySize);
      submissionData.append("contactName", formData.contactName);
      submissionData.append("email", formData.email);
      submissionData.append("phone", formData.phone);

      // Combine address fields
      const address = `${formData.addressLine1}, ${
        formData.addressLine2 ? formData.addressLine2 + ", " : ""
      }${formData.city}, ${formData.state}, ${formData.pinCode}`;
      submissionData.append("address", address);

      // Add registration details
      submissionData.append("registrationNumber", formData.username); // Using username as registration number
      submissionData.append("yearEstablished", new Date().getFullYear().toString());
      submissionData.append("password", formData.password);

      // Handle files
      if (formData.logo) {
        submissionData.append("logo", formData.logo);
      }

      if (formData.documents) {
        submissionData.append("documents", formData.documents);
      }

      // Ensure HTML content from ReactQuill is properly handled
      const description = formData.description || "<p>No description provided</p>";
      submissionData.append("description", description);

      const socialMediaLinks = {
        instagram: formData.instagram || "",
        twitter: formData.twitter || "",
        linkedin: formData.linkedin || "",
        youtube: formData.youtube || "",
      };
      submissionData.append("socialMediaLinks", JSON.stringify(socialMediaLinks));

      // Submit the form
      const response = await registerCompany(submissionData);

      // Handle successful registration
      setSnackbarMessage("Registration successful! Waiting for admin approval.");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);

      // Redirect to login page after a delay
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      console.error("Registration error:", error);
      setSnackbarMessage(error.message || "Registration failed. Please try again.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
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
        <h1 className="text-2xl sm:text-4xl font-heading font-bold mb-4 sm:mb-8 text-center text-gray-800">
          Company Registration
        </h1>

        <form className="space-y-4 sm:space-y-8" onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800 border-b border-gray-200 pb-3">
                📝 Basic Info
              </h2>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  <span className="font-medium text-gray-800">
                    Company Name <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="input-kgamify mt-2"
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
                  className="input-kgamify"
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
                  className="input-kgamify"
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
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2 text-white"
                  required
                >
                  <option className="text-black" value="">Select Industry</option>
                  <option className="text-black" value="IT">IT</option>
                  <option className="text-black" value="Finance">Finance</option>
                  <option className="text-black" value="Healthcare">Healthcare</option>
                  <option className="text-black" value="Education">Education</option>
                </select>
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">Company Description</label>
                <QuillEditor
                  value={formData.description}
                  onChange={(content) => setFormData({...formData, description: content})}
                  isDarkMode={isDarkMode}
                />
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
                  className="input-kgamify"
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
                  className="input-kgamify"
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
                  className="input-kgamify"
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
                  className="input-kgamify"
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
                  className="input-kgamify"
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
                  className="input-kgamify"
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
                  className="input-kgamify"
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
                  className="input-kgamify"
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
                  className="input-kgamify"
                  required
                >
                  <option value="">Select Company Type</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="Public Limited">Public Limited</option>
                  <option value="Startup">Startup</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Proprietorship">Proprietorship</option>
                  <option value="NGO">Non-Governmental Organization (NGO)</option>
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
                  className="input-kgamify"
                  accept=".pdf"
                  required
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">
                  Company Size <span className="text-red-500">*</span>
                </label>
                <select
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleChange}
                  className="input-kgamify"
                  required
                >
                  <option value="">Select Company Size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="10-50">10-50 employees</option>
                  <option value="50-100">50-100 employees</option>
                  <option value="100-500">100-500 employees</option>
                  <option value="500-1000">500-1000 employees</option>
                  <option value="1000-5000">1000-5000 employees</option>
                  <option value="5000+">5000+ employees</option>
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
                  className="input-kgamify"
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
                  className="input-kgamify"
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
                  className="input-kgamify"
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
                  className="input-kgamify"
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">Twitter</label>
                <input
                  type="url"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  className="input-kgamify"
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">LinkedIn</label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  className="input-kgamify"
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block">YouTube</label>
                <input
                  type="url"
                  name="youtube"
                  value={formData.youtube}
                  onChange={handleChange}
                  className="input-kgamify"
                />
              </div>
              
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
            {currentStep < 3 ? (
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
