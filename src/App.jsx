import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import "./App.css";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PostJob from "./pages/PostJob";
import JobPosted from "./pages/JobPosted";
import ForgotPassword from "./pages/ForgetPassword";
import EditRegistration from "./pages/EditRegistration";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import { useState, useEffect } from "react";
import { getCompanyInfo } from "./api";
import Login from "./pages/Login";
import AdminPortal from "./pages/AdminPortal";
import AdminLogin from "./pages/AdminLogin";
import EditJob from "./pages/EditJob";
import Job from "./JobApplications/Job.jsx";
import ResetPassword from "./pages/ResetPassword";

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/" || 
                      location.pathname === "/register" || 
                      location.pathname === "/forgot-password" || 
                      location.pathname === "/reset-password" ||
                      location.pathname === "/admin-login";
  
  const showNavbar = !isLoginPage;
  const showSidebar = !isLoginPage;
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [loggedInEmail, setLoggedInEmail] = useState(() => {
    return localStorage.getItem("rememberedEmail") || "";
  });
  const [loggedInCompany, setLoggedInCompany] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
        return;
      }

      try {
        const cachedCompanyData = localStorage.getItem("companyData");
        if (cachedCompanyData) {
          try {
            const parsedData = JSON.parse(cachedCompanyData);
            if (parsedData.email === loggedInEmail) {
              setLoggedInCompany(parsedData);
              return;
            }
          } catch (parseError) {
            // Continue with API fetch if parsing fails
          }
        }

        const response = await getCompanyInfo(loggedInEmail);
        setLoggedInCompany(response);
      } catch (error) {
        // Handle error silently
      }
    };

    fetchCompanyData();
  }, [loggedInEmail]);

  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <div className={`min-h-screen ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
        {/* Login/Auth pages - full width layout */}
        {isLoginPage ? (
          <div className="w-full min-h-screen">
            <Routes>
              <Route
                path="/"
                element={<Login setLoggedInEmail={setLoggedInEmail} />}
              />
              <Route
                path="/register"
                element={<Register isDarkMode={isDarkMode} />}
              />
              <Route
                path="/forgot-password"
                element={<ForgotPassword isDarkMode={isDarkMode} />}
              />
              <Route
                path="/reset-password"
                element={<ResetPassword isDarkMode={isDarkMode} />}
              />
              <Route path="/admin-login" element={<AdminLogin />} />
            </Routes>
          </div>
        ) : (
          /* Dashboard layout with sidebar and main content */
          <div className="flex h-screen">
            {/* Mobile Sidebar Overlay */}
            {isMobileView && isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setIsSidebarOpen(false)}
              ></div>
            )}
            
            {/* Sidebar - Fixed width */}
            {showSidebar && (
              <div className={`${
                isMobileView 
                  ? "fixed top-0 left-0 h-full z-50" 
                  : "relative"
              } ${
                isSidebarOpen 
                  ? "w-60" 
                  : "w-16"
              } transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}>
                <Sidebar
                  onToggle={setIsSidebarOpen}
                  isOpen={isSidebarOpen}
                />
              </div>
            )}
            
            {/* Main Content Area - Flexible width */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Navbar */}
              {showNavbar && (
                <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <Navbar
                    onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    onThemeToggle={handleThemeToggle}
                    isDarkMode={isDarkMode}
                    userCompany={loggedInCompany || {}}
                    email={loggedInEmail}
                  />
                </div>
              )}
              
              {/* Page Content */}
              <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
                <Routes>
                  <Route
                    path="/dashboard"
                    element={
                      <Dashboard isDarkMode={isDarkMode} email={loggedInEmail} />
                    }
                  />
                  <Route
                    path="/post-job"
                    element={
                      <PostJob isDarkMode={isDarkMode} email={loggedInEmail} />
                    }
                  />
                  <Route
                    path="/job-posted"
                    element={
                      <JobPosted isDarkMode={isDarkMode} email={loggedInEmail} />
                    }
                  />
                  <Route
                    path="/Edit-Registration"
                    element={<EditRegistration isDarkMode={isDarkMode} />}
                  />
                  <Route
                    path="/admin"
                    element={<AdminPortal isDarkMode={isDarkMode} />}
                  />
                  <Route
                    path="/edit-job/:jobId"
                    element={<EditJob isDarkMode={isDarkMode} />}
                  />
                  <Route
                    path="/job/:jobId"
                    element={<Job isDarkMode={isDarkMode} />}
                  />
                </Routes>
              </div>
              
              {/* Footer */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <Footer isDarkMode={isDarkMode} />
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
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
