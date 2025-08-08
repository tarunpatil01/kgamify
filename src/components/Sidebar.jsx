import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  FaHome, 
  FaBriefcase, 
  FaClipboardList, 
  FaBuilding, 
  FaChevronLeft,
  FaChevronRight,
  FaCog,
  FaSignOutAlt
} from "react-icons/fa";
import PropTypes from 'prop-types';
import Klogo from '../assets/KLOGO.png';

function Sidebar({ onToggle, isOpen = false }) {
  const [localIsOpen, setLocalIsOpen] = useState(isOpen);
  const location = useLocation();
  const isForgetPasswordPage = location.pathname === "/forgot-password";

  // Update local state when prop changes
  useEffect(() => {
    setLocalIsOpen(isOpen);
  }, [isOpen]);

  // Handle window resize to detect mobile devices
  useEffect(() => {
    const handleResize = () => {
      // Auto-collapse sidebar on small screens
      if (window.innerWidth < 768 && localIsOpen) {
        setLocalIsOpen(false);
        onToggle(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [localIsOpen, onToggle]);

  if (isForgetPasswordPage) {
    return null;
  }

  const toggleSidebar = () => {
    const newState = !localIsOpen;
    setLocalIsOpen(newState);
    onToggle(newState);
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  // Determine if the current path matches a nav item
  const isActivePath = (path) => location.pathname === path;

  const navigationItems = [
    { to: "/dashboard", icon: FaHome, text: "Dashboard", id: "dashboard" },
    { to: "/post-job", icon: FaBriefcase, text: "Post Job", id: "post-job" },
    { to: "/job-posted", icon: FaClipboardList, text: "Job Posted", id: "job-posted" },
    { to: "/Edit-Registration", icon: FaBuilding, text: "Edit Registration", id: "edit-registration" },
  ];

  return (
    <>
      {/* Sidebar Container */}
      <div 
        className={`h-full bg-gray-50 dark:bg-gray-900 shadow-xl flex flex-col transition-all duration-300 ease-in-out`}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {localIsOpen && (
            <div className="flex items-center space-x-3">
              <img
                src={Klogo}
                alt="Kgamify Logo"
                className="w-8 h-8 rounded-lg"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-kgamify-500">Kgamify</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Job Portal</span>
              </div>
            </div>
          )}
          
          {!localIsOpen && (
            <div className="flex justify-center w-full">
              <img
                src={Klogo}
                alt="Kgamify Logo"
                className="w-8 h-8 rounded-lg"
              />
            </div>
          )}
          
          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              !localIsOpen ? "hidden" : ""
            }`}
            aria-label={localIsOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {localIsOpen ? (
              <FaChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            ) : (
              <FaChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 py-6 space-y-2 bg-gray-50 dark:bg-gray-900">
          {localIsOpen && (
            <div className="px-3 mb-4">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Main Navigation
              </p>
            </div>
          )}
          
          {navigationItems.map((item) => (
            <SidebarLink
              key={item.id}
              to={item.to}
              icon={item.icon}
              text={item.text}
              isOpen={localIsOpen}
              isActive={isActivePath(item.to)}
            />
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2">
          {localIsOpen && (
            <div className="px-3 mb-4">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Account
              </p>
            </div>
          )}
          
          <SidebarLink
            to="/settings"
            icon={FaCog}
            text="Settings"
            isOpen={localIsOpen}
            isActive={isActivePath('/settings')}
          />
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-3 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all duration-200 group ${
              !localIsOpen ? "justify-center" : ""
            }`}
          >
            <FaSignOutAlt className={`w-5 h-5 ${localIsOpen ? "mr-3" : ""}`} />
            {localIsOpen && (
              <span className="font-medium">Sign Out</span>
            )}
            {!localIsOpen && (
              <span className="absolute left-16 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Sign Out
              </span>
            )}
          </button>
        </div>

        {/* Collapse Button for Collapsed State */}
        {!localIsOpen && (
          <div className="absolute -right-3 top-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Expand sidebar"
            >
              <FaChevronRight className="w-3 h-3 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// Modern SidebarLink component
function SidebarLink({ to, icon: Icon, text, isOpen, isActive }) {
  return (
    <Link to={to} className="relative group">
      <div
        className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-kgamify-500 text-white shadow-lg"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        } ${!isOpen ? "justify-center" : ""}`}
      >
        <Icon className={`w-5 h-5 ${isOpen ? "mr-3" : ""} ${isActive ? "text-white" : ""}`} />
        {isOpen && (
          <span className={`font-medium transition-all duration-200 ${isActive ? "text-white" : ""}`}>
            {text}
          </span>
        )}
        
        {/* Tooltip for collapsed state */}
        {!isOpen && (
          <span className="absolute left-16 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {text}
          </span>
        )}
      </div>
    </Link>
  );
}

// PropTypes for Sidebar
Sidebar.propTypes = {
  onToggle: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
};

// PropTypes for SidebarLink
SidebarLink.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  text: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  isActive: PropTypes.bool.isRequired,
};

export default Sidebar;
