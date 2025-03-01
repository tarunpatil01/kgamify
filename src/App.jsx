import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import backgroundImage from "./assets/background.jpg";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PostJob from "./pages/PostJob";
import JobPosted from "./pages/JobPosted";
import Job from "./JobApplications/job"; 
import ForgotPassword from "./pages/ForgetPassword";
import EditRegistration from "./pages/EditRegistration";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import { useState, useEffect } from "react";
import { loginCompany } from "./api"; 
import JobApplications from "./pages/JobApplications"; 

function Login({ setLoggedInEmail }) {  
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: localStorage.getItem("rememberedEmail") || "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem("rememberedEmail"));
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleRememberMeChange = (event) => {
    setRememberMe(event.target.checked);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await loginCompany(formData);
      if (response.success) { // Ensure the response indicates success
        setLoggedInEmail(formData.email); // Set the logged-in email
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", formData.email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }
        navigate("/dashboard"); // Corrected the navigate function
      } else {
        setErrorMessage(response.error);
      }
    } catch (error) {
      setErrorMessage(error.error);
    }
  };

  useEffect(() => {
    const img = new Image();
    img.src = backgroundImage;
  }, []);

  return (
    <div className="relative flex justify-center items-center h-screen bg-cover bg-center p-4 sm:p-8 bg-blur">
      <div className="bg-white bg-opacity-90 p-4 sm:p-8 rounded-xl shadow-md w-full max-w-md">
        <img
          src="src/assets/KLOGO.png"
          alt="Kgamify Logo"
          className="mx-auto mb-4 sm:mb-6 w-24 sm:w-32 h-24 sm:h-32 object-contain"
        />
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">Welcome to Kgamify</h1>
        <p className="mb-4 sm:mb-6 text-center">Post Job, View Application ....</p>
        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700">Email ID</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your Email ID"
              className="w-full p-2 sm:p-3 border border-gray-300 rounded mt-1"
            />
          </div>
          <div>
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your Password"
              className="w-full p-2 sm:p-3 border border-gray-300 rounded mt-1"
            />
          </div>
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
          <div className="flex items-center">
            <label className="flex items-center text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="mr-2 w-5 h-5"
                checked={rememberMe}
                onChange={handleRememberMeChange}
              />
              Remember Me
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 sm:p-3 rounded hover:bg-blue-700 transition duration-300"
          >
            Login Now
          </button>
        </form>
        <div className="mt-4 sm:mt-6 text-center">
          <a href="/forgot-password" className="text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>
        <div className="mt-4 sm:mt-6 text-center">
          <p>
            Not Registered Yet?{" "}
            <a href="/register" className="text-blue-600 hover:underline">
              Register now
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const showNavbar = location.pathname !== "/" && location.pathname !== "/register" && location.pathname !== "/forgot-password";
  const showSidebar = location.pathname !== "/" && location.pathname !== "/register" && location.pathname !== "/forgot-password";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [loggedInEmail, setLoggedInEmail] = useState("");

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`flex flex-col md:flex-row ${isDarkMode ? "dark bg-gray-900 " : ""}`}>
      {showSidebar && <Sidebar onToggle={setIsSidebarOpen} onThemeToggle={handleThemeToggle} isDarkMode={isDarkMode} />}
      <div className="flex-grow">
        {showNavbar && <Navbar isSidebarOpen={isSidebarOpen} onThemeToggle={handleThemeToggle} isDarkMode={isDarkMode} />}
        <Routes>
          <Route path="/register" element={<Register isDarkMode={isDarkMode} />} />
          <Route path="/dashboard" element={<Dashboard isDarkMode={isDarkMode} />} />
          <Route path="/post-job" element={<PostJob isDarkMode={isDarkMode} />} />
          <Route path="/job-posted" element={<JobPosted isDarkMode={isDarkMode} />} />
          <Route path="/forgot-password" element={<ForgotPassword isDarkMode={isDarkMode} />} />
          <Route path="/EditRegistration" element={<EditRegistration isDarkMode={isDarkMode} />} />
          <Route path="/job/:jobId" element={<Job isDarkMode={isDarkMode} />} />
          <Route path="/job-applications/:jobId" element={<JobApplications isDarkMode={isDarkMode} email={loggedInEmail} />} /> {/* Add route for JobApplications */}
          <Route path="/" element={<Login setLoggedInEmail={setLoggedInEmail} />} />
        </Routes>
        <Footer isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;