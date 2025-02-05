import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaHome, FaBriefcase, FaFileAlt, FaBuilding, FaMoon, FaSun, FaClipboardList, FaSignOutAlt } from "react-icons/fa";

function Sidebar({ onToggle, onThemeToggle, isDarkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    onToggle(!isOpen);
  };

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className={`flex flex-col h-screen bg-white shadow-lg ${isOpen ? "w-60" : "w-16"} transition-width duration-300`}>
      <div className="flex items-center justify-between p-3">
        <button onClick={toggleSidebar}>
          <FaBars className="h-8 w-8 transform scale-x-80 scale-y-75"/>
        </button>
        {isOpen && <div className="font-bold text-xl pr-10">Dashboard</div>}
      </div>
      <nav className="mt-5 flex-grow">
        <ul>
          <Link to="/dashboard">
            <li className="flex items-center p-3 hover:bg-gray-200">
              <FaHome className="h-6 w-8 mr-3 text-black" />
              {isOpen && <span className="text-black">Dashboard</span>}
            </li>
          </Link>
          <Link to="/post-job">
            <li className="flex items-center p-3 hover:bg-gray-200">
              <FaBriefcase className="h-6 w-8 mr-3 text-black" />
              {isOpen && <span className="text-black">Post Job</span>}
            </li>
          </Link>
          <Link to="/job-posted">
            <li className="flex items-center p-3 hover:bg-gray-200">
              <FaClipboardList className="h-6 w-8 mr-3 text-black" />
              {isOpen && <span className="text-black">Job Posted</span>}
            </li>
          </Link>
          <Link to="/applications">
            <li className="flex items-center p-3 hover:bg-gray-200">
              <FaFileAlt className="h-6 w-8 mr-3 text-black" />
              {isOpen && <span className="text-black">Applications</span>}
            </li>
          </Link>
          <Link to="/company-registration">
            <li className="flex items-center p-3 hover:bg-gray-200">
              <FaBuilding className="h-6 w-8 mr-3 text-black" />
              {isOpen && <span className="text-black">Company Registration</span>}
            </li>
          </Link>
        </ul>
      </nav>
      <div className="flex p-3 hover:bg-gray-200 text-lg items-center">
        <button onClick={onThemeToggle} className="flex items-center">
          {isDarkMode ? <FaSun className="h-6 w-8 mr-3" /> : <FaMoon className="h-6 w-8 mr-3" />}
          {isOpen && (isDarkMode ? "Light Mode" : "Dark Mode")}
        </button>
      </div>
      <div className="flex p-3 hover:bg-gray-200 text-lg items-center">
        <button onClick={handleLogout} className="flex items-center">
          <FaSignOutAlt className="h-6 w-8 mr-3" />
          {isOpen && "Logout"}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
