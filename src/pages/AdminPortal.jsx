import React, { useState, useEffect } from "react";
import { getPendingCompanies, approveCompany, denyCompany } from "../api";
import { FaCheck, FaTimes, FaBuilding, FaCalendarAlt, FaEnvelope, FaPhone, FaGlobeAmericas } from "react-icons/fa";

const AdminPortal = ({ isDarkMode }) => {
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    const fetchPendingCompanies = async () => {
      try {
        const response = await getPendingCompanies();
        setPendingCompanies(response);
      } catch (error) {
        console.error("Error fetching pending companies:", error);
        setNotification({
          show: true,
          message: "Failed to fetch pending companies",
          type: "error"
        });
      }
    };

    fetchPendingCompanies();
  }, []);

  const handleApprove = async (companyId) => {
    try {
      await approveCompany(companyId);
      setPendingCompanies(pendingCompanies.filter((company) => company._id !== companyId));
      setNotification({
        show: true,
        message: "Company approved successfully",
        type: "success"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
    } catch (error) {
      console.error("Error approving company:", error);
      setNotification({
        show: true,
        message: "Error approving company",
        type: "error"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
    }
  };

  const handleDeny = async (companyId) => {
    try {
      await denyCompany(companyId);
      setPendingCompanies(pendingCompanies.filter((company) => company._id !== companyId));
      setNotification({
        show: true,
        message: "Company registration denied",
        type: "success"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
    } catch (error) {
      console.error("Error denying company:", error);
      setNotification({
        show: true,
        message: "Error denying company",
        type: "error" 
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
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
    } catch (error) {
      console.error("Error formatting ObjectId to date:", error);
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

  return (
    <div className={`p-6 min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
      <h1 className="text-3xl font-bold mb-6">Admin Portal</h1>
      <h2 className="text-2xl font-semibold mb-4 text-[#ff8200]">Pending Company Approvals</h2>
      
      {notification.show && (
        <div className={`p-4 mb-6 rounded-lg ${notification.type === "success" ? "bg-green-500" : "bg-red-500"} text-white`}>
          {notification.message}
        </div>
      )}

      {pendingCompanies.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
          <p className="text-xl">No pending company approvals at the moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {Array.isArray(pendingCompanies) && pendingCompanies.map((company) => (
            <div key={company._id} className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} transition-all hover:shadow-xl`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="w-16 h-16 mr-4 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {company.logo ? (
                      <img src={company.logo} alt={company.companyName} className="w-full h-full object-cover" />
                    ) : (
                      <FaBuilding className="text-gray-500 text-3xl" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{company.companyName}</h3>
                    <div className="flex items-center mt-1">
                      <FaCalendarAlt className="text-[#ff8200] mr-2" />
                      <span className="text-sm">
                        Applied on: {formatDate(formatObjectIdToDate(company._id))}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleApprove(company._id)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FaCheck className="mr-2" /> Approve
                  </button>
                  <button
                    onClick={() => handleDeny(company._id)}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FaTimes className="mr-2" /> Deny
                  </button>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <FaEnvelope className="text-[#ff8200] mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p>{company.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaPhone className="text-[#ff8200] mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                      <p>{company.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaGlobeAmericas className="text-[#ff8200] mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Website</p>
                      <p>{company.website || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaBuilding className="text-[#ff8200] mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Industry</p>
                      <p>{company.industry || "Not specified"}</p>
                    </div>
                  </div>
                </div>
                
                {company.documents && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Documents</p>
                    <a 
                      href={company.documents} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#ff8200] hover:underline"
                    >
                      View Documents
                    </a>
                  </div>
                )}
                
                {company.description && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Company Description</p>
                    <p className="text-sm">{company.description}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
