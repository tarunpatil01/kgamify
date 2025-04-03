import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation, Navigate } from "react-router-dom";
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
import { loginCompany, getCompanyInfo } from "./api"; // Make sure this import is correct
import JobApplications from "./pages/JobApplications"; 
import Login from "./pages/Login";
import AdminPortal from "./pages/AdminPortal"; // Import AdminPortal component
import AdminLogin from "./pages/AdminLogin"; // Import AdminLogin component
import EditJob from "./pages/EditJob";

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";
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
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      // Auto-close sidebar on small screens when resizing
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      if (!loggedInEmail) {
        console.log("No logged in email found, skipping company data fetch");
        return;
      }
      
      setIsLoading(true);
      try {
        console.log("Fetching company info for:", loggedInEmail);
        
        // Try to get from localStorage first
        const cachedCompanyData = localStorage.getItem('companyData');
        if (cachedCompanyData) {
          try {
            const parsedData = JSON.parse(cachedCompanyData);
            if (parsedData.email === loggedInEmail) {
              console.log("Using cached company data");
              setLoggedInCompany(parsedData);
              setIsLoading(false);
              return;
            }
          } catch (parseError) {
            console.error("Error parsing cached company data:", parseError);
            // Continue with API fetch if parsing fails
          }
        }
        
        // If we reach here, we need to fetch from API
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
      {showSidebar && !isLoginPage && (
        <div className={`${isMobileView ? "fixed z-30" : "relative"}`}>
          <Sidebar 
            onToggle={setIsSidebarOpen} 
            onThemeToggle={handleThemeToggle} 
            isDarkMode={isDarkMode} 
          />
        </div>
      )}
      <div className={`flex-grow transition-all duration-300 ${showSidebar && isSidebarOpen && !isMobileView && !isLoginPage ? "md:ml-0 " : "ml-0"} ${ showSidebar && !isSidebarOpen && !isMobileView && !isLoginPage ? "md:ml-0" : "ml-15"}`}>
        {showNavbar && !isLoginPage && (
          <Navbar 
            isSidebarOpen={isSidebarOpen} 
            onThemeToggle={handleThemeToggle} 
            isDarkMode={isDarkMode}
            userCompany={loggedInCompany || {}} // Provide empty object fallback
          />
        )}
        <div className={`${isLoginPage ? "" : "min-h-[calc(100vh-64px)]"}`}>
          <Routes>
            <Route path="/register" element={<Register isDarkMode={isDarkMode} />} />
            <Route path="/dashboard" element={<Dashboard isDarkMode={isDarkMode} email={loggedInEmail} />} />
            <Route path="/post-job" element={<PostJob isDarkMode={isDarkMode} email={loggedInEmail} />} />
            <Route path="/job-posted" element={<JobPosted isDarkMode={isDarkMode} email={loggedInEmail} />} />
            <Route path="/forgot-password" element={<ForgotPassword isDarkMode={isDarkMode} />} />
            <Route path="/EditRegistration" element={<EditRegistration isDarkMode={isDarkMode} />} />
            <Route path="/job/:jobId" element={<Job isDarkMode={isDarkMode} />} />
            <Route path="/job-applications/:jobId" element={<JobApplications isDarkMode={isDarkMode} email={loggedInEmail} />} />
            <Route path="/admin" element={<AdminPortal isDarkMode={isDarkMode} />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/edit-job/:jobId" element={<EditJob isDarkMode={isDarkMode} />} />
            <Route path="/" element={<Login setLoggedInEmail={setLoggedInEmail} />} />
          </Routes>
        </div>
        {!isLoginPage && <Footer isDarkMode={isDarkMode} />}
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