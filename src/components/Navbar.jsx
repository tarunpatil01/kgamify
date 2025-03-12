import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaSun, FaMoon, FaEdit, FaSignOutAlt, FaBuilding } from "react-icons/fa";

function Navbar({ isSidebarOpen, onThemeToggle, isDarkMode, userCompany }) {
  const location = useLocation();
  const isForgetPasswordPage = location.pathname === "/forgot-password";
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState(null);
  
  console.log("UserCompany in Navbar:", userCompany); // Add debugging log

  useEffect(() => {
    if (userCompany && userCompany.logo) {
      console.log("Logo found:", typeof userCompany.logo, userCompany.logo.substring(0, 30) + "..."); // Debugging log
      
      // Direct use of base64 data or cloudinary URL
      setLogoUrl(userCompany.logo);
    } else {
      console.log("No logo found in user company data"); // Debugging log
      setLogoUrl(null);
    }
  }, [userCompany]);

  if (isForgetPasswordPage) {
    return null;
  }

  // Determine page title
  let pageTitle = "";
  switch (location.pathname) {
    case "/dashboard": pageTitle = "Dashboard"; break;
    case "/post-job": pageTitle = "Post Job"; break;
    case "/job-posted": pageTitle = "Job Posted"; break;
    case "/applications": pageTitle = "Applications"; break;
    case "/company-registration": pageTitle = "Company Registration"; break;
    default: pageTitle = "";
  }

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('companyType');
    localStorage.removeItem('rememberedEmail');
    navigate("/");
  };

  const handleEditRegistration = () => {
    navigate("/EditRegistration");
  };

  return (
    <nav
      className={`p-2 flex justify-between items-center transition-all duration-300 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-[#ff8200]"
      }`}
    >
      <h1 className="text-lg sm:text-xl font-bold ml-2 sm:ml-10">{pageTitle}</h1>
      <div className="flex items-center relative mr-5 sm:mr-10">
        <button onClick={onThemeToggle} className="mr-2 sm:mr-4">
          {isDarkMode ? (
            <FaMoon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
          ) : (
            <FaSun className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
          )}
        </button>
        <div 
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full cursor-pointer overflow-hidden bg-gray-200 flex items-center justify-center"
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(true)}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Company Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.log("Error loading logo image:", e);
                e.target.onerror = null;
                e.target.src = "src/assets/profile-icon.png";
              }}
            />
          ) : (
            <FaBuilding className="w-5 h-5 text-gray-500" />
          )}
        </div>
        
        {/* Dropdown menu */}
        {showDropdown && (
          <div
            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-10"
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <button
              className="flex items-center w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-200 transition-colors duration-200 ease-in-out"
              onClick={handleEditRegistration}
            >
              <FaEdit className="mr-2" /> Edit Registration
            </button>
            <button
              className="flex items-center w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-200 transition-colors duration-200 ease-in-out"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="mr-2" /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;