import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  FaHome, 
  FaBriefcase, 
  FaClipboardList, 
  FaBuilding, 
  FaChevronLeft,
  FaChevronRight,
  FaSignOutAlt,
  FaCreditCard,
  FaRegCommentDots
} from "react-icons/fa";
import PropTypes from 'prop-types';
import Klogo from '../assets/KLOGO.png';

function Sidebar({ onToggle, isOpen = false, isDarkMode = false, unreadMessages = 0 }) {
  const navigate = useNavigate();
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
    navigate("/");
  };

  // Determine if the current path matches a nav item
  const isActivePath = (path) => location.pathname === path;

  const navigationItems = [
    { to: "/dashboard", icon: FaHome, text: "Dashboard", id: "dashboard" },
    { to: "/post-job", icon: FaBriefcase, text: "Post Job", id: "post-job" },
    { to: "/job-posted", icon: FaClipboardList, text: "Job Posted", id: "job-posted" },
    { to: "/Edit-Registration", icon: FaBuilding, text: "Edit Registration", id: "edit-registration" },
    { to: "/applications", icon: FaClipboardList, text: "Applications", id: "applications" },
  { to: "/messages", icon: FaRegCommentDots, text: "Messages", id: "messages", badge: unreadMessages },
    { to: "/payment", icon: FaCreditCard, text: "Payment", id: "payment" },
  ];

  return (
    <>
      {/* Sidebar Container */}
      <div 
        className={`h-screen flex flex-col transition-all duration-300 ease-in-out relative z-[20000] ${
          isDarkMode 
            ? 'bg-gray-900 border-gray-800' 
            : 'bg-white border-gray-200'
        } border-r shadow-sm`}
      >
        {/* Header Section */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDarkMode ? 'border-gray-800' : 'border-gray-100'
        }`}>
          {localIsOpen && (
            <div className="flex items-center space-x-3">
              <img
                src={Klogo}
                alt="Kgamify Logo"
                className="w-8 h-8 rounded-lg"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-kgamify-500">Kgamify</span>
                <span className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Job Portal</span>
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
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-800 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            } ${!localIsOpen ? "hidden" : ""} hidden md:inline-flex`}
            aria-label={localIsOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {localIsOpen ? (
              <FaChevronLeft className="w-4 h-4" />
            ) : (
              <FaChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Section */}
        <nav className={`flex-1 px-2 py-4 space-y-1 ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        }`}>          
          {navigationItems.map((item) => (
            <SidebarLink
              key={item.id}
              to={item.to}
              icon={item.icon}
              text={item.text}
              isOpen={localIsOpen}
              isActive={isActivePath(item.to)}
              isDarkMode={isDarkMode}
            />
          ))}
          
          {/* Divider */}
          <div className={`my-4 border-t ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`} />
          
          {/* Settings link removed per request */}
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-3 py-2.5 text-left rounded-lg transition-all duration-200 group ${
              isDarkMode
                ? 'text-gray-300 hover:bg-red-900/20 hover:text-red-400'
                : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
            } ${!localIsOpen ? "justify-center" : ""}`}
          >
            <FaSignOutAlt className={`w-5 h-5 ${localIsOpen ? "mr-3" : ""}`} />
            {localIsOpen && (
              <span className="font-medium">Sign Out</span>
            )}
            {!localIsOpen && (
              <span className={`absolute left-16 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[10000] ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-900'
              }`}>
                Sign Out
              </span>
            )}
          </button>
        </nav>

        {/* Collapse Button for Collapsed State */}
        {!localIsOpen && (
          <div className={`absolute -right-3 top-6 border rounded-full shadow-lg ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-white border-gray-200'
          } hidden md:block`}>
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-full transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              aria-label="Expand sidebar"
            >
              <FaChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// Modern SidebarLink component
function SidebarLink({ to, icon: Icon, text, isOpen, isActive, isDarkMode = false, badge }) {
  return (
    <Link to={to} className="relative group">
      <div
        className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-kgamify-500 text-white shadow-sm"
            : isDarkMode
              ? "text-gray-300 hover:bg-gray-800 hover:text-gray-100"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        } ${!isOpen ? "justify-center" : ""}`}
      >
        <Icon className={`w-5 h-5 ${isOpen ? "mr-3" : ""} ${isActive ? "text-white" : ""}`} />
        {isOpen && (
          <span className={`font-medium transition-all duration-200 flex items-center gap-2 ${isActive ? "text-white" : ""}`}>
            <span>{text}</span>
            {badge > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-5 text-[10px] px-1.5 rounded-full bg-red-600 text-white font-semibold">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </span>
        )}
        
        {/* Tooltip for collapsed state */}
        {!isOpen && (
          <span className={`absolute left-16 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[10000] ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-900'
          }`}>
            {text}{badge>0?` (${badge>99?'99+':badge})`:''}
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
  isDarkMode: PropTypes.bool,
  unreadMessages: PropTypes.number,
};

// PropTypes for SidebarLink
SidebarLink.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  text: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  isActive: PropTypes.bool.isRequired,
  isDarkMode: PropTypes.bool,
  badge: PropTypes.number,
};

export default Sidebar;
