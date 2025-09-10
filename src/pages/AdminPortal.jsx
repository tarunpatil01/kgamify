import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { 
  FaCheck, FaTimes, FaBuilding, FaCalendarAlt, FaEnvelope, 
  FaPhone, FaGlobeAmericas, FaUserCircle, FaKey, FaLock,
  FaSignOutAlt, FaHome, FaClock, FaCheckCircle, FaUser
} from "react-icons/fa";
import { changeAdminPassword, denyCompanyWithReason, holdCompanyWithReason, revokeCompanyAccess } from "../api";
import logoUrl from "../assets/KLOGO.png";

// Inline helper to highlight search matches in text (case-insensitive)
const HighlightedText = ({ text, query, isDarkMode }) => {
  const safeText = typeof text === 'string' ? text : '';
  const q = (query || '').trim();
  if (!q) return <>{safeText}</>;
  const lower = safeText.toLowerCase();
  const qLower = q.toLowerCase();
  const parts = [];
  let i = 0;
  let idx;
  while ((idx = lower.indexOf(qLower, i)) !== -1) {
    if (idx > i) parts.push({ text: safeText.slice(i, idx), match: false });
    parts.push({ text: safeText.slice(idx, idx + q.length), match: true });
    i = idx + q.length;
  }
  if (i < safeText.length) parts.push({ text: safeText.slice(i), match: false });
  const cls = isDarkMode ? 'bg-yellow-600/40 rounded px-0.5' : 'bg-yellow-200 rounded px-0.5';
  return (
    <>
      {parts.map((p, key) => p.match ? <span key={key} className={cls}>{p.text}</span> : <span key={key}>{p.text}</span>)}
    </>
  );
};

HighlightedText.propTypes = {
  text: PropTypes.string,
  query: PropTypes.string,
  isDarkMode: PropTypes.bool,
};

