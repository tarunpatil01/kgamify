import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { 
  FaCheck, FaTimes, FaBuilding, FaCalendarAlt, FaEnvelope, 
  FaPhone, FaGlobeAmericas, FaUserCircle, FaKey, FaLock,
  FaSignOutAlt, FaHome, FaClock, FaCheckCircle, FaUser
} from "react-icons/fa";
import { changeAdminPassword, denyCompanyWithReason, holdCompanyWithReason } from "../api";
import logoUrl from "../assets/KLOGO.png";

const AdminPortal = ({ isDarkMode }) => {
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [approvedCompanies, setApprovedCompanies] = useState([]);
  const [activeTab, setActiveTab] = useState("pending"); // "pending", "approved", or "profile"
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  // Removed embedded login state; AdminLogin page handles auth UI
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("adminToken"));
  const [admin, setAdmin] = useState(null);
  
  // For password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState(null);
  const navigate = useNavigate();

  // Initial load: auth + admin data + initial fetches
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      // If no token, redirect to admin login page
      navigate('/admin-login');
      return;
    }

    setIsAuthenticated(true);

    // Get admin data from storage
    try {
      const adminData = JSON.parse(localStorage.getItem("adminData"));
      setAdmin(adminData);
    } catch {
      // If stored data is invalid, clear session-like state inline
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");
      setIsAuthenticated(false);
      setAdmin(null);
      setPendingCompanies([]);
      return;
    }

    const headers = { "x-auth-token": token };
    const baseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, "");

    // Fetch pending companies
    setIsLoading(true);
    axios
      .get(`${baseUrl}/api/admin/pending-companies`, { headers })
      .then((response) => setPendingCompanies(response.data))
      .catch((error) => {
        setNotification({
          show: true,
          message: "Failed to fetch pending companies",
          type: "error",
        });
        if (error?.response?.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminData");
          setIsAuthenticated(false);
          setAdmin(null);
          setPendingCompanies([]);
        }
      })
      .finally(() => setIsLoading(false));

    // Fetch approved companies
    axios
      .get(`${baseUrl}/api/admin/approved-companies`, { headers })
      .then((response) => setApprovedCompanies(response.data))
      .catch((error) => {
        if (error?.response?.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminData");
          setIsAuthenticated(false);
          setAdmin(null);
          setPendingCompanies([]);
        }
      });
  }, [navigate]);

  // Embedded login handler removed; dedicated AdminLogin page handles this

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    setIsAuthenticated(false);
    setAdmin(null);
    setPendingCompanies([]);
  // Redirect to admin login immediately
  navigate('/admin-login', { replace: true });
  };

  // fetchPendingCompanies removed; initial useEffect already loads pending list

  const fetchApprovedCompanies = async (token) => {
    try {
      const authToken = token || localStorage.getItem("adminToken");
      if (!authToken) {
        return;
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL.replace(/\/api$/, "")}/api/admin/approved-companies`,
        {
          headers: {
            "x-auth-token": authToken
          }
        }
      );
      
      setApprovedCompanies(response.data);
    } catch (error) {
      // Silent error handling
      // If unauthorized, logout
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleApprove = async (companyId) => {
    try {
      const token = localStorage.getItem("adminToken");
      
      await axios.post(
        `${import.meta.env.VITE_API_URL.replace(/\/api$/, "")}/api/admin/approve-company/${companyId}`,
        {},
        {
          headers: {
            "x-auth-token": token
          }
        }
      );
      
      setPendingCompanies(pendingCompanies.filter((company) => company._id !== companyId));
      setNotification({
        show: true,
        message: "Company approved successfully",
        type: "success"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
      
      // Refresh approved companies list
      fetchApprovedCompanies(token);
    } catch (error) {
      // Error handling without console.error
      setNotification({
        show: true,
        message: "Error approving company",
        type: "error"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
      
      // If unauthorized, logout
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleDeny = async (companyId) => {
    try {
      const reason = window.prompt('Please provide a reason for denial (required):');
      if (!reason || !reason.trim()) {
        return;
      }
      await denyCompanyWithReason(companyId, reason.trim());
      
      setPendingCompanies(pendingCompanies.filter((company) => company._id !== companyId));
      setNotification({
        show: true,
        message: "Company registration denied",
        type: "success"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
    } catch (error) {
      // Error handling without console.error
      setNotification({
        show: true,
        message: "Error denying company",
        type: "error" 
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
      
      // If unauthorized, logout
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleHold = async (companyId) => {
    try {
      const reason = window.prompt('Enter a reason to put this company on hold (required):');
      if (!reason || !reason.trim()) {
        return;
      }
      await holdCompanyWithReason(companyId, reason.trim());
      setPendingCompanies(prev => prev.map(c => c._id === companyId ? { ...c, status: 'hold' } : c));
      setNotification({ show: true, message: 'Company put on hold', type: 'success' });
      setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    } catch (error) {
      setNotification({ show: true, message: 'Error putting company on hold', type: 'error' });
      setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setIsLoading(true);
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      setIsLoading(false);
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }
    
    try {
      // Use our API function instead of axios directly
      await changeAdminPassword(currentPassword, newPassword);
      
      // Reset form fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setNotification({
        show: true,
        message: "Password changed successfully",
        type: "success"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
    } catch (error) {
      setPasswordError(
        error.message || error.error || 
        "Error changing password. Please verify your current password."
      );
      
      // If unauthorized, logout
      if (error.status === 401) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format MongoDB ObjectId into a date
  const formatObjectIdToDate = (objectId) => {
    // MongoDB ObjectId format: 4-byte timestamp, 5-byte random, 3-byte counter
    // Extract timestamp from first 4 bytes (8 characters) of ObjectId
    try {
      // Check if objectId is a string
      if (typeof objectId === 'string' && objectId.length >= 8) {
        const timestamp = parseInt(objectId.substring(0, 8), 16) * 1000;
        return new Date(timestamp);
      }
      // Default to current date if conversion fails
      return new Date();
    } catch {
      // Silent error handling without console.error
      return new Date(); // Return current date as fallback
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // If not authenticated, show redirect placeholder (dedicated login page handles UI)
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
        <div className="text-sm opacity-75">Redirecting to admin login…</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
      {/* Custom Admin Header/Navbar */}
      <header className={`${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-md sticky top-0 z-50`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-1.5 mr-3">
                <img 
                  src={logoUrl} 
                  alt="KGamify Logo" 
                  className="h-8 w-8" 
                />
              </div>
              <div>
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-[#ff8200]">KGamify</h1>
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    Admin
                  </span>
                </div>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Admin Control Panel</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {admin && (
                <div className="hidden md:flex items-center mr-2 bg-gray-100 dark:bg-gray-700 rounded-full pl-1 pr-3 py-1">
                  <div className="w-7 h-7 rounded-full bg-[#ff8200] flex items-center justify-center mr-2">
                    <FaUserCircle className="text-lg text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{admin.firstName || admin.email}</p>
                    <p className="text-xs text-[#ff8200]">
                      {admin?.role === 'super_admin' ? 'Super Admin' : admin?.role === 'moderator' ? 'Moderator' : 'Admin'}
                    </p>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => navigate('/')}
                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center text-sm"
              >
                <FaHome className="mr-1.5" /> 
                <span className="hidden md:inline">Main Site</span>
              </button>
              
              <button 
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center text-sm"
              >
                <FaSignOutAlt className="mr-1.5" /> 
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Portal</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage company registrations and account settings</p>
        </div>
      
      {notification.show && (
        <div className={`p-4 mb-6 rounded ${
          notification.type === "success" ? "bg-green-100 text-green-700 border border-green-200" : 
          "bg-red-100 text-red-700 border border-red-200"
        } flex items-center`}>
          <div className="mr-3 flex-shrink-0">
            {notification.type === "success" ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          {notification.message}
        </div>
      )}
      
      {/* Tabs for switching between pending, approved companies, and profile */}
      <nav className="admin-tabs">
        <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`admin-tab ${activeTab === 'pending' ? 'admin-tab--active' : ''}`}
          >
            <FaClock className="mr-2" />
            <span>Pending Companies</span>
            <span className={`admin-tab__badge ${activeTab === 'pending' ? 'admin-tab__badge--active' : ''}`}>
              {pendingCompanies?.length ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`admin-tab ${activeTab === 'approved' ? 'admin-tab--active' : ''}`}
          >
            <FaCheckCircle className="mr-2" />
            <span>Approved Companies</span>
            <span className={`admin-tab__badge ${activeTab === 'approved' ? 'admin-tab__badge--active' : ''}`}>
              {approvedCompanies?.length ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`admin-tab ${activeTab === 'profile' ? 'admin-tab--active' : ''}`}
          >
            <FaUser className="mr-2" />
            <span>My Profile</span>
          </button>
        </div>
      </nav>
      
      <h2 className="text-2xl font-semibold mb-6 text-[#ff8200]">
        {activeTab === "pending" 
          ? "Pending Company Approvals" 
          : activeTab === "approved" 
            ? "Approved Companies" 
            : "My Profile"}
      </h2>

      {/* Pending Companies Tab Content */}
      {activeTab === "pending" && (
        <>
          {pendingCompanies.length === 0 ? (
            <div className="text-center p-16 bg-white rounded-lg shadow-sm dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <FaBuilding className="text-[#ff8200] text-3xl" />
                </div>
              </div>
              <p className="text-xl font-medium">No pending company approvals at the moment</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">New registration requests will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {Array.isArray(pendingCompanies) && pendingCompanies.map((company) => (
                <div key={company._id} className={`rounded-lg shadow-md ${isDarkMode ? "bg-gray-800" : "bg-white"} transition-all hover:shadow-xl border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div className="flex items-center mb-4 md:mb-0">
                        <div className={`w-16 h-16 mr-4 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center border ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>
                          {company.logo ? (
                            <img src={company.logo} alt={company.companyName} className="w-full h-full object-cover" />
                          ) : (
                            <FaBuilding className="text-[#ff8200] text-3xl" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">{company.companyName}</h3>
                          <div className="flex items-center mt-1">
                            <FaCalendarAlt className="text-[#ff8200] mr-2" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Applied on: {formatDate(formatObjectIdToDate(company._id))}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleApprove(company._id)}
                          className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors shadow-sm"
                        >
                          <FaCheck className="mr-2" /> Approve
                        </button>
                        <button
                          onClick={() => handleHold(company._id)}
                          className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors shadow-sm"
                        >
                          <FaClock className="mr-2" /> Hold
                        </button>
                        <button
                          onClick={() => handleDeny(company._id)}
                          className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors shadow-sm"
                        >
                          <FaTimes className="mr-2" /> Deny
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                        <h4 className="font-medium mb-4 text-[#ff8200]">Contact Information</h4>
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <FaEnvelope className="text-[#ff8200] mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                              <p className="font-medium break-all">{company.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <FaPhone className="text-[#ff8200] mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                              <p className="font-medium">{company.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <FaGlobeAmericas className="text-[#ff8200] mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Website</p>
                              <p className="font-medium break-all">
                                {company.website ? (
                                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                    {company.website}
                                  </a>
                                ) : (
                                  "Not provided"
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                        <h4 className="font-medium mb-4 text-[#ff8200]">Company Details</h4>
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <FaBuilding className="text-[#ff8200] mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Industry</p>
                              <p className="font-medium">{company.industry || "Not specified"}</p>
                            </div>
                          </div>
                          
                          {company.documents && (
                            <div className="flex items-start">
                              <svg className="h-5 w-5 text-[#ff8200] mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Documents</p>
                                <a 
                                  href={company.documents} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-500 hover:underline font-medium"
                                >
                                  View Verification Documents
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {company.description && (
                      <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                        <h4 className="font-medium mb-2 text-[#ff8200]">Company Description</h4>
                        <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: company.description }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Approved Companies Tab Content */}
      {activeTab === "approved" && (
        <>
          {approvedCompanies.length === 0 ? (
            <div className="text-center p-16 bg-white rounded-lg shadow-sm dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <FaBuilding className="text-[#ff8200] text-3xl" />
                </div>
              </div>
              <p className="text-xl font-medium">No approved companies yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Approved companies will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {Array.isArray(approvedCompanies) && approvedCompanies.map((company) => (
                <div key={company._id} className={`rounded-lg shadow-md ${isDarkMode ? "bg-gray-800" : "bg-white"} transition-all hover:shadow-xl border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div className="flex items-center mb-4 md:mb-0">
                        <div className={`w-16 h-16 mr-4 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center border ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>
                          {company.logo ? (
                            <img src={company.logo} alt={company.companyName} className="w-full h-full object-cover" />
                          ) : (
                            <FaBuilding className="text-[#ff8200] text-3xl" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <h3 className="text-2xl font-bold">{company.companyName}</h3>
                            <span className="ml-3 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                              Approved
                            </span>
                          </div>
                          <div className="flex items-center mt-1">
                            <FaCalendarAlt className="text-[#ff8200] mr-2" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Approved on: {formatDate(company.updatedAt || formatObjectIdToDate(company._id))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                        <h4 className="font-medium mb-4 text-[#ff8200]">Contact Information</h4>
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <FaEnvelope className="text-[#ff8200] mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                              <p className="font-medium break-all">{company.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <FaPhone className="text-[#ff8200] mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                              <p className="font-medium">{company.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <FaGlobeAmericas className="text-[#ff8200] mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Website</p>
                              <p className="font-medium break-all">
                                {company.website ? (
                                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                    {company.website}
                                  </a>
                                ) : (
                                  "Not provided"
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                        <h4 className="font-medium mb-4 text-[#ff8200]">Company Details</h4>
                        <div className="flex items-center">
                          <FaBuilding className="text-[#ff8200] mr-3 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Industry</p>
                            <p className="font-medium">{company.industry || "Not specified"}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                          <div className="flex items-center mt-1">
                            <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                            <p className="font-medium">Active Account</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {company.description && (
                      <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                        <h4 className="font-medium mb-2 text-[#ff8200]">Company Description</h4>
                        <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: company.description }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Profile Tab Content */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Admin Info Card */}
          <div className={`p-8 rounded-lg shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex flex-col items-center">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  <FaUserCircle className="text-[#ff8200] text-6xl" />
                </div>
                <h3 className="text-2xl font-bold mt-3">{admin?.firstName || 'System'} {admin?.lastName || 'Admin'}</h3>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{admin?.email}</p>
                <div className="mt-2">
                  <span className="text-sm bg-[#ff8200] text-white px-3 py-1 rounded-full inline-block">
                    {admin?.role === 'super_admin' ? 'Super Admin' : admin?.role === 'moderator' ? 'Moderator' : 'Admin'}
                  </span>
                </div>
              </div>
              
              <div className="w-full max-w-3xl">
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <FaKey className="mr-2 text-[#ff8200]" /> Account Security
                  </h4>
                  <p className="text-sm">Keeping your password secure is important for maintaining the security of the admin portal.</p>
                  
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <FaLock className="mr-2 text-[#ff8200]" /> Password Guidelines
                    </h4>
                    <ul className="text-sm list-disc pl-5 space-y-1">
                      <li>Use at least 8 characters</li>
                      <li>Include uppercase and lowercase letters</li>
                      <li>Add numbers and special characters</li>
                      <li>Avoid using obvious information</li>
                      <li>Don&#39;t reuse passwords from other sites</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Change Password Card */}
          <div className={`p-8 rounded-lg shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <FaKey className="mr-2 text-[#ff8200]" /> Change Password
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Regularly updating your password helps maintain security. Your new password must be at least 6 characters long.
            </p>
            
            {passwordError && (
              <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded mb-6 flex items-start">
                <div className="flex-shrink-0 mr-2 mt-0.5">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  {passwordError}
                </div>
              </div>
            )}
            
            <form onSubmit={handlePasswordChange} className="max-w-lg">
              <div className="mb-4">
                <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                    required
                  />
                  <FaLock className="absolute right-3 top-3.5 text-gray-400" />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                    required
                    minLength="6"
                  />
                  <FaLock className="absolute right-3 top-3.5 text-gray-400" />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                    required
                    minLength="6"
                  />
                  <FaLock className="absolute right-3 top-3.5 text-gray-400" />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded font-medium text-white flex items-center justify-center ${
                  isLoading 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-[#ff8200] hover:bg-[#e67600] transition-colors"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <FaKey className="mr-2" /> Change Password
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="flex items-center">
                <svg className="h-4 w-4 mr-2 text-[#ff8200]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                For security reasons, you&#39;ll need to enter your current password before setting a new one.
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
      
      {/* Custom Admin Footer */}
      <footer className={`${isDarkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-600"} py-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} mt-auto`}>
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-sm">&copy; {new Date().getFullYear()} KGamify Admin Portal. All rights reserved.</p>
            <p className="text-sm mt-1">Version 1.0.0 | <span className="text-[#ff8200]">Admin System</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
};

AdminPortal.propTypes = {
  isDarkMode: PropTypes.bool
};

export default AdminPortal;
