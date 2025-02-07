import React from "react";
import { useLocation, Route, Routes } from "react-router-dom";
import { FaSun, FaMoon } from "react-icons/fa";
import PostJob from "../pages/PostJob";

function Navbar({ isSidebarOpen, onThemeToggle, isDarkMode }) {
  const location = useLocation();
  const isForgetPasswordPage = location.pathname === "/forgot-password";

  if (isForgetPasswordPage) {
    return null;
  }

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
    <nav className={`p-2 flex justify-between items-center transition-all duration-300  ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-[#C30E59]"}`}>
      <h1 className="text-xl font-bold ml-10">{pageTitle}</h1>
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