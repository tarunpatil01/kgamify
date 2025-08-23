import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';
import { 
  FaSun, 
  FaMoon, 
  FaEdit, 
  FaSignOutAlt, 
  FaBars, 
  FaSearch,
  FaBell,
  FaUser,
  FaCog,
  FaChevronDown
} from "react-icons/fa";
import Klogo from '../assets/KLOGO.png';

function Navbar({ onSidebarToggle, onThemeToggle, isDarkMode, userCompany = null, email = '' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isForgetPasswordPage = location.pathname === "/forgot-password";
  
  // State management
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logoUrl, setLogoUrl] = useState(null);
  const [notifications] = useState([
    { id: 1, message: "New job application received", time: "2 min ago", unread: true },
    { id: 2, message: "Job posting approved", time: "1 hour ago", unread: true },
    { id: 3, message: "Profile updated successfully", time: "3 hours ago", unread: false },
  ]);

  // Refs for click outside detection
  const userDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Set logo URL from userCompany
  useEffect(() => {
    if (userCompany && userCompany.logo) {
      setLogoUrl(userCompany.logo);
    } else {
      setLogoUrl(null);
    }
  }, [userCompany]);

  if (isForgetPasswordPage) {
    return null;
  }

  // Get page title
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard": return "Dashboard";
      case "/post-job": return "Post Job";
      case "/job-posted": return "Job Posted"; 
      case "/applications": return "Job Applications";
      case "/Edit-Registration": return "Edit Registration";
      case "/edit-registration": return "Edit Registration";
      case "/settings": return "Settings";
      case "/admin": return "Admin Portal";
      default: return "Kgamify Job Portal";
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
    setShowUserDropdown(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const unreadNotifications = notifications.filter(n => n.unread).length;

  return (
    <nav className={`sticky top-0 z-30 w-full border-b backdrop-blur-sm transition-colors ${
      isDarkMode 
        ? "bg-gray-900/95 border-gray-700" 
        : "bg-white/95 border-gray-200"
    }`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onSidebarToggle}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle sidebar"
            >
              <FaBars className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <img
                src={logoUrl || Klogo}
                alt="Company Logo"
                className="h-8 w-8 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = Klogo;
                }}
              />
              <div className="block min-w-0">
                <h1
                  className="font-heading font-bold title-strong text-base sm:text-lg md:text-xl truncate max-w-[45vw] md:max-w-none"
                  style={{ color: isDarkMode ? '#f3f4f6' : '#111827' }}
                >
                  {getPageTitle()}
                </h1>
                {userCompany?.companyName && (
                  <p
                    className="text-xs sm:text-sm subtitle-muted font-medium truncate max-w-[45vw] md:max-w-none"
                    style={{ color: isDarkMode ? '#d1d5db' : '#374151' }}
                  >
                    {userCompany.companyName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search jobs, applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-kgamify pl-10 py-2 text-sm w-full"
                />
              </div>
            </form>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Mobile Search Button */}
            <button className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <FaSearch className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onThemeToggle}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <FaSun className="h-5 w-5 text-yellow-500" />
              ) : (
                <FaMoon className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationDropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                aria-label="Notifications"
              >
                <FaBell className="h-5 w-5 text-gray-800 dark:text-gray-300" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div
                  className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg border z-50 ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b transition-colors ${
                          isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
                        } ${notification.unread ? (isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50') : ''}`}
                      >
                        <p className={`text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>{notification.message}</p>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notification.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className={`p-3 text-center border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <button className={`text-sm font-medium ${
                      isDarkMode ? 'text-kgamify-500 hover:text-kgamify-400' : 'text-kgamify-500 hover:text-kgamify-600'
                    }`}>
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                aria-label="User menu"
              >
                <div className="h-8 w-8 bg-kgamify-500 rounded-full flex items-center justify-center">
                  <FaUser className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-kgamify-500 dark:text-kgamify-500">
                    {userCompany?.companyName || "Company"}
                  </p>
                  <p className="text-xs text-gray-800 dark:text-gray-200">
                    {email}
                  </p>
                </div>
                <FaChevronDown className="h-3 w-3 text-gray-700 dark:text-gray-300" />
              </button>

              {/* User Dropdown Menu */}
              {showUserDropdown && (
                <div
                  className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg border z-50 ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className="font-medium text-kgamify-500">
                      {userCompany?.companyName || "Company"}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate('/edit-registration');
                        setShowUserDropdown(false);
                      }}
                      className={`flex items-center w-full px-4 py-2 text-sm ${
                        isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <FaEdit className="mr-3 h-4 w-4" />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowUserDropdown(false);
                      }}
                      className={`flex items-center w-full px-4 py-2 text-sm ${
                        isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <FaCog className="mr-3 h-4 w-4" />
                      Settings
                    </button>
                    <div className={`border-t my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                    <button
                      onClick={handleLogout}
                      className={`flex items-center w-full px-4 py-2 text-sm ${
                        isDarkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <FaSignOutAlt className="mr-3 h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

Navbar.propTypes = {
  onSidebarToggle: PropTypes.func.isRequired,
  onThemeToggle: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
  userCompany: PropTypes.shape({
    companyName: PropTypes.string,
    logo: PropTypes.string
  }),
  email: PropTypes.string
};

export default Navbar;