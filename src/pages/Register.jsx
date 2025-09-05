import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSpinner, FaCloudUploadAlt, FaCheckCircle } from "react-icons/fa";
import { registerCompany } from "../api";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import QuillEditor from '../components/QuillEditor';
// backgroundImage removed (not used)
import Klogo from '../assets/KLOGO.png';

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

// Map company type to required document label and help text
const companyTypeDocs = {
  "Private Limited": {
    label: "MOA/AOA (PDF)",
    help: "Upload Memorandum and Articles of Association.",
  },
  "Public Limited": {
    label: "Prospectus (PDF)",
    help: "Upload the company prospectus.",
  },
  "Startup": {
    label: "Startup Registration Certificate (PDF)",
    help: "Upload your Startup India registration certificate.",
  },
  "Partnership": {
    label: "Partnership Deed (PDF)",
    help: "Upload the registered partnership deed.",
  },
  "Proprietorship": {
    label: "GST Registration (PDF)",
    help: "Upload GST registration or equivalent proof.",
  },
  "NGO": {
    label: "NGO Registration Certificate (PDF)",
    help: "Upload your NGO registration certificate.",
  },
  "LLP": {
    label: "LLP Agreement (PDF)",
    help: "Upload the LLP agreement document.",
  },
};

import PropTypes from 'prop-types';

