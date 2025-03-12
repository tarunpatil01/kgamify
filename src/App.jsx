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
import { loginCompany, getCompanyInfo } from "./api"; 
import JobApplications from "./pages/JobApplications"; 
import GoogleRegister from "./pages/GoogleRegister";
import Login from "./pages/Login";
import GoogleCallback from './pages/GoogleCallback';
import AdminPortal from "./pages/AdminPortal"; // Import AdminPortal component
import AdminLogin from "./pages/AdminLogin"; // Import AdminLogin component

function AppContent() {
  const location = useLocation();
  const showNavbar = location.pathname !== "/" && location.pathname !== "/register" && location.pathname !== "/forgot-password" && location.pathname !== "/admin-login";
  const showSidebar = location.pathname !== "/" && location.pathname !== "/register" && location.pathname !== "/forgot-password" && location.pathname !== "/admin-login";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [loggedInEmail, setLoggedInEmail] = useState(() => {
    // Load email from localStorage on startup
    return localStorage.getItem("rememberedEmail") || "";
  });
  const [loggedInCompany, setLoggedInCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!loggedInEmail) return;
      
      setIsLoading(true);
      try {
        console.log("Fetching company info for:", loggedInEmail);
        const response = await getCompanyInfo(loggedInEmail);
        console.log("Company data received:", response);
        setLoggedInCompany(response);
      } catch (error) {
        console.error("Error fetching company data:", error);
        // Don't set company to null if fetch fails to prevent Navbar errors
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, [loggedInEmail]);

  return (
    <div className={`flex flex-col md:flex-row ${isDarkMode ? "dark bg-gray-900 " : ""}`}>
      {showSidebar && <Sidebar onToggle={setIsSidebarOpen} onThemeToggle={handleThemeToggle} isDarkMode={isDarkMode} />}
      <div className="flex-grow">
        {showNavbar && <Navbar 
          isSidebarOpen={isSidebarOpen} 
          onThemeToggle={handleThemeToggle} 
          isDarkMode={isDarkMode}
          userCompany={loggedInCompany || {}} // Provide empty object fallback
        />}
        <Routes>
          <Route path="/register" element={<Register isDarkMode={isDarkMode} />} />
          <Route path="/dashboard" element={<Dashboard isDarkMode={isDarkMode} email={loggedInEmail} />} />
          <Route path="/post-job" element={<PostJob isDarkMode={isDarkMode} email={loggedInEmail} />} />
          <Route path="/job-posted" element={<JobPosted isDarkMode={isDarkMode} />} />
          <Route path="/forgot-password" element={<ForgotPassword isDarkMode={isDarkMode} />} />
          <Route path="/EditRegistration" element={<EditRegistration isDarkMode={isDarkMode} />} />
          <Route path="/job/:jobId" element={<Job isDarkMode={isDarkMode} />} />
          <Route path="/job-applications/:jobId" element={<JobApplications isDarkMode={isDarkMode} email={loggedInEmail} />} />
          <Route path="/google-register" element={<GoogleRegister />} />
          <Route path="/api/auth/callback/google" element={<GoogleCallback />} />
          <Route path="/admin" element={<AdminPortal isDarkMode={isDarkMode} />} />
          <Route path="/admin-login" element={<AdminLogin />} />
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