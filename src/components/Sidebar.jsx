import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaHome, FaBriefcase, FaFileAlt, FaBuilding, FaMoon, FaSun, FaClipboardList, FaSignOutAlt, FaUserShield } from "react-icons/fa";

function Sidebar({ onToggle, onThemeToggle, isDarkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isForgetPasswordPage = location.pathname === "/forgot-password";
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize to detect mobile devices
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-collapse sidebar on small screens
      if (window.innerWidth < 768 && isOpen) {
        setIsOpen(false);
        onToggle(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onToggle]);

  if (isForgetPasswordPage) {
    return null;
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    onToggle(!isOpen);
  };

  const handleLogout = () => {
    navigate("/");
  };

  // Determine if the current path matches a nav item
  const isActivePath = (path) => location.pathname === path;

  return (
    <div 
      className={`flex flex-col ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"} shadow-lg 
        ${isOpen ? "w-60" : "w-16"} transition-all duration-300 ease-in-out z-10
        ${isMobile ? "fixed h-full" : "h-full"}`}
    >
      <div className="flex items-center justify-between p-3 sm:p-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          <FaBars className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      <nav className="flex-grow overflow-y-auto">
        <ul className="my-2 sm:my-5 py-2">
          <SidebarLink 
            to="/dashboard" 
            icon={<FaHome />} 
            text="Dashboard" 
            isOpen={isOpen} 
            isActive={isActivePath('/dashboard')}
            isDarkMode={isDarkMode} 
          />
          
          <SidebarLink 
            to="/post-job" 
            icon={<FaBriefcase />} 
            text="Post Job" 
            isOpen={isOpen}
            isActive={isActivePath('/post-job')} 
            isDarkMode={isDarkMode}
            state={{ isDarkMode }} 
          />
          
          <SidebarLink 
            to="/job-posted" 
            icon={<FaClipboardList />} 
            text="Job Posted" 
            isOpen={isOpen}
            isActive={isActivePath('/job-posted')} 
            isDarkMode={isDarkMode} 
          />
          
          <SidebarLink 
            to="/Edit-Registration" 
            icon={<FaBuilding />} 
            text="Edit Registration" 
            isOpen={isOpen}
            isActive={isActivePath('/EditRegistration')} 
            isDarkMode={isDarkMode} 
          />
        </ul>
      </nav>
      
      {/* Mobile overlay to close sidebar when clicking outside */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0  bg-opacity-50 z-0"
          onClick={toggleSidebar}
          aria-label="Close sidebar"
        ></div>
      )}
    </div>
  );
}

// Extracted SidebarLink component for cleaner code and consistent styling
function SidebarLink({ to, icon, text, isOpen, isActive, isDarkMode, state = {} }) {
  return (
    <Link to={to} state={state}>
      <li className={`flex items-center px-3 py-3 sm:py-4 mx-2 rounded-lg transition-colors
        ${isActive 
          ? isDarkMode 
            ? "bg-gray-700 text-white" 
            : "bg-gray-200 text-[#ff8200]" 
          : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
      >
        <div className="flex items-center justify-center w-8 h-8">
          {React.cloneElement(icon, { 
            className: `h-5 w-5 sm:h-5 sm:w-5 ${isActive && !isDarkMode ? "text-[#ff8200]" : ""}` 
          })}
        </div>
        {isOpen && (
          <span className={`ml-3 text-base sm:text-base transition-opacity duration-200 
            ${isActive && !isDarkMode ? "font-medium text-[#ff8200]" : ""}`}>
            {text}
          </span>
        )}
      </li>
    </Link>
  );
}

export default Sidebar;
