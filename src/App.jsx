import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import LimitedAccessBanner from './components/LimitedAccessBanner';
import { useState, useEffect, Suspense, lazy } from "react";
import { getCompanyInfo } from "./api";
import { PageLoadingFallback } from "./utils/lazyLoading";

// Lazy load all pages for better performance
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const PostJob = lazy(() => import("./pages/PostJob"));
const JobPosted = lazy(() => import("./pages/JobPosted"));
const ForgotPassword = lazy(() => import("./pages/ForgetPassword"));
const EditRegistration = lazy(() => import("./pages/EditRegistration"));
const AdminPortal = lazy(() => import("./pages/AdminPortal"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminMessages = lazy(() => import("./pages/AdminMessages"));
const EditJob = lazy(() => import("./pages/EditJob"));
const Job = lazy(() => import("./JobApplications/Job.jsx"));
const JobApplication = lazy(() => import("./pages/JobApplication"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Applications = lazy(() => import("./pages/Applications"));
const Messages = lazy(() => import("./pages/Messages"));
const Plans = lazy(() => import("./pages/Plans"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

function AppContent() {
  const location = useLocation();
  const isLoginPage = ["/","/register","/forgot-password","/reset-password","/admin-login","/verify-email"].includes(location.pathname);
  
  const isAdminPage = location.pathname === "/admin" || location.pathname.startsWith('/admin/messages');
  
  const showNavbar = !isLoginPage && !isAdminPage;
  const showSidebar = !isLoginPage && !isAdminPage;
  
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
          } catch {
            // Continue with API fetch if parsing fails
          }
        }

        const response = await getCompanyInfo(loggedInEmail);
        setLoggedInCompany(response);
      } catch {
        // Handle error silently
      }
    };

    fetchCompanyData();
  }, [loggedInEmail]);

  // Lock body scroll when mobile drawer is open for better UX
  useEffect(() => {
    if (isMobileView && isSidebarOpen) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [isMobileView, isSidebarOpen]);

  return (
    <ErrorBoundary showDetails={import.meta.env.MODE === 'development'}>
      <div className={`min-h-screen ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
        {/* Login/Auth pages - full width layout */}
        {isLoginPage ? (
          <div className="w-full min-h-screen">
            <Suspense fallback={<PageLoadingFallback type="form" />}>
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
                <Route path="/verify-email" element={<VerifyEmail />} />
              </Routes>
            </Suspense>
          </div>
        ) : (
          /* Dashboard layout with sidebar and main content */
          <div className="flex min-h-screen">
            {/* Mobile Sidebar Overlay */}
            {isMobileView && isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[60] md:hidden"
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
                role="presentation"
              />
            )}
            
            {/* Sidebar - Fixed width */}
            {showSidebar && (
              <div
                className={`${
                  isMobileView
                    ? // Mobile off-canvas: include translate on container itself
                      `fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 z-[90] md:hidden transition-transform duration-300 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
                    : // Desktop: static width, collapsible
                      `${isSidebarOpen ? 'w-64' : 'w-20'} relative z-[1000] hidden md:block`
                }`}
                style={{ willChange: 'transform' }}
                aria-modal={isMobileView && isSidebarOpen ? 'true' : undefined}
                role={isMobileView && isSidebarOpen ? 'dialog' : undefined}
              >
                {isMobileView ? (
                  <Sidebar
                    onToggle={setIsSidebarOpen}
                    isOpen={isSidebarOpen}
                    isDarkMode={isDarkMode}
                  />
                ) : (
                  <div className="h-full overflow-visible z-50 relative">
                    <Sidebar
                      onToggle={setIsSidebarOpen}
                      isOpen={isSidebarOpen}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Main Content Area - Flexible width */}
            <div
              className={`flex-1 flex flex-col min-w-0 md:ml-4 transform transition-transform duration-300 ${
                isMobileView && isSidebarOpen ? "translate-x-64" : "translate-x-0"
              }`}
              aria-hidden={isMobileView && isSidebarOpen ? "true" : "false"}
            >
              {/* Navbar */}
              {showNavbar && (
                <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 relative z-20">
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
              <div className="flex-1 bg-gray-50 dark:bg-gray-900 z-0 relative">
                <Suspense fallback={<PageLoadingFallback type="dashboard" />}>
                  <Routes>
                    <Route
                      path="/dashboard"
                      element={
                        <>
                          {/* Top banners: email verification & hold/pending status & plan upsell */}
                          {localStorage.getItem('companyNeedsEmailVerification') === 'true' && (
                            <div className="mx-4 mt-4 mb-2 p-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-800 text-sm flex flex-wrap items-center gap-3">
                              <span className="font-semibold">Email not verified.</span>
                              <span className="hidden sm:inline">Please verify to unlock full features.</span>
                              <a href={`/verify-email?email=${encodeURIComponent(loggedInEmail||'')}`} className="text-[#ff8200] font-semibold underline">Verify now</a>
                              <button onClick={()=>{localStorage.setItem('companyNeedsEmailVerification','');}} className="ml-auto text-xs text-amber-600 hover:text-amber-800">Dismiss</button>
                            </div>
                          )}
                          <LimitedAccessBanner company={loggedInCompany} isDarkMode={isDarkMode} className="mx-4 mt-2 mb-2" />
                          {/* Subscription upsell banner removed from dashboard. Use /plans page instead. */}
                          { (localStorage.getItem('companyLimitedAccess') === 'true') ? (
                            <div className={`min-h-[40vh] p-4 pt-0 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              <div className="max-w-5xl mx-auto">
                                <Dashboard 
                                  isDarkMode={isDarkMode} 
                                  email={loggedInEmail}
                                  userCompany={loggedInCompany}
                                  limited
                                />
                              </div>
                            </div>
                          ) : (
                            <Dashboard 
                              isDarkMode={isDarkMode} 
                              email={loggedInEmail}
                              userCompany={loggedInCompany}
                            />
                          )}
                        </>
                      }
                    />
                    <Route
                      path="/post-job"
                      element={
                        localStorage.getItem('companyLimitedAccess') === 'true' ? (
                          <div className={`min-h-[60vh] p-6 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} transition-colors`}>
                            <div className={`max-w-3xl mx-auto p-5 rounded-lg border shadow-sm backdrop-blur-sm ${
                              loggedInCompany?.status === 'hold'
                                ? isDarkMode
                                  ? 'bg-yellow-900/25 border-yellow-700 text-yellow-200'
                                  : 'bg-yellow-50 border-yellow-200 text-yellow-900'
                                : isDarkMode
                                  ? 'bg-blue-900/25 border-blue-800 text-blue-100'
                                  : 'bg-blue-50 border-blue-200 text-blue-900'
                            }`}> 
                              <div className="font-semibold mb-1 tracking-tight">Posting disabled</div>
                              <div className="text-sm leading-snug">
                                Your account is <span className="font-medium">{loggedInCompany?.status}</span>. You cannot post jobs. See{' '}
                                <a
                                  href="/messages"
                                  className={`underline font-medium ${isDarkMode ? 'text-[#ffb347] hover:text-[#ff9d33]' : 'text-[#ff8200] hover:text-[#e57400]'}`}
                                >
                                  Messages
                                </a>{' '}for details.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <PostJob isDarkMode={isDarkMode} email={loggedInEmail} userCompany={loggedInCompany} />
                        )
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
                      path="/applications"
                      element={<Applications isDarkMode={isDarkMode} />}
                    />
                    <Route
                      path="/messages"
                      element={<Messages isDarkMode={isDarkMode} />}
                    />
                    <Route
                      path="/admin"
                      element={<AdminPortal isDarkMode={isDarkMode} />}
                    />
                    <Route
                      path="/admin/messages/:companyId"
                      element={<AdminMessages isDarkMode={isDarkMode} />}
                    />
                    <Route
                      path="/edit-job/:jobId"
                      element={<EditJob isDarkMode={isDarkMode} />}
                    />
                    <Route
                      path="/job/:jobId"
                      element={<Job isDarkMode={isDarkMode} />}
                    />
                    <Route
                      path="/apply/:jobId"
                      element={<JobApplication />}
                    />
                    <Route path="/plans" element={<Plans isDarkMode={isDarkMode} />} />
                  </Routes>
                </Suspense>
              </div>
              
              {/* Footer */}
              <Footer isDarkMode={isDarkMode} />
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