const AdminPortal = ({ isDarkMode }) => {
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [approvedCompanies, setApprovedCompanies] = useState([]);
  const [activeTab, setActiveTab] = useState("pending"); // "pending", "approved", "denied", or "profile"
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

  // Reason modal for Hold / Deny
  const [reasonModal, setReasonModal] = useState({ open: false, mode: null, company: null, reason: "" });
  const [deniedCompanies, setDeniedCompanies] = useState([]);
  const [holdCompanies, setHoldCompanies] = useState([]);
  const [filters, setFilters] = useState({ q: '', sort: 'updatedAt', order: 'desc' });
  const [filterModal, setFilterModal] = useState(false);
  const pageSize = 10;
  const [pages, setPages] = useState({ pending: 1, approved: 1, hold: 1, denied: 1 });

  // (Optional) Filters & sorting could be added here if needed

  // Initial load: auth + admin data + initial fetches
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate('/admin-login');
      return;
    }

    setIsAuthenticated(true);

    try {
      const adminData = JSON.parse(localStorage.getItem("adminData"));
      setAdmin(adminData);
    } catch {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");
      setIsAuthenticated(false);
      setAdmin(null);
      setPendingCompanies([]);
      return;
    }

    const headers = { "x-auth-token": token };
    const baseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, "");

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

    axios
      .get(`${baseUrl}/api/admin/approved-companies`, { headers })
      .then((response) => setApprovedCompanies(response.data))
      .catch((error) => {
          if (error?.response?.status === 404) {
            // Fallback to generic companies endpoint (older backend without dedicated route)
            axios
              .get(`${baseUrl}/api/admin/companies?status=approved`, { headers })
              .then(r => {
                const list = Array.isArray(r.data) ? r.data.filter(c => c.approved === true && !['hold','denied'].includes(c.status)) : [];
                setApprovedCompanies(list);
              })
              .catch(() => {});
          } else if (error?.response?.status === 401) {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminData");
            setIsAuthenticated(false);
            setAdmin(null);
            setPendingCompanies([]);
          }
      });

    axios
      .get(`${baseUrl}/api/admin/companies?status=denied`, { headers })
      .then((response) => setDeniedCompanies(response.data))
      .catch(() => {});

    axios
      .get(`${baseUrl}/api/admin/companies?status=hold`, { headers })
      .then((response) => setHoldCompanies(response.data))
      .catch(() => {});
  }, [navigate]);

  // Re-fetch hold/denied on filter changes
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('adminToken');
    const headers = { 'x-auth-token': token };
    const baseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, "");
    const params = new URLSearchParams({ status: 'hold', q: filters.q || '', sort: filters.sort || 'updatedAt', order: filters.order || 'desc' }).toString();
    axios.get(`${baseUrl}/api/admin/companies?${params}`, { headers }).then(r => setHoldCompanies(r.data)).catch(()=>{});
    const paramsDenied = new URLSearchParams({ status: 'denied', q: filters.q || '', sort: filters.sort || 'updatedAt', order: filters.order || 'desc' }).toString();
    axios.get(`${baseUrl}/api/admin/companies?${paramsDenied}`, { headers }).then(r => setDeniedCompanies(r.data)).catch(()=>{});
  }, [filters, isAuthenticated]);

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

  // Approve action for companies in Hold tab
  const handleApproveFromHold = async (companyId) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `${import.meta.env.VITE_API_URL.replace(/\/api$/, "")}/api/admin/approve-company/${companyId}`,
        {},
        { headers: { "x-auth-token": token } }
      );
      // Remove from hold list and refresh approved
      setHoldCompanies(prev => (Array.isArray(prev) ? prev.filter(c => c._id !== companyId) : []));
      fetchApprovedCompanies(token);
      setNotification({ show: true, message: 'Company approved from On Hold', type: 'success' });
      setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    } catch (error) {
      setNotification({ show: true, message: 'Error approving company', type: 'error' });
      setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
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
      // If endpoint not found (older server without dedicated route), fallback to generic companies query
      if (error.response?.status === 404) {
        try {
          const authToken = token || localStorage.getItem("adminToken");
          if (!authToken) return;
          const fallback = await axios.get(
            `${import.meta.env.VITE_API_URL.replace(/\/api$/, "")}/api/admin/companies?status=approved`,
            { headers: { "x-auth-token": authToken } }
          );
          // Filter defensively: approved true & not hold/denied
          const list = Array.isArray(fallback.data) ? fallback.data.filter(c => c.approved === true && !['hold','denied'].includes(c.status)) : [];
          setApprovedCompanies(list);
        } catch (err2) {
          if (err2.response?.status === 401) handleLogout();
        }
        return;
      }
      if (error.response?.status === 401) handleLogout();
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
      
  // Remove from pending (if present) and from hold (if approving from hold)
  setPendingCompanies(prev => (Array.isArray(prev) ? prev.filter((company) => company._id !== companyId) : []));
  setHoldCompanies(prev => (Array.isArray(prev) ? prev.filter((company) => company._id !== companyId) : []));
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

  const openReasonModal = (mode, company) => {
    setReasonModal({ open: true, mode, company, reason: "" });
  };

  const submitReasonModal = async () => {
    const { mode, company, reason } = reasonModal;
    if (!mode || !company) { setReasonModal({ open: false, mode: null, company: null, reason: "" }); return; }
    const trimmed = (reason || "").trim();
    if (!trimmed) { return; }
    try {
      if (mode === 'hold') {
        const resp = await holdCompanyWithReason(company._id, trimmed);
        const updated = resp?.company || { ...company, status: 'hold', approved: false, adminMessages: [ ...(company.adminMessages||[]), { type: 'hold', message: trimmed, createdAt: new Date().toISOString() } ] };
        // Move from pending to hold
        setPendingCompanies(prev => (Array.isArray(prev) ? prev.filter(c => c._id !== company._id) : []));
        setHoldCompanies(prev => [updated, ...(Array.isArray(prev) ? prev : [])]);
        setNotification({ show: true, message: 'Company moved to On Hold', type: 'success' });
      } else if (mode === 'deny') {
        const resp = await denyCompanyWithReason(company._id, trimmed);
        const updated = resp?.company || { ...company, status: 'denied', approved: false, adminMessages: [ ...(company.adminMessages||[]), { type: 'deny', message: trimmed, createdAt: new Date().toISOString() } ] };
        // Remove from source list (pending or hold), then add to denied list
        if (company.status === 'hold') {
          setHoldCompanies(prev => (Array.isArray(prev) ? prev.filter(c => c._id !== company._id) : []));
        } else {
          setPendingCompanies(prev => (Array.isArray(prev) ? prev.filter(c => c._id !== company._id) : []));
        }
        setDeniedCompanies(prev => [updated, ...(Array.isArray(prev) ? prev : [])]);
        setNotification({ show: true, message: 'Company denied (email sent)', type: 'success' });
      }
    } catch (error) {
      setNotification({ show: true, message: error?.response?.data?.message || 'Action failed', type: 'error' });
    } finally {
      setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
      setReasonModal({ open: false, mode: null, company: null, reason: '' });
    }
  };

  const handleRevoke = async (companyId) => {
    try {
      const reason = window.prompt('Enter a reason to revoke access (optional):') || '';
      const resp = await revokeCompanyAccess(companyId, reason.trim());
      const updated = resp?.company;
      setApprovedCompanies(prev => (Array.isArray(prev) ? prev.filter(c => c._id !== companyId) : []));
      setHoldCompanies(prev => {
        const list = Array.isArray(prev) ? prev : [];
        return updated ? [updated, ...list] : list;
      });
      // Refresh approved list in background
      fetchApprovedCompanies();
  setNotification({ show: true, message: 'Access revoked; company moved to On Hold', type: 'success' });
      setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    } catch (error) {
      setNotification({ show: true, message: 'Error revoking access', type: 'error' });
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
                      <div className="flex items-center gap-2">
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
            <span>New Companies</span>
            <span className={`admin-tab__badge ${activeTab === 'pending' ? 'admin-tab__badge--active' : ''}`}>
              {Array.isArray(pendingCompanies) ? pendingCompanies.filter(c => (c.status || 'pending') === 'pending').length : 0}
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
            onClick={() => setActiveTab('hold')}
            className={`admin-tab ${activeTab === 'hold' ? 'admin-tab--active' : ''}`}
          >
            <FaClock className="mr-2" />
            <span>On Hold</span>
            <span className={`admin-tab__badge ${activeTab === 'hold' ? 'admin-tab__badge--active' : ''}`}>
              {holdCompanies?.length ?? 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('denied')}
            className={`admin-tab ${activeTab === 'denied' ? 'admin-tab--active' : ''}`}
          >
            <FaTimes className="mr-2" />
            <span>Denied Companies</span>
            <span className={`admin-tab__badge ${activeTab === 'denied' ? 'admin-tab__badge--active' : ''}`}>
              {deniedCompanies?.length ?? 0}
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
          ? "New Companies" 
          : activeTab === "approved" 
            ? "Approved Companies" 
            : activeTab === "hold" 
              ? "On Hold" 
              : activeTab === "denied" 
                ? "Denied Companies" 
                : "My Profile"}
      </h2>

  {(activeTab === 'hold' || activeTab === 'denied' || activeTab === 'pending' || activeTab === 'approved') && (
    <div className="mb-4 flex items-center gap-3">
      <button onClick={()=>setFilterModal(true)} className="px-4 py-2 rounded bg-[#ff8200] text-white text-sm hover:bg-[#e57400]">Open Filters</button>
      {(filters.q || filters.sort !== 'updatedAt' || filters.order !== 'desc') && (
        <button onClick={()=>setFilters({ q:'', sort:'updatedAt', order:'desc' })} className="text-xs underline text-[#ff8200]">Clear</button>
      )}
    </div>
  )}

      {/* Pending Companies Tab Content */}
    {activeTab === "pending" && (
        <>
      {(!Array.isArray(pendingCompanies) || pendingCompanies.filter(c => (c.status || 'pending') === 'pending').length === 0) ? (
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
    {(() => { const all = pendingCompanies.filter(c => (c.status || 'pending') === 'pending'); const page = pages.pending; const slice = all.slice((page-1)*pageSize, page*pageSize); return slice.map((company) => (
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
              onClick={() => openReasonModal('hold', company)}
                          className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors shadow-sm"
                        >
                          <FaClock className="mr-2" /> Hold
                        </button>
                        <button
              onClick={() => openReasonModal('deny', company)}
                          className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors shadow-sm"
                        >
                          <FaTimes className="mr-2" /> Deny
                        </button>
                        <button
                          onClick={()=> navigate(`/admin/messages/${company._id}`)}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          Messages
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
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
                            {company.status === 'hold' && (
                              <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">On Hold</span>
                            )}
                            {company.status === 'denied' && (
                              <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Denied</span>
                            )}
                            {(!company.status || company.status === 'pending') && (
                              <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Pending</span>
                            )}
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
                    {/* Admin message (latest) */}
                    {Array.isArray(company.adminMessages) && (
                      (() => {
                        const relevantType = company.status === 'denied' ? 'deny' : company.status === 'hold' ? 'hold' : null;
                        const msgs = relevantType ? company.adminMessages.filter(m => m.type === relevantType) : [];
                        const last = msgs[msgs.length - 1];
                        if (!last) return null;
                        return (
                          <div className={`mt-6 p-4 rounded ${company.status === 'denied' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700'}`}>
                            <div className="text-sm font-medium mb-1">{company.status === 'denied' ? 'Denial Reason' : 'Hold Reason'}</div>
                            <div className="text-sm">{last.message}</div>
                          </div>
                        );
                      })()
                    )}
                    
                    {company.description && (
                      <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                        <h4 className="font-medium mb-2 text-[#ff8200]">Company Description</h4>
                        <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: company.description }} />
                      </div>
                    )}
                  </div>
                </div>
              )); })()}
              {(() => { const all = pendingCompanies.filter(c => (c.status || 'pending') === 'pending'); const total = Math.max(1, Math.ceil(all.length / pageSize)); if (total <=1) return null; return (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <button disabled={pages.pending===1} onClick={()=>setPages(p=>({...p,pending:p.pending-1}))} className={`px-3 py-1 rounded border ${pages.pending===1?'opacity-40 cursor-not-allowed':'hover:bg-gray-100 dark:hover:bg-gray-700'} ${isDarkMode?'border-gray-600':'border-gray-300'}`}>Prev</button>
                  {Array.from({ length: total }).map((_,i)=>(
                    <button key={i} onClick={()=>setPages(p=>({...p,pending:i+1}))} className={`px-3 py-1 rounded border ${pages.pending===i+1? 'bg-[#ff8200] text-white border-[#ff8200]' : isDarkMode? 'border-gray-600':'border-gray-300'}`}>{i+1}</button>
                  ))}
                  <button disabled={pages.pending===total} onClick={()=>setPages(p=>({...p,pending:p.pending+1}))} className={`px-3 py-1 rounded border ${pages.pending===total?'opacity-40 cursor-not-allowed':'hover:bg-gray-100 dark:hover:bg-gray-700'} ${isDarkMode?'border-gray-600':'border-gray-300'}`}>Next</button>
                </div> ); })()}
            </div>
          )}
        </>
      )}

      {/* Approved Companies Tab Content */}
  {activeTab === "approved" && (
        <>
          {/* Approved list */}
      {(() => { const filtered = approvedCompanies.filter(c => c.approved === true && (c.status === 'approved' || c.status === undefined || c.status === null) && (!filters.q || (c.companyName?.toLowerCase().includes(filters.q.toLowerCase()) || c.email?.toLowerCase().includes(filters.q.toLowerCase()) || c.industry?.toLowerCase().includes(filters.q.toLowerCase())))); return filtered.length === 0; })() ? (
            <div className="text-center p-16 bg-white rounded-lg shadow-sm dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <FaBuilding className="text-[#ff8200] text-3xl" />
                </div>
              </div>
              <p className="text-xl font-medium">No approved companies yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Approved companies will appear here</p>
              <button
                onClick={() => fetchApprovedCompanies()}
                className="mt-6 inline-flex items-center px-4 py-2 rounded bg-[#ff8200] text-white text-sm font-medium hover:bg-[#e57400] transition"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => fetchApprovedCompanies()}
                  className="inline-flex items-center px-3 py-1.5 rounded bg-[#ff8200] text-white text-xs font-semibold hover:bg-[#e57400] transition"
                >
                  Refresh List
                </button>
              </div>
        {(() => { const all = approvedCompanies.filter(c => c.approved === true && (c.status === 'approved' || c.status === undefined || c.status === null) && (!filters.q || (c.companyName?.toLowerCase().includes(filters.q.toLowerCase()) || c.email?.toLowerCase().includes(filters.q.toLowerCase()) || c.industry?.toLowerCase().includes(filters.q.toLowerCase())))); const page = pages.approved; const slice = all.slice((page-1)*pageSize, page*pageSize); return slice.map((company) => (
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
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleRevoke(company._id)}
                          className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors shadow-sm"
                        >
                          <FaTimes className="mr-2" /> Deny Access
                        </button>
                        <button
                          onClick={()=> navigate(`/admin/messages/${company._id}`)}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          Messages
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
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Username</p>
                            <p className="font-medium break-all">{company.Username}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Company Type</p>
                            <p className="font-medium">{company.type || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Company Size</p>
                            <p className="font-medium">{company.size || '—'}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                            <p className="font-medium break-words">{company.address || '—'}</p>
                          </div>
                          {company.registrationNumber && (
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Registration Number</p>
                              <p className="font-medium">{company.registrationNumber}</p>
                            </div>
                          )}
                        </div>
                        {company.socialMediaLinks && (
                          <div className="mt-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Social</p>
                            <div className="flex flex-wrap gap-3 mt-1">
                              {company.socialMediaLinks.instagram && <a className="text-blue-500 hover:underline" href={company.socialMediaLinks.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
                              {company.socialMediaLinks.twitter && <a className="text-blue-500 hover:underline" href={company.socialMediaLinks.twitter} target="_blank" rel="noopener noreferrer">Twitter</a>}
                              {company.socialMediaLinks.linkedin && <a className="text-blue-500 hover:underline" href={company.socialMediaLinks.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
                              {company.socialMediaLinks.youtube && <a className="text-blue-500 hover:underline" href={company.socialMediaLinks.youtube} target="_blank" rel="noopener noreferrer">YouTube</a>}
                            </div>
                          </div>
                        )}
                        {company.documents && (
                          <div className="mt-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Verification Document</p>
                            <a
                              href={company.documents}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline font-medium"
                            >
                              View Document
                            </a>
                          </div>
                        )}
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
              )); })()}
              {(() => { const all = approvedCompanies.filter(c => c.approved === true && (c.status === 'approved' || c.status === undefined || c.status === null) && (!filters.q || (c.companyName?.toLowerCase().includes(filters.q.toLowerCase()) || c.email?.toLowerCase().includes(filters.q.toLowerCase()) || c.industry?.toLowerCase().includes(filters.q.toLowerCase())))); const total = Math.max(1, Math.ceil(all.length / pageSize)); if (total <=1) return null; return (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <button disabled={pages.approved===1} onClick={()=>setPages(p=>({...p,approved:p.approved-1}))} className={`px-3 py-1 rounded border ${pages.approved===1?'opacity-40 cursor-not-allowed':'hover:bg-gray-100 dark:hover:bg-gray-700'} ${isDarkMode?'border-gray-600':'border-gray-300'}`}>Prev</button>
                  {Array.from({ length: total }).map((_,i)=>(
                    <button key={i} onClick={()=>setPages(p=>({...p,approved:i+1}))} className={`px-3 py-1 rounded border ${pages.approved===i+1? 'bg-[#ff8200] text-white border-[#ff8200]' : isDarkMode? 'border-gray-600':'border-gray-300'}`}>{i+1}</button>
                  ))}
                  <button disabled={pages.approved===total} onClick={()=>setPages(p=>({...p,approved:p.approved+1}))} className={`px-3 py-1 rounded border ${pages.approved===total?'opacity-40 cursor-not-allowed':'hover:bg-gray-100 dark:hover:bg-gray-700'} ${isDarkMode?'border-gray-600':'border-gray-300'}`}>Next</button>
                </div>
              ); })()}
            </div>
          )}
        </>
      )}
      
      {/* Denied Companies Tab Content */}
      {activeTab === 'denied' && (
        <>
          {deniedCompanies.length === 0 ? (
            <div className="text-center p-16 bg-white rounded-lg shadow-sm dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <FaTimes className="text-red-600 text-3xl" />
                </div>
              </div>
              <p className="text-xl font-medium">No denied companies</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Denied companies will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {(() => { const all = deniedCompanies.filter(c => !filters.q || (c.companyName?.toLowerCase().includes(filters.q.toLowerCase()) || c.email?.toLowerCase().includes(filters.q.toLowerCase()) || c.industry?.toLowerCase().includes(filters.q.toLowerCase()))); const page = pages.denied; const slice = all.slice((page-1)*pageSize, page*pageSize); return slice.map((company) => (
                <div key={company._id} className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} transition-all hover:shadow-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                          {company.logo ? (
                            <img src={company.logo} alt={company.companyName} className="w-full h-full object-cover" />
                          ) : (
                            <FaBuilding className="text-[#ff8200] text-xl" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold">
                              <HighlightedText text={company.companyName} query={filters.q} isDarkMode={isDarkMode} />
                            </h3>
                            <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Denied</span>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <HighlightedText text={company.email} query={filters.q} isDarkMode={isDarkMode} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:flex">
                        <button
                          onClick={() => handleApproveFromHold(company._id)}
                          className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                        >
                          <FaCheck className="mr-2" /> Approve
                        </button>
                        <button
                          onClick={() => openReasonModal('deny', company)}
                          className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                        >
                          <FaTimes className="mr-2" /> Deny
                        </button>
                        <button
                          onClick={()=> navigate(`/admin/messages/${company._id}`)}
                          className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                        >
                          Messages
                        </button>
                      </div>
                      {/* Mobile action bar */}
                      <div className="w-full md:hidden">
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleApproveFromHold(company._id)}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                          >
                            <FaCheck className="mr-2" /> Approve
                          </button>
                          <button
                            onClick={() => openReasonModal('deny', company)}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                          >
                            <FaTimes className="mr-2" /> Deny
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {Array.isArray(company.adminMessages) && company.adminMessages.filter(m => m.type === 'deny').length > 0 ? (
                      <div className="text-sm">
                        <div className="font-medium mb-1">Reason</div>
                        <div className="p-3 rounded border bg-red-50 dark:bg-red-900/20 dark:border-red-700">
                          {company.adminMessages.filter(m => m.type === 'deny').slice(-1)[0].message}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm opacity-70">No reason provided.</div>
                    )}
                  </div>
                </div>
              )); })()}
              {(() => { const all = deniedCompanies.filter(c => !filters.q || (c.companyName?.toLowerCase().includes(filters.q.toLowerCase()) || c.email?.toLowerCase().includes(filters.q.toLowerCase()) || c.industry?.toLowerCase().includes(filters.q.toLowerCase()))); const total = Math.max(1, Math.ceil(all.length / pageSize)); if (total<=1) return null; return (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <button disabled={pages.denied===1} onClick={()=>setPages(p=>({...p,denied:p.denied-1}))} className={`px-3 py-1 rounded border ${pages.denied===1?'opacity-40 cursor-not-allowed':'hover:bg-gray-100 dark:hover:bg-gray-700'} ${isDarkMode?'border-gray-600':'border-gray-300'}`}>Prev</button>
                  {Array.from({ length: total }).map((_,i)=>(
                    <button key={i} onClick={()=>setPages(p=>({...p,denied:i+1}))} className={`px-3 py-1 rounded border ${pages.denied===i+1? 'bg-[#ff8200] text-white border-[#ff8200]' : isDarkMode? 'border-gray-600':'border-gray-300'}`}>{i+1}</button>
                  ))}
                  <button disabled={pages.denied===total} onClick={()=>setPages(p=>({...p,denied:p.denied+1}))} className={`px-3 py-1 rounded border ${pages.denied===total?'opacity-40 cursor-not-allowed':'hover:bg-gray-100 dark:hover:bg-gray-700'} ${isDarkMode?'border-gray-600':'border-gray-300'}`}>Next</button>
                </div>
              ); })()}
            </div>
          )}
        </>
      )}
      {/* On Hold Companies Tab Content */}
      {activeTab === 'hold' && (
        <>
          {holdCompanies.length === 0 ? (
            <div className="text-center p-16 bg-white rounded-lg shadow-sm dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <FaClock className="text-yellow-600 text-3xl" />
                </div>
              </div>
              <p className="text-xl font-medium">No companies on hold</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">On-hold companies will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {(() => { const all = holdCompanies.filter(c => !filters.q || (c.companyName?.toLowerCase().includes(filters.q.toLowerCase()) || c.email?.toLowerCase().includes(filters.q.toLowerCase()) || c.industry?.toLowerCase().includes(filters.q.toLowerCase()))); const page = pages.hold; const slice = all.slice((page-1)*pageSize, page*pageSize); return slice.map((company) => (
                <div key={company._id} className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} transition-all hover:shadow-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                          {company.logo ? (
                            <img src={company.logo} alt={company.companyName} className="w-full h-full object-cover" />
                          ) : (
                            <FaBuilding className="text-[#ff8200] text-xl" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold">
                              <HighlightedText text={company.companyName} query={filters.q} isDarkMode={isDarkMode} />
                            </h3>
                            <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">On Hold</span>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <HighlightedText text={company.email} query={filters.q} isDarkMode={isDarkMode} />
                          </div>
                        </div>
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveFromHold(company._id)}
                          className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                        >
                          <FaCheck className="mr-2" /> Approve
                        </button>
                        <button
                          onClick={() => openReasonModal('deny', company)}
                          className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                        >
                          <FaTimes className="mr-2" /> Deny
                        </button>
                        <button
                          onClick={()=> navigate(`/admin/messages/${company._id}`)}
                          className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                        >
                          Messages
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Reason block */}
                    <div>
                      {Array.isArray(company.adminMessages) && company.adminMessages.filter(m => m.type === 'hold').length > 0 ? (
                        <div className="text-sm">
                          <div className="font-medium mb-1">Reason</div>
                          <div className="p-3 rounded border bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
                            {company.adminMessages.filter(m => m.type === 'hold').slice(-1)[0].message}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm opacity-70">No reason provided.</div>
                      )}
                    </div>
                    {/* Contact & Details similar to pending */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
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
                              <p className="font-medium">{company.phone || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <FaGlobeAmericas className="text-[#ff8200] mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Website</p>
                              <p className="font-medium break-all">{company.website ? <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{company.website}</a> : 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h4 className="font-medium mb-4 text-[#ff8200]">Company Details</h4>
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <FaBuilding className="text-[#ff8200] mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Industry</p>
                              <p className="font-medium">{company.industry || 'Not specified'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
                            <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">On Hold</span>
                          </div>
                          {company.documents && (
                            <div className="flex items-start">
                              <svg className="h-5 w-5 text-[#ff8200] mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Documents</p>
                                <a href={company.documents} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">View Verification Documents</a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {company.description && (
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h4 className="font-medium mb-2 text-[#ff8200]">Company Description</h4>
                        <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: company.description }} />
                      </div>
                    )}
                  </div>
                </div>
              )); })()}
              {(() => { const all = holdCompanies.filter(c => !filters.q || (c.companyName?.toLowerCase().includes(filters.q.toLowerCase()) || c.email?.toLowerCase().includes(filters.q.toLowerCase()) || c.industry?.toLowerCase().includes(filters.q.toLowerCase()))); const total = Math.max(1, Math.ceil(all.length / pageSize)); if (total<=1) return null; return (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <button disabled={pages.hold===1} onClick={()=>setPages(p=>({...p,hold:p.hold-1}))} className={`px-3 py-1 rounded border ${pages.hold===1?'opacity-40 cursor-not-allowed':'hover:bg-gray-100 dark:hover:bg-gray-700'} ${isDarkMode?'border-gray-600':'border-gray-300'}`}>Prev</button>
                  {Array.from({ length: total }).map((_,i)=>(
                    <button key={i} onClick={()=>setPages(p=>({...p,hold:i+1}))} className={`px-3 py-1 rounded border ${pages.hold===i+1? 'bg-[#ff8200] text-white border-[#ff8200]' : isDarkMode? 'border-gray-600':'border-gray-300'}`}>{i+1}</button>
                  ))}
                  <button disabled={pages.hold===total} onClick={()=>setPages(p=>({...p,hold:p.hold+1}))} className={`px-3 py-1 rounded border ${pages.hold===total?'opacity-40 cursor-not-allowed':'hover:bg-gray-100 dark:hover:bg-gray-700'} ${isDarkMode?'border-gray-600':'border-gray-300'}`}>Next</button>
                </div>
              ); })()}
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
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
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

          {/* Reason Modal */}
          {reasonModal.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className={`w-full max-w-md rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold">
                    {reasonModal.mode === 'hold' ? 'Put Company on Hold' : 'Deny Company Registration'}
                  </h3>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="text-sm opacity-80">
                    {reasonModal.mode === 'hold'
                      ? 'Please provide a reason. The company will be able to log in but cannot post jobs.'
                      : 'Please provide a reason. The company will not be able to log in and will receive an email notification.'}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Reason</label>
                    <textarea
                      rows={4}
                      value={reasonModal.reason}
                      onChange={(e) => setReasonModal(s => ({ ...s, reason: e.target.value }))}
                      className={`w-full rounded border px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      placeholder="Enter a clear, actionable reason..."
                    />
                  </div>
                </div>
                <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setReasonModal({ open: false, mode: null, company: null, reason: '' })}
                    className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReasonModal}
                    className={`px-4 py-2 rounded text-white ${reasonModal.mode === 'hold' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'}`}
                    disabled={!reasonModal.reason.trim()}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
          {filterModal && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
              <div className={`w-full max-w-md rounded-lg shadow-lg ${isDarkMode? 'bg-gray-800 text-white':'bg-white text-gray-900'}`}>
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <button onClick={()=>setFilterModal(false)} className="text-sm opacity-70 hover:opacity-100">✕</button>
                </div>
                <div className="px-5 py-5 space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Search</label>
                    <input value={filters.q} onChange={e=>setFilters(s=>({...s,q:e.target.value}))} placeholder="Name / Email / Industry" className={`w-full rounded border px-3 py-2 ${isDarkMode? 'bg-gray-700 border-gray-600':'bg-white border-gray-300'}`} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Sort By</label>
                      <select value={filters.sort} onChange={e=>setFilters(s=>({...s,sort:e.target.value}))} className={`w-full rounded border px-3 py-2 ${isDarkMode? 'bg-gray-700 border-gray-600':'bg-white border-gray-300'}`}>
                        <option value="updatedAt">Updated</option>
                        <option value="name">Name</option>
                        <option value="status">Status</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Order</label>
                      <select value={filters.order} onChange={e=>setFilters(s=>({...s,order:e.target.value}))} className={`w-full rounded border px-3 py-2 ${isDarkMode? 'bg-gray-700 border-gray-600':'bg-white border-gray-300'}`}>
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
                  <button onClick={()=>setFilters({ q:'', sort:'updatedAt', order:'desc' })} className={`px-4 py-2 rounded ${isDarkMode? 'bg-gray-700 hover:bg-gray-600':'bg-gray-100 hover:bg-gray-200'}`}>Reset</button>
                  <button onClick={()=>setFilterModal(false)} className="px-4 py-2 rounded bg-[#ff8200] text-white hover:bg-[#e57400]">Apply</button>
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
