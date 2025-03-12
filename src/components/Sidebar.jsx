import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaHome, FaBriefcase, FaFileAlt, FaBuilding, FaMoon, FaSun, FaClipboardList, FaSignOutAlt, FaUserShield } from "react-icons/fa";

function Sidebar({ onToggle, onThemeToggle, isDarkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isForgetPasswordPage = location.pathname === "/forgot-password";

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

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"} shadow-lg ${isOpen ? "w-60" : "w-16"} transition-width duration-300`}>
      <div className="flex items-center justify-between p-3">
        <button onClick={toggleSidebar}>
          <FaBars className="h-8 w-8 transform scale-x-80 scale-y-75"/>
        </button>
      </div>
      <nav className="h-screen mt-5 flex-grow">
        <ul className="my-5">
          <Link to="/dashboard">
            <li className="flex items-center p-3 hover:bg-gray-200 dark:hover:bg-gray-100">
              <FaHome className="h-6 w-8 mr-3" />
              {isOpen && <span>Dashboard</span>}
            </li>
          </Link>
          <Link to="/post-job" state={{ isDarkMode }}>
            <li className="flex items-center p-3 hover:bg-gray-200 dark:hover:bg-gray-100">
              <FaBriefcase className="h-6 w-8 mr-3" />
              {isOpen && <span>Post Job</span>}
            </li>
          </Link>
          <Link to="/job-posted">
            <li className="flex items-center p-3 hover:bg-gray-200 dark:hover:bg-gray-100">
              <FaClipboardList className="h-6 w-8 mr-3" />
              {isOpen && <span>Job Posted</span>}
            </li>
          </Link>
          <Link to="/EditRegistration">
            <li className="flex items-center p-3 hover:bg-gray-200 dark:hover:bg-gray-100">
              <FaBuilding className="h-6 w-8 mr-3" />
              {isOpen && <span>Edit Registration</span>}
            </li>
          </Link>
          
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;
