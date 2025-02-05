import React from "react";
import { useLocation } from "react-router-dom";
import { FaSun, FaMoon } from "react-icons/fa";

function Navbar({ isSidebarOpen, onThemeToggle, isDarkMode }) {
  const location = useLocation();
  let pageTitle = "";

  switch (location.pathname) {
    case "/dashboard":
      pageTitle = "Dashboard";
      break;
    case "/post-job":
      pageTitle = "Post Job";
      break;
    case "/job-posted":
      pageTitle = "Job Posted";
      break;
    case "/applications":
      pageTitle = "Applications";
      break;
    case "/company-registration":
      pageTitle = "Company Registration";
      break;
    default:
      pageTitle = "";
  }

  return (
    <nav className={`bg-white  text-[#C30E59] p-2 flex justify-between items-center transition-all duration-300 ${isSidebarOpen ? "ml-20" : "ml-16"}`}>
      <h1 className="text-xl font-bold">{pageTitle}</h1>
      <div className="flex items-center">
        <button onClick={onThemeToggle} className="mr-4">
          {isDarkMode ? <FaSun className="h-6 w-6 text-yellow-500" /> : <FaMoon className="h-6 w-6 text-gray-500" />}
        </button>
        <img
          src="src/assets/profile-icon.png"
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover"
        />
      </div>
    </nav>
  );
}

export default Navbar;