function Register({ isDarkMode }) {
  const navigate = useNavigate();
  // const [passwordVisible, setPasswordVisible] = useState(false);
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
  // const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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

  // Navigation handlers inline in buttons

  const handleSubmit = async (event) => {
    event.preventDefault();
  // clear prior errors if any
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
        formData.addressLine2 ? `${formData.addressLine2  }, ` : ""
      }${formData.city}, ${formData.state}, ${formData.pinCode}`;
      submissionData.append("address", address);

  // Add registration details (backend expects case-sensitive field `Username`)
  submissionData.append("Username", formData.username);
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
  // eslint-disable-next-line no-console
  console.error("Registration error:", error);
      setSnackbarMessage(error.message || "Registration failed. Please try again.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password visibility reserved; using plain password fields in this flow

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // Drag-and-drop handlers for document upload
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFormData((prev) => ({ ...prev, documents: e.dataTransfer.files[0] }));
    }
  };

  // Stepper steps
  const steps = [
    "Registration & Account",
    "Address & Contact",
    "Document Upload",
    "Summary"
  ];

  // Helper for progress text
  const progressText = `Step ${currentStep} of ${steps.length}`;

  // Document field info based on company type
  const docInfo = companyTypeDocs[formData.companyType] || {
    label: "Documents (PDF)",
    help: "Upload relevant company documents.",
  };

  // Summary step content
  const summaryContent = (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
        Review &amp; Confirm
      </h2>
      <div className="bg-gray-50 rounded p-4 border">
        <div className="mb-2"><b>Company Name:</b> {formData.companyName}</div>
        <div className="mb-2"><b>Website:</b> {formData.website}</div>
        <div className="mb-2"><b>Industry:</b> {formData.industry}</div>
        <div className="mb-2"><b>Description:</b> <span dangerouslySetInnerHTML={{__html: formData.description}} /></div>
        <div className="mb-2"><b>Contact Name:</b> {formData.contactName}</div>
        <div className="mb-2"><b>Email:</b> {formData.email}</div>
        <div className="mb-2"><b>Phone:</b> {formData.phone}</div>
        <div className="mb-2"><b>Address:</b> {formData.addressLine1}, {formData.addressLine2}, {formData.city}, {formData.state}, {formData.pinCode}</div>
        <div className="mb-2"><b>Company Type:</b> {formData.companyType}</div>
        <div className="mb-2"><b>Company Size:</b> {formData.companySize}</div>
        <div className="mb-2"><b>Username:</b> {formData.username}</div>
        <div className="mb-2"><b>Social Links:</b> 
          <span className="ml-2">Instagram: {formData.instagram || "-"}</span>
          <span className="ml-2">Twitter: {formData.twitter || "-"}</span>
          <span className="ml-2">LinkedIn: {formData.linkedin || "-"}</span>
          <span className="ml-2">YouTube: {formData.youtube || "-"}</span>
        </div>
        <div className="mb-2"><b>Logo:</b> {formData.logo ? formData.logo.name : "-"}</div>
        <div className="mb-2"><b>Document:</b> {formData.documents ? formData.documents.name : "-"}</div>
      </div>
      <div className="text-sm text-gray-500 mt-2">Please review your details before submitting.</div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center py-8 px-2 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      {/* Modern animated gradient background with subtle pattern overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(120deg, #fff7e6 0%, #ffecd2 40%, #ffe3b3 100%)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 80% 20%, #ffb34733 0%, transparent 60%), radial-gradient(circle at 20% 80%, #ff820033 0%, transparent 60%)",
            opacity: 0.7,
          }}
        />
        <div
          className="absolute inset-0 animate-gradient-move"
          style={{
            background:
              "linear-gradient(120deg, #ffecd2 0%, #ffb347 100%)",
            opacity: 0.15,
            mixBlendMode: "multiply",
          }}
        />
        <style>
          {`
            @keyframes gradient-move {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .animate-gradient-move {
              background-size: 200% 200%;
              animation: gradient-move 10s ease-in-out infinite;
            }
          `}
        </style>
      </div>
      {/* Content Container */}
      <div className="relative z-10 w-full max-w-3xl mx-auto rounded-3xl shadow-2xl border bg-white dark:bg-gray-800 border-orange-200 dark:border-gray-700 p-6 sm:p-10">
        {/* Logo at the top */}
        <div className="flex justify-center mb-4">
          <img src={Klogo} alt="Kgamify Logo" className="h-16 sm:h-20 w-auto object-contain" />
        </div>
        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, idx) => (
            <div key={step} className="flex-1 flex flex-col items-center relative">
              <div className={`w-9 h-9 flex items-center justify-center rounded-full border-2
                ${currentStep === idx + 1 ? 'bg-[#ff8200] text-white border-[#ff8200] font-bold' : 
                  currentStep > idx + 1 ? 'bg-[#ff8200] text-white border-[#ff8200]' : 
                  'bg-white text-gray-400 border-gray-300'}
                transition-all duration-200`}>
                {currentStep > idx + 1 ? <FaCheckCircle /> : idx + 1}
              </div>
              <div className={`mt-2 text-xs sm:text-sm ${currentStep === idx + 1 ? 'font-bold text-[#ff8200]' : 'text-gray-500'}`}>
                {step}
              </div>
              {idx < steps.length - 1 && (
                <div className="absolute top-1/2 right-0 w-full h-0.5 bg-gray-300 z-0" style={{left: '50%', width: '100%', zIndex: -1}}></div>
              )}
            </div>
          ))}
        </div>
        <div className="text-right text-xs text-gray-500 mb-2">{progressText}</div>
        <h1 className="text-2xl sm:text-4xl font-extrabold mb-6 text-center tracking-tight bg-gradient-to-r from-[#ff8200] to-[#ffb347] bg-clip-text text-transparent drop-shadow-lg">
          Company Registration
        </h1>

        <form className="space-y-8" onSubmit={handleSubmit}>
      {currentStep === 1 && (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 border-b pb-2 border-dashed border-orange-300 text-black">
        Basic Information & Account
              </h2>
              <div className="mb-6">
                <label className="block font-medium text-black mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block font-medium text-black mb-2">
                  Logo (PNG, JPEG) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  name="logo"
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition"
                  accept=".png, .jpeg"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block font-medium text-black mb-2">
                  Website <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block font-medium text-black mb-2">
                  Industry Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition"
                  required
                >
                  <option className="text-black" value="">Select Industry</option>
                  <option className="text-black" value="IT">IT</option>
                  <option className="text-black" value="Finance">Finance</option>
                  <option className="text-black" value="Healthcare">Healthcare</option>
                  <option className="text-black" value="Education">Education</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block font-medium text-black mb-2">Company Description</label>
                <QuillEditor
                  value={formData.description}
                  onChange={(content) => setFormData({...formData, description: content})}
                  isDarkMode={isDarkMode}
                />
              </div>
              {/* Account credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block font-medium text-black mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition"
                    placeholder="Choose a unique username"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-black mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition"
                    placeholder="Create a strong password"
                    minLength={6}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium text-black mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition"
                    placeholder="Re-enter your password"
                    minLength={6}
                    required
                  />
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 border-b pb-2 border-dashed border-orange-300 text-black">
                Company Address & Contact
              </h2>
              <div className="mb-6">
                <label className="block font-medium text-black mb-2">Contact Person Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block font-medium text-black mb-2">Contact Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block font-medium text-black mb-2">Contact Phone <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block font-medium text-black mb-2">Company Address <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block font-medium text-black mb-2">Company Address Line 2</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition"
                />
              </div>
              <div className="mb-6">
                <label className="block font-medium text-black mb-2">Company State <span className="text-red-500">*</span></label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleStateChange}
                  className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition"
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
              <div className="mb-6">
                <label className="block font-medium text-black mb-2">Company City <span className="text-red-500">*</span></label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition"
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
              <div className="mb-6">
                <label className="block font-medium text-black mb-2">
                  Pin Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block font-medium text-black mb-2">Company Type <span className="text-red-500">*</span></label>
                <select
                  name="companyType"
                  value={formData.companyType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition"
                  required
                >
                  <option value="">Select Company Type</option>
                  {Object.keys(companyTypeDocs).map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 border-b pb-2 border-dashed border-orange-300 text-black">
                Document Upload
              </h2>
              <div className="mb-6">
                <label className="block font-medium text-black mb-2">
                  {docInfo.label} <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-gray-500" title={docInfo.help}>ⓘ</span>
                </label>
                {/* Drag-and-drop area */}
                <div
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-150
                    ${dragActive ? 'border-[#ff8200] bg-orange-50' : 'border-gray-300 bg-gray-50'}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('doc-upload').click()}
                  style={{ minHeight: 100 }}
                >
                  <FaCloudUploadAlt className="text-3xl text-[#ff8200] mb-2" />
                  <div className="text-black mb-1">
                    {formData.documents ? (
                      <span className="font-medium">{formData.documents.name}</span>
                    ) : (
                      `Drag & drop ${docInfo.label} here, or click to select`
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{docInfo.help}</div>
                  <input
                    id="doc-upload"
                    type="file"
                    name="documents"
                    onChange={handleChange}
                    className="hidden"
                    accept=".pdf"
                    required
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Tip: Only the required document for your selected company type is shown to keep things simple.
              </div>
            </>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 border-b pb-2 border-dashed border-orange-300 text-black">
                Review &amp; Confirm
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-black">
                {/* ...existing summaryContent... */}
                {/* ...existing code... */}
                {summaryContent}
              </div>
              <div className="text-sm text-gray-500 mt-2">Please review your details before submitting.</div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {/* Left-side Back control */}
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-xl font-bold text-base shadow transition bg-gray-200 hover:bg-gray-300 text-black"
              >
                Back to Login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-6 py-3 rounded-xl font-bold text-base shadow transition bg-gray-200 hover:bg-gray-300 text-black"
              >
                Back
              </button>
            )}

            {/* Right-side Next/Submit */}
      {currentStep < steps.length ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className={`px-6 py-3 rounded-xl font-bold text-base shadow transition bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white hover:from-[#e57400] hover:to-[#ffb347] ${currentStep > 1 ? '' : ''}`}
        disabled={(currentStep === 3 && !formData.documents) || (currentStep === 2 && !formData.companyType)}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-3 rounded-xl font-bold text-base shadow transition bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white hover:from-[#e57400] hover:to-[#ffb347]"
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

